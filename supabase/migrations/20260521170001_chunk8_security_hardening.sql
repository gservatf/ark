-- Chunk 8: security hardening for sequence privileges and safe presence identity.

-- SEG-25: do not keep broad sequence privileges for authenticated clients.
-- Current app tables use UUID defaults, so no public sequence needs client access.
revoke all privileges on all sequences in schema public from anon;
revoke all privileges on all sequences in schema public from authenticated;

alter default privileges in schema public revoke all privileges on sequences from anon;
alter default privileges in schema public revoke all privileges on sequences from authenticated;

-- SEG-27: never derive a visible display name from an unverified email.
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
  safe_display_name := case
    when verified then coalesce(nullif(split_part(normalized_email, '@', 1), ''), 'Usuario colaborador')
    else 'Usuario colaborador'
  end;

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
  case
    when u.email_confirmed_at is not null
      then coalesce(nullif(split_part(nullif(btrim(coalesce(u.email, '')), ''), '@', 1), ''), 'Usuario colaborador')
    else 'Usuario colaborador'
  end,
  now(),
  now()
from auth.users u
on conflict (user_id) do update
set
  email = excluded.email,
  email_verified = excluded.email_verified,
  display_name = excluded.display_name,
  updated_at = now();
