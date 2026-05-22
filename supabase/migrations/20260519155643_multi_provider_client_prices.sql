-- C y P - Multi-provider quotes and client prices.
-- Adds client-visible providers, resource/provider quotes and live client
-- price controls for budget drafts before freezing official versions.

alter table public.proveedores
  add column disponible_para_cliente boolean not null default false;

create table public.recurso_proveedor_precios (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones(id) on delete restrict,
  recurso_id uuid not null references public.recursos(id) on delete restrict,
  proveedor_id uuid not null references public.proveedores(id) on delete restrict,
  costo_unitario numeric(14, 4) not null,
  costo_transporte numeric(14, 4) not null default 0,
  moneda public.moneda not null default 'PEN',
  fecha_cotizacion date,
  vigente_desde date,
  vigente_hasta date,
  fuente_precio text,
  url_referencia text,
  es_preferido_interno boolean not null default false,
  estado public.estado_registro not null default 'activo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recurso_proveedor_precios_costos_non_negative check (
    costo_unitario >= 0
    and costo_transporte >= 0
  ),
  constraint recurso_proveedor_precios_vigencia_consistente check (
    vigente_hasta is null
    or vigente_desde is null
    or vigente_hasta >= vigente_desde
  ),
  constraint recurso_proveedor_precios_fuente_not_blank check (
    fuente_precio is null or length(btrim(fuente_precio)) > 0
  ),
  constraint recurso_proveedor_precios_url_not_blank check (
    url_referencia is null or length(btrim(url_referencia)) > 0
  )
);

create trigger recurso_proveedor_precios_set_updated_at
before update on public.recurso_proveedor_precios
for each row execute function public.set_updated_at();

create index recurso_proveedor_precios_organizacion_id_idx
  on public.recurso_proveedor_precios using btree (organizacion_id);
create index recurso_proveedor_precios_recurso_id_idx
  on public.recurso_proveedor_precios using btree (recurso_id);
create index recurso_proveedor_precios_proveedor_id_idx
  on public.recurso_proveedor_precios using btree (proveedor_id);
create index recurso_proveedor_precios_estado_idx
  on public.recurso_proveedor_precios using btree (estado);
create index recurso_proveedor_precios_fecha_idx
  on public.recurso_proveedor_precios using btree (fecha_cotizacion desc);
create unique index recurso_proveedor_precios_preferido_unico_idx
  on public.recurso_proveedor_precios (organizacion_id, recurso_id)
  where es_preferido_interno and estado = 'activo';

alter table public.presupuesto_borrador_partida_recursos
  add column precio_cliente_actual numeric(14, 4),
  add column cotizacion_interna_id uuid references public.recurso_proveedor_precios(id) on delete set null,
  add column cotizacion_cliente_id uuid references public.recurso_proveedor_precios(id) on delete set null,
  add column precio_cliente_origen text,
  add column precio_cliente_advertencia text,
  add column precio_cliente_override boolean not null default false,
  add column motivo_precio_cliente_override text,
  add constraint presupuesto_borrador_recursos_precio_cliente_non_negative
    check (coalesce(precio_cliente_actual, 0) >= 0),
  add constraint presupuesto_borrador_recursos_precio_cliente_origen
    check (
      precio_cliente_origen is null
      or precio_cliente_origen in ('proveedor_visible', 'fallback_general', 'override_manual')
    ),
  add constraint presupuesto_borrador_recursos_override_consistente
    check (
      not precio_cliente_override
      or (
        precio_cliente_actual is not null
        and precio_cliente_origen = 'override_manual'
      )
    );

alter table public.presupuesto_version_partida_recursos
  add constraint presupuesto_version_recursos_cotizacion_interna_fkey
    foreign key (cotizacion_interna_id_snapshot)
    references public.recurso_proveedor_precios(id)
    on delete set null,
  add constraint presupuesto_version_recursos_cotizacion_cliente_fkey
    foreign key (cotizacion_cliente_id_snapshot)
    references public.recurso_proveedor_precios(id)
    on delete set null,
  add constraint presupuesto_version_recursos_precio_cliente_origen
    check (
      precio_cliente_origen_snapshot is null
      or precio_cliente_origen_snapshot in (
        'proveedor_visible',
        'fallback_general',
        'override_manual',
        'snapshot_demo'
      )
    );

grant select, insert, update, delete on public.recurso_proveedor_precios to authenticated;

alter table public.recurso_proveedor_precios enable row level security;

create policy recurso_proveedor_precios_select_org_members
on public.recurso_proveedor_precios for select to authenticated
using (
  organizacion_id is not null
  and public.is_organization_member(organizacion_id)
);

create policy recurso_proveedor_precios_insert_org_admins
on public.recurso_proveedor_precios for insert to authenticated
with check (
  organizacion_id is not null
  and public.is_organization_admin(organizacion_id)
  and exists (
    select 1
    from public.recursos r
    where r.id = recurso_id
      and r.organizacion_id = organizacion_id
  )
  and exists (
    select 1
    from public.proveedores p
    where p.id = proveedor_id
      and p.organizacion_id = organizacion_id
  )
);

create policy recurso_proveedor_precios_update_org_admins
on public.recurso_proveedor_precios for update to authenticated
using (
  organizacion_id is not null
  and public.is_organization_admin(organizacion_id)
)
with check (
  organizacion_id is not null
  and public.is_organization_admin(organizacion_id)
  and exists (
    select 1
    from public.recursos r
    where r.id = recurso_id
      and r.organizacion_id = organizacion_id
  )
  and exists (
    select 1
    from public.proveedores p
    where p.id = proveedor_id
      and p.organizacion_id = organizacion_id
  )
);

create policy recurso_proveedor_precios_delete_org_admins
on public.recurso_proveedor_precios for delete to authenticated
using (
  organizacion_id is not null
  and public.is_organization_admin(organizacion_id)
);
