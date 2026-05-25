-- C y P - Fix de ambiguedad en complete_user_onboarding.
-- En funciones RETURNS TABLE, los nombres de columnas de retorno son variables
-- PL/pgSQL. Evitamos usar `user_id` como nombre de retorno para que no choque
-- con columnas de tablas como organizacion_miembros.user_id.

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
  existing_membership public.organizacion_miembros%rowtype;
  new_organization_id uuid;
  new_membership_id uuid;
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
    case when u.email_confirmed_at is not null then nullif(btrim(coalesce(u.email, '')), '') else null end,
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

  select om.*
  into existing_membership
  from public.organizacion_miembros om
  where om.user_id = actor_id
    and om.estado = 'activo'
  order by om.created_at asc
  limit 1;

  if found then
    return query select
      actor_id,
      existing_membership.organizacion_id,
      existing_membership.id;
    return;
  end if;

  insert into public.organizaciones (nombre, ruc)
  values ('Espacio de ' || display_name, null)
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

  return query select actor_id, new_organization_id, new_membership_id;
end;
$$;

grant execute on function public.complete_user_onboarding(text, text) to authenticated;
