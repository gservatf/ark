-- C y P - Auditoria/realtime para admins de proyecto sobre catalogos.
-- Corrige el caso en el que la mutacion de catalogo funcionaba, pero fallaba
-- el insert de activity_events y por tanto no disparaba broadcast realtime.

drop policy if exists activity_events_insert_authorized on public.activity_events;
create policy activity_events_insert_authorized
on public.activity_events for insert to authenticated
with check (
  actor_id = auth.uid()
  and public.is_valid_activity_entity(
    entity_type,
    entity_id,
    organizacion_id,
    proyecto_id,
    presupuesto_borrador_id,
    presupuesto_version_id
  )
  and (
    (
      proyecto_id is not null
      and public.can_edit_project(proyecto_id)
      and public.project_belongs_to_organization(proyecto_id, organizacion_id)
    )
    or (
      proyecto_id is null
      and (
        public.is_organization_admin(organizacion_id)
        or (
          entity_type in ('proveedor', 'recurso', 'recurso_proveedor_precio', 'partida', 'partida_recurso')
          and public.can_manage_organization_catalog(organizacion_id)
        )
      )
    )
  )
);
