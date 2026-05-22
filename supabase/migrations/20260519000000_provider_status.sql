-- C y P - Provider lifecycle status.
-- Providers are deactivated instead of physically deleted so linked resources,
-- snapshots and audit history remain traceable.

alter table public.proveedores
  add column estado public.estado_registro not null default 'activo';

create index proveedores_estado_idx on public.proveedores using btree (estado);
