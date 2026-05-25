-- C y P - Multi-organizacion personal/empresa e invitaciones.
-- Cada cuenta conserva una organizacion personal y puede pertenecer a
-- organizaciones de empresa con invitaciones a organizacion y proyecto opcional.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'tipo_organizacion') then
    create type public.tipo_organizacion as enum ('personal', 'empresa');
  end if;

  if not exists (select 1 from pg_type where typname = 'estado_invitacion') then
    create type public.estado_invitacion as enum ('pendiente', 'aceptada', 'rechazada', 'revocada', 'expirada');
  end if;
end
$$;

alter table public.organizaciones
  add column if not exists tipo_organizacion public.tipo_organizacion not null default 'empresa';

alter table public.organizacion_miembros
  add column if not exists acceso_todos_proyectos boolean not null default false,
  add column if not exists rol_proyecto_predeterminado public.rol_proyecto;

update public.organizaciones
set tipo_organizacion = 'personal'
where tipo_organizacion = 'empresa'
  and lower(nombre) like 'espacio de %'
  and ruc is null;

create table if not exists public.organizacion_invitaciones (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones(id) on delete cascade,
  email text not null,
  rol_organizacion public.rol_organizacion not null default 'miembro',
  proyecto_id uuid references public.proyectos(id) on delete cascade,
  proyecto_ids uuid[] not null default '{}'::uuid[],
  incluir_proyectos_futuros boolean not null default false,
  rol_proyecto public.rol_proyecto,
  token_hash text not null unique,
  estado public.estado_invitacion not null default 'pendiente',
  invited_by uuid not null references auth.users(id) on delete cascade,
  accepted_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizacion_invitaciones_email_not_blank check (length(btrim(email)) > 0),
  constraint organizacion_invitaciones_email_lower check (email = lower(email)),
  constraint organizacion_invitaciones_project_role_required check (
    (
      proyecto_id is null
      and cardinality(proyecto_ids) = 0
      and incluir_proyectos_futuros = false
      and rol_proyecto is null
    )
    or (
      rol_proyecto is not null
      and (
        proyecto_id is not null
        or cardinality(proyecto_ids) > 0
        or incluir_proyectos_futuros = true
      )
    )
  )
);

create trigger organizacion_invitaciones_set_updated_at
before update on public.organizacion_invitaciones
for each row execute function public.set_updated_at();

create index if not exists organizacion_invitaciones_organizacion_id_idx
  on public.organizacion_invitaciones using btree (organizacion_id);

create index if not exists organizacion_invitaciones_email_idx
  on public.organizacion_invitaciones using btree (email);

create index if not exists organizacion_invitaciones_estado_idx
  on public.organizacion_invitaciones using btree (estado);

create index if not exists organizaciones_tipo_idx
  on public.organizaciones using btree (tipo_organizacion);

create unique index if not exists organizacion_invitaciones_pending_unique_idx
  on public.organizacion_invitaciones (organizacion_id, email)
  where estado = 'pendiente';

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
  or exists (
    select 1
    from public.proyectos p
    join public.organizacion_miembros om on om.organizacion_id = p.organizacion_id
    where p.id = target_project_id
      and p.estado = 'activo'
      and om.estado = 'activo'
      and om.user_id = auth.uid()
      and om.acceso_todos_proyectos = true
      and om.rol_proyecto_predeterminado is not null
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
  or exists (
    select 1
    from public.proyectos p
    join public.organizacion_miembros om on om.organizacion_id = p.organizacion_id
    where p.id = target_project_id
      and p.estado = 'activo'
      and om.estado = 'activo'
      and om.user_id = auth.uid()
      and om.acceso_todos_proyectos = true
      and om.rol_proyecto_predeterminado in ('admin', 'presupuestador', 'editor')
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
  or exists (
    select 1
    from public.proyectos p
    join public.organizacion_miembros om on om.organizacion_id = p.organizacion_id
    where p.id = target_project_id
      and p.estado = 'activo'
      and om.estado = 'activo'
      and om.user_id = auth.uid()
      and om.acceso_todos_proyectos = true
      and om.rol_proyecto_predeterminado in ('admin', 'presupuestador')
  )
$$;

alter table public.organizacion_invitaciones enable row level security;

create or replace function public.current_verified_email()
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select case
    when u.email_confirmed_at is not null then lower(nullif(btrim(coalesce(u.email, '')), ''))
    else null
  end
  from auth.users u
  where u.id = auth.uid()
$$;

grant execute on function public.current_verified_email() to authenticated;

drop policy if exists organizacion_invitaciones_select_authorized on public.organizacion_invitaciones;
create policy organizacion_invitaciones_select_authorized
on public.organizacion_invitaciones for select to authenticated
using (
  public.is_organization_admin(organizacion_id)
  or email = public.current_verified_email()
);

drop policy if exists organizacion_invitaciones_insert_blocked on public.organizacion_invitaciones;
create policy organizacion_invitaciones_insert_blocked
on public.organizacion_invitaciones for insert to authenticated
with check (false);

drop policy if exists organizacion_invitaciones_update_blocked on public.organizacion_invitaciones;
create policy organizacion_invitaciones_update_blocked
on public.organizacion_invitaciones for update to authenticated
using (false)
with check (false);

drop policy if exists organizacion_invitaciones_delete_blocked on public.organizacion_invitaciones;
create policy organizacion_invitaciones_delete_blocked
on public.organizacion_invitaciones for delete to authenticated
using (false);

grant select on public.organizacion_invitaciones to authenticated;

create or replace function public.ensure_personal_organization_for_current_user(
  display_name text default null
)
returns table (
  organizacion_id uuid,
  organizacion_miembro_id uuid
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  actor_id uuid := auth.uid();
  safe_name text := nullif(btrim(coalesce(display_name, '')), '');
  existing_personal public.organizacion_miembros%rowtype;
  new_organization_id uuid;
  new_membership_id uuid;
begin
  if actor_id is null then
    raise exception 'CYP_PERMISSION: Debes iniciar sesion para crear tu organizacion personal.'
      using errcode = '42501';
  end if;

  select om.*
  into existing_personal
  from public.organizacion_miembros om
  join public.organizaciones o on o.id = om.organizacion_id
  where om.user_id = actor_id
    and om.estado = 'activo'
    and o.tipo_organizacion = 'personal'
  order by om.created_at asc
  limit 1;

  if found then
    return query select existing_personal.organizacion_id, existing_personal.id;
    return;
  end if;

  insert into public.organizaciones (nombre, ruc, tipo_organizacion)
  values ('Espacio de ' || coalesce(safe_name, 'Usuario'), null, 'personal')
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
  returning id into new_membership_id;

  return query select new_organization_id, new_membership_id;
end;
$$;

grant execute on function public.ensure_personal_organization_for_current_user(text) to authenticated;

drop function if exists public.complete_user_onboarding(text, text);

create or replace function public.complete_user_onboarding(
  nombre_usuario text,
  apellido_usuario text
)
returns table (
  perfil_user_id uuid,
  organizacion_id uuid,
  organizacion_miembro_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  first_name text := btrim(coalesce(nombre_usuario, ''));
  last_name text := btrim(coalesce(apellido_usuario, ''));
  display_name text;
  personal_record record;
begin
  if actor_id is null then
    raise exception 'CYP_PERMISSION: Debes iniciar sesion para completar tu perfil.'
      using errcode = '42501';
  end if;

  if length(first_name) = 0 then
    raise exception 'CYP_VALIDATION: El nombre es obligatorio.';
  end if;

  if length(last_name) = 0 then
    raise exception 'CYP_VALIDATION: El apellido es obligatorio.';
  end if;

  if length(first_name) > 80 or length(last_name) > 80 then
    raise exception 'CYP_VALIDATION: Nombre y apellido deben tener 80 caracteres como maximo.';
  end if;

  display_name := first_name || ' ' || last_name;

  insert into public.user_profiles (
    user_id,
    email,
    email_verified,
    display_name,
    created_at,
    updated_at
  )
  select
    actor_id,
    case when u.email_confirmed_at is not null then lower(nullif(btrim(coalesce(u.email, '')), '')) else null end,
    u.email_confirmed_at is not null,
    display_name,
    now(),
    now()
  from auth.users u
  where u.id = actor_id
  on conflict (user_id) do update
  set
    display_name = excluded.display_name,
    email = excluded.email,
    email_verified = excluded.email_verified,
    updated_at = now();

  select *
  into personal_record
  from public.ensure_personal_organization_for_current_user(display_name)
  limit 1;

  return query select actor_id, personal_record.organizacion_id, personal_record.organizacion_miembro_id;
end;
$$;

grant execute on function public.complete_user_onboarding(text, text) to authenticated;

create or replace function public.create_organization_for_current_user(
  nombre_org text,
  ruc_org text default null
)
returns public.organizaciones
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  actor_id uuid := auth.uid();
  new_organization public.organizaciones%rowtype;
begin
  if actor_id is null then
    raise exception 'CYP_PERMISSION: Debes iniciar sesion para crear una organizacion.'
      using errcode = '42501';
  end if;

  if length(btrim(coalesce(nombre_org, ''))) = 0 then
    raise exception 'CYP_VALIDATION: El nombre de la organizacion es obligatorio.';
  end if;

  insert into public.organizaciones (nombre, ruc, tipo_organizacion)
  values (
    btrim(nombre_org),
    nullif(btrim(coalesce(ruc_org, '')), ''),
    'empresa'
  )
  returning * into new_organization;

  insert into public.organizacion_miembros (
    organizacion_id,
    user_id,
    rol,
    estado,
    joined_at
  )
  values (
    new_organization.id,
    actor_id,
    'owner',
    'activo',
    now()
  );

  insert into public.activity_events (
    organizacion_id,
    actor_id,
    entity_type,
    entity_id,
    action,
    after,
    changed_fields,
    metadata
  )
  values (
    new_organization.id,
    actor_id,
    'organizacion',
    new_organization.id,
    'create',
    to_jsonb(new_organization),
    to_jsonb(new_organization) - 'created_at' - 'updated_at',
    jsonb_build_object('repository', 'organizationsRepository')
  );

  return new_organization;
end;
$$;

grant execute on function public.create_organization_for_current_user(text, text) to authenticated;

create or replace function public.create_project_in_organization(
  p_organizacion_id uuid,
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
    and organizacion_id = p_organizacion_id
    and estado = 'activo'
  limit 1;

  if not found then
    raise exception 'CYP_NOT_FOUND: No perteneces a la organizacion seleccionada.';
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
    p_organizacion_id,
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
  on conflict (proyecto_id, organizacion_miembro_id) do update
  set rol = 'admin', estado = 'activo', updated_at = now()
  returning * into new_project_member;

  insert into public.proyecto_miembros (
    proyecto_id,
    organizacion_miembro_id,
    rol,
    estado
  )
  select
    new_project.id,
    om.id,
    coalesce(om.rol_proyecto_predeterminado, 'lector'::public.rol_proyecto),
    'activo'::public.estado_miembro
  from public.organizacion_miembros om
  where om.organizacion_id = p_organizacion_id
    and om.estado = 'activo'
    and om.acceso_todos_proyectos = true
    and om.rol_proyecto_predeterminado is not null
    and om.id <> current_membership.id
  on conflict (proyecto_id, organizacion_miembro_id) do update
  set rol = excluded.rol,
      estado = 'activo',
      updated_at = now();

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

grant execute on function public.create_project_in_organization(uuid, text, text, text) to authenticated;

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

  return public.create_project_in_organization(
    current_membership.organizacion_id,
    nombre_proyecto,
    cliente,
    ubicacion
  );
end;
$$;

grant execute on function public.create_project_with_current_member(text, text, text) to authenticated;

create or replace function public.create_organization_invitation(
  p_organizacion_id uuid,
  p_email text,
  p_rol_organizacion public.rol_organizacion default 'miembro',
  p_proyecto_ids uuid[] default '{}'::uuid[],
  p_incluir_proyectos_futuros boolean default false,
  p_rol_proyecto public.rol_proyecto default null
)
returns table (
  invitacion_id uuid,
  organizacion_id uuid,
  email text,
  token text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  actor_id uuid := auth.uid();
  normalized_email text := lower(btrim(coalesce(p_email, '')));
  raw_token text := encode(extensions.gen_random_bytes(32), 'hex');
  hashed_token text := encode(extensions.digest(raw_token, 'sha256'), 'hex');
  new_invitation public.organizacion_invitaciones%rowtype;
  selected_project_ids uuid[] := coalesce(p_proyecto_ids, '{}'::uuid[]);
  include_future boolean := coalesce(p_incluir_proyectos_futuros, false);
  selected_project_count integer;
begin
  if actor_id is null then
    raise exception 'CYP_PERMISSION: Debes iniciar sesion para invitar usuarios.'
      using errcode = '42501';
  end if;

  if not public.is_organization_admin(p_organizacion_id) then
    raise exception 'CYP_PERMISSION: Solo owners o admins pueden invitar a esta organizacion.'
      using errcode = '42501';
  end if;

  if normalized_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'CYP_VALIDATION: Ingresa un correo valido.';
  end if;

  if p_rol_organizacion = 'owner' then
    raise exception 'CYP_PERMISSION: Las invitaciones no pueden asignar owner.';
  end if;

  if p_rol_proyecto = 'presupuestador' then
    raise exception 'CYP_VALIDATION: Usa lector, editor o admin como rol de proyecto.';
  end if;

  selected_project_ids := (
    select coalesce(array_agg(distinct project_id), '{}'::uuid[])
    from unnest(selected_project_ids) as project_id
  );
  selected_project_count := cardinality(selected_project_ids);

  if p_rol_organizacion = 'admin' then
    include_future := true;
    p_rol_proyecto := 'admin';
    selected_project_ids := coalesce((
      select array_agg(p.id order by p.created_at asc)
      from public.proyectos p
      where p.organizacion_id = p_organizacion_id
        and p.estado = 'activo'
    ), '{}'::uuid[]);
    selected_project_count := cardinality(selected_project_ids);
  elsif selected_project_count > 0 or include_future then
    if p_rol_proyecto is null then
      raise exception 'CYP_VALIDATION: Selecciona un rol para los proyectos.';
    end if;
  elsif p_rol_proyecto is not null then
    raise exception 'CYP_VALIDATION: Selecciona proyectos o activa acceso a proyectos futuros.';
  end if;

  if selected_project_count > 0 and exists (
    select 1
    from unnest(selected_project_ids) as selected_project_id
    where not public.project_belongs_to_organization(selected_project_id, p_organizacion_id)
  ) then
    raise exception 'CYP_VALIDATION: Uno o mas proyectos no pertenecen a la organizacion seleccionada.';
  end if;

  update public.organizacion_invitaciones oi
  set estado = 'revocada',
      revoked_at = now(),
      updated_at = now()
  where oi.organizacion_id = p_organizacion_id
    and oi.email = normalized_email
    and oi.estado = 'pendiente';

  insert into public.organizacion_invitaciones (
    organizacion_id,
    email,
    rol_organizacion,
    proyecto_ids,
    incluir_proyectos_futuros,
    rol_proyecto,
    token_hash,
    invited_by,
    expires_at
  )
  values (
    p_organizacion_id,
    normalized_email,
    p_rol_organizacion,
    selected_project_ids,
    include_future,
    p_rol_proyecto,
    hashed_token,
    actor_id,
    now() + interval '14 days'
  )
  returning * into new_invitation;

  insert into public.activity_events (
    organizacion_id,
    actor_id,
    entity_type,
    entity_id,
    action,
    after,
    changed_fields,
    metadata
  )
  values (
    p_organizacion_id,
    actor_id,
    'organizacion_invitacion',
    new_invitation.id,
    'create',
    to_jsonb(new_invitation) - 'token_hash',
    jsonb_build_object('email', jsonb_build_object('after', normalized_email)),
    jsonb_build_object(
      'repository', 'organizationsRepository',
      'project_count', selected_project_count,
      'include_future_projects', include_future
    )
  );

  return query select
    new_invitation.id,
    new_invitation.organizacion_id,
    new_invitation.email,
    raw_token,
    new_invitation.expires_at;
end;
$$;

grant execute on function public.create_organization_invitation(uuid, text, public.rol_organizacion, uuid[], boolean, public.rol_proyecto) to authenticated;

create or replace function public.regenerate_organization_invitation_token(
  p_invitacion_id uuid
)
returns table (
  invitacion_id uuid,
  organizacion_id uuid,
  email text,
  token text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  raw_token text := encode(extensions.gen_random_bytes(32), 'hex');
  hashed_token text := encode(extensions.digest(raw_token, 'sha256'), 'hex');
  updated_invitation public.organizacion_invitaciones%rowtype;
begin
  update public.organizacion_invitaciones oi
  set token_hash = hashed_token,
      expires_at = now() + interval '14 days',
      updated_at = now()
  where oi.id = p_invitacion_id
    and oi.estado = 'pendiente'
    and public.is_organization_admin(oi.organizacion_id)
  returning * into updated_invitation;

  if not found then
    raise exception 'CYP_NOT_FOUND: No se encontro una invitacion pendiente editable.';
  end if;

  return query select
    updated_invitation.id,
    updated_invitation.organizacion_id,
    updated_invitation.email,
    raw_token,
    updated_invitation.expires_at;
end;
$$;

grant execute on function public.regenerate_organization_invitation_token(uuid) to authenticated;

create or replace function public.revoke_organization_invitation(
  p_invitacion_id uuid
)
returns public.organizacion_invitaciones
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  updated_invitation public.organizacion_invitaciones%rowtype;
begin
  update public.organizacion_invitaciones oi
  set estado = 'revocada',
      revoked_at = now(),
      updated_at = now()
  where oi.id = p_invitacion_id
    and oi.estado = 'pendiente'
    and public.is_organization_admin(oi.organizacion_id)
  returning * into updated_invitation;

  if not found then
    raise exception 'CYP_NOT_FOUND: No se encontro una invitacion pendiente editable.';
  end if;

  return updated_invitation;
end;
$$;

grant execute on function public.revoke_organization_invitation(uuid) to authenticated;

create or replace function public.accept_organization_invitation(
  p_token text
)
returns table (
  invitacion_id uuid,
  organizacion_id uuid,
  proyecto_id uuid
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  actor_id uuid := auth.uid();
  actor_email text := public.current_verified_email();
  hashed_token text := encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex');
  invitation public.organizacion_invitaciones%rowtype;
  member_id uuid;
begin
  if actor_id is null then
    raise exception 'CYP_PERMISSION: Debes iniciar sesion para aceptar la invitacion.'
      using errcode = '42501';
  end if;

  if actor_email is null then
    raise exception 'CYP_PERMISSION: Verifica tu correo antes de aceptar invitaciones.'
      using errcode = '42501';
  end if;

  select *
  into invitation
  from public.organizacion_invitaciones
  where token_hash = hashed_token
  limit 1;

  if not found then
    raise exception 'CYP_NOT_FOUND: La invitacion no existe o el enlace es invalido.';
  end if;

  if invitation.estado <> 'pendiente' then
    raise exception 'CYP_VALIDATION: Esta invitacion ya no esta pendiente.';
  end if;

  if invitation.expires_at < now() then
    update public.organizacion_invitaciones
    set estado = 'expirada', updated_at = now()
    where id = invitation.id;
    raise exception 'CYP_VALIDATION: Esta invitacion expiro.';
  end if;

  if invitation.email <> actor_email then
    raise exception 'CYP_PERMISSION: Esta invitacion pertenece a otro correo.'
      using errcode = '42501';
  end if;

  insert into public.organizacion_miembros (
    organizacion_id,
    user_id,
    rol,
    estado,
    acceso_todos_proyectos,
    rol_proyecto_predeterminado,
    invitado_por,
    joined_at
  )
  values (
    invitation.organizacion_id,
    actor_id,
    invitation.rol_organizacion,
    'activo',
    invitation.incluir_proyectos_futuros,
    case when invitation.incluir_proyectos_futuros then invitation.rol_proyecto else null end,
    invitation.invited_by,
    now()
  )
  on conflict on constraint organizacion_miembros_unique_user do update
  set
    rol = case
      when public.organizacion_miembros.rol = 'owner' then 'owner'
      else excluded.rol
    end,
    estado = 'activo',
    acceso_todos_proyectos = excluded.acceso_todos_proyectos,
    rol_proyecto_predeterminado = excluded.rol_proyecto_predeterminado,
    invitado_por = excluded.invitado_por,
    joined_at = coalesce(public.organizacion_miembros.joined_at, now()),
    updated_at = now()
  returning id into member_id;

  if cardinality(invitation.proyecto_ids) > 0 then
    insert into public.proyecto_miembros (
      proyecto_id,
      organizacion_miembro_id,
      rol,
      estado
    )
    select
      selected_project_id,
      member_id,
      invitation.rol_proyecto,
      'activo'
    from unnest(invitation.proyecto_ids) as selected_project_id
    on conflict on constraint proyecto_miembros_unique_member do update
    set rol = excluded.rol,
        estado = 'activo',
        updated_at = now();
  end if;

  update public.organizacion_invitaciones
  set estado = 'aceptada',
      accepted_by = actor_id,
      accepted_at = now(),
      updated_at = now()
  where id = invitation.id;

  return query select invitation.id, invitation.organizacion_id, invitation.proyecto_ids[1];
end;
$$;

grant execute on function public.accept_organization_invitation(text) to authenticated;

create or replace function public.accept_organization_invitation_by_id(
  p_invitacion_id uuid
)
returns table (
  invitacion_id uuid,
  organizacion_id uuid,
  proyecto_id uuid
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  actor_id uuid := auth.uid();
  actor_email text := public.current_verified_email();
  invitation public.organizacion_invitaciones%rowtype;
  member_id uuid;
begin
  if actor_id is null then
    raise exception 'CYP_PERMISSION: Debes iniciar sesion para aceptar la invitacion.'
      using errcode = '42501';
  end if;

  if actor_email is null then
    raise exception 'CYP_PERMISSION: Verifica tu correo antes de aceptar invitaciones.'
      using errcode = '42501';
  end if;

  select *
  into invitation
  from public.organizacion_invitaciones
  where id = p_invitacion_id
  limit 1;

  if not found then
    raise exception 'CYP_NOT_FOUND: La invitacion no existe.';
  end if;

  if invitation.estado <> 'pendiente' then
    raise exception 'CYP_VALIDATION: Esta invitacion ya no esta pendiente.';
  end if;

  if invitation.expires_at < now() then
    update public.organizacion_invitaciones
    set estado = 'expirada', updated_at = now()
    where id = invitation.id;
    raise exception 'CYP_VALIDATION: Esta invitacion expiro.';
  end if;

  if invitation.email <> actor_email then
    raise exception 'CYP_PERMISSION: Esta invitacion pertenece a otro correo.'
      using errcode = '42501';
  end if;

  insert into public.organizacion_miembros (
    organizacion_id,
    user_id,
    rol,
    estado,
    acceso_todos_proyectos,
    rol_proyecto_predeterminado,
    invitado_por,
    joined_at
  )
  values (
    invitation.organizacion_id,
    actor_id,
    invitation.rol_organizacion,
    'activo',
    invitation.incluir_proyectos_futuros,
    case when invitation.incluir_proyectos_futuros then invitation.rol_proyecto else null end,
    invitation.invited_by,
    now()
  )
  on conflict on constraint organizacion_miembros_unique_user do update
  set
    rol = case
      when public.organizacion_miembros.rol = 'owner' then 'owner'
      else excluded.rol
    end,
    estado = 'activo',
    acceso_todos_proyectos = excluded.acceso_todos_proyectos,
    rol_proyecto_predeterminado = excluded.rol_proyecto_predeterminado,
    invitado_por = excluded.invitado_por,
    joined_at = coalesce(public.organizacion_miembros.joined_at, now()),
    updated_at = now()
  returning id into member_id;

  if cardinality(invitation.proyecto_ids) > 0 then
    insert into public.proyecto_miembros (
      proyecto_id,
      organizacion_miembro_id,
      rol,
      estado
    )
    select
      selected_project_id,
      member_id,
      invitation.rol_proyecto,
      'activo'
    from unnest(invitation.proyecto_ids) as selected_project_id
    on conflict on constraint proyecto_miembros_unique_member do update
    set rol = excluded.rol,
        estado = 'activo',
        updated_at = now();
  end if;

  update public.organizacion_invitaciones
  set estado = 'aceptada',
      accepted_by = actor_id,
      accepted_at = now(),
      updated_at = now()
  where id = invitation.id;

  return query select invitation.id, invitation.organizacion_id, invitation.proyecto_ids[1];
end;
$$;

grant execute on function public.accept_organization_invitation_by_id(uuid) to authenticated;

create or replace function public.reject_organization_invitation(
  p_invitacion_id uuid
)
returns public.organizacion_invitaciones
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  actor_email text := public.current_verified_email();
  updated_invitation public.organizacion_invitaciones%rowtype;
begin
  if actor_email is null then
    raise exception 'CYP_PERMISSION: Verifica tu correo antes de rechazar invitaciones.'
      using errcode = '42501';
  end if;

  update public.organizacion_invitaciones oi
  set estado = 'rechazada',
      updated_at = now()
  where oi.id = p_invitacion_id
    and oi.estado = 'pendiente'
    and oi.email = actor_email
  returning * into updated_invitation;

  if not found then
    raise exception 'CYP_NOT_FOUND: No se encontro una invitacion pendiente para tu correo.';
  end if;

  return updated_invitation;
end;
$$;

grant execute on function public.reject_organization_invitation(uuid) to authenticated;

create or replace function public.list_received_organization_invitations()
returns jsonb
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', oi.id,
      'organizacionId', oi.organizacion_id,
      'organizacionNombre', o.nombre,
      'organizacionTipo', o.tipo_organizacion,
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
      'createdAt', oi.created_at
    )
    order by oi.created_at desc
  ), '[]'::jsonb)
  from public.organizacion_invitaciones oi
  join public.organizaciones o on o.id = oi.organizacion_id
  left join public.proyectos p on p.id = oi.proyecto_id
  left join lateral (
    select jsonb_agg(project.nombre order by project.created_at asc) as names
    from public.proyectos project
    where project.id = any(oi.proyecto_ids)
  ) project_names on true
  where oi.email = public.current_verified_email()
    and oi.estado = 'pendiente'
    and oi.expires_at >= now()
$$;

grant execute on function public.list_received_organization_invitations() to authenticated;

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
        'estado', case when oi.estado = 'pendiente' and oi.expires_at < now() then 'expirada' else oi.estado end,
        'expiresAt', oi.expires_at,
        'createdAt', oi.created_at
      )
      order by oi.created_at desc
    ) filter (where oi.id is not null), '[]'::jsonb)
  end
  from public.organizaciones o
  left join public.organizacion_invitaciones oi on oi.organizacion_id = o.id
  left join public.proyectos p on p.id = oi.proyecto_id
  left join lateral (
    select jsonb_agg(project.nombre order by project.created_at asc) as names
    from public.proyectos project
    where project.id = any(oi.proyecto_ids)
  ) project_names on true
  where o.id = p_organizacion_id
$$;

grant execute on function public.list_sent_organization_invitations(uuid) to authenticated;

drop function if exists public.list_budget_dashboard_projects();

create or replace function public.list_budget_dashboard_projects(
  p_organizacion_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  org_id uuid;
begin
  if actor_id is null then
    raise exception 'CYP_PERMISSION: Debes iniciar sesion para cargar el dashboard.'
      using errcode = '42501';
  end if;

  select om.organizacion_id
  into org_id
  from public.organizacion_miembros om
  where om.user_id = actor_id
    and om.estado = 'activo'
    and (p_organizacion_id is null or om.organizacion_id = p_organizacion_id)
  order by om.created_at asc
  limit 1;

  if org_id is null then
    raise exception 'CYP_NOT_FOUND: No se encontro una organizacion activa.';
  end if;

  return coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'id', project.id,
        'proyecto_nombre', project.nombre,
        'cliente', coalesce(latest_version.cliente, draft.cliente, project.cliente),
        'ubicacion', coalesce(latest_version.ubicacion, draft.ubicacion, project.ubicacion),
        'estado', case when latest_version.id is not null then 'aprobado' else 'borrador' end,
        'version', case
          when latest_version.id is not null then 'V' || latest_version.numero_version::text || ' oficial'
          when draft.id is not null then 'Borrador activo'
          else 'Sin presupuesto'
        end,
        'subtotal', coalesce(latest_version.subtotal, draft.subtotal, 0),
        'total', coalesce(latest_version.total, draft.total, 0),
        'updated_at', coalesce(draft.updated_at, latest_version.emitida_at, project.updated_at),
        'partidasTotal', coalesce(latest_version_lines.count, draft_lines.count, 0),
        'partidasCompletadas', 0,
        'gastoEjecutado', 0,
        'gastoPorcentaje', 0
      )
      order by project.created_at asc
    )
    from public.proyectos project
    left join public.presupuesto_borradores draft
      on draft.proyecto_id = project.id
     and draft.estado = 'activo'
    left join lateral (
      select version.*
      from public.presupuesto_versiones version
      where version.proyecto_id = project.id
        and version.estado = 'emitida'
      order by version.numero_version desc
      limit 1
    ) latest_version on true
    left join lateral (
      select count(*)::integer
      from public.presupuesto_borrador_partidas line
      where line.presupuesto_borrador_id = draft.id
    ) draft_lines on true
    left join lateral (
      select count(*)::integer
      from public.presupuesto_version_partidas line
      where line.presupuesto_version_id = latest_version.id
    ) latest_version_lines on true
    where project.organizacion_id = org_id
      and project.estado = 'activo'
      and public.can_read_project(project.id)
  ), '[]'::jsonb);
end;
$$;

grant execute on function public.list_budget_dashboard_projects(uuid) to authenticated;

create or replace function public.list_workspace_organizations()
returns jsonb
language sql
stable
security definer
set search_path = public, auth
as $$
  with memberships as (
    select
      om.id as membership_id,
      om.organizacion_id,
      om.rol,
      om.acceso_todos_proyectos,
      om.rol_proyecto_predeterminado,
      om.created_at,
      o.nombre,
      o.ruc,
      o.tipo_organizacion
    from public.organizacion_miembros om
    join public.organizaciones o on o.id = om.organizacion_id
    where om.user_id = auth.uid()
      and om.estado = 'activo'
      and o.estado = 'activo'
  ),
  projects as (
    select
      m.organizacion_id,
      coalesce(jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'nombre', p.nombre,
          'cliente', p.cliente,
          'ubicacion', p.ubicacion,
          'codigo', p.codigo,
          'descripcion', p.descripcion,
          'estado', p.estado,
          'created_by', p.created_by,
          'created_at', p.created_at,
          'updated_at', p.updated_at,
          'rol', case
            when m.rol in ('owner', 'admin') then 'admin'::public.rol_proyecto
            when pm.rol is not null then pm.rol
            when m.acceso_todos_proyectos then m.rol_proyecto_predeterminado
            else null
          end
        )
        order by p.created_at asc
      ) filter (where p.id is not null), '[]'::jsonb) as projects
    from memberships m
    left join public.proyectos p
      on p.organizacion_id = m.organizacion_id
     and p.estado = 'activo'
     and public.can_read_project(p.id)
    left join public.proyecto_miembros pm
      on pm.proyecto_id = p.id
     and pm.organizacion_miembro_id = m.membership_id
     and pm.estado = 'activo'
    group by m.organizacion_id
  )
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'membershipId', m.membership_id,
      'id', m.organizacion_id,
      'nombre', m.nombre,
      'ruc', m.ruc,
      'tipoOrganizacion', m.tipo_organizacion,
      'rol', m.rol,
      'canMutate', m.rol in ('owner', 'admin'),
      'accesoTodosProyectos', m.acceso_todos_proyectos,
      'rolProyectoPredeterminado', m.rol_proyecto_predeterminado,
      'projects', coalesce(p.projects, '[]'::jsonb)
    )
    order by case when m.tipo_organizacion = 'personal' then 0 else 1 end, m.created_at asc
  ), '[]'::jsonb)
  from memberships m
  left join projects p on p.organizacion_id = m.organizacion_id
$$;

grant execute on function public.list_workspace_organizations() to authenticated;
