-- Redisenio de partidas/APU al formato tradicional de obra.
-- Limpia el modelo anterior de la estructura vigente.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'tipo_calculo_apu') then
    create type public.tipo_calculo_apu as enum (
      'mano_obra_rendimiento',
      'material_desperdicio',
      'equipo_hm_rendimiento',
      'equipo_cantidad_fija',
      'herramientas_porcentaje_mano_obra'
    );
  end if;
end $$;

alter table public.partidas
  add column if not exists subcategoria text,
  add column if not exists jornada_horas numeric(7, 2) not null default 8,
  add column if not exists desperdicio_materiales_porcentaje numeric(7, 4) not null default 5;

alter table public.partidas
  alter column rendimiento set default 1,
  alter column codigo drop not null;

alter table public.partidas
  drop column if exists descripcion,
  drop column if exists cuadrilla;

alter table public.partidas
  drop constraint if exists partidas_codigo_not_blank,
  drop constraint if exists partidas_codigo_key,
  drop constraint if exists partidas_rendimiento_non_negative,
  add constraint partidas_codigo_optional_not_blank check (codigo is null or length(btrim(codigo)) > 0),
  add constraint partidas_rendimiento_positive check (rendimiento is null or rendimiento > 0),
  add constraint partidas_jornada_positive check (jornada_horas > 0),
  add constraint partidas_desperdicio_materiales_porcentaje check (
    desperdicio_materiales_porcentaje >= 0
    and desperdicio_materiales_porcentaje <= 100
  );

drop index if exists partidas_organizacion_codigo_idx;
create unique index if not exists partidas_organizacion_codigo_idx
on public.partidas (organizacion_id, codigo)
where codigo is not null;

alter table public.partida_recursos
  add column if not exists tipo_calculo_apu public.tipo_calculo_apu,
  add column if not exists cuadrilla numeric(14, 6),
  add column if not exists cantidad_base numeric(14, 6),
  add column if not exists porcentaje_aplicado numeric(7, 4);

update public.partida_recursos
set
  tipo_calculo_apu = case
    when grupo = 'mano_obra' then 'mano_obra_rendimiento'::public.tipo_calculo_apu
    when grupo = 'materiales' then 'material_desperdicio'::public.tipo_calculo_apu
    when upper(unidad) = 'HM' then 'equipo_hm_rendimiento'::public.tipo_calculo_apu
    else 'equipo_cantidad_fija'::public.tipo_calculo_apu
  end,
  cantidad_base = coalesce(cantidad_base, cantidad),
  porcentaje_aplicado = case
    when porcentaje_aplicado is null and upper(unidad) = '%' then 3
    else porcentaje_aplicado
  end
where tipo_calculo_apu is null;

alter table public.partida_recursos
  alter column tipo_calculo_apu set not null,
  drop column if exists rendimiento_factor,
  drop column if exists desperdicio_porcentaje,
  drop constraint if exists partida_recursos_non_negative,
  add constraint partida_recursos_non_negative check (
    cantidad >= 0
    and costo_unitario_snapshot >= 0
    and costo_transporte_snapshot >= 0
    and parcial >= 0
    and orden >= 0
    and coalesce(cuadrilla, 0) >= 0
    and coalesce(cantidad_base, 0) >= 0
    and coalesce(porcentaje_aplicado, 0) >= 0
  ),
  drop constraint if exists partida_recursos_desperdicio_porcentaje,
  add constraint partida_recursos_porcentajes check (
    coalesce(porcentaje_aplicado, 0) <= 100
  );

alter table public.presupuesto_borrador_partidas
  add column if not exists subcategoria_snapshot text,
  add column if not exists jornada_horas_snapshot numeric(7, 2),
  add column if not exists desperdicio_materiales_porcentaje_snapshot numeric(7, 4);

alter table public.presupuesto_borrador_partidas
  drop column if exists descripcion_snapshot,
  drop column if exists cuadrilla_snapshot;

alter table public.presupuesto_version_partidas
  add column if not exists subcategoria_snapshot text,
  add column if not exists jornada_horas_snapshot numeric(7, 2),
  add column if not exists desperdicio_materiales_porcentaje_snapshot numeric(7, 4);

alter table public.presupuesto_version_partidas
  drop column if exists descripcion_snapshot,
  drop column if exists cuadrilla_snapshot;

alter table public.presupuesto_partidas
  add column if not exists subcategoria_snapshot text,
  add column if not exists jornada_horas_snapshot numeric(7, 2),
  add column if not exists desperdicio_materiales_porcentaje_snapshot numeric(7, 4);

alter table public.presupuesto_partidas
  drop column if exists descripcion_snapshot,
  drop column if exists cuadrilla_snapshot;

alter table public.presupuesto_borrador_partida_recursos
  add column if not exists tipo_calculo_apu public.tipo_calculo_apu,
  add column if not exists cuadrilla numeric(14, 6),
  add column if not exists cantidad_base numeric(14, 6),
  add column if not exists porcentaje_aplicado numeric(7, 4);

alter table public.presupuesto_borrador_partida_recursos
  drop column if exists rendimiento_factor,
  drop column if exists desperdicio_porcentaje;

alter table public.presupuesto_version_partida_recursos
  add column if not exists tipo_calculo_apu public.tipo_calculo_apu,
  add column if not exists cuadrilla numeric(14, 6),
  add column if not exists cantidad_base numeric(14, 6),
  add column if not exists porcentaje_aplicado numeric(7, 4);

alter table public.presupuesto_version_partida_recursos
  drop column if exists rendimiento_factor,
  drop column if exists desperdicio_porcentaje;

alter table public.presupuesto_partida_recursos
  add column if not exists tipo_calculo_apu public.tipo_calculo_apu,
  add column if not exists cuadrilla numeric(14, 6),
  add column if not exists cantidad_base numeric(14, 6),
  add column if not exists porcentaje_aplicado numeric(7, 4);

alter table public.presupuesto_partida_recursos
  drop column if exists rendimiento_factor,
  drop column if exists desperdicio_porcentaje;

create or replace function public.emit_official_budget_version(
  p_draft_id uuid,
  p_expected_updated_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  actor_id uuid := auth.uid();
  draft_row public.presupuesto_borradores%rowtype;
  new_version public.presupuesto_versiones%rowtype;
  next_version_number integer;
  result jsonb;
begin
  if actor_id is null then
    raise exception 'CYP_PERMISSION: Debes iniciar sesion para emitir una version.'
      using errcode = '42501';
  end if;

  select *
  into draft_row
  from public.presupuesto_borradores
  where id = p_draft_id
  for update;

  if not found then
    raise exception 'CYP_NOT_FOUND: No se encontro el borrador solicitado.';
  end if;

  if draft_row.estado <> 'activo' then
    raise exception 'CYP_VALIDATION: Solo se puede emitir un borrador activo.';
  end if;

  if not public.can_emit_project(draft_row.proyecto_id) then
    raise exception 'CYP_PERMISSION: No tienes permisos para emitir versiones.'
      using errcode = '42501';
  end if;

  if draft_row.updated_at is distinct from p_expected_updated_at then
    raise exception 'CYP_CONFLICT: El borrador cambio mientras estabas editando.';
  end if;

  if not exists (
    select 1 from public.presupuesto_borrador_partidas
    where presupuesto_borrador_id = draft_row.id
  ) then
    raise exception 'CYP_VALIDATION: No se puede emitir un borrador vacio.';
  end if;

  select coalesce(max(numero_version), 0) + 1
  into next_version_number
  from public.presupuesto_versiones
  where proyecto_id = draft_row.proyecto_id;

  insert into public.presupuesto_versiones (
    organizacion_id,
    proyecto_id,
    presupuesto_borrador_id,
    numero_version,
    nombre,
    cliente,
    ubicacion,
    estado,
    moneda,
    gastos_generales_porcentaje,
    utilidad_porcentaje,
    igv_porcentaje,
    subtotal,
    gastos_generales_total,
    utilidad_total,
    subtotal_con_margen,
    igv_total,
    total,
    emitida_por
  )
  values (
    draft_row.organizacion_id,
    draft_row.proyecto_id,
    draft_row.id,
    next_version_number,
    regexp_replace(draft_row.nombre, '_Presupuesto$', '', 'i') || '_Presupuesto_V' || next_version_number,
    draft_row.cliente,
    draft_row.ubicacion,
    'emitida',
    draft_row.moneda,
    draft_row.gastos_generales_porcentaje,
    draft_row.utilidad_porcentaje,
    draft_row.igv_porcentaje,
    draft_row.subtotal,
    draft_row.gastos_generales_total,
    draft_row.utilidad_total,
    draft_row.subtotal_con_margen,
    draft_row.igv_total,
    draft_row.total,
    actor_id
  )
  returning * into new_version;

  with line_map as (
    select
      gen_random_uuid() as version_line_id,
      line.*
    from public.presupuesto_borrador_partidas line
    where line.presupuesto_borrador_id = draft_row.id
  ),
  inserted_lines as (
    insert into public.presupuesto_version_partidas (
      id,
      presupuesto_version_id,
      partida_id,
      codigo_snapshot,
      nombre_snapshot,
      unidad_snapshot,
      categoria_snapshot,
      subcategoria_snapshot,
      especificaciones_snapshot,
      rendimiento_snapshot,
      jornada_horas_snapshot,
      desperdicio_materiales_porcentaje_snapshot,
      metrado,
      precio_unitario_snapshot,
      motivo_precio_fijado_snapshot,
      precio_fijado_snapshot,
      precio_origen_snapshot,
      parcial_snapshot,
      orden
    )
    select
      version_line_id,
      new_version.id,
      partida_id,
      codigo_snapshot,
      nombre_snapshot,
      unidad_snapshot,
      categoria_snapshot,
      subcategoria_snapshot,
      especificaciones_snapshot,
      rendimiento_snapshot,
      jornada_horas_snapshot,
      desperdicio_materiales_porcentaje_snapshot,
      metrado,
      precio_unitario_actual,
      motivo_precio_fijado,
      precio_fijado,
      precio_origen,
      parcial,
      orden
    from line_map
    returning *
  ),
  inserted_resources as (
    insert into public.presupuesto_version_partida_recursos (
      presupuesto_version_id,
      presupuesto_version_partida_id,
      partida_recurso_id,
      recurso_id,
      nombre_snapshot,
      tipo_snapshot,
      unidad_snapshot,
      costo_unitario_snapshot,
      costo_transporte_snapshot,
      proveedor_id_snapshot,
      proveedor_nombre_snapshot,
      fuente_precio_snapshot,
      fecha_precio_snapshot,
      precio_cliente_snapshot,
      cotizacion_interna_id_snapshot,
      cotizacion_cliente_id_snapshot,
      precio_cliente_origen_snapshot,
      precio_cliente_advertencia_snapshot,
      motivo_precio_fijado_snapshot,
      precio_fijado_snapshot,
      precio_origen_snapshot,
      grupo,
      tipo_calculo_apu,
      cuadrilla,
      cantidad_base,
      porcentaje_aplicado,
      cantidad,
      unidad,
      parcial_snapshot,
      orden
    )
    select
      new_version.id,
      lm.version_line_id,
      resource.partida_recurso_id,
      resource.recurso_id,
      resource.nombre_snapshot,
      resource.tipo_snapshot,
      resource.unidad_snapshot,
      resource.costo_unitario_actual,
      resource.costo_transporte_actual,
      resource.proveedor_id_snapshot,
      resource.proveedor_nombre_snapshot,
      resource.fuente_precio_snapshot,
      resource.fecha_precio_snapshot,
      resource.precio_cliente_actual,
      resource.cotizacion_interna_id,
      resource.cotizacion_cliente_id,
      resource.precio_cliente_origen,
      resource.precio_cliente_advertencia,
      resource.motivo_precio_fijado,
      resource.precio_fijado,
      resource.precio_origen,
      resource.grupo,
      resource.tipo_calculo_apu,
      resource.cuadrilla,
      resource.cantidad_base,
      resource.porcentaje_aplicado,
      resource.cantidad,
      resource.unidad,
      resource.parcial_actual,
      resource.orden
    from public.presupuesto_borrador_partida_recursos resource
    join line_map lm on lm.id = resource.presupuesto_borrador_partida_id
    returning *
  )
  select jsonb_build_object(
    'version', to_jsonb(new_version),
    'lines', coalesce((select jsonb_agg(to_jsonb(inserted_lines) order by orden) from inserted_lines), '[]'::jsonb),
    'resources', coalesce((select jsonb_agg(to_jsonb(inserted_resources) order by orden) from inserted_resources), '[]'::jsonb)
  )
  into result;

  insert into public.activity_events (
    organizacion_id,
    proyecto_id,
    presupuesto_borrador_id,
    presupuesto_version_id,
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
    draft_row.organizacion_id,
    draft_row.proyecto_id,
    draft_row.id,
    new_version.id,
    actor_id,
    'presupuesto_version',
    new_version.id,
    'emitir_version',
    to_jsonb(draft_row),
    to_jsonb(new_version),
    '{}'::jsonb,
    '{"repository":"budgetsRepository","source":"rpc"}'::jsonb
  );

  return result;
end;
$$;

create or replace function public.add_draft_partida(
  p_draft_id uuid,
  p_partida_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  actor_id uuid := auth.uid();
  draft_row public.presupuesto_borradores%rowtype;
  partida_row public.partidas%rowtype;
  inserted_line public.presupuesto_borrador_partidas%rowtype;
  next_order integer;
  unit_price numeric;
begin
  if actor_id is null then
    raise exception 'CYP_PERMISSION: Debes iniciar sesion para agregar partidas.'
      using errcode = '42501';
  end if;

  select *
  into draft_row
  from public.presupuesto_borradores
  where id = p_draft_id
  for update;

  if not found then
    raise exception 'CYP_NOT_FOUND: No se encontro el borrador solicitado.';
  end if;

  if draft_row.estado <> 'activo' then
    raise exception 'CYP_VALIDATION: Solo se puede editar un borrador activo.';
  end if;

  if not public.can_edit_project(draft_row.proyecto_id) then
    raise exception 'CYP_PERMISSION: No tienes permisos para editar el borrador.'
      using errcode = '42501';
  end if;

  select *
  into partida_row
  from public.partidas
  where id = p_partida_id
    and organizacion_id = draft_row.organizacion_id;

  if not found then
    raise exception 'CYP_NOT_FOUND: No se encontro la partida seleccionada.';
  end if;

  select coalesce(max(orden), 0) + 1
  into next_order
  from public.presupuesto_borrador_partidas
  where presupuesto_borrador_id = draft_row.id;

  select coalesce(round(sum(parcial), 2), 0)
  into unit_price
  from public.partida_recursos
  where partida_id = partida_row.id;

  insert into public.presupuesto_borrador_partidas (
    presupuesto_borrador_id,
    partida_id,
    codigo_snapshot,
    nombre_snapshot,
    unidad_snapshot,
    categoria_snapshot,
    subcategoria_snapshot,
    especificaciones_snapshot,
    rendimiento_snapshot,
    jornada_horas_snapshot,
    desperdicio_materiales_porcentaje_snapshot,
    metrado,
    precio_unitario_actual,
    precio_fijado,
    autoactualizar_precio,
    precio_origen,
    parcial,
    orden
  )
  values (
    draft_row.id,
    partida_row.id,
    coalesce(partida_row.codigo, ''),
    partida_row.nombre,
    partida_row.unidad,
    partida_row.categoria,
    partida_row.subcategoria,
    partida_row.especificaciones,
    partida_row.rendimiento,
    partida_row.jornada_horas,
    partida_row.desperdicio_materiales_porcentaje,
    1,
    unit_price,
    false,
    true,
    'catalogo',
    unit_price,
    next_order
  )
  returning * into inserted_line;

  insert into public.presupuesto_borrador_partida_recursos (
    presupuesto_borrador_id,
    presupuesto_borrador_partida_id,
    partida_recurso_id,
    recurso_id,
    nombre_snapshot,
    tipo_snapshot,
    unidad_snapshot,
    costo_unitario_actual,
    costo_transporte_actual,
    proveedor_id_snapshot,
    proveedor_nombre_snapshot,
    fuente_precio_snapshot,
    fecha_precio_snapshot,
    grupo,
    tipo_calculo_apu,
    cuadrilla,
    cantidad_base,
    porcentaje_aplicado,
    cantidad,
    unidad,
    precio_fijado,
    autoactualizar_precio,
    motivo_precio_fijado,
    precio_origen,
    parcial_actual,
    orden,
    precio_cliente_override,
    motivo_precio_cliente_override
  )
  select
    draft_row.id,
    inserted_line.id,
    pr.id,
    pr.recurso_id,
    r.nombre,
    r.tipo,
    r.unidad,
    pr.costo_unitario_snapshot,
    pr.costo_transporte_snapshot,
    r.proveedor_id,
    null,
    r.fuente_precio,
    r.fecha_actualizacion_precio,
    pr.grupo,
    pr.tipo_calculo_apu,
    pr.cuadrilla,
    pr.cantidad_base,
    pr.porcentaje_aplicado,
    pr.cantidad,
    pr.unidad,
    false,
    true,
    null,
    'catalogo',
    pr.parcial,
    pr.orden + next_order * 1000,
    false,
    null
  from public.partida_recursos pr
  join public.recursos r on r.id = pr.recurso_id
  where pr.partida_id = partida_row.id;

  perform public.recalculate_budget_draft_totals(draft_row.id);

  insert into public.activity_events (
    organizacion_id,
    proyecto_id,
    presupuesto_borrador_id,
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
    draft_row.organizacion_id,
    draft_row.proyecto_id,
    draft_row.id,
    actor_id,
    'presupuesto_borrador_partida',
    inserted_line.id,
    'add_partida',
    null,
    to_jsonb(inserted_line),
    to_jsonb(inserted_line),
    '{"repository":"budgetsRepository","source":"rpc"}'::jsonb
  );

  return public.recalculate_budget_draft_totals(draft_row.id);
end;
$$;

create or replace function public.refresh_draft_current_prices(p_draft_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  draft_row public.presupuesto_borradores%rowtype;
  updated_resources integer := 0;
begin
  if actor_id is null then
    raise exception 'CYP_PERMISSION: Debes iniciar sesion para refrescar precios.'
      using errcode = '42501';
  end if;

  select *
  into draft_row
  from public.presupuesto_borradores
  where id = p_draft_id
  for update;

  if not found then
    raise exception 'CYP_NOT_FOUND: No se encontro el borrador solicitado.';
  end if;

  if draft_row.estado <> 'activo' then
    raise exception 'CYP_VALIDATION: Solo se puede refrescar un borrador activo.';
  end if;

  if not public.can_edit_project(draft_row.proyecto_id) then
    raise exception 'CYP_PERMISSION: No tienes permisos para refrescar precios.'
      using errcode = '42501';
  end if;

  with candidates as (
    select
      resource.id,
      catalog.fecha_actualizacion_precio,
      catalog.fuente_precio,
      coalesce(internal_quote.costo_unitario, catalog.costo_unitario_actual, resource.costo_unitario_actual) as next_unit_cost,
      coalesce(internal_quote.costo_transporte, catalog.costo_transporte, resource.costo_transporte_actual) as next_transport_cost,
      internal_quote.id as next_internal_quote_id,
      coalesce(internal_quote.proveedor_id, catalog.proveedor_id, resource.proveedor_id_snapshot) as next_provider_id,
      coalesce(internal_provider.nombre, catalog_provider.nombre, resource.proveedor_nombre_snapshot) as next_provider_name,
      case
        when resource.tipo_calculo_apu = 'herramientas_porcentaje_mano_obra' then resource.parcial_actual
        else round(resource.cantidad * (
          coalesce(internal_quote.costo_unitario, catalog.costo_unitario_actual, resource.costo_unitario_actual)
          + coalesce(internal_quote.costo_transporte, catalog.costo_transporte, resource.costo_transporte_actual)
        ), 2)
      end as next_partial
    from public.presupuesto_borrador_partida_recursos resource
    join public.presupuesto_borrador_partidas line on line.id = resource.presupuesto_borrador_partida_id
    join public.recursos catalog on catalog.id = resource.recurso_id and catalog.organizacion_id = draft_row.organizacion_id
    left join public.proveedores catalog_provider on catalog_provider.id = catalog.proveedor_id
    left join lateral (
      select q.*
      from public.recurso_proveedor_precios q
      join public.proveedores p on p.id = q.proveedor_id
      where q.recurso_id = resource.recurso_id
        and q.organizacion_id = draft_row.organizacion_id
        and q.estado = 'activo'
        and p.estado <> 'inactivo'
        and (q.vigente_desde is null or q.vigente_desde <= current_date)
        and (q.vigente_hasta is null or q.vigente_hasta >= current_date)
      order by q.es_preferido_interno desc, q.fecha_cotizacion desc nulls last, q.updated_at desc, q.created_at desc
      limit 1
    ) internal_quote on true
    left join public.proveedores internal_provider on internal_provider.id = internal_quote.proveedor_id
    where resource.presupuesto_borrador_id = draft_row.id
      and resource.recurso_id is not null
      and not line.precio_fijado
      and not resource.precio_fijado
      and resource.autoactualizar_precio
      and resource.precio_origen = 'catalogo'
  ),
  updated as (
    update public.presupuesto_borrador_partida_recursos resource
    set
      costo_unitario_actual = candidates.next_unit_cost,
      costo_transporte_actual = candidates.next_transport_cost,
      cotizacion_interna_id = candidates.next_internal_quote_id,
      parcial_actual = candidates.next_partial,
      proveedor_id_snapshot = candidates.next_provider_id,
      proveedor_nombre_snapshot = candidates.next_provider_name,
      fecha_precio_snapshot = coalesce(candidates.fecha_actualizacion_precio, resource.fecha_precio_snapshot),
      fuente_precio_snapshot = coalesce(candidates.fuente_precio, resource.fuente_precio_snapshot)
    from candidates
    where resource.id = candidates.id
    returning resource.id
  )
  select count(*) into updated_resources from updated;

  perform public.recalculate_budget_draft_totals(draft_row.id);

  insert into public.activity_events (
    organizacion_id,
    proyecto_id,
    presupuesto_borrador_id,
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
    draft_row.organizacion_id,
    draft_row.proyecto_id,
    draft_row.id,
    actor_id,
    'presupuesto_borrador',
    draft_row.id,
    'refresh_current_prices',
    null,
    jsonb_build_object('draftId', draft_row.id, 'updatedResources', updated_resources),
    null,
    jsonb_build_object('repository', 'budgetsRepository', 'source', 'rpc')
  );

  return jsonb_build_object('draftId', draft_row.id, 'updatedResources', updated_resources);
end;
$$;
