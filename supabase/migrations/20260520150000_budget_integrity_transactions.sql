-- Chunk 2: budget integrity, transactional official versions and audited ownership hardening.

create or replace function public.prevent_project_organization_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.organizacion_id is distinct from new.organizacion_id then
    raise exception 'No se puede mover un proyecto a otra organizacion.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists proyectos_prevent_organization_change on public.proyectos;
create trigger proyectos_prevent_organization_change
before update on public.proyectos
for each row execute function public.prevent_project_organization_change();

alter table public.presupuesto_borradores
  alter column created_by set default auth.uid(),
  alter column updated_by set default auth.uid();

drop policy if exists presupuesto_borradores_insert_project_editors on public.presupuesto_borradores;
create policy presupuesto_borradores_insert_project_editors
on public.presupuesto_borradores for insert to authenticated
with check (
  public.can_edit_project(proyecto_id)
  and public.project_belongs_to_organization(proyecto_id, organizacion_id)
  and created_by = auth.uid()
);

drop policy if exists presupuesto_borradores_update_project_editors on public.presupuesto_borradores;
create policy presupuesto_borradores_update_project_editors
on public.presupuesto_borradores for update to authenticated
using (public.can_edit_project(proyecto_id))
with check (
  public.can_edit_project(proyecto_id)
  and public.project_belongs_to_organization(proyecto_id, organizacion_id)
  and updated_by = auth.uid()
);

create or replace function public.create_organization_with_owner(
  nombre_org text,
  ruc_org text,
  nombre_proyecto text,
  cliente text default null,
  ubicacion text default null
)
returns table (
  organizacion_id uuid,
  proyecto_id uuid,
  organizacion_miembro_id uuid,
  proyecto_miembro_id uuid
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  actor_id uuid := auth.uid();
  normalized_ruc text := nullif(btrim(coalesce(ruc_org, '')), '');
  new_organization_id uuid;
  new_project_id uuid;
  new_organization_member_id uuid;
  new_project_member_id uuid;
begin
  if actor_id is null then
    raise exception 'Debes iniciar sesion para crear una organizacion.'
      using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.organizacion_miembros om
    where om.user_id = actor_id
      and om.estado = 'activo'
  ) then
    raise exception 'Tu usuario ya pertenece a una organizacion activa.';
  end if;

  if length(btrim(coalesce(nombre_org, ''))) = 0 then
    raise exception 'El nombre de la organizacion es obligatorio.';
  end if;

  if length(btrim(coalesce(nombre_proyecto, ''))) = 0 then
    raise exception 'El nombre del proyecto es obligatorio.';
  end if;

  if normalized_ruc is not null and normalized_ruc !~ '^[0-9]{11}$' then
    raise exception 'El RUC debe tener 11 digitos.';
  end if;

  insert into public.organizaciones (nombre, ruc)
  values (btrim(nombre_org), normalized_ruc)
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
  returning id into new_organization_member_id;

  insert into public.proyectos (
    organizacion_id,
    nombre,
    cliente,
    ubicacion,
    created_by
  )
  values (
    new_organization_id,
    btrim(nombre_proyecto),
    nullif(btrim(coalesce(cliente, '')), ''),
    nullif(btrim(coalesce(ubicacion, '')), ''),
    actor_id
  )
  returning id into new_project_id;

  insert into public.proyecto_miembros (
    proyecto_id,
    organizacion_miembro_id,
    rol,
    estado
  )
  values (
    new_project_id,
    new_organization_member_id,
    'admin',
    'activo'
  )
  returning id into new_project_member_id;

  return query select
    new_organization_id,
    new_project_id,
    new_organization_member_id,
    new_project_member_id;
end;
$$;

create or replace function public.is_valid_activity_entity(
  p_entity_type text,
  p_entity_id uuid,
  p_organizacion_id uuid,
  p_proyecto_id uuid,
  p_presupuesto_borrador_id uuid,
  p_presupuesto_version_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_entity_type not in (
    'proveedor',
    'recurso',
    'recurso_proveedor_precio',
    'partida',
    'partida_recurso',
    'presupuesto_borrador',
    'presupuesto_borrador_partida',
    'presupuesto_borrador_recurso',
    'presupuesto_version'
  ) then
    return false;
  end if;

  if p_entity_id is null then
    return false;
  end if;

  case p_entity_type
    when 'proveedor' then
      return exists (
        select 1 from public.proveedores e
        where e.id = p_entity_id and e.organizacion_id = p_organizacion_id
      );
    when 'recurso' then
      return exists (
        select 1 from public.recursos e
        where e.id = p_entity_id and e.organizacion_id = p_organizacion_id
      );
    when 'recurso_proveedor_precio' then
      return exists (
        select 1 from public.recurso_proveedor_precios e
        where e.id = p_entity_id and e.organizacion_id = p_organizacion_id
      );
    when 'partida' then
      return exists (
        select 1 from public.partidas e
        where e.id = p_entity_id and e.organizacion_id = p_organizacion_id
      );
    when 'partida_recurso' then
      return exists (
        select 1
        from public.partida_recursos e
        join public.partidas p on p.id = e.partida_id
        where e.id = p_entity_id
          and p.organizacion_id = p_organizacion_id
      );
    when 'presupuesto_borrador' then
      return exists (
        select 1 from public.presupuesto_borradores e
        where e.id = p_entity_id
          and e.organizacion_id = p_organizacion_id
          and (p_proyecto_id is null or e.proyecto_id = p_proyecto_id)
      );
    when 'presupuesto_borrador_partida' then
      return exists (
        select 1
        from public.presupuesto_borrador_partidas e
        join public.presupuesto_borradores b on b.id = e.presupuesto_borrador_id
        where e.id = p_entity_id
          and b.organizacion_id = p_organizacion_id
          and (p_proyecto_id is null or b.proyecto_id = p_proyecto_id)
          and (p_presupuesto_borrador_id is null or b.id = p_presupuesto_borrador_id)
      );
    when 'presupuesto_borrador_recurso' then
      return exists (
        select 1
        from public.presupuesto_borrador_partida_recursos e
        join public.presupuesto_borradores b on b.id = e.presupuesto_borrador_id
        where e.id = p_entity_id
          and b.organizacion_id = p_organizacion_id
          and (p_proyecto_id is null or b.proyecto_id = p_proyecto_id)
          and (p_presupuesto_borrador_id is null or b.id = p_presupuesto_borrador_id)
      );
    when 'presupuesto_version' then
      return exists (
        select 1 from public.presupuesto_versiones e
        where e.id = p_entity_id
          and e.organizacion_id = p_organizacion_id
          and (p_proyecto_id is null or e.proyecto_id = p_proyecto_id)
          and (p_presupuesto_version_id is null or e.id = p_presupuesto_version_id)
      );
    else
      return false;
  end case;
end;
$$;

drop policy if exists activity_events_insert_authorized on public.activity_events;
create policy activity_events_insert_authorized
on public.activity_events for insert to authenticated
with check (
  actor_id = auth.uid()
  and public.is_valid_activity_entity(
    entity_type,
    entity_id,
    organizacion_id,
    proyecto_id,
    presupuesto_borrador_id,
    presupuesto_version_id
  )
  and (
    (
      proyecto_id is not null
      and public.can_edit_project(proyecto_id)
      and public.project_belongs_to_organization(proyecto_id, organizacion_id)
    )
    or (
      proyecto_id is null
      and public.is_organization_admin(organizacion_id)
    )
  )
);

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
      descripcion_snapshot,
      especificaciones_snapshot,
      rendimiento_snapshot,
      cuadrilla_snapshot,
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
      descripcion_snapshot,
      especificaciones_snapshot,
      rendimiento_snapshot,
      cuadrilla_snapshot,
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
      cantidad,
      unidad,
      rendimiento_factor,
      desperdicio_porcentaje,
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
      resource.cantidad,
      resource.unidad,
      resource.rendimiento_factor,
      resource.desperdicio_porcentaje,
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
  subtotal_value numeric;
  overhead_value numeric;
  profit_value numeric;
  subtotal_with_margin_value numeric;
  tax_value numeric;
  total_value numeric;
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

  with resource_rows as (
    select
      pr.*,
      r.nombre as recurso_nombre,
      r.tipo as recurso_tipo,
      r.unidad as recurso_unidad,
      r.proveedor_id as recurso_proveedor_id,
      r.fuente_precio as recurso_fuente_precio,
      r.fecha_actualizacion_precio as recurso_fecha_precio,
      internal_quote.id as cotizacion_interna_id,
      coalesce(internal_quote.costo_unitario, pr.costo_unitario_snapshot) as costo_unitario_actual,
      coalesce(internal_quote.costo_transporte, pr.costo_transporte_snapshot) as costo_transporte_actual,
      coalesce(client_quote.id, fallback_quote.id) as cotizacion_cliente_id,
      coalesce(
        client_quote.costo_unitario + client_quote.costo_transporte,
        fallback_quote.costo_unitario + fallback_quote.costo_transporte
      ) as precio_cliente_actual,
      case
        when client_quote.id is not null then 'proveedor_visible'
        when fallback_quote.id is not null then 'fallback_general'
        else null
      end as precio_cliente_origen,
      case
        when client_quote.id is null and fallback_quote.id is not null
          then 'No hay cotizacion de proveedor visible para cliente; se uso el precio general mas alto disponible.'
        else null
      end as precio_cliente_advertencia
    from public.partida_recursos pr
    join public.recursos r on r.id = pr.recurso_id
    left join lateral (
      select q.*
      from public.recurso_proveedor_precios q
      join public.proveedores p on p.id = q.proveedor_id
      where q.recurso_id = pr.recurso_id
        and q.organizacion_id = draft_row.organizacion_id
        and q.estado = 'activo'
        and p.estado <> 'inactivo'
        and (q.vigente_desde is null or q.vigente_desde <= current_date)
        and (q.vigente_hasta is null or q.vigente_hasta >= current_date)
      order by q.es_preferido_interno desc, q.fecha_cotizacion desc nulls last, q.updated_at desc, q.created_at desc
      limit 1
    ) internal_quote on true
    left join lateral (
      select q.*
      from public.recurso_proveedor_precios q
      join public.proveedores p on p.id = q.proveedor_id
      where q.recurso_id = pr.recurso_id
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
      where q.recurso_id = pr.recurso_id
        and q.organizacion_id = draft_row.organizacion_id
        and q.estado = 'activo'
        and p.estado <> 'inactivo'
        and (q.vigente_desde is null or q.vigente_desde <= current_date)
        and (q.vigente_hasta is null or q.vigente_hasta >= current_date)
      order by (q.costo_unitario + q.costo_transporte) desc, q.fecha_cotizacion desc nulls last, q.updated_at desc, q.created_at desc
      limit 1
    ) fallback_quote on true
    where pr.partida_id = partida_row.id
  ),
  partials as (
    select
      round(
        cantidad * costo_unitario_actual
        + cantidad * costo_transporte_actual
        + ((cantidad * costo_unitario_actual) * desperdicio_porcentaje / 100),
        2
      ) as parcial_actual
    from resource_rows
  )
  select coalesce(round(sum(parcial_actual), 2), 0)
  into unit_price
  from partials;

  insert into public.presupuesto_borrador_partidas (
    presupuesto_borrador_id,
    partida_id,
    codigo_snapshot,
    nombre_snapshot,
    unidad_snapshot,
    categoria_snapshot,
    descripcion_snapshot,
    especificaciones_snapshot,
    rendimiento_snapshot,
    cuadrilla_snapshot,
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
    partida_row.codigo,
    partida_row.nombre,
    partida_row.unidad,
    partida_row.categoria,
    partida_row.descripcion,
    partida_row.especificaciones,
    partida_row.rendimiento,
    partida_row.cuadrilla,
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
    cantidad,
    unidad,
    rendimiento_factor,
    desperdicio_porcentaje,
    precio_fijado,
    autoactualizar_precio,
    motivo_precio_fijado,
    precio_origen,
    parcial_actual,
    orden,
    precio_cliente_actual,
    cotizacion_interna_id,
    cotizacion_cliente_id,
    precio_cliente_origen,
    precio_cliente_advertencia,
    precio_cliente_override,
    motivo_precio_cliente_override
  )
  select
    draft_row.id,
    inserted_line.id,
    id,
    recurso_id,
    recurso_nombre,
    recurso_tipo,
    recurso_unidad,
    costo_unitario_actual,
    costo_transporte_actual,
    recurso_proveedor_id,
    null,
    recurso_fuente_precio,
    recurso_fecha_precio,
    grupo,
    cantidad,
    unidad,
    rendimiento_factor,
    desperdicio_porcentaje,
    false,
    true,
    null,
    'catalogo',
    round(
      cantidad * costo_unitario_actual
      + cantidad * costo_transporte_actual
      + ((cantidad * costo_unitario_actual) * desperdicio_porcentaje / 100),
      2
    ),
    orden + next_order * 1000,
    precio_cliente_actual,
    cotizacion_interna_id,
    cotizacion_cliente_id,
    precio_cliente_origen,
    precio_cliente_advertencia,
    false,
    null
  from (
    select
      pr.*,
      r.nombre as recurso_nombre,
      r.tipo as recurso_tipo,
      r.unidad as recurso_unidad,
      r.proveedor_id as recurso_proveedor_id,
      r.fuente_precio as recurso_fuente_precio,
      r.fecha_actualizacion_precio as recurso_fecha_precio,
      internal_quote.id as cotizacion_interna_id,
      coalesce(internal_quote.costo_unitario, pr.costo_unitario_snapshot) as costo_unitario_actual,
      coalesce(internal_quote.costo_transporte, pr.costo_transporte_snapshot) as costo_transporte_actual,
      coalesce(client_quote.id, fallback_quote.id) as cotizacion_cliente_id,
      coalesce(
        client_quote.costo_unitario + client_quote.costo_transporte,
        fallback_quote.costo_unitario + fallback_quote.costo_transporte
      ) as precio_cliente_actual,
      case
        when client_quote.id is not null then 'proveedor_visible'
        when fallback_quote.id is not null then 'fallback_general'
        else null
      end as precio_cliente_origen,
      case
        when client_quote.id is null and fallback_quote.id is not null
          then 'No hay cotizacion de proveedor visible para cliente; se uso el precio general mas alto disponible.'
        else null
      end as precio_cliente_advertencia
    from public.partida_recursos pr
    join public.recursos r on r.id = pr.recurso_id
    left join lateral (
      select q.*
      from public.recurso_proveedor_precios q
      join public.proveedores p on p.id = q.proveedor_id
      where q.recurso_id = pr.recurso_id
        and q.organizacion_id = draft_row.organizacion_id
        and q.estado = 'activo'
        and p.estado <> 'inactivo'
        and (q.vigente_desde is null or q.vigente_desde <= current_date)
        and (q.vigente_hasta is null or q.vigente_hasta >= current_date)
      order by q.es_preferido_interno desc, q.fecha_cotizacion desc nulls last, q.updated_at desc, q.created_at desc
      limit 1
    ) internal_quote on true
    left join lateral (
      select q.*
      from public.recurso_proveedor_precios q
      join public.proveedores p on p.id = q.proveedor_id
      where q.recurso_id = pr.recurso_id
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
      where q.recurso_id = pr.recurso_id
        and q.organizacion_id = draft_row.organizacion_id
        and q.estado = 'activo'
        and p.estado <> 'inactivo'
        and (q.vigente_desde is null or q.vigente_desde <= current_date)
        and (q.vigente_hasta is null or q.vigente_hasta >= current_date)
      order by (q.costo_unitario + q.costo_transporte) desc, q.fecha_cotizacion desc nulls last, q.updated_at desc, q.created_at desc
      limit 1
    ) fallback_quote on true
    where pr.partida_id = partida_row.id
  ) resource_rows;

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

  return jsonb_build_object('line', to_jsonb(inserted_line));
end;
$$;

grant execute on function public.is_valid_activity_entity(text, uuid, uuid, uuid, uuid, uuid) to authenticated;
grant execute on function public.emit_official_budget_version(uuid, timestamptz) to authenticated;
grant execute on function public.add_draft_partida(uuid, uuid) to authenticated;
