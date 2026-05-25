-- C y P - Eliminacion explicita de proveedores.
-- La accion de activar/desactivar sigue siendo update de estado; esta RPC
-- elimina fisicamente solo cuando las FK historicas lo permiten.

create or replace function public.delete_provider_for_current_user(
  p_provider_id uuid
)
returns public.proveedores
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  actor_id uuid := auth.uid();
  provider_row public.proveedores%rowtype;
begin
  if actor_id is null then
    raise exception 'CYP_PERMISSION: Debes iniciar sesion para eliminar proveedores.'
      using errcode = '42501';
  end if;

  select *
  into provider_row
  from public.proveedores
  where id = p_provider_id
  limit 1;

  if not found then
    raise exception 'CYP_NOT_FOUND: No se encontro el proveedor.';
  end if;

  if provider_row.organizacion_id is null
    or not public.can_manage_organization_catalog(provider_row.organizacion_id) then
    raise exception 'CYP_PERMISSION: No tienes permisos para eliminar este proveedor.'
      using errcode = '42501';
  end if;

  insert into public.activity_events (
    organizacion_id,
    actor_id,
    entity_type,
    entity_id,
    action,
    before,
    after,
    changed_fields,
    metadata
  )
  values (
    provider_row.organizacion_id,
    actor_id,
    'proveedor',
    provider_row.id,
    'delete',
    to_jsonb(provider_row),
    null,
    to_jsonb(provider_row) - 'created_at' - 'updated_at',
    jsonb_build_object('repository', 'providersRepository')
  );

  delete from public.proveedores
  where id = provider_row.id;

  return provider_row;
exception
  when foreign_key_violation then
    raise exception 'CYP_VALIDATION: No se puede eliminar este proveedor porque tiene cotizaciones, recursos historicos o presupuestos vinculados. Puedes desactivarlo para ocultarlo sin romper historicos.';
end;
$$;

grant execute on function public.delete_provider_for_current_user(uuid) to authenticated;
