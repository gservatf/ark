-- C y P - Project creation and activity center support.

create or replace function public.create_project_with_current_member(
  nombre_proyecto text,
  cliente text default null,
  ubicacion text default null
)
returns public.proyectos
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  actor_id uuid := auth.uid();
  current_membership public.organizacion_miembros%rowtype;
  new_project public.proyectos%rowtype;
  new_project_member public.proyecto_miembros%rowtype;
begin
  if actor_id is null then
    raise exception 'CYP_PERMISSION: Debes iniciar sesion para crear un proyecto.'
      using errcode = '42501';
  end if;

  select *
  into current_membership
  from public.organizacion_miembros
  where user_id = actor_id
    and estado = 'activo'
  order by created_at asc
  limit 1;

  if not found then
    raise exception 'CYP_NOT_FOUND: No se encontro una organizacion activa para tu usuario.';
  end if;

  if current_membership.rol not in ('owner', 'admin') then
    raise exception 'CYP_PERMISSION: Solo un owner o admin de organizacion puede crear proyectos.'
      using errcode = '42501';
  end if;

  if length(btrim(coalesce(nombre_proyecto, ''))) = 0 then
    raise exception 'CYP_VALIDATION: El nombre del proyecto es obligatorio.';
  end if;

  insert into public.proyectos (
    organizacion_id,
    nombre,
    cliente,
    ubicacion,
    created_by
  )
  values (
    current_membership.organizacion_id,
    btrim(nombre_proyecto),
    nullif(btrim(coalesce(cliente, '')), ''),
    nullif(btrim(coalesce(ubicacion, '')), ''),
    actor_id
  )
  returning * into new_project;

  insert into public.proyecto_miembros (
    proyecto_id,
    organizacion_miembro_id,
    rol,
    estado
  )
  values (
    new_project.id,
    current_membership.id,
    'admin',
    'activo'
  )
  returning * into new_project_member;

  insert into public.activity_events (
    organizacion_id,
    proyecto_id,
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
    new_project.organizacion_id,
    new_project.id,
    actor_id,
    'proyecto',
    new_project.id,
    'create',
    null,
    to_jsonb(new_project),
    to_jsonb(new_project) - 'created_at' - 'updated_at' - 'created_by',
    jsonb_build_object(
      'repository', 'projectsRepository',
      'proyecto_miembro_id', new_project_member.id
    )
  );

  return new_project;
end;
$$;

grant execute on function public.create_project_with_current_member(text, text, text) to authenticated;

create or replace function public.is_valid_activity_entity(
  p_entity_type text,
  p_entity_id uuid,
  p_organizacion_id uuid,
  p_proyecto_id uuid,
  p_presupuesto_borrador_id uuid,
  p_presupuesto_version_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_entity_type not in (
    'proyecto',
    'proveedor',
    'recurso',
    'recurso_proveedor_precio',
    'partida',
    'partida_recurso',
    'presupuesto_borrador',
    'presupuesto_borrador_partida',
    'presupuesto_borrador_recurso',
    'presupuesto_version'
  ) then
    return false;
  end if;

  if p_entity_id is null then
    return false;
  end if;

  case p_entity_type
    when 'proyecto' then
      return exists (
        select 1 from public.proyectos e
        where e.id = p_entity_id
          and e.organizacion_id = p_organizacion_id
          and (p_proyecto_id is null or e.id = p_proyecto_id)
      );
    when 'proveedor' then
      return exists (
        select 1 from public.proveedores e
        where e.id = p_entity_id and e.organizacion_id = p_organizacion_id
      );
    when 'recurso' then
      return exists (
        select 1 from public.recursos e
        where e.id = p_entity_id and e.organizacion_id = p_organizacion_id
      );
    when 'recurso_proveedor_precio' then
      return exists (
        select 1 from public.recurso_proveedor_precios e
        where e.id = p_entity_id and e.organizacion_id = p_organizacion_id
      );
    when 'partida' then
      return exists (
        select 1 from public.partidas e
        where e.id = p_entity_id and e.organizacion_id = p_organizacion_id
      );
    when 'partida_recurso' then
      return exists (
        select 1
        from public.partida_recursos e
        join public.partidas p on p.id = e.partida_id
        where e.id = p_entity_id
          and p.organizacion_id = p_organizacion_id
      );
    when 'presupuesto_borrador' then
      return exists (
        select 1 from public.presupuesto_borradores e
        where e.id = p_entity_id
          and e.organizacion_id = p_organizacion_id
          and (p_proyecto_id is null or e.proyecto_id = p_proyecto_id)
      );
    when 'presupuesto_borrador_partida' then
      return exists (
        select 1
        from public.presupuesto_borrador_partidas e
        join public.presupuesto_borradores b on b.id = e.presupuesto_borrador_id
        where e.id = p_entity_id
          and b.organizacion_id = p_organizacion_id
          and (p_proyecto_id is null or b.proyecto_id = p_proyecto_id)
          and (p_presupuesto_borrador_id is null or b.id = p_presupuesto_borrador_id)
      );
    when 'presupuesto_borrador_recurso' then
      return exists (
        select 1
        from public.presupuesto_borrador_partida_recursos e
        join public.presupuesto_borradores b on b.id = e.presupuesto_borrador_id
        where e.id = p_entity_id
          and b.organizacion_id = p_organizacion_id
          and (p_proyecto_id is null or b.proyecto_id = p_proyecto_id)
          and (p_presupuesto_borrador_id is null or b.id = p_presupuesto_borrador_id)
      );
    when 'presupuesto_version' then
      return exists (
        select 1 from public.presupuesto_versiones e
        where e.id = p_entity_id
          and e.organizacion_id = p_organizacion_id
          and (p_proyecto_id is null or e.proyecto_id = p_proyecto_id)
          and (p_presupuesto_version_id is null or e.id = p_presupuesto_version_id)
      );
    else
      return false;
  end case;
end;
$$;
