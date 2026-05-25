-- C y P - Invitaciones: pendientes enviadas y notificaciones para admins.

create or replace function public.list_sent_organization_invitations(
  p_organizacion_id uuid
)
returns jsonb
language sql
stable
security definer
set search_path = public, auth
as $$
  select case
    when not public.is_organization_admin(p_organizacion_id) then
      '[]'::jsonb
    else coalesce(jsonb_agg(
      jsonb_build_object(
        'id', oi.id,
        'organizacionId', oi.organizacion_id,
        'organizacionNombre', o.nombre,
        'email', oi.email,
        'rolOrganizacion', oi.rol_organizacion,
        'proyectoId', oi.proyecto_id,
        'proyectoNombre', p.nombre,
        'proyectoIds', oi.proyecto_ids,
        'proyectoNombres', coalesce(project_names.names, '[]'::jsonb),
        'incluirProyectosFuturos', oi.incluir_proyectos_futuros,
        'rolProyecto', oi.rol_proyecto,
        'estado', case when oi.expires_at < now() then 'expirada' else oi.estado end,
        'expiresAt', oi.expires_at,
        'createdAt', oi.created_at
      )
      order by oi.created_at desc
    ) filter (where oi.id is not null), '[]'::jsonb)
  end
  from public.organizaciones o
  left join public.organizacion_invitaciones oi
    on oi.organizacion_id = o.id
   and oi.estado = 'pendiente'
   and oi.expires_at >= now()
  left join public.proyectos p on p.id = oi.proyecto_id
  left join lateral (
    select jsonb_agg(project.nombre order by project.created_at asc) as names
    from public.proyectos project
    where project.id = any(oi.proyecto_ids)
  ) project_names on true
  where o.id = p_organizacion_id
$$;

grant execute on function public.list_sent_organization_invitations(uuid) to authenticated;

create or replace function public.list_organization_invitation_notifications(
  p_organizacion_id uuid
)
returns jsonb
language sql
stable
security definer
set search_path = public, auth
as $$
  select case
    when not public.is_organization_admin(p_organizacion_id) then
      '[]'::jsonb
    else coalesce(jsonb_agg(
      jsonb_build_object(
        'id', oi.id,
        'organizacionId', oi.organizacion_id,
        'organizacionNombre', o.nombre,
        'email', oi.email,
        'rolOrganizacion', oi.rol_organizacion,
        'proyectoId', oi.proyecto_id,
        'proyectoNombre', p.nombre,
        'proyectoIds', oi.proyecto_ids,
        'proyectoNombres', coalesce(project_names.names, '[]'::jsonb),
        'incluirProyectosFuturos', oi.incluir_proyectos_futuros,
        'rolProyecto', oi.rol_proyecto,
        'estado', oi.estado,
        'expiresAt', oi.expires_at,
        'createdAt', oi.created_at,
        'updatedAt', oi.updated_at
      )
      order by oi.updated_at desc
    ) filter (where oi.id is not null), '[]'::jsonb)
  end
  from public.organizaciones o
  left join public.organizacion_invitaciones oi
    on oi.organizacion_id = o.id
   and oi.estado in ('aceptada', 'rechazada')
  left join public.proyectos p on p.id = oi.proyecto_id
  left join lateral (
    select jsonb_agg(project.nombre order by project.created_at asc) as names
    from public.proyectos project
    where project.id = any(oi.proyecto_ids)
  ) project_names on true
  where o.id = p_organizacion_id
$$;

grant execute on function public.list_organization_invitation_notifications(uuid) to authenticated;
