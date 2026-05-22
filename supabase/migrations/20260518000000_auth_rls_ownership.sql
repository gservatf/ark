-- C y P - Auth, ownership helpers and RLS policies.
-- This migration locks public data behind Supabase Auth and enforces
-- organization/project ownership before enabling real collaboration.

create or replace function public.current_user_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select auth.uid()
$$;

create or replace function public.is_organization_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.organizacion_miembros om
    where om.organizacion_id = target_organization_id
      and om.user_id = auth.uid()
      and om.estado = 'activo'
  )
$$;

create or replace function public.is_organization_admin(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.organizacion_miembros om
    where om.organizacion_id = target_organization_id
      and om.user_id = auth.uid()
      and om.estado = 'activo'
      and om.rol in ('owner', 'admin')
  )
$$;

create or replace function public.is_project_member(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.proyecto_miembros pm
    join public.organizacion_miembros om on om.id = pm.organizacion_miembro_id
    where pm.proyecto_id = target_project_id
      and pm.estado = 'activo'
      and om.estado = 'activo'
      and om.user_id = auth.uid()
  )
$$;

create or replace function public.is_project_admin(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.proyectos p
    where p.id = target_project_id
      and public.is_organization_admin(p.organizacion_id)
  )
  or exists (
    select 1
    from public.proyecto_miembros pm
    join public.organizacion_miembros om on om.id = pm.organizacion_miembro_id
    where pm.proyecto_id = target_project_id
      and pm.estado = 'activo'
      and pm.rol = 'admin'
      and om.estado = 'activo'
      and om.user_id = auth.uid()
  )
$$;

create or replace function public.can_read_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.proyectos p
    where p.id = target_project_id
      and (
        public.is_organization_admin(p.organizacion_id)
        or public.is_project_member(p.id)
      )
  )
$$;

create or replace function public.can_edit_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.proyectos p
    where p.id = target_project_id
      and public.is_organization_admin(p.organizacion_id)
  )
  or exists (
    select 1
    from public.proyecto_miembros pm
    join public.organizacion_miembros om on om.id = pm.organizacion_miembro_id
    where pm.proyecto_id = target_project_id
      and pm.estado = 'activo'
      and pm.rol in ('admin', 'presupuestador', 'editor')
      and om.estado = 'activo'
      and om.user_id = auth.uid()
  )
$$;

create or replace function public.can_emit_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.proyectos p
    where p.id = target_project_id
      and public.is_organization_admin(p.organizacion_id)
  )
  or exists (
    select 1
    from public.proyecto_miembros pm
    join public.organizacion_miembros om on om.id = pm.organizacion_miembro_id
    where pm.proyecto_id = target_project_id
      and pm.estado = 'activo'
      and pm.rol in ('admin', 'presupuestador')
      and om.estado = 'activo'
      and om.user_id = auth.uid()
  )
$$;

create or replace function public.project_belongs_to_organization(
  target_project_id uuid,
  target_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.proyectos p
    where p.id = target_project_id
      and p.organizacion_id = target_organization_id
  )
$$;

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
set search_path = public, auth
as $$
declare
  current_user uuid := auth.uid();
  new_organization_id uuid;
  new_project_id uuid;
  new_organization_member_id uuid;
  new_project_member_id uuid;
begin
  if current_user is null then
    raise exception 'Debes iniciar sesion para crear una organizacion.';
  end if;

  if length(btrim(coalesce(nombre_org, ''))) = 0 then
    raise exception 'El nombre de la organizacion es obligatorio.';
  end if;

  if length(btrim(coalesce(nombre_proyecto, ''))) = 0 then
    raise exception 'El nombre del proyecto es obligatorio.';
  end if;

  insert into public.organizaciones (nombre, ruc)
  values (btrim(nombre_org), nullif(btrim(coalesce(ruc_org, '')), ''))
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
    current_user,
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
    current_user
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

grant execute on function public.current_user_id() to authenticated;
grant execute on function public.is_organization_member(uuid) to authenticated;
grant execute on function public.is_organization_admin(uuid) to authenticated;
grant execute on function public.is_project_member(uuid) to authenticated;
grant execute on function public.is_project_admin(uuid) to authenticated;
grant execute on function public.can_read_project(uuid) to authenticated;
grant execute on function public.can_edit_project(uuid) to authenticated;
grant execute on function public.can_emit_project(uuid) to authenticated;
grant execute on function public.project_belongs_to_organization(uuid, uuid) to authenticated;
grant execute on function public.create_organization_with_owner(text, text, text, text, text) to authenticated;

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

alter table public.organizaciones enable row level security;
alter table public.organizacion_miembros enable row level security;
alter table public.proyectos enable row level security;
alter table public.proyecto_miembros enable row level security;
alter table public.proveedores enable row level security;
alter table public.recursos enable row level security;
alter table public.recurso_precios_historial enable row level security;
alter table public.partidas enable row level security;
alter table public.partida_recursos enable row level security;
alter table public.presupuestos enable row level security;
alter table public.presupuesto_partidas enable row level security;
alter table public.presupuesto_partida_recursos enable row level security;
alter table public.presupuesto_borradores enable row level security;
alter table public.presupuesto_borrador_partidas enable row level security;
alter table public.presupuesto_borrador_partida_recursos enable row level security;
alter table public.presupuesto_versiones enable row level security;
alter table public.presupuesto_version_partidas enable row level security;
alter table public.presupuesto_version_partida_recursos enable row level security;
alter table public.activity_events enable row level security;

create policy organizaciones_select_members
on public.organizaciones for select to authenticated
using (public.is_organization_member(id));

create policy organizaciones_insert_authenticated
on public.organizaciones for insert to authenticated
with check (false);

create policy organizaciones_update_admins
on public.organizaciones for update to authenticated
using (public.is_organization_admin(id))
with check (public.is_organization_admin(id));

create policy organizacion_miembros_select_members
on public.organizacion_miembros for select to authenticated
using (public.is_organization_member(organizacion_id));

create policy organizacion_miembros_insert_admins
on public.organizacion_miembros for insert to authenticated
with check (public.is_organization_admin(organizacion_id));

create policy organizacion_miembros_update_admins
on public.organizacion_miembros for update to authenticated
using (public.is_organization_admin(organizacion_id))
with check (public.is_organization_admin(organizacion_id));

create policy proyectos_select_authorized
on public.proyectos for select to authenticated
using (public.can_read_project(id));

create policy proyectos_insert_org_admins
on public.proyectos for insert to authenticated
with check (
  public.is_organization_admin(organizacion_id)
  and coalesce(created_by, auth.uid()) = auth.uid()
);

create policy proyectos_update_project_admins
on public.proyectos for update to authenticated
using (public.is_project_admin(id))
with check (public.is_project_admin(id));

create policy proyecto_miembros_select_authorized
on public.proyecto_miembros for select to authenticated
using (public.can_read_project(proyecto_id));

create policy proyecto_miembros_insert_project_admins
on public.proyecto_miembros for insert to authenticated
with check (
  public.is_project_admin(proyecto_id)
  and exists (
    select 1
    from public.organizacion_miembros om
    join public.proyectos p on p.id = proyecto_id
    where om.id = organizacion_miembro_id
      and om.organizacion_id = p.organizacion_id
  )
);

create policy proyecto_miembros_update_project_admins
on public.proyecto_miembros for update to authenticated
using (public.is_project_admin(proyecto_id))
with check (public.is_project_admin(proyecto_id));

create policy proyecto_miembros_delete_project_admins
on public.proyecto_miembros for delete to authenticated
using (public.is_project_admin(proyecto_id));

create policy proveedores_select_org_members
on public.proveedores for select to authenticated
using (organizacion_id is not null and public.is_organization_member(organizacion_id));

create policy proveedores_insert_org_admins
on public.proveedores for insert to authenticated
with check (organizacion_id is not null and public.is_organization_admin(organizacion_id));

create policy proveedores_update_org_admins
on public.proveedores for update to authenticated
using (organizacion_id is not null and public.is_organization_admin(organizacion_id))
with check (organizacion_id is not null and public.is_organization_admin(organizacion_id));

create policy proveedores_delete_org_admins
on public.proveedores for delete to authenticated
using (organizacion_id is not null and public.is_organization_admin(organizacion_id));

create policy recursos_select_org_members
on public.recursos for select to authenticated
using (organizacion_id is not null and public.is_organization_member(organizacion_id));

create policy recursos_insert_org_admins
on public.recursos for insert to authenticated
with check (organizacion_id is not null and public.is_organization_admin(organizacion_id));

create policy recursos_update_org_admins
on public.recursos for update to authenticated
using (organizacion_id is not null and public.is_organization_admin(organizacion_id))
with check (organizacion_id is not null and public.is_organization_admin(organizacion_id));

create policy recursos_delete_org_admins
on public.recursos for delete to authenticated
using (organizacion_id is not null and public.is_organization_admin(organizacion_id));

create policy recurso_precios_historial_select_org_members
on public.recurso_precios_historial for select to authenticated
using (
  exists (
    select 1
    from public.recursos r
    where r.id = recurso_id
      and r.organizacion_id is not null
      and public.is_organization_member(r.organizacion_id)
  )
);

create policy recurso_precios_historial_insert_org_admins
on public.recurso_precios_historial for insert to authenticated
with check (
  coalesce(usuario_id, auth.uid()) = auth.uid()
  and exists (
    select 1
    from public.recursos r
    where r.id = recurso_id
      and r.organizacion_id is not null
      and public.is_organization_admin(r.organizacion_id)
  )
);

create policy partidas_select_org_members
on public.partidas for select to authenticated
using (organizacion_id is not null and public.is_organization_member(organizacion_id));

create policy partidas_insert_org_admins
on public.partidas for insert to authenticated
with check (organizacion_id is not null and public.is_organization_admin(organizacion_id));

create policy partidas_update_org_admins
on public.partidas for update to authenticated
using (organizacion_id is not null and public.is_organization_admin(organizacion_id))
with check (organizacion_id is not null and public.is_organization_admin(organizacion_id));

create policy partidas_delete_org_admins
on public.partidas for delete to authenticated
using (organizacion_id is not null and public.is_organization_admin(organizacion_id));

create policy partida_recursos_select_org_members
on public.partida_recursos for select to authenticated
using (
  exists (
    select 1
    from public.partidas p
    where p.id = partida_id
      and p.organizacion_id is not null
      and public.is_organization_member(p.organizacion_id)
  )
);

create policy partida_recursos_write_org_admins
on public.partida_recursos for all to authenticated
using (
  exists (
    select 1
    from public.partidas p
    where p.id = partida_id
      and p.organizacion_id is not null
      and public.is_organization_admin(p.organizacion_id)
  )
)
with check (
  exists (
    select 1
    from public.partidas p
    where p.id = partida_id
      and p.organizacion_id is not null
      and public.is_organization_admin(p.organizacion_id)
  )
);

create policy presupuestos_select_org_members
on public.presupuestos for select to authenticated
using (organizacion_id is not null and public.is_organization_member(organizacion_id));

create policy presupuestos_write_org_admins
on public.presupuestos for all to authenticated
using (organizacion_id is not null and public.is_organization_admin(organizacion_id))
with check (organizacion_id is not null and public.is_organization_admin(organizacion_id));

create policy presupuesto_partidas_select_org_members
on public.presupuesto_partidas for select to authenticated
using (
  exists (
    select 1
    from public.presupuestos p
    where p.id = presupuesto_id
      and p.organizacion_id is not null
      and public.is_organization_member(p.organizacion_id)
  )
);

create policy presupuesto_partidas_write_org_admins
on public.presupuesto_partidas for all to authenticated
using (
  exists (
    select 1
    from public.presupuestos p
    where p.id = presupuesto_id
      and p.organizacion_id is not null
      and public.is_organization_admin(p.organizacion_id)
  )
)
with check (
  exists (
    select 1
    from public.presupuestos p
    where p.id = presupuesto_id
      and p.organizacion_id is not null
      and public.is_organization_admin(p.organizacion_id)
  )
);

create policy presupuesto_partida_recursos_select_org_members
on public.presupuesto_partida_recursos for select to authenticated
using (
  exists (
    select 1
    from public.presupuestos p
    where p.id = presupuesto_id
      and p.organizacion_id is not null
      and public.is_organization_member(p.organizacion_id)
  )
);

create policy presupuesto_partida_recursos_write_org_admins
on public.presupuesto_partida_recursos for all to authenticated
using (
  exists (
    select 1
    from public.presupuestos p
    where p.id = presupuesto_id
      and p.organizacion_id is not null
      and public.is_organization_admin(p.organizacion_id)
  )
)
with check (
  exists (
    select 1
    from public.presupuestos p
    where p.id = presupuesto_id
      and p.organizacion_id is not null
      and public.is_organization_admin(p.organizacion_id)
  )
);

create policy presupuesto_borradores_select_project_readers
on public.presupuesto_borradores for select to authenticated
using (
  public.can_read_project(proyecto_id)
  and public.project_belongs_to_organization(proyecto_id, organizacion_id)
);

create policy presupuesto_borradores_insert_project_editors
on public.presupuesto_borradores for insert to authenticated
with check (
  public.can_edit_project(proyecto_id)
  and public.project_belongs_to_organization(proyecto_id, organizacion_id)
  and coalesce(created_by, auth.uid()) = auth.uid()
);

create policy presupuesto_borradores_update_project_editors
on public.presupuesto_borradores for update to authenticated
using (public.can_edit_project(proyecto_id))
with check (
  public.can_edit_project(proyecto_id)
  and public.project_belongs_to_organization(proyecto_id, organizacion_id)
  and coalesce(updated_by, auth.uid()) = auth.uid()
);

create policy presupuesto_borradores_delete_project_admins
on public.presupuesto_borradores for delete to authenticated
using (public.is_project_admin(proyecto_id));

create policy presupuesto_borrador_partidas_select_project_readers
on public.presupuesto_borrador_partidas for select to authenticated
using (
  exists (
    select 1
    from public.presupuesto_borradores b
    where b.id = presupuesto_borrador_id
      and public.can_read_project(b.proyecto_id)
  )
);

create policy presupuesto_borrador_partidas_write_project_editors
on public.presupuesto_borrador_partidas for all to authenticated
using (
  exists (
    select 1
    from public.presupuesto_borradores b
    where b.id = presupuesto_borrador_id
      and public.can_edit_project(b.proyecto_id)
  )
)
with check (
  exists (
    select 1
    from public.presupuesto_borradores b
    where b.id = presupuesto_borrador_id
      and public.can_edit_project(b.proyecto_id)
  )
);

create policy presupuesto_borrador_recursos_select_project_readers
on public.presupuesto_borrador_partida_recursos for select to authenticated
using (
  exists (
    select 1
    from public.presupuesto_borradores b
    where b.id = presupuesto_borrador_id
      and public.can_read_project(b.proyecto_id)
  )
);

create policy presupuesto_borrador_recursos_write_project_editors
on public.presupuesto_borrador_partida_recursos for all to authenticated
using (
  exists (
    select 1
    from public.presupuesto_borradores b
    where b.id = presupuesto_borrador_id
      and public.can_edit_project(b.proyecto_id)
  )
)
with check (
  exists (
    select 1
    from public.presupuesto_borradores b
    where b.id = presupuesto_borrador_id
      and public.can_edit_project(b.proyecto_id)
  )
);

create policy presupuesto_versiones_select_project_readers
on public.presupuesto_versiones for select to authenticated
using (
  public.can_read_project(proyecto_id)
  and public.project_belongs_to_organization(proyecto_id, organizacion_id)
);

create policy presupuesto_versiones_insert_emitters
on public.presupuesto_versiones for insert to authenticated
with check (
  public.can_emit_project(proyecto_id)
  and public.project_belongs_to_organization(proyecto_id, organizacion_id)
  and coalesce(emitida_por, auth.uid()) = auth.uid()
);

create policy presupuesto_version_partidas_select_project_readers
on public.presupuesto_version_partidas for select to authenticated
using (
  exists (
    select 1
    from public.presupuesto_versiones v
    where v.id = presupuesto_version_id
      and public.can_read_project(v.proyecto_id)
  )
);

create policy presupuesto_version_partidas_insert_emitters
on public.presupuesto_version_partidas for insert to authenticated
with check (
  exists (
    select 1
    from public.presupuesto_versiones v
    where v.id = presupuesto_version_id
      and public.can_emit_project(v.proyecto_id)
  )
);

create policy presupuesto_version_recursos_select_project_readers
on public.presupuesto_version_partida_recursos for select to authenticated
using (
  exists (
    select 1
    from public.presupuesto_versiones v
    where v.id = presupuesto_version_id
      and public.can_read_project(v.proyecto_id)
  )
);

create policy presupuesto_version_recursos_insert_emitters
on public.presupuesto_version_partida_recursos for insert to authenticated
with check (
  exists (
    select 1
    from public.presupuesto_versiones v
    where v.id = presupuesto_version_id
      and public.can_emit_project(v.proyecto_id)
  )
);

create policy activity_events_select_authorized
on public.activity_events for select to authenticated
using (
  (
    proyecto_id is not null
    and public.can_read_project(proyecto_id)
    and public.project_belongs_to_organization(proyecto_id, organizacion_id)
  )
  or (
    proyecto_id is null
    and public.is_organization_member(organizacion_id)
  )
);

create policy activity_events_insert_authorized
on public.activity_events for insert to authenticated
with check (
  actor_id = auth.uid()
  and (
    (
      proyecto_id is not null
      and public.can_edit_project(proyecto_id)
      and public.project_belongs_to_organization(proyecto_id, organizacion_id)
    )
    or (
      proyecto_id is null
      and public.is_organization_admin(organizacion_id)
    )
  )
);
