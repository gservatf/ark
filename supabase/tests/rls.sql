begin;

select no_plan();

insert into realtime.messages (topic, extension, payload, event, private)
values
  ('org:00000000-0000-0000-0000-000000000901', 'broadcast', '{}'::jsonb, 'activity_event', true),
  ('org:00000000-0000-0000-0000-000000000901', 'presence', '{}'::jsonb, 'presence_state', true),
  ('presence:org:00000000-0000-0000-0000-000000000901', 'presence', '{}'::jsonb, 'presence_state', true),
  ('project:00000000-0000-0000-0000-000000000902', 'broadcast', '{}'::jsonb, 'activity_event', true),
  ('project:00000000-0000-0000-0000-000000000902', 'presence', '{}'::jsonb, 'presence_state', true),
  ('presence:project:00000000-0000-0000-0000-000000000902', 'presence', '{}'::jsonb, 'presence_state', true);

select ok(
  bool_and(c.relrowsecurity),
  'RLS esta activo en todas las tablas publicas'
)
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r';

set local role anon;
select is((select count(*)::int from public.organizaciones), 0, 'anon no lee organizaciones');
select is((select count(*)::int from public.proyectos), 0, 'anon no lee proyectos');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000a001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select is((select count(*)::int from public.organizaciones), 1, 'owner ve solo su organizacion');
select is((select count(*)::int from public.proyectos), 1, 'owner ve solo su proyecto demo');
select ok((select count(*) > 0 from public.recurso_proveedor_precios), 'owner ve cotizaciones de su organizacion');
select set_config('realtime.topic', 'org:00000000-0000-0000-0000-000000000901', true);
select ok(
  (select count(*) > 0 from realtime.messages where topic = 'org:00000000-0000-0000-0000-000000000901'),
  'owner puede suscribirse al topic realtime de su organizacion'
);
select lives_ok(
  $$
    insert into realtime.messages (topic, extension, payload, event, private)
    values ('org:00000000-0000-0000-0000-000000000901', 'presence', '{"actorId":"00000000-0000-0000-0000-00000000a001"}'::jsonb, 'presence_state', true)
  $$,
  'owner puede publicar Presence en su organizacion'
);
select set_config('realtime.topic', 'presence:org:00000000-0000-0000-0000-000000000901', true);
select ok(
  (select count(*) > 0 from realtime.messages where topic = 'presence:org:00000000-0000-0000-0000-000000000901'),
  'owner puede suscribirse al topic dedicado de Presence de su organizacion'
);
select lives_ok(
  $$
    insert into realtime.messages (topic, extension, payload, event, private)
    values ('presence:org:00000000-0000-0000-0000-000000000901', 'presence', '{"actorId":"00000000-0000-0000-0000-00000000a001"}'::jsonb, 'presence_state', true)
  $$,
  'owner puede publicar Presence en topic dedicado de organizacion'
);
select set_config('realtime.topic', 'org:00000000-0000-0000-0000-000000000901', true);
select throws_ok(
  $$
    insert into realtime.messages (topic, extension, payload, event, private)
    values ('org:00000000-0000-0000-0000-000000000901', 'broadcast', '{"actorId":"00000000-0000-0000-0000-00000000a001"}'::jsonb, 'activity_event', true)
  $$,
  '42501',
  null,
  'cliente no puede publicar Broadcast directo'
);
select throws_ok(
  $$
    insert into realtime.messages (topic, extension, payload, event, private)
    values ('org:00000000-0000-0000-0000-000000000901', 'presence', '{"actorId":"00000000-0000-0000-0000-00000000a002"}'::jsonb, 'presence_state', true)
  $$,
  '42501',
  null,
  'Presence exige actorId del usuario actual'
);
select is((select count(*)::int from public.user_profiles), 3, 'owner ve perfiles de miembros de su organizacion');
select is(
  (select email from public.user_profiles where user_id = '00000000-0000-0000-0000-00000000a002'),
  'editor@cyp.local',
  'perfil confiable expone email verificado de colaborador'
);
select ok(public.is_organization_admin('00000000-0000-0000-0000-000000000901'), 'owner es admin de organizacion');
select ok(public.can_emit_project('00000000-0000-0000-0000-000000000902'), 'owner puede emitir versiones');
select is(
  jsonb_array_length(public.list_budget_dashboard_projects()),
  1,
  'dashboard RPC devuelve solo proyectos accesibles del owner'
);
select lives_ok(
  $$ select public.create_project_with_current_member('Proyecto Nuevo Owner', 'Cliente Demo', 'Lima') $$,
  'owner crea proyecto via RPC'
);
select ok(
  exists (
    select 1
    from public.proyectos p
    join public.proyecto_miembros pm on pm.proyecto_id = p.id
    join public.organizacion_miembros om on om.id = pm.organizacion_miembro_id
    where p.nombre = 'Proyecto Nuevo Owner'
      and p.organizacion_id = '00000000-0000-0000-0000-000000000901'
      and om.user_id = '00000000-0000-0000-0000-00000000a001'
      and pm.rol = 'admin'
  ),
  'owner queda como admin del proyecto creado'
);
select ok(
  exists (
    select 1
    from public.activity_events ae
    join public.proyectos p on p.id = ae.entity_id
    where p.nombre = 'Proyecto Nuevo Owner'
      and ae.entity_type = 'proyecto'
      and ae.action = 'create'
      and ae.actor_id = '00000000-0000-0000-0000-00000000a001'
  ),
  'crear proyecto registra auditoria persistente'
);
select lives_ok(
  $$
    insert into public.activity_events (
      organizacion_id,
      proyecto_id,
      actor_id,
      entity_type,
      entity_id,
      action
    )
    select
      '00000000-0000-0000-0000-000000000901',
      p.id,
      '00000000-0000-0000-0000-00000000a001',
      'proyecto',
      p.id,
      'rls_project_insert'
    from public.proyectos p
    where p.nombre = 'Proyecto Nuevo Owner'
  $$,
  'activity_events acepta entidad proyecto valida'
);
select lives_ok(
  $$ select public.recalculate_budget_draft_totals('00000000-0000-0000-0000-000000000903') $$,
  'owner recalcula totales de borrador via RPC'
);
select lives_ok(
  $$ select public.refresh_draft_current_prices('00000000-0000-0000-0000-000000000903') $$,
  'owner refresca precios actuales del borrador via RPC'
);
select ok(
  (
    select (public.refresh_draft_current_prices_for_resources(
      array['00000000-0000-0000-0000-000000000201'::uuid]
    )->>'refreshedDrafts')::int >= 1
  ),
  'refresh por recursos detecta borradores activos afectados'
);
select lives_ok(
  $$
    insert into public.activity_events (
      organizacion_id,
      proyecto_id,
      actor_id,
      entity_type,
      entity_id,
      action
    ) values (
      '00000000-0000-0000-0000-000000000901',
      '00000000-0000-0000-0000-000000000902',
      '00000000-0000-0000-0000-00000000a001',
      'presupuesto_borrador',
      '00000000-0000-0000-0000-000000000903',
      'rls_owner_insert'
    )
  $$,
  'owner inserta auditoria propia'
);
select throws_ok(
  $$
    update public.proyectos
    set organizacion_id = '00000000-0000-0000-0000-00000000e001'
    where id = '00000000-0000-0000-0000-000000000902'
  $$,
  '23514',
  null,
  'admin no puede cambiar organizacion_id del proyecto'
);
select throws_ok(
  $$
    insert into public.presupuesto_borradores (
      organizacion_id,
      proyecto_id,
      nombre,
      created_by,
      updated_by
    ) values (
      '00000000-0000-0000-0000-000000000901',
      '00000000-0000-0000-0000-000000000902',
      'Borrador sin creador',
      null,
      '00000000-0000-0000-0000-00000000a001'
    )
  $$,
  '42501',
  null,
  'insert de borrador exige created_by del usuario actual'
);
select throws_ok(
  $$
    update public.presupuesto_borradores
    set updated_by = null
    where id = '00000000-0000-0000-0000-000000000903'
  $$,
  '42501',
  null,
  'update de borrador exige updated_by del usuario actual'
);
select throws_ok(
  $$
    insert into public.activity_events (
      organizacion_id,
      proyecto_id,
      actor_id,
      entity_type,
      entity_id,
      action
    ) values (
      '00000000-0000-0000-0000-000000000901',
      '00000000-0000-0000-0000-000000000902',
      '00000000-0000-0000-0000-00000000a001',
      'tipo_no_permitido',
      '00000000-0000-0000-0000-000000000903',
      'tipo_invalido'
    )
  $$,
  '42501',
  null,
  'auditoria rechaza entity_type no permitido'
);
select throws_ok(
  $$
    insert into public.activity_events (
      organizacion_id,
      proyecto_id,
      actor_id,
      entity_type,
      entity_id,
      action
    ) values (
      '00000000-0000-0000-0000-000000000901',
      '00000000-0000-0000-0000-000000000902',
      '00000000-0000-0000-0000-00000000a001',
      'presupuesto_borrador',
      '00000000-0000-0000-0000-000000009999',
      'entidad_inexistente'
    )
  $$,
  '42501',
  null,
  'auditoria rechaza entidad inexistente'
);
select throws_ok(
  $$
    insert into public.activity_events (
      organizacion_id,
      proyecto_id,
      actor_id,
      entity_type,
      entity_id,
      action,
      metadata
    ) values (
      '00000000-0000-0000-0000-000000000901',
      '00000000-0000-0000-0000-000000000902',
      '00000000-0000-0000-0000-00000000a001',
      'presupuesto_borrador',
      '00000000-0000-0000-0000-000000000903',
      'payload_excesivo',
      jsonb_build_object('payload', repeat('x', 50001))
    )
  $$,
  '23514',
  null,
  'auditoria rechaza metadata mayor al limite'
);
select lives_ok(
  $$
    update public.proveedores
    set updated_at = '2000-01-01 00:00:00+00'
    where id = '00000000-0000-0000-0000-000000000101';

    update public.proveedores
    set nombre = nombre
    where id = '00000000-0000-0000-0000-000000000101'
  $$,
  'set_updated_at opera con grants explicitos'
);
select isnt(
  (select updated_at from public.proveedores where id = '00000000-0000-0000-0000-000000000101'),
  '2000-01-01 00:00:00+00'::timestamptz,
  'set_updated_at sigue actualizando updated_at'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000a002', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select is((select count(*)::int from public.proyectos), 1, 'editor ve proyecto asignado');
select throws_ok(
  $$ select public.create_project_with_current_member('Proyecto Editor', null, null) $$,
  '42501',
  null,
  'miembro sin rol owner/admin no crea proyectos'
);
select ok(public.can_edit_project('00000000-0000-0000-0000-000000000902'), 'editor puede editar borrador');
select ok(not public.can_emit_project('00000000-0000-0000-0000-000000000902'), 'editor no puede emitir versiones');
select throws_ok(
  $$
    insert into public.recurso_proveedor_precios (
      organizacion_id,
      recurso_id,
      proveedor_id,
      costo_unitario,
      costo_transporte
    ) values (
      '00000000-0000-0000-0000-000000000901',
      '00000000-0000-0000-0000-000000000201',
      '00000000-0000-0000-0000-000000000101',
      31.00,
      2.00
    )
  $$,
  '42501',
  null,
  'editor no administra cotizaciones del catalogo'
);
select lives_ok(
  $$
    update public.presupuesto_borradores
    set updated_by = '00000000-0000-0000-0000-00000000a002'
    where id = '00000000-0000-0000-0000-000000000903'
  $$,
  'editor puede actualizar borrador'
);
select throws_ok(
  $$
    select public.emit_official_budget_version(
      '00000000-0000-0000-0000-000000000903',
      (select updated_at from public.presupuesto_borradores where id = '00000000-0000-0000-0000-000000000903')
    )
  $$,
  '42501',
  null,
  'editor no puede emitir version oficial via RPC'
);
select throws_ok(
  $$
    insert into public.presupuesto_versiones (
      organizacion_id,
      proyecto_id,
      presupuesto_borrador_id,
      numero_version,
      nombre,
      emitida_por
    ) values (
      '00000000-0000-0000-0000-000000000901',
      '00000000-0000-0000-0000-000000000902',
      '00000000-0000-0000-0000-000000000903',
      2,
      'Version bloqueada por editor',
      '00000000-0000-0000-0000-00000000a002'
    )
  $$,
  '42501',
  null,
  'editor no puede insertar version oficial'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000a003', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select is((select count(*)::int from public.proyectos), 1, 'lector ve proyecto asignado');
select ok(public.can_read_project('00000000-0000-0000-0000-000000000902'), 'lector puede leer proyecto');
select set_config('realtime.topic', 'project:00000000-0000-0000-0000-000000000902', true);
select ok(
  (select count(*) > 0 from realtime.messages where topic = 'project:00000000-0000-0000-0000-000000000902'),
  'lector puede suscribirse al topic realtime del proyecto asignado'
);
select set_config('realtime.topic', 'presence:project:00000000-0000-0000-0000-000000000902', true);
select ok(
  (select count(*) > 0 from realtime.messages where topic = 'presence:project:00000000-0000-0000-0000-000000000902'),
  'lector puede suscribirse al topic dedicado de Presence del proyecto'
);
select lives_ok(
  $$
    insert into realtime.messages (topic, extension, payload, event, private)
    values ('presence:project:00000000-0000-0000-0000-000000000902', 'presence', '{"actorId":"00000000-0000-0000-0000-00000000a003"}'::jsonb, 'presence_state', true)
  $$,
  'lector puede publicar Presence en topic dedicado de proyecto valido'
);
select set_config('realtime.topic', 'presence:project:00000000-0000-0000-0000-000000000902x', true);
select throws_ok(
  $$
    insert into realtime.messages (topic, extension, payload, event, private)
    values ('presence:project:00000000-0000-0000-0000-000000000902x', 'presence', '{"actorId":"00000000-0000-0000-0000-00000000a003"}'::jsonb, 'presence_state', true)
  $$,
  '42501',
  null,
  'topic dedicado de Presence de proyecto malformado falla'
);
select ok(not public.can_edit_project('00000000-0000-0000-0000-000000000902'), 'lector no puede editar proyecto');
select throws_ok(
  $$ select public.refresh_draft_current_prices('00000000-0000-0000-0000-000000000903') $$,
  '42501',
  null,
  'lector no puede refrescar precios del borrador'
);
select throws_ok(
  $$ select public.recalculate_budget_draft_totals('00000000-0000-0000-0000-000000000903') $$,
  '42501',
  null,
  'lector no puede recalcular totales del borrador'
);
with updated_quote as (
  update public.recurso_proveedor_precios
  set costo_unitario = costo_unitario + 1
  where id = '00000000-0000-0000-0000-000000001001'
  returning 1
)
select is((select count(*)::int from updated_quote), 0, 'lector no actualiza cotizaciones');
with updated as (
  update public.presupuesto_borradores
  set nombre = nombre || ' bloqueado'
  where id = '00000000-0000-0000-0000-000000000903'
  returning 1
)
select is((select count(*)::int from updated), 0, 'lector no actualiza borrador');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000a004', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select is((select count(*)::int from public.organizaciones), 1, 'externo ve solo su organizacion');
select is((select count(*)::int from public.proyectos), 1, 'externo ve solo su proyecto');
select is((select count(*)::int from public.user_profiles), 1, 'externo solo ve perfiles de su organizacion');
select is(
  (select count(*)::int from public.user_profiles where email = 'owner@cyp.local'),
  0,
  'externo no ve perfiles de otra organizacion'
);
select is((select count(*)::int from public.presupuesto_borradores), 0, 'externo no ve borradores demo');
select is((select count(*)::int from public.recurso_proveedor_precios), 0, 'externo no ve cotizaciones demo');
select set_config('realtime.topic', 'org:00000000-0000-0000-0000-000000000901', true);
select is(
  (select count(*)::int from realtime.messages where topic = 'org:00000000-0000-0000-0000-000000000901'),
  0,
  'externo no puede suscribirse al topic realtime de la organizacion demo'
);
select throws_ok(
  $$
    insert into realtime.messages (topic, extension, payload, event, private)
    values ('org:00000000-0000-0000-0000-000000000901', 'presence', '{"actorId":"00000000-0000-0000-0000-00000000a004"}'::jsonb, 'presence_state', true)
  $$,
  '42501',
  null,
  'externo no puede publicar Presence en organizacion ajena'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000a001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
update public.presupuesto_versiones
set nombre = 'Intento de mutacion'
where id = '00000000-0000-0000-0000-000000000907';
select isnt(
  (select nombre from public.presupuesto_versiones where id = '00000000-0000-0000-0000-000000000907'),
  'Intento de mutacion',
  'version oficial no se actualiza desde cliente'
);
delete from public.presupuesto_versiones
where id = '00000000-0000-0000-0000-000000000907';
select is(
  (select count(*)::int from public.presupuesto_versiones where id = '00000000-0000-0000-0000-000000000907'),
  1,
  'version oficial no se elimina desde cliente'
);
select throws_ok(
  $$
    insert into public.activity_events (
      organizacion_id,
      proyecto_id,
      actor_id,
      entity_type,
      entity_id,
      action
    ) values (
      '00000000-0000-0000-0000-000000000901',
      '00000000-0000-0000-0000-000000000902',
      '00000000-0000-0000-0000-00000000a002',
      'presupuesto_borrador',
      '00000000-0000-0000-0000-000000000903',
      'actor_suplantado'
    )
  $$,
  '42501',
  null,
  'auditoria exige actor_id del usuario actual'
);
select throws_ok(
  $$
    select public.emit_official_budget_version(
      '00000000-0000-0000-0000-000000000903',
      '2000-01-01 00:00:00+00'::timestamptz
    )
  $$,
  null,
  'CYP_CONFLICT: El borrador cambio mientras estabas editando.',
  'emision stale falla sin crear version parcial'
);
select is(
  (select count(*)::int from public.presupuesto_versiones where proyecto_id = '00000000-0000-0000-0000-000000000902'),
  1,
  'emision stale no crea version parcial'
);
select lives_ok(
  $$
    select public.emit_official_budget_version(
      '00000000-0000-0000-0000-000000000903',
      (select updated_at from public.presupuesto_borradores where id = '00000000-0000-0000-0000-000000000903')
    )
  $$,
  'owner emite version oficial via RPC'
);
select lives_ok(
  $$
    select public.emit_official_budget_version(
      '00000000-0000-0000-0000-000000000903',
      (select updated_at from public.presupuesto_borradores where id = '00000000-0000-0000-0000-000000000903')
    )
  $$,
  'dos emisiones secuenciales no duplican numero_version'
);
select is(
  (
    select count(distinct numero_version)::int
    from public.presupuesto_versiones
    where proyecto_id = '00000000-0000-0000-0000-000000000902'
  ),
  (
    select count(*)::int
    from public.presupuesto_versiones
    where proyecto_id = '00000000-0000-0000-0000-000000000902'
  ),
  'numero_version se mantiene unico'
);
select lives_ok(
  $$
    select public.add_draft_partida(
      '00000000-0000-0000-0000-000000000903',
      '00000000-0000-0000-0000-000000000404'
    );
    select public.add_draft_partida(
      '00000000-0000-0000-0000-000000000903',
      '00000000-0000-0000-0000-000000000405'
    )
  $$,
  'agregar partidas via RPC calcula ordenes distintos'
);
select is(
  (
    select count(distinct orden)::int
    from public.presupuesto_borrador_partidas
    where presupuesto_borrador_id = '00000000-0000-0000-0000-000000000903'
  ),
  (
    select count(*)::int
    from public.presupuesto_borrador_partidas
    where presupuesto_borrador_id = '00000000-0000-0000-0000-000000000903'
  ),
  'ordenes de partidas de borrador no se duplican'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000a099', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select throws_ok(
  $$
    select * from public.create_organization_with_owner(
      'Organizacion RUC invalido',
      '123',
      'Proyecto RUC invalido'
    )
  $$,
  null,
  'El RUC debe tener 11 digitos.',
  'onboarding rechaza RUC invalido con mensaje claro'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000a001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select throws_ok(
  $$
    select * from public.create_organization_with_owner(
      'Organizacion duplicada',
      '20123456789',
      'Proyecto duplicado'
    )
  $$,
  null,
  'Tu usuario ya pertenece a una organizacion activa.',
  'onboarding rechaza usuario con membresia activa'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000a004', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select throws_ok(
  $$
    insert into public.activity_events (
      organizacion_id,
      actor_id,
      entity_type,
      entity_id,
      action
    ) values (
      '00000000-0000-0000-0000-00000000e001',
      '00000000-0000-0000-0000-00000000a004',
      'recurso',
      '00000000-0000-0000-0000-000000000201',
      'entidad_otra_org'
    )
  $$,
  '42501',
  null,
  'auditoria rechaza entidad de otra organizacion'
);
reset role;

select * from finish();

rollback;
