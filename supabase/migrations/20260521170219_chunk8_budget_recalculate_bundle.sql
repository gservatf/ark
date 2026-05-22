create or replace function public.recalculate_budget_draft_totals(p_draft_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  draft_row public.presupuesto_borradores%rowtype;
  refreshed_draft jsonb;
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

  update public.presupuesto_borradores draft
  set
    subtotal = subtotal_value,
    gastos_generales_total = overhead_value,
    utilidad_total = profit_value,
    subtotal_con_margen = subtotal_with_margin_value,
    igv_total = tax_value,
    total = total_value,
    updated_by = actor_id
  where draft.id = draft_row.id
  returning to_jsonb(draft.*) into refreshed_draft;

  return jsonb_build_object(
    'draft', refreshed_draft,
    'lines', coalesce((
      select jsonb_agg(to_jsonb(line.*) order by line.orden)
      from public.presupuesto_borrador_partidas line
      where line.presupuesto_borrador_id = draft_row.id
    ), '[]'::jsonb),
    'resources', coalesce((
      select jsonb_agg(to_jsonb(resource.*) order by resource.orden)
      from public.presupuesto_borrador_partida_recursos resource
      where resource.presupuesto_borrador_id = draft_row.id
    ), '[]'::jsonb),
    'versions', coalesce((
      select jsonb_agg(to_jsonb(version.*) order by version.numero_version desc)
      from public.presupuesto_versiones version
      where version.organizacion_id = draft_row.organizacion_id
        and version.proyecto_id = draft_row.proyecto_id
    ), '[]'::jsonb)
  );
end;
$$;

grant execute on function public.recalculate_budget_draft_totals(uuid) to authenticated;
