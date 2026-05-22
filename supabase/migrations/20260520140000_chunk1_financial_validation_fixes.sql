alter table public.presupuesto_version_partidas
  add column motivo_precio_fijado_snapshot text;

alter table public.presupuesto_version_partida_recursos
  add column motivo_precio_fijado_snapshot text;

alter table public.presupuesto_borrador_partida_recursos
  add constraint presupuesto_borrador_recursos_precio_cliente_consistente
    check (
      (
        precio_cliente_actual is null
        and precio_cliente_origen is null
      )
      or (
        precio_cliente_actual is not null
        and precio_cliente_origen is not null
      )
    );
