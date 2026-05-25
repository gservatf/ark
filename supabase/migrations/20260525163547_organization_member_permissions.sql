-- C y P - Gestion de permisos de miembros por organizacion y proyecto.

create or replace function public.list_organization_member_permissions(
  p_organizacion_id uuid
)
returns jsonb
language sql
stable
security definer
set search_path = public, auth
as $$
  with actor_membership as (
    select om.*
    from public.organizacion_miembros om
    where om.organizacion_id = p_organizacion_id
      and om.user_id = auth.uid()
      and om.estado = 'activo'
    limit 1
  ),
  authorized as (
    select exists (
      select 1
      from actor_membership am
      where am.rol in ('owner', 'admin')
    ) as can_admin
  ),
  org_projects as (
    select p.*
    from public.proyectos p
    where p.organizacion_id = p_organizacion_id
      and p.estado = 'activo'
  ),
  members as (
    select
      om.*,
      coalesce(up.display_name, nullif(split_part(au.email, '@', 1), ''), 'Usuario colaborador') as display_name,
      coalesce(up.email, lower(nullif(btrim(coalesce(au.email, '')), ''))) as email
    from public.organizacion_miembros om
    left join public.user_profiles up on up.user_id = om.user_id
    left join auth.users au on au.id = om.user_id
    where om.organizacion_id = p_organizacion_id
      and om.estado = 'activo'
  )
  select case
    when not (select can_admin from authorized) then
      '[]'::jsonb
    else coalesce(jsonb_agg(
      jsonb_build_object(
        'id', m.id,
        'userId', m.user_id,
        'displayName', m.display_name,
        'email', m.email,
        'rolOrganizacion', m.rol,
        'estado', m.estado,
        'accesoTodosProyectos', m.acceso_todos_proyectos,
        'rolProyectoPredeterminado', m.rol_proyecto_predeterminado,
        'joinedAt', m.joined_at,
        'createdAt', m.created_at,
        'updatedAt', m.updated_at,
        'projects', coalesce(project_access.projects, '[]'::jsonb)
      )
      order by
        case m.rol when 'owner' then 0 when 'admin' then 1 else 2 end,
        lower(m.display_name),
        lower(coalesce(m.email, ''))
    ), '[]'::jsonb)
  end
  from members m
  cross join authorized
  left join lateral (
    select jsonb_agg(
      jsonb_build_object(
        'projectId', p.id,
        'projectName', p.nombre,
        'cliente', p.cliente,
        'ubicacion', p.ubicacion,
        'explicitRole', pm.rol,
        'effectiveRole', case
          when m.rol in ('owner', 'admin') then 'admin'::public.rol_proyecto
          when pm.estado = 'activo' then pm.rol
          when m.acceso_todos_proyectos then m.rol_proyecto_predeterminado
          else null
        end,
        'hasExplicitAccess', pm.estado = 'activo',
        'isInherited', m.rol in ('owner', 'admin')
          or (m.acceso_todos_proyectos and pm.id is null),
        'estado', pm.estado
      )
      order by p.created_at asc
    ) as projects
    from org_projects p
    left join public.proyecto_miembros pm
      on pm.proyecto_id = p.id
     and pm.organizacion_miembro_id = m.id
     and pm.estado = 'activo'
  ) project_access on true
$$;

grant execute on function public.list_organization_member_permissions(uuid) to authenticated;

create or replace function public.update_organization_member_permissions(
  p_organizacion_id uuid,
  p_organizacion_miembro_id uuid,
  p_rol_organizacion public.rol_organizacion,
  p_acceso_todos_proyectos boolean default false,
  p_rol_proyecto_predeterminado public.rol_proyecto default null,
  p_project_access jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  actor_id uuid := auth.uid();
  actor_membership public.organizacion_miembros%rowtype;
  target_membership public.organizacion_miembros%rowtype;
  normalized_org_role public.rol_organizacion := coalesce(p_rol_organizacion, 'miembro');
  normalized_access_all boolean := coalesce(p_acceso_todos_proyectos, false);
  normalized_default_role public.rol_proyecto := p_rol_proyecto_predeterminado;
  access_item jsonb;
  access_project_id uuid;
  access_role public.rol_proyecto;
  selected_project_ids uuid[] := '{}'::uuid[];
  before_payload jsonb;
  after_payload jsonb;
begin
  if actor_id is null then
    raise exception 'CYP_PERMISSION: Debes iniciar sesion para editar permisos.'
      using errcode = '42501';
  end if;

  select *
  into actor_membership
  from public.organizacion_miembros
  where organizacion_id = p_organizacion_id
    and user_id = actor_id
    and estado = 'activo'
  limit 1;

  if not found or actor_membership.rol not in ('owner', 'admin') then
    raise exception 'CYP_PERMISSION: Solo owners o admins pueden editar permisos.'
      using errcode = '42501';
  end if;

  select *
  into target_membership
  from public.organizacion_miembros
  where id = p_organizacion_miembro_id
    and organizacion_id = p_organizacion_id
    and estado = 'activo'
  limit 1;

  if not found then
    raise exception 'CYP_NOT_FOUND: No se encontro el miembro seleccionado.';
  end if;

  if target_membership.id = actor_membership.id then
    raise exception 'CYP_PERMISSION: No puedes editar tus propios permisos.'
      using errcode = '42501';
  end if;

  if target_membership.rol = 'owner' then
    raise exception 'CYP_PERMISSION: Los permisos del owner no se editan desde este panel.'
      using errcode = '42501';
  end if;

  if normalized_org_role = 'owner' then
    raise exception 'CYP_PERMISSION: No se puede asignar owner desde este panel.'
      using errcode = '42501';
  end if;

  if actor_membership.rol = 'admin'
    and (target_membership.rol = 'admin' or normalized_org_role = 'admin') then
    raise exception 'CYP_PERMISSION: Solo el owner puede editar o asignar admins.'
      using errcode = '42501';
  end if;

  if normalized_org_role = 'admin' then
    normalized_access_all := true;
    normalized_default_role := 'admin';
  elsif normalized_access_all and normalized_default_role is null then
    normalized_default_role := 'lector';
  elsif not normalized_access_all then
    normalized_default_role := null;
  end if;

  if normalized_default_role = 'presupuestador' then
    raise exception 'CYP_VALIDATION: Usa lector, editor o admin como rol de proyecto.';
  end if;

  before_payload := to_jsonb(target_membership);

  update public.organizacion_miembros
  set rol = normalized_org_role,
      acceso_todos_proyectos = normalized_access_all,
      rol_proyecto_predeterminado = normalized_default_role,
      updated_at = now()
  where id = target_membership.id
  returning * into target_membership;

  if normalized_org_role = 'admin' then
    insert into public.proyecto_miembros (
      proyecto_id,
      organizacion_miembro_id,
      rol,
      estado
    )
    select
      p.id,
      target_membership.id,
      'admin'::public.rol_proyecto,
      'activo'::public.estado_miembro
    from public.proyectos p
    where p.organizacion_id = p_organizacion_id
      and p.estado = 'activo'
    on conflict on constraint proyecto_miembros_unique_member do update
    set rol = excluded.rol,
        estado = 'activo',
        updated_at = now();
  elsif normalized_access_all then
    insert into public.proyecto_miembros (
      proyecto_id,
      organizacion_miembro_id,
      rol,
      estado
    )
    select
      p.id,
      target_membership.id,
      normalized_default_role,
      'activo'::public.estado_miembro
    from public.proyectos p
    where p.organizacion_id = p_organizacion_id
      and p.estado = 'activo'
    on conflict on constraint proyecto_miembros_unique_member do update
    set rol = excluded.rol,
        estado = 'activo',
        updated_at = now();
  else
    if jsonb_typeof(coalesce(p_project_access, '[]'::jsonb)) <> 'array' then
      raise exception 'CYP_VALIDATION: Los accesos a proyectos deben enviarse como lista.';
    end if;

    for access_item in select * from jsonb_array_elements(coalesce(p_project_access, '[]'::jsonb))
    loop
      access_project_id := nullif(access_item->>'projectId', '')::uuid;
      access_role := coalesce(nullif(access_item->>'rol', '')::public.rol_proyecto, 'lector');

      if access_role = 'presupuestador' then
        raise exception 'CYP_VALIDATION: Usa lector, editor o admin como rol de proyecto.';
      end if;

      if not exists (
        select 1
        from public.proyectos p
        where p.id = access_project_id
          and p.organizacion_id = p_organizacion_id
          and p.estado = 'activo'
      ) then
        raise exception 'CYP_VALIDATION: Uno de los proyectos no pertenece a la organizacion.';
      end if;

      selected_project_ids := array_append(selected_project_ids, access_project_id);

      insert into public.proyecto_miembros (
        proyecto_id,
        organizacion_miembro_id,
        rol,
        estado
      )
      values (
        access_project_id,
        target_membership.id,
        access_role,
        'activo'
      )
      on conflict on constraint proyecto_miembros_unique_member do update
      set rol = excluded.rol,
          estado = 'activo',
          updated_at = now();
    end loop;

    update public.proyecto_miembros pm
    set estado = 'suspendido',
        updated_at = now()
    from public.proyectos p
    where p.id = pm.proyecto_id
      and p.organizacion_id = p_organizacion_id
      and pm.organizacion_miembro_id = target_membership.id
      and pm.estado = 'activo'
      and not (pm.proyecto_id = any(selected_project_ids));
  end if;

  after_payload := to_jsonb(target_membership);

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
    p_organizacion_id,
    actor_id,
    'organizacion_miembro',
    target_membership.id,
    'update_permissions',
    before_payload,
    after_payload,
    jsonb_build_object(
      'rol', jsonb_build_object('before', before_payload->'rol', 'after', after_payload->'rol'),
      'acceso_todos_proyectos', jsonb_build_object(
        'before', before_payload->'acceso_todos_proyectos',
        'after', after_payload->'acceso_todos_proyectos'
      ),
      'rol_proyecto_predeterminado', jsonb_build_object(
        'before', before_payload->'rol_proyecto_predeterminado',
        'after', after_payload->'rol_proyecto_predeterminado'
      )
    ),
    jsonb_build_object(
      'repository', 'organizationsRepository',
      'selectedProjectCount', cardinality(selected_project_ids),
      'accessAllProjects', normalized_access_all
    )
  );

  return public.list_organization_member_permissions(p_organizacion_id);
end;
$$;

grant execute on function public.update_organization_member_permissions(
  uuid,
  uuid,
  public.rol_organizacion,
  boolean,
  public.rol_proyecto,
  jsonb
) to authenticated;
