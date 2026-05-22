-- C y P - Chunk 5 performance and query reduction.
-- Set-based budget recalculation RPCs replace per-row TypeScript loops.

create or replace function public.recalculate_budget_draft_totals(p_draft_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  draft_row public.presupuesto_borradores%rowtype;
  subtotal_value numeric;
  overhead_value numeric;
  profit_value numeric;
  subtotal_with_margin_value numeric;
  tax_value numeric;
  total_value numeric;
begin
  if actor_id is null then
    raise exception 'CYP_PERMISSION: Debes iniciar sesion para recalcular el borrador.'
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
    raise exception 'CYP_VALIDATION: Solo se puede recalcular un borrador activo.';
  end if;

  if not public.can_edit_project(draft_row.proyecto_id) then
    raise exception 'CYP_PERMISSION: No tienes permisos para recalcular el borrador.'
      using errcode = '42501';
  end if;

  with line_totals as (
    select
      line.id,
      coalesce(round(sum(resource.parcial_actual), 2), 0) as unit_price
    from public.presupuesto_borrador_partidas line
    left join public.presupuesto_borrador_partida_recursos resource
      on resource.presupuesto_borrador_partida_id = line.id
    where line.presupuesto_borrador_id = draft_row.id
      and not line.precio_fijado
    group by line.id
  )
  update public.presupuesto_borrador_partidas line
  set
    precio_unitario_actual = line_totals.unit_price,
    parcial = round(line.metrado * line_totals.unit_price, 2),
    precio_origen = 'catalogo'
  from line_totals
  where line.id = line_totals.id;

  select coalesce(round(sum(parcial), 2), 0)
  into subtotal_value
  from public.presupuesto_borrador_partidas
  where presupuesto_borrador_id = draft_row.id;

  overhead_value := round(subtotal_value * draft_row.gastos_generales_porcentaje / 100, 2);
  profit_value := round(subtotal_value * draft_row.utilidad_porcentaje / 100, 2);
  subtotal_with_margin_value := round(subtotal_value + overhead_value + profit_value, 2);
  tax_value := round(subtotal_with_margin_value * draft_row.igv_porcentaje / 100, 2);
  total_value := round(subtotal_with_margin_value + tax_value, 2);

  update public.presupuesto_borradores
  set
    subtotal = subtotal_value,
    gastos_generales_total = overhead_value,
    utilidad_total = profit_value,
    subtotal_con_margen = subtotal_with_margin_value,
    igv_total = tax_value,
    total = total_value,
    updated_by = actor_id
  where id = draft_row.id;

  return jsonb_build_object(
    'draftId', draft_row.id,
    'subtotal', subtotal_value,
    'total', total_value
  );
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
      coalesce(internal_quote.id, null) as next_internal_quote_id,
      coalesce(internal_quote.proveedor_id, catalog.proveedor_id, resource.proveedor_id_snapshot) as next_provider_id,
      coalesce(internal_provider.nombre, catalog_provider.nombre, resource.proveedor_nombre_snapshot) as next_provider_name,
      case when resource.precio_cliente_override then resource.precio_cliente_actual else coalesce(client_quote.costo_unitario + client_quote.costo_transporte, fallback_quote.costo_unitario + fallback_quote.costo_transporte) end as next_client_price,
      case when resource.precio_cliente_override then resource.precio_cliente_origen when client_quote.id is not null then 'proveedor_visible' when fallback_quote.id is not null then 'fallback_general' else null end as next_client_origin,
      case when resource.precio_cliente_override then resource.cotizacion_cliente_id else coalesce(client_quote.id, fallback_quote.id) end as next_client_quote_id,
      case
        when resource.precio_cliente_override then resource.precio_cliente_advertencia
        when client_quote.id is null and fallback_quote.id is not null then 'No hay cotizacion de proveedor visible para cliente; se uso el precio general mas alto disponible.'
        else null
      end as next_client_warning,
      round(
        resource.cantidad * coalesce(internal_quote.costo_unitario, catalog.costo_unitario_actual, resource.costo_unitario_actual)
        + resource.cantidad * coalesce(internal_quote.costo_transporte, catalog.costo_transporte, resource.costo_transporte_actual)
        + ((resource.cantidad * coalesce(internal_quote.costo_unitario, catalog.costo_unitario_actual, resource.costo_unitario_actual)) * resource.desperdicio_porcentaje / 100),
        2
      ) as next_partial
    from public.presupuesto_borrador_partida_recursos resource
    join public.presupuesto_borrador_partidas line
      on line.id = resource.presupuesto_borrador_partida_id
    join public.recursos catalog
      on catalog.id = resource.recurso_id
     and catalog.organizacion_id = draft_row.organizacion_id
    left join public.proveedores catalog_provider
      on catalog_provider.id = catalog.proveedor_id
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
    left join lateral (
      select q.*
      from public.recurso_proveedor_precios q
      join public.proveedores p on p.id = q.proveedor_id
      where q.recurso_id = resource.recurso_id
        and q.organizacion_id = draft_row.organizacion_id
        and q.estado = 'activo'
        and p.estado = 'activo'
        and p.disponible_para_cliente
        and (q.vigente_desde is null or q.vigente_desde <= current_date)
        and (q.vigente_hasta is null or q.vigente_hasta >= current_date)
      order by (q.costo_unitario + q.costo_transporte) desc, q.fecha_cotizacion desc nulls last, q.updated_at desc, q.created_at desc
      limit 1
    ) client_quote on true
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
      order by (q.costo_unitario + q.costo_transporte) desc, q.fecha_cotizacion desc nulls last, q.updated_at desc, q.created_at desc
      limit 1
    ) fallback_quote on true
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
      cotizacion_cliente_id = candidates.next_client_quote_id,
      precio_cliente_actual = candidates.next_client_price,
      precio_cliente_origen = candidates.next_client_origin,
      precio_cliente_advertencia = candidates.next_client_warning,
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

create or replace function public.refresh_draft_current_prices_for_resources(p_resource_ids uuid[])
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  draft_id uuid;
  refreshed_count integer := 0;
begin
  if actor_id is null then
    raise exception 'CYP_PERMISSION: Debes iniciar sesion para refrescar precios.'
      using errcode = '42501';
  end if;

  if coalesce(array_length(p_resource_ids, 1), 0) = 0 then
    return jsonb_build_object('refreshedDrafts', 0);
  end if;

  for draft_id in
    select distinct resource.presupuesto_borrador_id
    from public.presupuesto_borrador_partida_recursos resource
    join public.presupuesto_borradores draft on draft.id = resource.presupuesto_borrador_id
    where resource.recurso_id = any(p_resource_ids)
      and draft.estado = 'activo'
      and public.can_edit_project(draft.proyecto_id)
  loop
    perform public.refresh_draft_current_prices(draft_id);
    refreshed_count := refreshed_count + 1;
  end loop;

  return jsonb_build_object('refreshedDrafts', refreshed_count);
end;
$$;

create or replace function public.list_budget_dashboard_projects()
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
        'version', case when latest_version.id is not null then 'V' || latest_version.numero_version::text || ' oficial' when draft.id is not null then 'Borrador activo' else 'Sin presupuesto' end,
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

grant execute on function public.recalculate_budget_draft_totals(uuid) to authenticated;
grant execute on function public.refresh_draft_current_prices(uuid) to authenticated;
grant execute on function public.refresh_draft_current_prices_for_resources(uuid[]) to authenticated;
grant execute on function public.list_budget_dashboard_projects() to authenticated;
