-- C y P - Realtime activity broadcast.
-- Broadcast is an ephemeral invalidation signal. The durable source of truth
-- remains public.activity_events plus the persisted business tables.

create schema if not exists private;

alter table realtime.messages enable row level security;

drop policy if exists realtime_messages_select_cyp_activity on realtime.messages;

create policy realtime_messages_select_cyp_activity
on realtime.messages for select to authenticated
using (
  realtime.messages.extension = 'broadcast'
  and realtime.messages.topic = (select realtime.topic())
  and case
    when (select realtime.topic()) ~ '^org:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then public.is_organization_member(split_part((select realtime.topic()), ':', 2)::uuid)
    when (select realtime.topic()) ~ '^project:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then public.can_read_project(split_part((select realtime.topic()), ':', 2)::uuid)
    else false
  end
);

create or replace function private.broadcast_activity_event()
returns trigger
language plpgsql
security definer
set search_path = private, public, realtime
as $$
declare
  payload jsonb;
begin
  payload := jsonb_build_object(
    'activityEventId', new.id,
    'organizacionId', new.organizacion_id,
    'proyectoId', new.proyecto_id,
    'actorId', new.actor_id,
    'entityType', new.entity_type,
    'entityId', new.entity_id,
    'action', new.action,
    'metadata', coalesce(new.metadata, '{}'::jsonb),
    'createdAt', new.created_at
  );

  perform realtime.send(payload, 'activity_event', 'org:' || new.organizacion_id::text, true);

  if new.proyecto_id is not null then
    perform realtime.send(payload, 'activity_event', 'project:' || new.proyecto_id::text, true);
  end if;

  return new;
end;
$$;

drop trigger if exists activity_events_broadcast_realtime on public.activity_events;

create trigger activity_events_broadcast_realtime
after insert on public.activity_events
for each row
execute function private.broadcast_activity_event();
