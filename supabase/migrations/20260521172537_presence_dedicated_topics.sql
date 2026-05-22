-- Use dedicated Presence topics so the browser singleton can keep a Broadcast
-- subscription and a Presence subscription for the same project/org without
-- Supabase Realtime returning the already-subscribed channel.

drop policy if exists realtime_messages_select_cyp_private_channels on realtime.messages;
drop policy if exists realtime_messages_insert_cyp_private_channels on realtime.messages;

create policy realtime_messages_select_cyp_private_channels
on realtime.messages for select to authenticated
using (
  realtime.messages.topic = (select realtime.topic())
  and case
    when realtime.messages.extension = 'broadcast'
      and (select realtime.topic()) ~ '^org:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then public.is_organization_member(split_part((select realtime.topic()), ':', 2)::uuid)
    when realtime.messages.extension = 'broadcast'
      and (select realtime.topic()) ~ '^project:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then public.can_read_project(split_part((select realtime.topic()), ':', 2)::uuid)
    when realtime.messages.extension = 'presence'
      and (select realtime.topic()) ~ '^presence:org:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then public.is_organization_member(split_part((select realtime.topic()), ':', 3)::uuid)
    when realtime.messages.extension = 'presence'
      and (select realtime.topic()) ~ '^presence:project:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then public.can_read_project(split_part((select realtime.topic()), ':', 3)::uuid)
    -- Legacy compatibility for channels opened before this migration.
    when realtime.messages.extension = 'presence'
      and (select realtime.topic()) ~ '^org:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then public.is_organization_member(split_part((select realtime.topic()), ':', 2)::uuid)
    when realtime.messages.extension = 'presence'
      and (select realtime.topic()) ~ '^project:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then public.can_read_project(split_part((select realtime.topic()), ':', 2)::uuid)
    else false
  end
);

create policy realtime_messages_insert_cyp_private_channels
on realtime.messages for insert to authenticated
with check (
  realtime.messages.extension = 'presence'
  and realtime.messages.topic = (select realtime.topic())
  and realtime.messages.payload->>'actorId' = auth.uid()::text
  and case
    when (select realtime.topic()) ~ '^presence:org:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then public.is_organization_member(split_part((select realtime.topic()), ':', 3)::uuid)
    when (select realtime.topic()) ~ '^presence:project:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then public.can_read_project(split_part((select realtime.topic()), ':', 3)::uuid)
    -- Legacy compatibility for clients that have not reloaded yet.
    when (select realtime.topic()) ~ '^org:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then public.is_organization_member(split_part((select realtime.topic()), ':', 2)::uuid)
    when (select realtime.topic()) ~ '^project:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then public.can_read_project(split_part((select realtime.topic()), ':', 2)::uuid)
    else false
  end
);
