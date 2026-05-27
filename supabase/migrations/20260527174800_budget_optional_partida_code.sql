alter table public.presupuesto_partidas
  drop constraint if exists presupuesto_partidas_snapshots_not_blank,
  add constraint presupuesto_partidas_snapshots_not_blank check (
    length(btrim(nombre_snapshot)) > 0
    and length(btrim(unidad_snapshot)) > 0
  );

alter table public.presupuesto_borrador_partidas
  drop constraint if exists presupuesto_borrador_partidas_snapshots_not_blank,
  add constraint presupuesto_borrador_partidas_snapshots_not_blank check (
    length(btrim(nombre_snapshot)) > 0
    and length(btrim(unidad_snapshot)) > 0
  );

alter table public.presupuesto_version_partidas
  drop constraint if exists presupuesto_version_partidas_snapshots_not_blank,
  add constraint presupuesto_version_partidas_snapshots_not_blank check (
    length(btrim(nombre_snapshot)) > 0
    and length(btrim(unidad_snapshot)) > 0
  );
