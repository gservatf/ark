alter table public.partidas
  drop constraint if exists partidas_codigo_key;

create unique index if not exists partidas_organizacion_codigo_idx
on public.partidas (organizacion_id, codigo);
