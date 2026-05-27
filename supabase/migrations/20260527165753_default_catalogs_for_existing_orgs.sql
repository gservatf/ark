-- C y P - Catalogos base para organizaciones existentes.
-- Las migraciones previas crean tablas y backfill desde datos actuales; esta
-- agrega opciones iniciales para que produccion no quede con dropdowns vacios.

with default_categories(nombre) as (
  values
    ('Estructura'),
    ('Arquitectura'),
    ('Instalaciones sanitarias'),
    ('Instalaciones electricas'),
    ('Obras preliminares'),
    ('Acabados')
)
insert into public.partida_categorias (organizacion_id, nombre)
select o.id, c.nombre
from public.organizaciones o
cross join default_categories c
where not exists (
  select 1
  from public.partida_categorias existing
  where existing.organizacion_id = o.id
    and lower(btrim(existing.nombre)) = lower(btrim(c.nombre))
    and existing.estado = 'activo'
);

with default_subcategories(categoria_nombre, nombre) as (
  values
    ('Obras preliminares', 'Movimiento de tierras'),
    ('Estructura', 'Concreto simple'),
    ('Estructura', 'Concreto armado'),
    ('Arquitectura', 'Muros'),
    ('Arquitectura', 'Pisos'),
    ('Arquitectura', 'Revoques'),
    ('Acabados', 'Pintura'),
    ('Instalaciones sanitarias', 'Tuberias'),
    ('Instalaciones electricas', 'Cableado')
)
insert into public.partida_subcategorias (organizacion_id, categoria_id, nombre)
select o.id, c.id, s.nombre
from public.organizaciones o
join default_subcategories s on true
join public.partida_categorias c
  on c.organizacion_id = o.id
  and lower(btrim(c.nombre)) = lower(btrim(s.categoria_nombre))
  and c.estado = 'activo'
where not exists (
  select 1
  from public.partida_subcategorias existing
  where existing.organizacion_id = o.id
    and existing.categoria_id = c.id
    and lower(btrim(existing.nombre)) = lower(btrim(s.nombre))
    and existing.estado = 'activo'
);

with default_units(codigo, nombre, tipo) as (
  values
    ('m3', 'Metro cubico', 'volumen'),
    ('m2', 'Metro cuadrado', 'area'),
    ('ml', 'Metro lineal', 'longitud'),
    ('kg', 'Kilogramo', 'peso'),
    ('und', 'Unidad', 'unidad'),
    ('glb', 'Global', 'global'),
    ('HH', 'Hora hombre', 'tiempo'),
    ('HM', 'Hora maquina', 'tiempo'),
    ('dia', 'Dia', 'tiempo'),
    ('Bls', 'Bolsa', 'unidad'),
    ('%', 'Porcentaje', 'porcentaje')
)
insert into public.unidades_medida (organizacion_id, codigo, nombre, tipo)
select o.id, u.codigo, u.nombre, u.tipo
from public.organizaciones o
cross join default_units u
where not exists (
  select 1
  from public.unidades_medida existing
  where existing.organizacion_id = o.id
    and lower(btrim(existing.codigo)) = lower(btrim(u.codigo))
    and existing.estado = 'activo'
);

update public.partidas p
set categoria_id = c.id
from public.partida_categorias c
where p.categoria_id is null
  and p.organizacion_id = c.organizacion_id
  and p.categoria is not null
  and lower(btrim(p.categoria)) = lower(btrim(c.nombre))
  and c.estado = 'activo';

update public.partidas p
set subcategoria_id = s.id
from public.partida_subcategorias s
where p.subcategoria_id is null
  and p.organizacion_id = s.organizacion_id
  and p.categoria_id = s.categoria_id
  and p.subcategoria is not null
  and lower(btrim(p.subcategoria)) = lower(btrim(s.nombre))
  and s.estado = 'activo';

update public.partidas p
set unidad_id = u.id
from public.unidades_medida u
where p.unidad_id is null
  and p.organizacion_id = u.organizacion_id
  and lower(btrim(p.unidad)) = lower(btrim(u.codigo))
  and u.estado = 'activo';

update public.recursos r
set unidad_id = u.id
from public.unidades_medida u
where r.unidad_id is null
  and r.organizacion_id = u.organizacion_id
  and lower(btrim(r.unidad)) = lower(btrim(u.codigo))
  and u.estado = 'activo';
