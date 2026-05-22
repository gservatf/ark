-- C y P - Realtime Presence authorization.
-- Presence is ephemeral UI state for collaborators viewing/editing records.
-- Durable history remains in public.activity_events and business tables.

drop policy if exists realtime_messages_select_cyp_activity on realtime.messages;
drop policy if exists realtime_messages_select_cyp_private_channels on realtime.messages;
drop policy if exists realtime_messages_insert_cyp_private_channels on realtime.messages;

create policy realtime_messages_select_cyp_private_channels
on realtime.messages for select to authenticated
using (
  realtime.messages.extension in ('broadcast', 'presence')
  and realtime.messages.topic = (select realtime.topic())
  and case
    when (select realtime.topic()) ~ '^org:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then public.is_organization_member(split_part((select realtime.topic()), ':', 2)::uuid)
    when (select realtime.topic()) ~ '^project:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then public.can_read_project(split_part((select realtime.topic()), ':', 2)::uuid)
    else false
  end
);

create policy realtime_messages_insert_cyp_private_channels
on realtime.messages for insert to authenticated
with check (
  realtime.messages.extension in ('broadcast', 'presence')
  and realtime.messages.topic = (select realtime.topic())
  and case
    when (select realtime.topic()) ~ '^org:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then public.is_organization_member(split_part((select realtime.topic()), ':', 2)::uuid)
    when (select realtime.topic()) ~ '^project:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then public.can_read_project(split_part((select realtime.topic()), ':', 2)::uuid)
    else false
  end
);
