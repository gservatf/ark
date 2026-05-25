# Modelo de Datos

## Estado actual

El modelo de datos estÃ¡ documentado y preparado en SQL. La UI ya lo usa como backend real para proveedores, recursos, cotizaciones, partidas/APU y presupuestos; cronogramas sigue pendiente de persistencia real.

- La migraciÃ³n inicial vive en `supabase/migrations/20260514000000_initial_schema.sql`.
- La migraciÃ³n colaborativa vive en `supabase/migrations/20260515000000_collaborative_model.sql`.
- El seed inicial vive en `supabase/seed.sql` e incluye datos demo para el modelo colaborativo.
- Los tipos de dominio frontend viven en `types/domain.ts`.
- Los tipos Supabase generados desde la base local viven en `lib/supabase/types.ts`.
- Supabase CLI local y Docker estÃ¡n configurados para desarrollo local-first.
- Auth/RLS vive en `supabase/migrations/20260518000000_auth_rls_ownership.sql`.
- Las pruebas pgTAP de aislamiento viven en `supabase/tests/rls.sql`.
- Las migraciones y el seed fueron validados contra Supabase local con `pnpm run supabase:reset`.
- La estrategia acordada sigue siendo ejecutar primero migraciones y seed contra Supabase local; el proyecto remoto se usarÃ¡ reciÃ©n para staging, producciÃ³n o migraciÃ³n final.
- El modelo multi-proveedor vive en `supabase/migrations/20260519155643_multi_provider_client_prices.sql` e incluye `proveedores.disponible_para_cliente`, `recurso_proveedor_precios`, campos vivos de precio cliente en borradores y snapshots de cotizaciones en versiones oficiales.
- La integridad transaccional de presupuestos vive en `supabase/migrations/20260520150000_budget_integrity_transactions.sql`: agrega RPCs para emitir versiones oficiales y agregar partidas, endurece trazabilidad de borradores, bloquea cambios de organizaciÃ³n en proyectos y valida auditorÃ­a/onboarding.
- El hardening de producciÃ³n web/Auth vive en `supabase/migrations/20260520164133_chunk3_auth_web_security_hardening.sql`: ajusta `set_updated_at`, reemplaza grants globales por grants explÃ­citos y limita payloads de auditorÃ­a.
- La creaciÃ³n de proyectos post-onboarding vive en `supabase/migrations/20260522165506_create_project_activity_center.sql`: agrega `create_project_with_current_member`, registra auditorÃ­a `proyecto` y habilita el centro de actividad persistente.
- El onboarding personal vive en `supabase/migrations/20260525090532_onboarding_profile_workspace.sql`: agrega `complete_user_onboarding(nombre_usuario, apellido_usuario)` para guardar el nombre visible del usuario y crear una organizaciÃ³n vacÃ­a sin proyecto inicial.

- Multi-organizacion 2026-05-25: `supabase/migrations/20260525100520_multi_organization_invitations.sql` agrega `tipo_organizacion`, `organizacion_invitaciones`, `create_organization_for_current_user`, `create_project_in_organization`, `list_workspace_organizations`, `list_budget_dashboard_projects(p_organizacion_id)` e invitaciones a organizacion con seleccion multiple de proyectos. `20260525163547_organization_member_permissions.sql` agrega RPCs para listar y actualizar permisos de miembros por organizacion/proyecto.

## Contratos de capa de datos

La capa `lib/data/` encapsula Supabase para que las pantallas no importen el cliente directamente. Sus repositorios base cubren proveedores y recursos con scope obligatorio de organizacion y mutaciones auditadas. `/proveedores` y `/recursos` ya consumen esta capa desde la UI.

Contratos compartidos:

- `DataScope`: requiere `organizacionId`; acepta `proyectoId` opcional para auditoria y exige `actorId` en mutaciones.
- `DataResult<T>` y `DataError`: devuelven errores normalizados de validacion, permisos, conflictos, no encontrado, Supabase o desconocidos.
- `DataLoadState<T>`: contrato de loading reutilizable para futuras pantallas persistentes.
- `AuditContract`: registra `activity_events` con entidad, accion, actor, scope, valores antes/despues, campos cambiados y metadata.

Reglas actuales:

- Proveedores se listan, obtienen, crean, actualizan y desactivan con `organizacion_id = scope.organizacionId`.
- Recursos se listan, obtienen, crean, actualizan y desactivan con `estado = 'inactivo'`.
- Cotizaciones por recurso/proveedor se gestionan en `lib/data/quotes.ts` con scope de organizaciÃ³n, validaciÃ³n Zod, preferido interno Ãºnico por recurso y auditorÃ­a.
- Partidas/APU se gestionan en `lib/data/items.ts`: lista, crea, edita y desactiva partidas, persiste recursos APU, recalcula parciales y registra auditoria.
- Presupuestos se gestionan en `lib/data/budgets.ts`: lista dashboard persistente, asegura/crea borrador activo por proyecto, edita datos generales, agrega partidas por RPC, edita metrados, elimina lÃ­neas, refresca precios vigentes, fija precios por lÃ­nea/recurso, resuelve o selecciona precios cliente, aplica override manual y emite versiones oficiales congeladas por RPC.
- Proyectos se gestionan en `lib/data/projects.ts`: lista proyectos accesibles del workspace y crea proyectos mediante la RPC transaccional `create_project_with_current_member`.
- El flujo nuevo de proyectos usa `create_project_in_organization(p_organizacion_id, nombre_proyecto, cliente, ubicacion)` para respetar la organizacion activa recordada por navegador.
- Organizaciones e invitaciones se gestionan en `lib/data/organizations.ts`; las invitaciones guardan token hasheado, estado, expiracion, proyectos seleccionados e inclusion automatica en proyectos futuros, y se aceptan solo con el correo verificado del usuario autenticado.
- `organizacion_miembros.acceso_todos_proyectos` y `rol_proyecto_predeterminado` permiten que un miembro acceda a todos los proyectos actuales/futuros sin convertirlo en admin de organizacion.
- `list_organization_member_permissions(p_organizacion_id)` devuelve miembros activos, perfil confiable, rol de organizacion y matriz de proyectos. `update_organization_member_permissions(...)` permite a owners/admins editar permisos, bloquea self-edit, no permite editar owners desde el panel y registra auditoria.
- Actividad reciente se consulta desde `lib/data/activity.ts`, leyendo `activity_events` bajo RLS para la campanita del topbar.
- Al cambiar costo unitario o transporte de un recurso se registra `recurso_precios_historial` y tambien `activity_events`.
- `createResourceCatalogPriceChange` describe el cambio de precio del catalogo, `canAutoUpdateDraftResourcePrice` cubre el contrato de recursos y `shouldAutoUpdateDraftResourcePrice` aplica la regla real en presupuestos: solo recursos del mismo catÃ¡logo, dentro de lÃ­neas no fijadas, con `autoactualizar_precio = true`, `precio_fijado = false` y `precio_origen = 'catalogo'`.
- Los mocks siguen disponibles mediante adaptadores explicitos para transicion temporal.

## Tablas mÃ­nimas

- `proveedores`
- `recursos`
- `recurso_proveedor_precios`
- `recurso_precios_historial`
- `partidas`
- `partida_recursos`
- `presupuestos` legacy temporal
- `presupuesto_partidas`
- `presupuesto_partida_recursos`
- `organizaciones`
- `organizacion_miembros`
- `user_profiles`
- `proyectos`
- `proyecto_miembros`
- `activity_events`
- `presupuesto_borradores`
- `presupuesto_borrador_partidas`
- `presupuesto_borrador_partida_recursos`
- `presupuesto_versiones`
- `presupuesto_version_partidas`
- `presupuesto_version_partida_recursos`
- `cronogramas` futuro
- `cronograma_tareas` futuro
- `cronograma_dependencias` futuro

## Modelo colaborativo

El modelo colaborativo ya tiene RLS productivo activado sobre todas las tablas pÃºblicas. `anon` no tiene acceso por policies; `authenticated` solo puede consultar o escribir dentro de organizaciones/proyectos donde tenga membresÃ­a activa. Las funciones `security definer` `is_organization_member`, `is_organization_admin`, `is_project_member`, `is_project_admin`, `can_read_project`, `can_edit_project`, `can_emit_project` y `project_belongs_to_organization` centralizan las reglas para evitar acceso cruzado y recursiÃ³n de policies.

El onboarding nuevo usa la RPC `complete_user_onboarding(nombre_usuario, apellido_usuario)` para guardar `user_profiles.display_name` y crear automÃ¡ticamente una organizaciÃ³n vacÃ­a con el usuario como `owner`. No crea proyecto inicial; el dashboard vacÃ­o muestra una llamada a crear el primer proyecto.

`user_profiles.display_name` no es Ãºnico ni se usa para permisos. Pueden existir usuarios con el mismo nombre y apellido; la identidad confiable para auditorÃ­a, ownership y colaboraciÃ³n sigue siendo `auth.users.id`/`actor_id`. Cuando la UI necesite desambiguar personas, debe mostrar un dato adicional permitido, como correo verificado o contexto de membresÃ­a.

La RPC legacy `create_organization_with_owner(nombre_org, ruc_org, nombre_proyecto, cliente, ubicacion)` queda disponible para compatibilidad, pero ya no es el flujo principal de onboarding.

La RPC de onboarding rechaza usuarios que ya tienen una membresÃ­a activa y valida que el RUC, cuando existe, cumpla `^[0-9]{11}$` antes de insertar.

La RPC `create_project_with_current_member(nombre_proyecto, cliente, ubicacion)` permite que un `owner` o `admin` de organizaciÃ³n cree proyectos adicionales dentro de su organizaciÃ³n activa. La funciÃ³n crea el proyecto, asigna al creador como `admin` de proyecto y registra `activity_events.entity_type = 'proyecto'`.

Antes de conectar CRUDs reales o colaboraciÃ³n realtime se agregÃ³ un modelo de ownership y auditorÃ­a en una migraciÃ³n versionada. La direcciÃ³n aprobada es:

- `organizaciones`: agrupa usuarios, proyectos y permisos; `tipo_organizacion` distingue espacios `personal` y organizaciones `empresa`.
- `organizacion_miembros`: usuarios dentro de una organizaciÃ³n con rol base `owner | admin | miembro` y estado `activo | invitado | suspendido`.
- `user_profiles`: perfil confiable derivado de `auth.users` para mostrar identidad en colaboraciÃ³n; se sincroniza por trigger privado y no se edita desde cliente.
- `proyectos`: unidad principal de colaboraciÃ³n y reporting.
- `proyecto_miembros`: miembros y roles especÃ­ficos por proyecto `admin | presupuestador | editor | lector`.
- `activity_events`: auditorÃ­a permanente de cambios.
- `presupuesto_borradores`: espacio colaborativo vivo por proyecto.
- `presupuesto_versiones`: versiones oficiales congeladas.
- `presupuesto_borrador_partidas` y `presupuesto_borrador_partida_recursos`: lÃ­neas vivas con control de precio autoactualizable o fijado.
- `presupuesto_version_partidas` y `presupuesto_version_partida_recursos`: snapshots oficiales congelados.

`activity_events` debe registrar como mÃ­nimo:

- `id`
- `organizacion_id`
- `proyecto_id`
- `presupuesto_borrador_id`
- `presupuesto_version_id`
- `actor_id`
- `entity_type`
- `entity_id`
- `action`
- `before` como `jsonb`
- `after` como `jsonb`
- `changed_fields` como `jsonb`
- `created_at`

Los campos JSON de auditorÃ­a (`before`, `after`, `changed_fields`, `metadata`) tienen lÃ­mite de 50000 caracteres serializados por campo.

El historial especializado `recurso_precios_historial` se mantiene para anÃ¡lisis de precios, pero no reemplaza la auditorÃ­a general.

Reglas RLS actuales:

- `owner` y `admin` de organizaciÃ³n administran la organizaciÃ³n y todos sus proyectos.
- `admin` de proyecto administra miembros del proyecto, edita borradores y puede emitir versiones oficiales.
- `presupuestador` edita borradores y puede emitir versiones oficiales.
- `editor` edita borradores, pero no emite versiones oficiales.
- `lector` solo puede leer datos del proyecto.
- Las versiones oficiales permiten lectura e inserciÃ³n autorizada, pero no `update` ni `delete` desde clientes autenticados.
- `activity_events` exige `actor_id = auth.uid()`, permisos sobre la organizaciÃ³n/proyecto informado, `entity_type` dentro de la whitelist inicial y existencia/scope vÃ¡lido de `entity_id`.
- `user_profiles` permite leer el perfil propio y perfiles de miembros activos con organizaciÃ³n compartida; no permite escrituras directas desde clientes.

## Borradores, precios fijados y versiones

El borrador colaborativo representa el trabajo activo. Puede recalcular con precios vigentes cuando cambian recursos, proveedores o partidas.

Reglas persistidas:

- Un proyecto puede tener un solo borrador activo.
- Si el usuario abre un proyecto sin borrador y tiene permiso de ediciÃ³n, la capa de datos crea un borrador activo con nombre `NombreProyecto_Presupuesto`, cliente/ubicaciÃ³n del proyecto y porcentajes por defecto.
- Los borradores guardan `created_by`/`updated_by` con default `auth.uid()` y las policies de insert/update exigen que coincidan con el usuario autenticado.
- `precio_fijado = true` obliga `autoactualizar_precio = false`.
- `precio_origen` usa `catalogo | manual | snapshot`.
- Los totales del borrador son valores persistidos que deben recalcularse desde la capa de datos y funciones puras, no desde componentes visuales.
- El refresco de precios vigentes se ejecuta al cambiar recursos/cotizaciones del catÃ¡logo y tambiÃ©n desde un botÃ³n manual en `/presupuestos`.
- La selecciÃ³n de precio cliente puede ser automÃ¡tica, una cotizaciÃ³n especÃ­fica o un override manual; al emitir versiÃ³n oficial se congela la selecciÃ³n vigente sin recalcularla.

Para controlar cambios automÃ¡ticos, las lÃ­neas o recursos del borrador soportan:

- `precio_fijado`: indica que la lÃ­nea no debe autoactualizarse con cambios del catÃ¡logo.
- `motivo_precio_fijado`: nota opcional para explicar el bloqueo.
- `precio_origen`: catÃ¡logo, manual o snapshot.
- `updated_at` como base para detectar conflictos optimistas en la capa de datos.

Las versiones oficiales son snapshots formales. Conservan los valores exactos emitidos, no se recalculan con precios actuales y podrÃ¡n compararse/restaurarse creando un nuevo borrador o una nueva versiÃ³n.

El nombre oficial se construye como `NombreProyecto_Presupuesto_V{n}`. Si el borrador ya termina en `_Presupuesto`, no se duplica el sufijo.

La emisiÃ³n oficial usa `emit_official_budget_version(p_draft_id, p_expected_updated_at)`: bloquea el borrador con `FOR UPDATE`, valida permisos de emisiÃ³n, estado activo, `updated_at` esperado y lÃ­neas existentes; calcula `numero_version` dentro de la transacciÃ³n, inserta cabecera/lÃ­neas/recursos con `INSERT ... SELECT`, audita y devuelve `{ version, lines, resources }`.

Agregar partidas al borrador usa `add_draft_partida(p_draft_id, p_partida_id)`: bloquea el borrador, valida permiso de ediciÃ³n, calcula `orden`, toma snapshots APU y precios cliente con proveedores/cotizaciones vigentes, recalcula totales y audita en una sola transacciÃ³n.

Las tablas de versiones oficiales incluyen campos preparados para congelar precio interno y precio cliente:

- `precio_cliente_snapshot`
- `cotizacion_interna_id_snapshot`
- `cotizacion_cliente_id_snapshot`
- `precio_cliente_origen_snapshot`
- `precio_cliente_advertencia_snapshot`

Las migraciones usan IDs `uuid` con `gen_random_uuid()`, enums PostgreSQL, timestamps `created_at`/`updated_at`, checks para montos y porcentajes no negativos, foreign keys e Ã­ndices bÃ¡sicos. La migraciÃ³n colaborativa agrega `organizacion_id` nullable en tablas legacy para preparar ownership sin romper seed ni UI mock.

## Flujo de migraciones local-first

- `supabase/migrations/` es la fuente de verdad del esquema.
- `supabase/seed.sql` es la fuente de datos demo local.
- `supabase/config.toml` define el stack local y carga `supabase/seed.sql` durante `supabase db reset`.
- Las migraciones deben probarse primero en Supabase local con `pnpm run supabase:reset` o `pnpm run supabase:migrate`.
- Los tipos de `lib/supabase/types.ts` deben generarse desde la base local con `pnpm run supabase:types` cuando el esquema cambie.
- No se deben crear tablas manualmente en un proyecto remoto como fuente primaria del modelo.

## Proveedores

Campos:

- `id`
- `nombre`
- `ruc`
- `disponible_para_cliente`: checkbox para indicar que el proveedor puede usarse como referencia en presupuestos para cliente.
- `contacto`
- `telefono`
- `email`
- `direccion`
- `notas`
- `estado`: `activo | inactivo`
- `created_at`
- `updated_at`

## Recursos

Campos:

- `id`
- `nombre`
- `tipo`: `material | mano_obra | equipo | herramienta`
- `unidad`
- `costo_unitario_actual`
- `proveedor_id`
- `transporte_aplica`
- `costo_transporte`
- `especificacion`
- `marca`
- `fuente_precio`
- `fecha_actualizacion_precio`
- `estado`: `activo | inactivo`
- `created_at`
- `updated_at`

En el modelo persistente real, `recursos` debe representar el catÃ¡logo canÃ³nico. No se deben duplicar recursos solo porque varios proveedores ofrecen el mismo material. La relaciÃ³n de precios por proveedor debe salir de una tabla de cotizaciones.

En el CRUD persistente actual, `proveedor_id` representa el proveedor actual o preferente del recurso como compatibilidad temporal. El recurso sigue siendo canÃ³nico y las cotizaciones viven fuera de `recursos`, en `recurso_proveedor_precios`.

## Cotizaciones por proveedor

La tabla `recurso_proveedor_precios` permite que un mismo recurso tenga mÃºltiples precios por proveedor.

Campos conceptuales:

- `id`
- `recurso_id`
- `proveedor_id`
- `costo_unitario`
- `costo_transporte`
- `moneda`
- `fecha_cotizacion`
- `vigente_desde`
- `vigente_hasta`
- `fuente_precio`
- `url_referencia`
- `es_preferido_interno`
- `estado`
- `created_at`
- `updated_at`

En el CRUD persistente, `codigo` es unico por organizacion. Las partidas se desactivan con `estado = inactivo`; no se eliminan fisicamente desde la UI.

Reglas:

- El precio interno del borrador puede usar una cotizaciÃ³n seleccionada por el equipo.
- El precio cliente se calcula desde cotizaciones de proveedores con `disponible_para_cliente = true`.
- Si hay varias cotizaciones visibles para cliente, se propone automÃ¡ticamente la mÃ¡s cara.
- El usuario puede cambiar manualmente el precio cliente antes de emitir una versiÃ³n oficial; el override guarda precio total unitario, origen `override_manual` y motivo opcional.
- Si no hay cotizaciÃ³n de proveedor visible para cliente, se usa el precio mÃ¡s alto de la base general y se registra advertencia.
- El precio cliente automÃ¡tico compara `costo_unitario + costo_transporte`.
- La versiÃ³n oficial congela `cotizacion_interna_id_snapshot`, `cotizacion_cliente_id_snapshot`, `precio_cliente_snapshot`, `precio_cliente_origen_snapshot` y `precio_cliente_advertencia_snapshot`.

## Historial de precios

Cada cambio de costo de recurso debe crear un registro en `recurso_precios_historial` cuando exista persistencia real.

Campos:

- `id`
- `recurso_id`
- `costo_unitario_anterior`
- `costo_unitario_nuevo`
- `costo_transporte_anterior`
- `costo_transporte_nuevo`
- `fuente_precio`
- `fecha`
- `usuario_id`
- `notas`

## Partidas/APU

`partidas` contiene la cabecera tÃ©cnica:

- `id`
- `codigo`
- `nombre`
- `unidad`
- `categoria`
- `descripcion`
- `especificaciones`
- `rendimiento`
- `cuadrilla`
- `estado`
- `created_at`
- `updated_at`

`partida_recursos` contiene los recursos asociados:

- `id`
- `partida_id`
- `recurso_id`
- `grupo`: `materiales | mano_obra | equipos_herramientas`
- `cantidad`
- `unidad`
- `costo_unitario_snapshot`
- `costo_transporte_snapshot`
- `rendimiento_factor`
- `desperdicio_porcentaje`
- `parcial`
- `orden`

Cada fila APU guarda snapshot de unidad y costos del recurso en el momento de agregarlo o editarlo. El campo `parcial` se recalcula desde `lib/calculations/apu.ts` antes de persistir para que el builder, presupuestos y futuros recalculos colaborativos usen la misma formula.

Las partidas no guardan gastos generales ni utilidad propios. Esos porcentajes pertenecen al presupuesto completo y se aplican sobre el subtotal de todas las partidas. En el detalle APU pueden mostrarse controles editables de simulacion, pero no son fuente persistente del precio oficial de una partida.

## Presupuestos

`presupuestos` contiene cabecera y totales:

- `id`
- `proyecto_nombre`
- `cliente`
- `ubicacion`
- `version`
- `estado`: `borrador | aprobado | archivado`
- `moneda`: `PEN`
- `gastos_generales_porcentaje`
- `utilidad_porcentaje`
- `igv_porcentaje`
- `subtotal`
- `gastos_generales_total`
- `utilidad_total`
- `subtotal_con_margen`
- `igv_total`
- `total`
- `created_at`
- `updated_at`

`presupuesto_partidas` congela partidas usadas:

- `id`
- `presupuesto_id`
- `partida_id`
- `codigo_snapshot`
- `nombre_snapshot`
- `unidad_snapshot`
- `categoria_snapshot`
- `descripcion_snapshot`
- `especificaciones_snapshot`
- `rendimiento_snapshot`
- `cuadrilla_snapshot`
- `metrado`
- `precio_unitario_snapshot`
- `parcial`
- `orden`

`presupuesto_partida_recursos` congela el APU completo usado en el presupuesto. Se incluye desde el MVP para preservar trazabilidad.

Las versiones oficiales deberÃ¡n congelar tanto el precio interno como el precio cliente. El snapshot cliente debe permitir reproducir la exportaciÃ³n para cliente aunque cambien proveedores o cotizaciones despuÃ©s.

Campos snapshot principales:

- `presupuesto_id`
- `presupuesto_partida_id`
- `partida_recurso_id`
- `recurso_id`
- `nombre_snapshot`
- `tipo_snapshot`
- `unidad_snapshot`
- `costo_unitario_snapshot`
- `costo_transporte_snapshot`
- `proveedor_id_snapshot`
- `proveedor_nombre_snapshot`
- `fuente_precio_snapshot`
- `fecha_precio_snapshot`
- `cotizacion_interna_id_snapshot`
- `precio_cliente_snapshot`
- `cotizacion_cliente_id_snapshot`
- `precio_cliente_origen_snapshot`: proveedor visible, fallback general u override manual.
- `precio_cliente_advertencia_snapshot`: nota cuando faltÃ³ referencia de proveedor visible para cliente.
- `grupo`
- `cantidad`
- `unidad`
- `rendimiento_factor`
- `desperdicio_porcentaje`
- `parcial_snapshot`
- `orden`

## Cronogramas

El primer mÃ³dulo de cronogramas serÃ¡ mock/frontend antes de Supabase. El modelo persistente se diseÃ±arÃ¡ cuando se migren presupuestos y cronogramas a backend real.

RelaciÃ³n conceptual:

- Un cronograma pertenece a un proyecto y normalmente nace desde un presupuesto o borrador.
- Cada partida presupuestada puede convertirse en una tarea de cronograma.
- La tarea conserva referencia a la partida/lÃ­nea origen cuando exista, pero puede tener campos propios de planificaciÃ³n.
- Las dependencias MVP son fin-a-inicio entre tareas.

Campos conceptuales de `cronogramas`:

- `id`
- `organizacion_id`
- `proyecto_id`
- `presupuesto_borrador_id` o `presupuesto_version_id`
- `nombre`
- `fecha_inicio`
- `estado`: `borrador | aprobado | archivado`
- `created_at`
- `updated_at`

Campos conceptuales de `cronograma_tareas`:

- `id`
- `cronograma_id`
- `presupuesto_partida_id` o referencia equivalente a lÃ­nea de borrador.
- `partida_id`
- `codigo_snapshot`
- `nombre_snapshot`
- `metrado_snapshot`
- `rendimiento_snapshot`
- `duracion_dias`
- `duracion_origen`: `sugerida | manual`
- `fecha_inicio`
- `fecha_fin`
- `holgura_dias`
- `es_ruta_critica`
- `orden`

Campos conceptuales de `cronograma_dependencias`:

- `id`
- `cronograma_id`
- `tarea_predecesora_id`
- `tarea_sucesora_id`
- `tipo`: `fin_inicio` en MVP.

Si una partida no tiene rendimiento usable, la tarea debe permitir `duracion_origen = manual` y exigir `duracion_dias`. La ausencia de rendimiento no debe bloquear la creaciÃ³n de partidas/APU, pero sÃ­ debe impedir calcular un cronograma completo hasta que la duraciÃ³n manual exista.

## Ãndices recomendados

- Recursos: `nombre`, `tipo`, `proveedor_id`, `estado`.
- Cotizaciones por proveedor: `recurso_id`, `proveedor_id`, `estado`, `fecha_cotizacion`, `vigente_hasta`.
- Proveedores: `nombre`, `ruc`.
- Partidas: `codigo`, `nombre`, `categoria`, `estado`.
- Presupuestos: `proyecto_nombre`, `cliente`, `estado`, `created_at`.
- Cronogramas: `proyecto_id`, `presupuesto_borrador_id`, `presupuesto_version_id`, `fecha_inicio`, `estado`.
- Tareas de cronograma: `cronograma_id`, `partida_id`, `orden`, `es_ruta_critica`.
- Historial: `recurso_id`, `fecha`.

## Seed data PerÃº

Recursos iniciales:

- Cemento Portland Tipo I.
- Arena gruesa.
- Piedra chancada.
- Agua.
- Aditivo impermeabilizante.
- Maestro de obra.
- Operario.
- Oficial.
- PeÃ³n.
- Mezcladora 9 - 11 p3.
- Herramientas manuales.

Partidas iniciales:

- Tarrajeo en muros interiores.
- Piso porcelanato 60x60.
- Pintura lÃ¡tex en muros y cielos.
- Muro drywall e=12.5mm.
- Puerta de madera contraplacada.
- Concreto f'c=210 kg/cm2.

Presupuesto demo:

- Proyecto: Edificio Multifamiliar Los Olivos.
- Cliente: Cliente Demo.
- UbicaciÃ³n: Lima, PerÃº.

## RPCs de performance de presupuestos

La migracion `20260521143659_chunk5_performance_query_reduction.sql` agrega RPCs publicas para repositorios:

- `refresh_draft_current_prices(p_draft_id uuid)`: refresca precios internos/cliente, parciales de recursos, parciales de lineas y totales del borrador activo dentro de Postgres.
- `refresh_draft_current_prices_for_resources(p_resource_ids uuid[])`: detecta borradores activos afectados por recursos/cotizaciones y refresca en lote.
- `recalculate_budget_draft_totals(p_draft_id uuid)`: recalcula lineas no fijadas y totales sin reconstruir el bundle completo en TypeScript.
- `list_budget_dashboard_projects()`: devuelve proyectos del dashboard con agregados y conteos bajo el scope del usuario autenticado.

Todas validan `auth.uid()`, permisos por organizacion/proyecto y usan `set search_path = ''`.
