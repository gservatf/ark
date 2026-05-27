-- C y P - Recursos enlazados al catalogo persistente de unidades.

alter table public.recursos
add column unidad_id uuid references public.unidades_medida(id) on delete set null;

create index recursos_unidad_id_idx on public.recursos (unidad_id);

update public.recursos r
set unidad_id = u.id
from public.unidades_medida u
where r.unidad_id is null
  and r.organizacion_id = u.organizacion_id
  and lower(btrim(r.unidad)) = lower(btrim(u.codigo))
  and u.estado = 'activo';
