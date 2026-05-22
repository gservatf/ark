-- C y P - Initial Supabase schema.
-- This migration prepares the relational model for the MVP without enabling
-- auth-dependent policies yet. RLS/auth hardening belongs to a later goal.

create extension if not exists pgcrypto;

create type public.tipo_recurso as enum ('material', 'mano_obra', 'equipo', 'herramienta');
create type public.estado_registro as enum ('activo', 'inactivo');
create type public.grupo_apu as enum ('materiales', 'mano_obra', 'equipos_herramientas');
create type public.estado_presupuesto as enum ('borrador', 'aprobado', 'archivado');
create type public.moneda as enum ('PEN');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.proveedores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  ruc text unique,
  contacto text,
  telefono text,
  email text,
  direccion text,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint proveedores_nombre_not_blank check (length(btrim(nombre)) > 0),
  constraint proveedores_ruc_format check (ruc is null or ruc ~ '^[0-9]{11}$')
);

create trigger proveedores_set_updated_at
before update on public.proveedores
for each row execute function public.set_updated_at();

create table public.recursos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  tipo public.tipo_recurso not null,
  unidad text not null,
  costo_unitario_actual numeric(14, 4) not null default 0,
  proveedor_id uuid references public.proveedores(id) on delete set null,
  transporte_aplica boolean not null default false,
  costo_transporte numeric(14, 4) not null default 0,
  especificacion text,
  marca text,
  fuente_precio text,
  fecha_actualizacion_precio date,
  estado public.estado_registro not null default 'activo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recursos_nombre_not_blank check (length(btrim(nombre)) > 0),
  constraint recursos_unidad_not_blank check (length(btrim(unidad)) > 0),
  constraint recursos_costo_unitario_non_negative check (costo_unitario_actual >= 0),
  constraint recursos_costo_transporte_non_negative check (costo_transporte >= 0),
  constraint recursos_transporte_consistente check (transporte_aplica or costo_transporte = 0)
);

create trigger recursos_set_updated_at
before update on public.recursos
for each row execute function public.set_updated_at();

create table public.recurso_precios_historial (
  id uuid primary key default gen_random_uuid(),
  recurso_id uuid not null references public.recursos(id) on delete restrict,
  costo_unitario_anterior numeric(14, 4) not null default 0,
  costo_unitario_nuevo numeric(14, 4) not null default 0,
  costo_transporte_anterior numeric(14, 4) not null default 0,
  costo_transporte_nuevo numeric(14, 4) not null default 0,
  fuente_precio text,
  fecha timestamptz not null default now(),
  usuario_id uuid,
  notas text,
  constraint recurso_historial_costos_non_negative check (
    costo_unitario_anterior >= 0
    and costo_unitario_nuevo >= 0
    and costo_transporte_anterior >= 0
    and costo_transporte_nuevo >= 0
  )
);

create table public.partidas (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nombre text not null,
  unidad text not null,
  categoria text,
  descripcion text,
  especificaciones text,
  rendimiento numeric(14, 4),
  cuadrilla text,
  estado public.estado_registro not null default 'activo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partidas_codigo_not_blank check (length(btrim(codigo)) > 0),
  constraint partidas_nombre_not_blank check (length(btrim(nombre)) > 0),
  constraint partidas_unidad_not_blank check (length(btrim(unidad)) > 0),
  constraint partidas_rendimiento_non_negative check (rendimiento is null or rendimiento >= 0)
);

create trigger partidas_set_updated_at
before update on public.partidas
for each row execute function public.set_updated_at();

create table public.partida_recursos (
  id uuid primary key default gen_random_uuid(),
  partida_id uuid not null references public.partidas(id) on delete cascade,
  recurso_id uuid not null references public.recursos(id) on delete restrict,
  grupo public.grupo_apu not null,
  cantidad numeric(14, 6) not null,
  unidad text not null,
  costo_unitario_snapshot numeric(14, 4) not null,
  costo_transporte_snapshot numeric(14, 4) not null default 0,
  rendimiento_factor numeric(14, 6) default 1,
  desperdicio_porcentaje numeric(7, 4) not null default 0,
  parcial numeric(14, 4) not null default 0,
  orden integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partida_recursos_unidad_not_blank check (length(btrim(unidad)) > 0),
  constraint partida_recursos_non_negative check (
    cantidad >= 0
    and costo_unitario_snapshot >= 0
    and costo_transporte_snapshot >= 0
    and coalesce(rendimiento_factor, 1) >= 0
    and desperdicio_porcentaje >= 0
    and parcial >= 0
    and orden >= 0
  ),
  constraint partida_recursos_desperdicio_porcentaje check (desperdicio_porcentaje <= 100)
);

create trigger partida_recursos_set_updated_at
before update on public.partida_recursos
for each row execute function public.set_updated_at();

create table public.presupuestos (
  id uuid primary key default gen_random_uuid(),
  proyecto_nombre text not null,
  cliente text,
  ubicacion text,
  version text not null default 'Version 1',
  estado public.estado_presupuesto not null default 'borrador',
  moneda public.moneda not null default 'PEN',
  gastos_generales_porcentaje numeric(7, 4) not null default 0,
  utilidad_porcentaje numeric(7, 4) not null default 0,
  igv_porcentaje numeric(7, 4) not null default 18,
  subtotal numeric(14, 4) not null default 0,
  gastos_generales_total numeric(14, 4) not null default 0,
  utilidad_total numeric(14, 4) not null default 0,
  subtotal_con_margen numeric(14, 4) not null default 0,
  igv_total numeric(14, 4) not null default 0,
  total numeric(14, 4) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint presupuestos_proyecto_not_blank check (length(btrim(proyecto_nombre)) > 0),
  constraint presupuestos_version_not_blank check (length(btrim(version)) > 0),
  constraint presupuestos_porcentajes_validos check (
    gastos_generales_porcentaje between 0 and 100
    and utilidad_porcentaje between 0 and 100
    and igv_porcentaje between 0 and 100
  ),
  constraint presupuestos_totales_non_negative check (
    subtotal >= 0
    and gastos_generales_total >= 0
    and utilidad_total >= 0
    and subtotal_con_margen >= 0
    and igv_total >= 0
    and total >= 0
  )
);

create trigger presupuestos_set_updated_at
before update on public.presupuestos
for each row execute function public.set_updated_at();

create table public.presupuesto_partidas (
  id uuid primary key default gen_random_uuid(),
  presupuesto_id uuid not null references public.presupuestos(id) on delete cascade,
  partida_id uuid references public.partidas(id) on delete restrict,
  codigo_snapshot text not null,
  nombre_snapshot text not null,
  unidad_snapshot text not null,
  categoria_snapshot text,
  descripcion_snapshot text,
  especificaciones_snapshot text,
  rendimiento_snapshot numeric(14, 4),
  cuadrilla_snapshot text,
  metrado numeric(14, 6) not null,
  precio_unitario_snapshot numeric(14, 4) not null,
  parcial numeric(14, 4) not null,
  orden integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint presupuesto_partidas_snapshots_not_blank check (
    length(btrim(codigo_snapshot)) > 0
    and length(btrim(nombre_snapshot)) > 0
    and length(btrim(unidad_snapshot)) > 0
  ),
  constraint presupuesto_partidas_non_negative check (
    coalesce(rendimiento_snapshot, 0) >= 0
    and metrado >= 0
    and precio_unitario_snapshot >= 0
    and parcial >= 0
    and orden >= 0
  )
);

create trigger presupuesto_partidas_set_updated_at
before update on public.presupuesto_partidas
for each row execute function public.set_updated_at();

create table public.presupuesto_partida_recursos (
  id uuid primary key default gen_random_uuid(),
  presupuesto_id uuid not null references public.presupuestos(id) on delete cascade,
  presupuesto_partida_id uuid not null references public.presupuesto_partidas(id) on delete cascade,
  partida_recurso_id uuid references public.partida_recursos(id) on delete restrict,
  recurso_id uuid references public.recursos(id) on delete restrict,
  nombre_snapshot text not null,
  tipo_snapshot public.tipo_recurso not null,
  unidad_snapshot text not null,
  costo_unitario_snapshot numeric(14, 4) not null,
  costo_transporte_snapshot numeric(14, 4) not null default 0,
  proveedor_id_snapshot uuid references public.proveedores(id) on delete restrict,
  proveedor_nombre_snapshot text,
  fuente_precio_snapshot text,
  fecha_precio_snapshot date,
  grupo public.grupo_apu not null,
  cantidad numeric(14, 6) not null,
  unidad text not null,
  rendimiento_factor numeric(14, 6) default 1,
  desperdicio_porcentaje numeric(7, 4) not null default 0,
  parcial_snapshot numeric(14, 4) not null,
  orden integer not null default 1,
  created_at timestamptz not null default now(),
  constraint presupuesto_partida_recursos_snapshots_not_blank check (
    length(btrim(nombre_snapshot)) > 0
    and length(btrim(unidad_snapshot)) > 0
    and length(btrim(unidad)) > 0
  ),
  constraint presupuesto_partida_recursos_non_negative check (
    costo_unitario_snapshot >= 0
    and costo_transporte_snapshot >= 0
    and cantidad >= 0
    and coalesce(rendimiento_factor, 1) >= 0
    and desperdicio_porcentaje >= 0
    and desperdicio_porcentaje <= 100
    and parcial_snapshot >= 0
    and orden >= 0
  )
);

create index proveedores_nombre_idx on public.proveedores using btree (nombre);
create index proveedores_ruc_idx on public.proveedores using btree (ruc);

create index recursos_nombre_idx on public.recursos using btree (nombre);
create index recursos_tipo_idx on public.recursos using btree (tipo);
create index recursos_proveedor_id_idx on public.recursos using btree (proveedor_id);
create index recursos_estado_idx on public.recursos using btree (estado);

create index recurso_precios_historial_recurso_id_idx on public.recurso_precios_historial using btree (recurso_id);
create index recurso_precios_historial_fecha_idx on public.recurso_precios_historial using btree (fecha desc);

create index partidas_codigo_idx on public.partidas using btree (codigo);
create index partidas_nombre_idx on public.partidas using btree (nombre);
create index partidas_categoria_idx on public.partidas using btree (categoria);
create index partidas_estado_idx on public.partidas using btree (estado);

create index partida_recursos_partida_id_idx on public.partida_recursos using btree (partida_id);
create index partida_recursos_recurso_id_idx on public.partida_recursos using btree (recurso_id);
create unique index partida_recursos_partida_orden_idx on public.partida_recursos (partida_id, orden);

create index presupuestos_proyecto_nombre_idx on public.presupuestos using btree (proyecto_nombre);
create index presupuestos_cliente_idx on public.presupuestos using btree (cliente);
create index presupuestos_estado_idx on public.presupuestos using btree (estado);
create index presupuestos_created_at_idx on public.presupuestos using btree (created_at desc);

create index presupuesto_partidas_presupuesto_id_idx on public.presupuesto_partidas using btree (presupuesto_id);
create index presupuesto_partidas_partida_id_idx on public.presupuesto_partidas using btree (partida_id);
create unique index presupuesto_partidas_presupuesto_orden_idx on public.presupuesto_partidas (presupuesto_id, orden);

create index presupuesto_partida_recursos_presupuesto_id_idx on public.presupuesto_partida_recursos using btree (presupuesto_id);
create index presupuesto_partida_recursos_presupuesto_partida_id_idx on public.presupuesto_partida_recursos using btree (presupuesto_partida_id);
create index presupuesto_partida_recursos_recurso_id_idx on public.presupuesto_partida_recursos using btree (recurso_id);
