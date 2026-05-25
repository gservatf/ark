-- C y P - Admin de proyecto puede gestionar catalogo operativo.
-- Mantiene separada la administracion de organizacion: invitar usuarios,
-- crear proyectos y cambiar permisos siguen reservados a owner/admin org.

create or replace function public.can_manage_organization_catalog(
  target_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.is_organization_admin(target_organization_id)
  or exists (
    select 1
    from public.organizacion_miembros om
    join public.proyecto_miembros pm on pm.organizacion_miembro_id = om.id
    join public.proyectos p on p.id = pm.proyecto_id
    where om.organizacion_id = target_organization_id
      and om.user_id = auth.uid()
      and om.estado = 'activo'
      and p.organizacion_id = target_organization_id
      and p.estado = 'activo'
      and pm.estado = 'activo'
      and pm.rol = 'admin'
  )
$$;

grant execute on function public.can_manage_organization_catalog(uuid) to authenticated;

drop policy if exists proveedores_insert_org_admins on public.proveedores;
create policy proveedores_insert_org_admins
on public.proveedores for insert to authenticated
with check (organizacion_id is not null and public.can_manage_organization_catalog(organizacion_id));

drop policy if exists proveedores_update_org_admins on public.proveedores;
create policy proveedores_update_org_admins
on public.proveedores for update to authenticated
using (organizacion_id is not null and public.can_manage_organization_catalog(organizacion_id))
with check (organizacion_id is not null and public.can_manage_organization_catalog(organizacion_id));

drop policy if exists proveedores_delete_org_admins on public.proveedores;
create policy proveedores_delete_org_admins
on public.proveedores for delete to authenticated
using (organizacion_id is not null and public.can_manage_organization_catalog(organizacion_id));

drop policy if exists recursos_insert_org_admins on public.recursos;
create policy recursos_insert_org_admins
on public.recursos for insert to authenticated
with check (organizacion_id is not null and public.can_manage_organization_catalog(organizacion_id));

drop policy if exists recursos_update_org_admins on public.recursos;
create policy recursos_update_org_admins
on public.recursos for update to authenticated
using (organizacion_id is not null and public.can_manage_organization_catalog(organizacion_id))
with check (organizacion_id is not null and public.can_manage_organization_catalog(organizacion_id));

drop policy if exists recursos_delete_org_admins on public.recursos;
create policy recursos_delete_org_admins
on public.recursos for delete to authenticated
using (organizacion_id is not null and public.can_manage_organization_catalog(organizacion_id));

drop policy if exists recurso_precios_historial_insert_org_admins on public.recurso_precios_historial;
create policy recurso_precios_historial_insert_org_admins
on public.recurso_precios_historial for insert to authenticated
with check (
  coalesce(usuario_id, auth.uid()) = auth.uid()
  and exists (
    select 1
    from public.recursos r
    where r.id = recurso_id
      and r.organizacion_id is not null
      and public.can_manage_organization_catalog(r.organizacion_id)
  )
);

drop policy if exists partidas_insert_org_admins on public.partidas;
create policy partidas_insert_org_admins
on public.partidas for insert to authenticated
with check (organizacion_id is not null and public.can_manage_organization_catalog(organizacion_id));

drop policy if exists partidas_update_org_admins on public.partidas;
create policy partidas_update_org_admins
on public.partidas for update to authenticated
using (organizacion_id is not null and public.can_manage_organization_catalog(organizacion_id))
with check (organizacion_id is not null and public.can_manage_organization_catalog(organizacion_id));

drop policy if exists partidas_delete_org_admins on public.partidas;
create policy partidas_delete_org_admins
on public.partidas for delete to authenticated
using (organizacion_id is not null and public.can_manage_organization_catalog(organizacion_id));

drop policy if exists partida_recursos_write_org_admins on public.partida_recursos;
create policy partida_recursos_write_org_admins
on public.partida_recursos for all to authenticated
using (
  exists (
    select 1
    from public.partidas p
    where p.id = partida_id
      and p.organizacion_id is not null
      and public.can_manage_organization_catalog(p.organizacion_id)
  )
)
with check (
  exists (
    select 1
    from public.partidas p
    where p.id = partida_id
      and p.organizacion_id is not null
      and public.can_manage_organization_catalog(p.organizacion_id)
  )
);

drop policy if exists recurso_proveedor_precios_insert_org_admins on public.recurso_proveedor_precios;
create policy recurso_proveedor_precios_insert_org_admins
on public.recurso_proveedor_precios for insert to authenticated
with check (
  organizacion_id is not null
  and public.can_manage_organization_catalog(organizacion_id)
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

drop policy if exists recurso_proveedor_precios_update_org_admins on public.recurso_proveedor_precios;
create policy recurso_proveedor_precios_update_org_admins
on public.recurso_proveedor_precios for update to authenticated
using (
  organizacion_id is not null
  and public.can_manage_organization_catalog(organizacion_id)
)
with check (
  organizacion_id is not null
  and public.can_manage_organization_catalog(organizacion_id)
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

drop policy if exists recurso_proveedor_precios_delete_org_admins on public.recurso_proveedor_precios;
create policy recurso_proveedor_precios_delete_org_admins
on public.recurso_proveedor_precios for delete to authenticated
using (
  organizacion_id is not null
  and public.can_manage_organization_catalog(organizacion_id)
);
