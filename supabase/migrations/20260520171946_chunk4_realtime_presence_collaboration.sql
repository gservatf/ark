-- C y P - Chunk 4 Realtime, Presence and collaboration hardening.
-- Presence remains ephemeral, but visible identity is resolved from trusted
-- database profiles instead of client-controlled Presence payload fields.

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  email_verified boolean not null default false,
  display_name text not null default 'Usuario colaborador',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_profiles_display_name_not_blank check (length(btrim(display_name)) > 0),
  constraint user_profiles_email_not_blank check (email is null or length(btrim(email)) > 0)
);

create trigger user_profiles_set_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

create or replace function private.sync_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_email text;
  verified boolean;
  safe_display_name text;
begin
  normalized_email := nullif(btrim(coalesce(new.email, '')), '');
  verified := new.email_confirmed_at is not null;
  safe_display_name := coalesce(nullif(split_part(normalized_email, '@', 1), ''), 'Usuario colaborador');

  insert into public.user_profiles (
    user_id,
    email,
    email_verified,
    display_name,
    created_at,
    updated_at
  ) values (
    new.id,
    case when verified then normalized_email else null end,
    verified,
    safe_display_name,
    now(),
    now()
  )
  on conflict (user_id) do update
  set
    email = excluded.email,
    email_verified = excluded.email_verified,
    display_name = excluded.display_name,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists sync_user_profile_on_auth_user on auth.users;

create trigger sync_user_profile_on_auth_user
after insert or update of email, email_confirmed_at on auth.users
for each row execute function private.sync_user_profile();

insert into public.user_profiles (
  user_id,
  email,
  email_verified,
  display_name,
  created_at,
  updated_at
)
select
  u.id,
  case when u.email_confirmed_at is not null then nullif(btrim(coalesce(u.email, '')), '') else null end,
  u.email_confirmed_at is not null,
  coalesce(nullif(split_part(nullif(btrim(coalesce(u.email, '')), ''), '@', 1), ''), 'Usuario colaborador'),
  now(),
  now()
from auth.users u
on conflict (user_id) do update
set
  email = excluded.email,
  email_verified = excluded.email_verified,
  display_name = excluded.display_name,
  updated_at = now();

alter table public.user_profiles enable row level security;

drop policy if exists user_profiles_select_collaborators on public.user_profiles;
drop policy if exists user_profiles_insert_blocked on public.user_profiles;
drop policy if exists user_profiles_update_blocked on public.user_profiles;
drop policy if exists user_profiles_delete_blocked on public.user_profiles;

create policy user_profiles_select_collaborators
on public.user_profiles for select to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.organizacion_miembros current_member
    join public.organizacion_miembros target_member
      on target_member.organizacion_id = current_member.organizacion_id
    where current_member.user_id = auth.uid()
      and current_member.estado = 'activo'
      and target_member.user_id = user_profiles.user_id
      and target_member.estado = 'activo'
  )
);

create policy user_profiles_insert_blocked
on public.user_profiles for insert to authenticated
with check (false);

create policy user_profiles_update_blocked
on public.user_profiles for update to authenticated
using (false)
with check (false);

create policy user_profiles_delete_blocked
on public.user_profiles for delete to authenticated
using (false);

grant select on public.user_profiles to authenticated;

drop policy if exists realtime_messages_insert_cyp_private_channels on realtime.messages;

create policy realtime_messages_insert_cyp_private_channels
on realtime.messages for insert to authenticated
with check (
  realtime.messages.extension = 'presence'
  and realtime.messages.topic = (select realtime.topic())
  and realtime.messages.payload->>'actorId' = auth.uid()::text
  and case
    when (select realtime.topic()) ~ '^org:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then public.is_organization_member(split_part((select realtime.topic()), ':', 2)::uuid)
    when (select realtime.topic()) ~ '^project:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then public.can_read_project(split_part((select realtime.topic()), ':', 2)::uuid)
    else false
  end
);
