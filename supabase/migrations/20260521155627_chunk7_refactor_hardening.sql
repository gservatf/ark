create or replace function public.create_organization_with_owner(
  nombre_org text,
  ruc_org text,
  nombre_proyecto text,
  cliente text default null,
  ubicacion text default null
)
returns table (
  organizacion_id uuid,
  proyecto_id uuid,
  organizacion_miembro_id uuid,
  proyecto_miembro_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  normalized_ruc text := nullif(btrim(coalesce(ruc_org, '')), '');
  new_organization_id uuid;
  new_project_id uuid;
  new_organization_member_id uuid;
  new_project_member_id uuid;
begin
  if actor_id is null then
    raise exception 'Debes iniciar sesion para crear una organizacion.'
      using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.organizacion_miembros om
    where om.user_id = actor_id
      and om.estado = 'activo'
  ) then
    raise exception 'Tu usuario ya pertenece a una organizacion activa.';
  end if;

  if length(btrim(coalesce(nombre_org, ''))) = 0 then
    raise exception 'El nombre de la organizacion es obligatorio.';
  end if;

  if length(btrim(coalesce(nombre_proyecto, ''))) = 0 then
    raise exception 'El nombre del proyecto es obligatorio.';
  end if;

  if normalized_ruc is not null and normalized_ruc !~ '^[0-9]{11}$' then
    raise exception 'El RUC debe tener 11 digitos.';
  end if;

  insert into public.organizaciones (nombre, ruc)
  values (btrim(nombre_org), normalized_ruc)
  returning id into new_organization_id;

  insert into public.organizacion_miembros (
    organizacion_id,
    user_id,
    rol,
    estado,
    joined_at
  )
  values (
    new_organization_id,
    actor_id,
    'owner',
    'activo',
    now()
  )
  returning id into new_organization_member_id;

  insert into public.proyectos (
    organizacion_id,
    nombre,
    cliente,
    ubicacion,
    created_by
  )
  values (
    new_organization_id,
    btrim(nombre_proyecto),
    nullif(btrim(coalesce(cliente, '')), ''),
    nullif(btrim(coalesce(ubicacion, '')), ''),
    actor_id
  )
  returning id into new_project_id;

  insert into public.proyecto_miembros (
    proyecto_id,
    organizacion_miembro_id,
    rol,
    estado
  )
  values (
    new_project_id,
    new_organization_member_id,
    'admin',
    'activo'
  )
  returning id into new_project_member_id;

  return query select
    new_organization_id,
    new_project_id,
    new_organization_member_id,
    new_project_member_id;
end;
$$;

grant execute on function public.create_organization_with_owner(text, text, text, text, text) to authenticated;
