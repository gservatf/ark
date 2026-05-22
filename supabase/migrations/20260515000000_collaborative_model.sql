-- C y P - Collaborative Supabase model.
-- This migration adds ownership, project collaboration, audit events,
-- live budget drafts and frozen official budget versions.
-- Auth/RLS policies and Realtime channels belong to later goals.

create type public.rol_organizacion as enum ('owner', 'admin', 'miembro');
create type public.rol_proyecto as enum ('admin', 'presupuestador', 'editor', 'lector');
create type public.estado_miembro as enum ('activo', 'invitado', 'suspendido');
create type public.estado_proyecto as enum ('activo', 'archivado');
create type public.estado_presupuesto_borrador as enum ('activo', 'cerrado', 'archivado');
create type public.estado_presupuesto_version as enum ('emitida', 'anulada');
create type public.precio_origen as enum ('catalogo', 'manual', 'snapshot');

alter table public.proveedores
  add column organizacion_id uuid;

alter table public.recursos
  add column organizacion_id uuid;

alter table public.partidas
  add column organizacion_id uuid;

alter table public.presupuestos
  add column organizacion_id uuid;

create table public.organizaciones (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  ruc text,
  estado public.estado_registro not null default 'activo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizaciones_nombre_not_blank check (length(btrim(nombre)) > 0),
  constraint organizaciones_ruc_format check (ruc is null or ruc ~ '^[0-9]{11}$')
);

create trigger organizaciones_set_updated_at
before update on public.organizaciones
for each row execute function public.set_updated_at();

create table public.organizacion_miembros (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rol public.rol_organizacion not null default 'miembro',
  estado public.estado_miembro not null default 'activo',
  invitado_por uuid references auth.users(id) on delete set null,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizacion_miembros_unique_user unique (organizacion_id, user_id)
);

create trigger organizacion_miembros_set_updated_at
before update on public.organizacion_miembros
for each row execute function public.set_updated_at();

create table public.proyectos (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones(id) on delete cascade,
  nombre text not null,
  cliente text,
  ubicacion text,
  codigo text,
  descripcion text,
  estado public.estado_proyecto not null default 'activo',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint proyectos_nombre_not_blank check (length(btrim(nombre)) > 0),
  constraint proyectos_codigo_not_blank check (codigo is null or length(btrim(codigo)) > 0)
);

create trigger proyectos_set_updated_at
before update on public.proyectos
for each row execute function public.set_updated_at();

create table public.proyecto_miembros (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos(id) on delete cascade,
  organizacion_miembro_id uuid not null references public.organizacion_miembros(id) on delete cascade,
  rol public.rol_proyecto not null default 'editor',
  estado public.estado_miembro not null default 'activo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint proyecto_miembros_unique_member unique (proyecto_id, organizacion_miembro_id)
);

create trigger proyecto_miembros_set_updated_at
before update on public.proyecto_miembros
for each row execute function public.set_updated_at();

alter table public.proveedores
  add constraint proveedores_organizacion_id_fkey
  foreign key (organizacion_id) references public.organizaciones(id) on delete restrict;

alter table public.recursos
  add constraint recursos_organizacion_id_fkey
  foreign key (organizacion_id) references public.organizaciones(id) on delete restrict;

alter table public.partidas
  add constraint partidas_organizacion_id_fkey
  foreign key (organizacion_id) references public.organizaciones(id) on delete restrict;

alter table public.presupuestos
  add constraint presupuestos_organizacion_id_fkey
  foreign key (organizacion_id) references public.organizaciones(id) on delete restrict;

create table public.presupuesto_borradores (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones(id) on delete restrict,
  proyecto_id uuid not null references public.proyectos(id) on delete cascade,
  nombre text not null,
  cliente text,
  ubicacion text,
  estado public.estado_presupuesto_borrador not null default 'activo',
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
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint presupuesto_borradores_nombre_not_blank check (length(btrim(nombre)) > 0),
  constraint presupuesto_borradores_porcentajes_validos check (
    gastos_generales_porcentaje between 0 and 100
    and utilidad_porcentaje between 0 and 100
    and igv_porcentaje between 0 and 100
  ),
  constraint presupuesto_borradores_totales_non_negative check (
    subtotal >= 0
    and gastos_generales_total >= 0
    and utilidad_total >= 0
    and subtotal_con_margen >= 0
    and igv_total >= 0
    and total >= 0
  )
);

create trigger presupuesto_borradores_set_updated_at
before update on public.presupuesto_borradores
for each row execute function public.set_updated_at();

create table public.presupuesto_borrador_partidas (
  id uuid primary key default gen_random_uuid(),
  presupuesto_borrador_id uuid not null references public.presupuesto_borradores(id) on delete cascade,
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
  precio_unitario_actual numeric(14, 4) not null,
  precio_fijado boolean not null default false,
  autoactualizar_precio boolean not null default true,
  motivo_precio_fijado text,
  precio_origen public.precio_origen not null default 'catalogo',
  parcial numeric(14, 4) not null,
  orden integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint presupuesto_borrador_partidas_snapshots_not_blank check (
    length(btrim(codigo_snapshot)) > 0
    and length(btrim(nombre_snapshot)) > 0
    and length(btrim(unidad_snapshot)) > 0
  ),
  constraint presupuesto_borrador_partidas_non_negative check (
    coalesce(rendimiento_snapshot, 0) >= 0
    and metrado >= 0
    and precio_unitario_actual >= 0
    and parcial >= 0
    and orden >= 0
  ),
  constraint presupuesto_borrador_partidas_precio_fijado_consistente check (
    not (precio_fijado and autoactualizar_precio)
  )
);

create trigger presupuesto_borrador_partidas_set_updated_at
before update on public.presupuesto_borrador_partidas
for each row execute function public.set_updated_at();

create table public.presupuesto_borrador_partida_recursos (
  id uuid primary key default gen_random_uuid(),
  presupuesto_borrador_id uuid not null references public.presupuesto_borradores(id) on delete cascade,
  presupuesto_borrador_partida_id uuid not null references public.presupuesto_borrador_partidas(id) on delete cascade,
  partida_recurso_id uuid references public.partida_recursos(id) on delete restrict,
  recurso_id uuid references public.recursos(id) on delete restrict,
  nombre_snapshot text not null,
  tipo_snapshot public.tipo_recurso not null,
  unidad_snapshot text not null,
  costo_unitario_actual numeric(14, 4) not null,
  costo_transporte_actual numeric(14, 4) not null default 0,
  proveedor_id_snapshot uuid references public.proveedores(id) on delete restrict,
  proveedor_nombre_snapshot text,
  fuente_precio_snapshot text,
  fecha_precio_snapshot date,
  grupo public.grupo_apu not null,
  cantidad numeric(14, 6) not null,
  unidad text not null,
  rendimiento_factor numeric(14, 6) default 1,
  desperdicio_porcentaje numeric(7, 4) not null default 0,
  precio_fijado boolean not null default false,
  autoactualizar_precio boolean not null default true,
  motivo_precio_fijado text,
  precio_origen public.precio_origen not null default 'catalogo',
  parcial_actual numeric(14, 4) not null,
  orden integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint presupuesto_borrador_recursos_snapshots_not_blank check (
    length(btrim(nombre_snapshot)) > 0
    and length(btrim(unidad_snapshot)) > 0
    and length(btrim(unidad)) > 0
  ),
  constraint presupuesto_borrador_recursos_non_negative check (
    costo_unitario_actual >= 0
    and costo_transporte_actual >= 0
    and cantidad >= 0
    and coalesce(rendimiento_factor, 1) >= 0
    and desperdicio_porcentaje >= 0
    and desperdicio_porcentaje <= 100
    and parcial_actual >= 0
    and orden >= 0
  ),
  constraint presupuesto_borrador_recursos_precio_fijado_consistente check (
    not (precio_fijado and autoactualizar_precio)
  )
);

create trigger presupuesto_borrador_partida_recursos_set_updated_at
before update on public.presupuesto_borrador_partida_recursos
for each row execute function public.set_updated_at();

create table public.presupuesto_versiones (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones(id) on delete restrict,
  proyecto_id uuid not null references public.proyectos(id) on delete cascade,
  presupuesto_borrador_id uuid references public.presupuesto_borradores(id) on delete set null,
  numero_version integer not null,
  nombre text not null,
  cliente text,
  ubicacion text,
  estado public.estado_presupuesto_version not null default 'emitida',
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
  emitida_por uuid references auth.users(id) on delete set null,
  emitida_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint presupuesto_versiones_nombre_not_blank check (length(btrim(nombre)) > 0),
  constraint presupuesto_versiones_numero_positive check (numero_version > 0),
  constraint presupuesto_versiones_porcentajes_validos check (
    gastos_generales_porcentaje between 0 and 100
    and utilidad_porcentaje between 0 and 100
    and igv_porcentaje between 0 and 100
  ),
  constraint presupuesto_versiones_totales_non_negative check (
    subtotal >= 0
    and gastos_generales_total >= 0
    and utilidad_total >= 0
    and subtotal_con_margen >= 0
    and igv_total >= 0
    and total >= 0
  ),
  constraint presupuesto_versiones_unique_numero unique (proyecto_id, numero_version)
);

create table public.presupuesto_version_partidas (
  id uuid primary key default gen_random_uuid(),
  presupuesto_version_id uuid not null references public.presupuesto_versiones(id) on delete cascade,
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
  precio_fijado_snapshot boolean not null default false,
  precio_origen_snapshot public.precio_origen not null default 'snapshot',
  parcial_snapshot numeric(14, 4) not null,
  orden integer not null default 1,
  created_at timestamptz not null default now(),
  constraint presupuesto_version_partidas_snapshots_not_blank check (
    length(btrim(codigo_snapshot)) > 0
    and length(btrim(nombre_snapshot)) > 0
    and length(btrim(unidad_snapshot)) > 0
  ),
  constraint presupuesto_version_partidas_non_negative check (
    coalesce(rendimiento_snapshot, 0) >= 0
    and metrado >= 0
    and precio_unitario_snapshot >= 0
    and parcial_snapshot >= 0
    and orden >= 0
  )
);

create table public.presupuesto_version_partida_recursos (
  id uuid primary key default gen_random_uuid(),
  presupuesto_version_id uuid not null references public.presupuesto_versiones(id) on delete cascade,
  presupuesto_version_partida_id uuid not null references public.presupuesto_version_partidas(id) on delete cascade,
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
  precio_cliente_snapshot numeric(14, 4),
  cotizacion_interna_id_snapshot uuid,
  cotizacion_cliente_id_snapshot uuid,
  precio_cliente_origen_snapshot text,
  precio_cliente_advertencia_snapshot text,
  precio_fijado_snapshot boolean not null default false,
  precio_origen_snapshot public.precio_origen not null default 'snapshot',
  grupo public.grupo_apu not null,
  cantidad numeric(14, 6) not null,
  unidad text not null,
  rendimiento_factor numeric(14, 6) default 1,
  desperdicio_porcentaje numeric(7, 4) not null default 0,
  parcial_snapshot numeric(14, 4) not null,
  orden integer not null default 1,
  created_at timestamptz not null default now(),
  constraint presupuesto_version_recursos_snapshots_not_blank check (
    length(btrim(nombre_snapshot)) > 0
    and length(btrim(unidad_snapshot)) > 0
    and length(btrim(unidad)) > 0
  ),
  constraint presupuesto_version_recursos_non_negative check (
    costo_unitario_snapshot >= 0
    and costo_transporte_snapshot >= 0
    and coalesce(precio_cliente_snapshot, 0) >= 0
    and cantidad >= 0
    and coalesce(rendimiento_factor, 1) >= 0
    and desperdicio_porcentaje >= 0
    and desperdicio_porcentaje <= 100
    and parcial_snapshot >= 0
    and orden >= 0
  )
);

create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones(id) on delete cascade,
  proyecto_id uuid references public.proyectos(id) on delete cascade,
  presupuesto_borrador_id uuid references public.presupuesto_borradores(id) on delete set null,
  presupuesto_version_id uuid references public.presupuesto_versiones(id) on delete set null,
  actor_id uuid references auth.users(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  before jsonb,
  after jsonb,
  changed_fields jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint activity_events_entity_type_not_blank check (length(btrim(entity_type)) > 0),
  constraint activity_events_action_not_blank check (length(btrim(action)) > 0)
);

create index proveedores_organizacion_id_idx on public.proveedores using btree (organizacion_id);
create index recursos_organizacion_id_idx on public.recursos using btree (organizacion_id);
create index partidas_organizacion_id_idx on public.partidas using btree (organizacion_id);
create index presupuestos_organizacion_id_idx on public.presupuestos using btree (organizacion_id);

create index organizaciones_nombre_idx on public.organizaciones using btree (nombre);
create index organizacion_miembros_organizacion_id_idx on public.organizacion_miembros using btree (organizacion_id);
create index organizacion_miembros_user_id_idx on public.organizacion_miembros using btree (user_id);
create index proyectos_organizacion_id_idx on public.proyectos using btree (organizacion_id);
create index proyectos_estado_idx on public.proyectos using btree (estado);
create index proyecto_miembros_proyecto_id_idx on public.proyecto_miembros using btree (proyecto_id);
create index proyecto_miembros_organizacion_miembro_id_idx on public.proyecto_miembros using btree (organizacion_miembro_id);

create unique index presupuesto_borradores_proyecto_activo_idx
  on public.presupuesto_borradores (proyecto_id)
  where estado = 'activo';

create index presupuesto_borradores_organizacion_id_idx on public.presupuesto_borradores using btree (organizacion_id);
create index presupuesto_borradores_proyecto_id_idx on public.presupuesto_borradores using btree (proyecto_id);
create index presupuesto_borradores_estado_idx on public.presupuesto_borradores using btree (estado);
create index presupuesto_borrador_partidas_borrador_id_idx on public.presupuesto_borrador_partidas using btree (presupuesto_borrador_id);
create index presupuesto_borrador_partidas_partida_id_idx on public.presupuesto_borrador_partidas using btree (partida_id);
create unique index presupuesto_borrador_partidas_orden_idx on public.presupuesto_borrador_partidas (presupuesto_borrador_id, orden);
create index presupuesto_borrador_recursos_borrador_id_idx on public.presupuesto_borrador_partida_recursos using btree (presupuesto_borrador_id);
create index presupuesto_borrador_recursos_partida_id_idx on public.presupuesto_borrador_partida_recursos using btree (presupuesto_borrador_partida_id);
create index presupuesto_borrador_recursos_recurso_id_idx on public.presupuesto_borrador_partida_recursos using btree (recurso_id);

create index presupuesto_versiones_organizacion_id_idx on public.presupuesto_versiones using btree (organizacion_id);
create index presupuesto_versiones_proyecto_id_idx on public.presupuesto_versiones using btree (proyecto_id);
create index presupuesto_versiones_emitida_at_idx on public.presupuesto_versiones using btree (emitida_at desc);
create index presupuesto_version_partidas_version_id_idx on public.presupuesto_version_partidas using btree (presupuesto_version_id);
create unique index presupuesto_version_partidas_orden_idx on public.presupuesto_version_partidas (presupuesto_version_id, orden);
create index presupuesto_version_recursos_version_id_idx on public.presupuesto_version_partida_recursos using btree (presupuesto_version_id);
create index presupuesto_version_recursos_partida_id_idx on public.presupuesto_version_partida_recursos using btree (presupuesto_version_partida_id);
create index presupuesto_version_recursos_recurso_id_idx on public.presupuesto_version_partida_recursos using btree (recurso_id);

create index activity_events_organizacion_id_idx on public.activity_events using btree (organizacion_id);
create index activity_events_proyecto_id_idx on public.activity_events using btree (proyecto_id);
create index activity_events_actor_id_idx on public.activity_events using btree (actor_id);
create index activity_events_entity_idx on public.activity_events using btree (entity_type, entity_id);
create index activity_events_created_at_idx on public.activity_events using btree (created_at desc);
