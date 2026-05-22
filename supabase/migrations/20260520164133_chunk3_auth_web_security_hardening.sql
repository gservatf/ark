-- Chunk 3: auth, route and production web hardening.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

alter table public.activity_events
  drop constraint if exists activity_events_before_size,
  drop constraint if exists activity_events_after_size,
  drop constraint if exists activity_events_changed_fields_size,
  drop constraint if exists activity_events_metadata_size,
  add constraint activity_events_before_size
    check (before is null or length(before::text) <= 50000),
  add constraint activity_events_after_size
    check (after is null or length(after::text) <= 50000),
  add constraint activity_events_changed_fields_size
    check (changed_fields is null or length(changed_fields::text) <= 50000),
  add constraint activity_events_metadata_size
    check (length(metadata::text) <= 50000);

revoke select, insert, update, delete on all tables in schema public from authenticated;

grant usage on schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

grant select, insert, update, delete on table
  public.proveedores,
  public.recursos,
  public.recurso_precios_historial,
  public.partidas,
  public.partida_recursos,
  public.presupuestos,
  public.presupuesto_partidas,
  public.presupuesto_partida_recursos,
  public.recurso_proveedor_precios,
  public.presupuesto_borradores,
  public.presupuesto_borrador_partidas,
  public.presupuesto_borrador_partida_recursos,
  public.presupuesto_versiones,
  public.presupuesto_version_partidas,
  public.presupuesto_version_partida_recursos,
  public.activity_events
to authenticated;

grant select on table
  public.organizaciones,
  public.organizacion_miembros,
  public.proyectos,
  public.proyecto_miembros
to authenticated;

grant insert, update on table
  public.organizaciones,
  public.organizacion_miembros,
  public.proyectos,
  public.proyecto_miembros
to authenticated;
