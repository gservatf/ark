-- C y P - Catalogos persistentes para cabecera de partidas.
-- Categoria, subcategoria y unidad dejan de ser texto libre en la UI.

create table public.partida_categorias (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones(id) on delete cascade,
  nombre text not null,
  estado public.estado_registro not null default 'activo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partida_categorias_nombre_not_blank check (length(btrim(nombre)) > 0)
);

create unique index partida_categorias_org_nombre_active_idx
on public.partida_categorias (organizacion_id, lower(btrim(nombre)))
where estado = 'activo';

create index partida_categorias_org_idx
on public.partida_categorias (organizacion_id);

create trigger partida_categorias_set_updated_at
before update on public.partida_categorias
for each row execute function public.set_updated_at();

create table public.partida_subcategorias (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones(id) on delete cascade,
  categoria_id uuid not null references public.partida_categorias(id) on delete cascade,
  nombre text not null,
  estado public.estado_registro not null default 'activo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partida_subcategorias_nombre_not_blank check (length(btrim(nombre)) > 0)
);

create unique index partida_subcategorias_org_categoria_nombre_active_idx
on public.partida_subcategorias (organizacion_id, categoria_id, lower(btrim(nombre)))
where estado = 'activo';

create index partida_subcategorias_org_idx
on public.partida_subcategorias (organizacion_id);

create index partida_subcategorias_categoria_idx
on public.partida_subcategorias (categoria_id);

create trigger partida_subcategorias_set_updated_at
before update on public.partida_subcategorias
for each row execute function public.set_updated_at();

create table public.unidades_medida (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones(id) on delete cascade,
  codigo text not null,
  nombre text not null,
  tipo text,
  estado public.estado_registro not null default 'activo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unidades_medida_codigo_not_blank check (length(btrim(codigo)) > 0),
  constraint unidades_medida_nombre_not_blank check (length(btrim(nombre)) > 0)
);

create unique index unidades_medida_org_codigo_active_idx
on public.unidades_medida (organizacion_id, lower(btrim(codigo)))
where estado = 'activo';

create index unidades_medida_org_idx
on public.unidades_medida (organizacion_id);

create trigger unidades_medida_set_updated_at
before update on public.unidades_medida
for each row execute function public.set_updated_at();

alter table public.partidas
add column categoria_id uuid references public.partida_categorias(id) on delete set null,
add column subcategoria_id uuid references public.partida_subcategorias(id) on delete set null,
add column unidad_id uuid references public.unidades_medida(id) on delete set null;

create index partidas_categoria_id_idx on public.partidas (categoria_id);
create index partidas_subcategoria_id_idx on public.partidas (subcategoria_id);
create index partidas_unidad_id_idx on public.partidas (unidad_id);

insert into public.partida_categorias (organizacion_id, nombre)
select distinct p.organizacion_id, btrim(p.categoria)
from public.partidas p
where p.organizacion_id is not null
  and p.categoria is not null
  and length(btrim(p.categoria)) > 0
  and not exists (
    select 1
    from public.partida_categorias c
    where c.organizacion_id = p.organizacion_id
      and lower(btrim(c.nombre)) = lower(btrim(p.categoria))
      and c.estado = 'activo'
  );

update public.partidas p
set categoria_id = c.id
from public.partida_categorias c
where p.categoria_id is null
  and p.organizacion_id = c.organizacion_id
  and p.categoria is not null
  and lower(btrim(p.categoria)) = lower(btrim(c.nombre))
  and c.estado = 'activo';

insert into public.partida_subcategorias (organizacion_id, categoria_id, nombre)
select distinct p.organizacion_id, p.categoria_id, btrim(p.subcategoria)
from public.partidas p
where p.organizacion_id is not null
  and p.categoria_id is not null
  and p.subcategoria is not null
  and length(btrim(p.subcategoria)) > 0
  and not exists (
    select 1
    from public.partida_subcategorias s
    where s.organizacion_id = p.organizacion_id
      and s.categoria_id = p.categoria_id
      and lower(btrim(s.nombre)) = lower(btrim(p.subcategoria))
      and s.estado = 'activo'
  );

update public.partidas p
set subcategoria_id = s.id
from public.partida_subcategorias s
where p.subcategoria_id is null
  and p.organizacion_id = s.organizacion_id
  and p.categoria_id = s.categoria_id
  and p.subcategoria is not null
  and lower(btrim(p.subcategoria)) = lower(btrim(s.nombre))
  and s.estado = 'activo';

insert into public.unidades_medida (organizacion_id, codigo, nombre)
select distinct p.organizacion_id, btrim(p.unidad), btrim(p.unidad)
from public.partidas p
where p.organizacion_id is not null
  and p.unidad is not null
  and length(btrim(p.unidad)) > 0
  and not exists (
    select 1
    from public.unidades_medida u
    where u.organizacion_id = p.organizacion_id
      and lower(btrim(u.codigo)) = lower(btrim(p.unidad))
      and u.estado = 'activo'
  );

update public.partidas p
set unidad_id = u.id
from public.unidades_medida u
where p.unidad_id is null
  and p.organizacion_id = u.organizacion_id
  and lower(btrim(p.unidad)) = lower(btrim(u.codigo))
  and u.estado = 'activo';

alter table public.partida_categorias enable row level security;
alter table public.partida_subcategorias enable row level security;
alter table public.unidades_medida enable row level security;

create policy partida_categorias_select_org_members
on public.partida_categorias for select to authenticated
using (public.is_organization_member(organizacion_id));

create policy partida_categorias_insert_catalog_admins
on public.partida_categorias for insert to authenticated
with check (public.can_manage_organization_catalog(organizacion_id));

create policy partida_categorias_update_catalog_admins
on public.partida_categorias for update to authenticated
using (public.can_manage_organization_catalog(organizacion_id))
with check (public.can_manage_organization_catalog(organizacion_id));

create policy partida_categorias_delete_catalog_admins
on public.partida_categorias for delete to authenticated
using (public.can_manage_organization_catalog(organizacion_id));

create policy partida_subcategorias_select_org_members
on public.partida_subcategorias for select to authenticated
using (public.is_organization_member(organizacion_id));

create policy partida_subcategorias_insert_catalog_admins
on public.partida_subcategorias for insert to authenticated
with check (
  public.can_manage_organization_catalog(organizacion_id)
  and exists (
    select 1
    from public.partida_categorias c
    where c.id = categoria_id
      and c.organizacion_id = partida_subcategorias.organizacion_id
  )
);

create policy partida_subcategorias_update_catalog_admins
on public.partida_subcategorias for update to authenticated
using (public.can_manage_organization_catalog(organizacion_id))
with check (
  public.can_manage_organization_catalog(organizacion_id)
  and exists (
    select 1
    from public.partida_categorias c
    where c.id = categoria_id
      and c.organizacion_id = partida_subcategorias.organizacion_id
  )
);

create policy partida_subcategorias_delete_catalog_admins
on public.partida_subcategorias for delete to authenticated
using (public.can_manage_organization_catalog(organizacion_id));

create policy unidades_medida_select_org_members
on public.unidades_medida for select to authenticated
using (public.is_organization_member(organizacion_id));

create policy unidades_medida_insert_catalog_admins
on public.unidades_medida for insert to authenticated
with check (public.can_manage_organization_catalog(organizacion_id));

create policy unidades_medida_update_catalog_admins
on public.unidades_medida for update to authenticated
using (public.can_manage_organization_catalog(organizacion_id))
with check (public.can_manage_organization_catalog(organizacion_id));

create policy unidades_medida_delete_catalog_admins
on public.unidades_medida for delete to authenticated
using (public.can_manage_organization_catalog(organizacion_id));

grant select, insert, update, delete on public.partida_categorias to authenticated;
grant select, insert, update, delete on public.partida_subcategorias to authenticated;
grant select, insert, update, delete on public.unidades_medida to authenticated;

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
    'proyecto',
    'proveedor',
    'recurso',
    'recurso_proveedor_precio',
    'partida',
    'partida_categoria',
    'partida_subcategoria',
    'unidad_medida',
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
    when 'proyecto' then
      return exists (
        select 1 from public.proyectos e
        where e.id = p_entity_id
          and e.organizacion_id = p_organizacion_id
          and (p_proyecto_id is null or e.id = p_proyecto_id)
      );
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
    when 'partida_categoria' then
      return exists (
        select 1 from public.partida_categorias e
        where e.id = p_entity_id and e.organizacion_id = p_organizacion_id
      );
    when 'partida_subcategoria' then
      return exists (
        select 1 from public.partida_subcategorias e
        where e.id = p_entity_id and e.organizacion_id = p_organizacion_id
      );
    when 'unidad_medida' then
      return exists (
        select 1 from public.unidades_medida e
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
