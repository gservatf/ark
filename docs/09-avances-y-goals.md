# Avances, Pendientes y Goals

Última actualización: 2026-05-23.

Este documento es el tablero vivo del MVP persistente colaborativo. El roadmap general está en [Roadmap MVP](04-roadmap-mvp.md); aquí se registra qué ya está hecho, qué falta y cuáles son los próximos prompts `/goal` para avanzar por etapas. El backlog posterior al MVP vive en [Post-MVP, feature complete y goals](10-post-mvp-goals.md).

## Estado actual

El proyecto tiene una app Next.js 14 funcional con dashboard persistente en `/`, pantalla mock para cronogramas, reportes MVP persistentes en `/reportes`, CRUD persistente de proveedores, recursos y partidas/APU conectado a Supabase, cotizaciones multi-proveedor por recurso, proveedores visibles para cliente, creación de proyectos desde dashboard/topbar mediante RPC auditada, búsqueda global navegable, campanita de actividad persistente basada en `activity_events`, `/presupuestos` y `/presupuestos/[proyectoId]` conectados al borrador persistente multi-proyecto y versiones oficiales emitidas por RPC transaccional, historial persistente de precios de recursos, cálculos puros corregidos para costo directo APU/redondeo monetario, validaciones Zod base endurecidas, suite Vitest ampliada para contratos críticos de datos/exportaciones/conflictos, exportación interna a Excel/PDF, exportación cliente desde versiones oficiales, migraciones Supabase, seed data Perú extendido, cliente Supabase preparado, auth email/password endurecido, RLS por organización/proyecto, hardening preventivo de errores/exportaciones, cierre de bugs/reaperturas del Chunk 8, tooling Supabase local-first configurado y primer deploy productivo controlado en Vercel + Supabase remoto con Site URL/Redirect URLs, confirmación de email, SMTP Resend, Cloudflare Turnstile, reglas fuertes de contraseña, Realtime público desactivado y SSL enforcement configurados.

La UI actual usa Supabase para `/`, `/proveedores`, `/recursos`, `/partidas`, `/partidas/[id]`, `/presupuestos` y `/reportes`; cronogramas sigue con flujo mock/frontend hasta su goal persistente. `/recursos` consulta historial persistente y gestiona cotizaciones por proveedor. `/partidas` gestiona cabeceras y recursos APU persistentes con auditoría. `/presupuestos` crea o carga el borrador activo del proyecto, permite editar datos generales, agregar partidas, fijar precios por línea/recurso, revisar precios cliente, elegir cotización cliente, aplicar override manual, refrescar precios vigentes y emitir versiones oficiales congeladas. `/reportes` resume presupuestos, costos por grupo APU, recursos más costosos y totales por estado/proyecto, priorizando versiones oficiales. El topbar ya usa proyectos reales, permite cambiar/crear proyecto, buscar entidades principales y abrir actividad reciente desde la campanita. Realtime colaborativo usa Broadcast privado desde `activity_events`, Presence efímero con identidad desde `user_profiles` y resolución optimista de conflictos con `updated_at` en dashboard, presupuestos y CRUDs. Supabase local está operativo con CLI local del repo + Docker, migraciones/seed/RLS validados, pruebas pgTAP de seguridad y tipos generados desde la base local. Supabase remoto queda enlazado como deploy/staging inicial, no como fuente primaria de cambios de esquema.

Seguir todos los goals de este documento debe llevar a un MVP completo y colaborativo, no a un producto feature complete final. Las mejoras posteriores quedan separadas en `docs/10-post-mvp-goals.md`.

## Avance por etapas

| Etapa | Estado | Avance | Hecho | Pendiente | Verificación |
| --- | --- | ---: | --- | --- | --- |
| 1. Base del proyecto | En progreso avanzado | 85% | Git inicializado, Next.js 14 App Router, React 18, TypeScript, Tailwind, pnpm, lucide-react, alias `@/*`, scripts base y componentes UI compartidos mínimos | Revisión documental continua | `pnpm lint`, `pnpm build` han pasado |
| 2. Modelo y datos | En progreso avanzado | 98% | Tipos TS, migraciones Supabase, Auth/RLS, seed data Perú extendido con usuarios demo, tabla `recurso_proveedor_precios`, proveedores visibles para cliente, campos vivos/snapshot de precio cliente, motivos de precio fijado congelados, scripts Supabase, tipos generados desde Supabase local y capa `lib/data/` para proveedores, recursos, cotizaciones, partidas/APU, proyectos, actividad y presupuestos | Conectar cronogramas a persistencia | `pnpm lint`, `pnpm test` y `pnpm build` ejecutados |
| 3. Cálculos y validaciones | En progreso avanzado | 94% | Fórmulas documentadas, `lib/calculations/*` implementado, Vitest configurado, costo directo APU sin doble margen, redondeo monetario, cotizaciones con vigencia/proveedor activo, cronogramas con paralelos por solapamiento, esquemas Zod base conectados y cobertura ampliada para validaciones/exportaciones/repositorios/conflictos | Ampliar validaciones de presupuestos si el formulario crece y formalizar Zod de cronogramas persistentes cuando aplique | `pnpm lint`, `pnpm test` y `pnpm build` ejecutados |
| 4. UI base | En progreso avanzado | 91% | `AppLayout`, `Sidebar`, `Topbar`, `Button`, `StatCard`, `PageHeader`, `EmptyState`, `LoadingState`, `ConfirmDialog`, `DataTable`, dashboard, selector real de proyecto, búsqueda global, campanita de actividad, pantallas mock principales, affordances falsas limpiadas y revisión responsive amplia | Ajustes finos futuros según feedback real de uso | `pnpm lint`, `pnpm test`, `pnpm build` han pasado |
| 5. CRUDs base | En progreso persistente avanzado | 90% | `/proveedores`, `/recursos` y `/partidas` conectados a Supabase con validación Zod, auditoría, historial de precios, proveedores visibles para cliente, cotizaciones por recurso/proveedor y recursos APU persistentes | Pulir conflictos optimistas futuros | `pnpm lint`, `pnpm test` y `pnpm build` ejecutados |
| 6. Partidas/APU | Resuelta base persistente | 90% | `/partidas` y `/partidas/[id]` usan Supabase para crear, editar y desactivar partidas, persistir recursos APU, recalcular parciales y auditar cambios | Recalculo colaborativo y conflictos optimistas cuando llegue Realtime | `pnpm lint`, `pnpm test` y `pnpm build` ejecutados |
| 7. Presupuestos | Resuelta base persistente | 99% | `/presupuestos` usa borrador activo de Supabase, crea borrador si falta, edita datos generales/metrados, agrega/elimina partidas, fija precios por línea/recurso, refresca precios vigentes, revisa precios cliente, permite elegir cotización/override manual, agrega partidas y emite versiones oficiales mediante RPCs transaccionales; el workspace y repositorio quedaron refactorizados internamente sin romper imports públicos | Quedan mejoras futuras de UX fina según uso real | `pnpm run supabase:types`, pgTAP, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build` han pasado |
| 8. Cronogramas | En progreso avanzado mock | 75% | `/cronogramas` implementado con selector de presupuesto, tareas desde partidas, duración sugerida/manual, dependencias fin-a-inicio, Gantt simple, tareas paralelas, orden topológico, holgura y ruta crítica | Persistencia futura en borradores/versiones y validaciones Zod formales si el formulario crece | `pnpm test`, `pnpm lint`, `pnpm build` han pasado |
| 9. Reportes y exportaciones | Resuelta base MVP | 88% | `/reportes` implementado con resumen por presupuesto, costos por grupo APU, recursos más costosos, totales por estado/proyecto, prioridad de versión oficial y fallback a borrador; Excel/PDF interno final con borrador etiquetado, versión oficial congelada, resumen financiero, partidas, detalle APU, exportación cliente sin proveedores, advertencias rojas y tests de exportación | Selector de versiones oficiales históricas y exportación de cronogramas quedan post-MVP | `pnpm lint`, `pnpm test`, `pnpm build` y `@Navegador` |
| 10. Colaboración realtime | Resuelta avanzada | 90% | Broadcast privado desde `activity_events`, topics `org:*`/`project:*`, RLS en `realtime.messages`, renovación de token, toasts accesibles, dedupe, debounce, Presence con identidad desde `user_profiles`, avisos de edición y resolución optimista de conflictos con `updated_at` | Pruebas UI end-to-end futuras y extender a cronogramas persistentes | `pnpm lint`, `pnpm test`, `pnpm build` y pgTAP |
| 11. Pulido final | En progreso | 38% | Build inicial exitoso, verificaciones visuales previas y revisión responsive en laptop mediana/desktop para módulos mock principales | Pulido final posterior a persistencia, auth, colaboración y reportes | `pnpm lint`, `pnpm build` han pasado |

## Avances completados

- Repo Git inicializado.
- Documentación base creada en `docs/`.
- App Next.js 14 App Router + React 18 + TypeScript creada.
- Tailwind CSS configurado.
- `lucide-react`, `zod`, `vitest`, `xlsx` y `@supabase/supabase-js` instalados.
- Dashboard `/` conectado a Supabase con proyectos accesibles por RLS, versión oficial vigente o borrador activo y enlace a detalle.
- Creación de proyectos nuevos conectada a Supabase desde dashboard y topbar mediante `create_project_with_current_member`; al crear, navega a `/presupuestos/[proyectoId]`.
- Topbar conectado a proyectos reales con selector funcional, búsqueda global navegable y campanita de actividad persistente; se eliminó el botón de correo deshabilitado.
- Módulo `/reportes` conectado a Supabase con resumen por presupuesto/proyecto, costos por grupo APU, recursos más costosos, totales por estado y distinción visible entre versión oficial y borrador activo.
- Dashboard y flujo persistente inicial de `/presupuestos` implementados.
- Layout base creado con `AppLayout`, `Sidebar` y `Topbar`.
- QA UI/Auth/Layout 2026-05-21: Topbar agrega navegación móvil para mantener acceso global cuando el Sidebar de escritorio está oculto; se corrigieron textos visibles de sesión/cierre de sesión.
- QA UI/workflows 2026-05-21: se recorrieron con Navegador dashboard, presupuestos, cronogramas, recursos, proveedores, partidas y detalle APU; se corrigieron textos visibles/exportables sin tilde y no quedaron errores de consola en el smoke final.
- Componentes principales de presupuesto creados: KPI cards, tabla, resumen financiero, tabla mini de recursos, tabs y desglose APU.
- Datos mock separados en `lib/mock-data/`.
- Tipos de dominio creados en `types/domain.ts`.
- Funciones puras de cálculo APU y presupuesto creadas en `lib/calculations/`.
- Vitest configurado con pruebas unitarias para cálculos.
- Esquemas base de validación creados en `lib/validations/`.
- Módulo `/recursos` conectado a Supabase con búsqueda, filtros, formulario validado con Zod, desactivación con confirmación e historial persistente de precios.
- Módulo `/proveedores` conectado a Supabase con CRUD, búsqueda por nombre/RUC, filtro por visibilidad cliente, formulario reutilizable, desactivación con confirmación y estados vacíos.
- Módulo `/partidas` conectado a Supabase con listado, filtros, métricas, crear/editar/desactivar partidas, estados loading/error/vacío y auditoría.
- Detalle `/partidas/[id]` conectado a Supabase con builder APU persistente, snapshots de recursos, parciales calculados, costos por grupo, costo directo y simulación de precio unitario.
- Módulo `/presupuestos` evolucionado a flujo persistente multi-proyecto con creación/edición de borrador activo, partidas existentes, metrados editables, eliminación de líneas, precios fijados por línea/recurso, refresco de precios vigentes, selección de cotización cliente, override manual, emisión oficial y snapshots de recursos APU.
- Exportaciones mock de presupuesto agregadas en frontend: Excel con `xlsx` y PDF mediante vista imprimible usando partidas snapshot.
- Migración inicial Supabase creada con tablas mínimas, enums, foreign keys, checks, triggers `updated_at` e índices básicos.
- Seed data Perú creado con proveedores, recursos, historial, partidas/APU y presupuesto demo con snapshots.
- Cliente Supabase preparado en `lib/supabase/` con variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Migración colaborativa Supabase creada con organizaciones, miembros, proyectos, roles, `activity_events`, borradores colaborativos, versiones oficiales congeladas y controles de precio fijado/autoactualizable.
- Seed data Perú extendido con organización demo, proyecto demo, borrador activo, versión oficial congelada y evento de auditoría demo sin actor.
- Tipos de `lib/supabase/types.ts` generados desde Supabase local y `types/domain.ts` actualizado para cubrir el modelo colaborativo.
- Arquitectura colaborativa definida documentalmente: borrador colaborativo vivo, versiones oficiales congeladas, auditoría completa, Broadcast, Presence y conflictos optimistas.
- Estrategia Supabase local-first definida: desarrollo persistente con Supabase CLI + Docker; Supabase remoto solo para staging, producción o migración final.
- Tooling Supabase local-first configurado: CLI local `supabase`, `supabase/config.toml`, scripts pnpm para start/stop/status/reset/migrate/types, `.env.local` local y seed/migraciones validados con `supabase db reset`.
- Auth/RLS productivo base implementado: `@supabase/ssr`, rutas `/login`, `/registro`, `/recuperar-clave`, `/actualizar-clave`, `/auth/callback`, `/onboarding`, login email/password, opción OAuth Google, middleware de sesión, RPC de bootstrap de organización/proyecto, policies RLS sobre tablas públicas y usuarios demo locales.
- Pruebas pgTAP de RLS agregadas en `supabase/tests/rls.sql` para anon, owner, editor, lector, externo, versiones oficiales y auditoría con actor propio.
- Modelo multi-proveedor definido documentalmente: recursos canónicos, múltiples cotizaciones por proveedor, proveedores visibles para cliente y exportación cliente con precios cliente congelados.
- Limpieza de affordances falsas en módulos completados: links `#` eliminados, acciones pendientes deshabilitadas con tooltip y navegación conectada cuando existe ruta real.
- Documentación normalizada a UTF-8 correcto en `AGENTS.md` y `docs/*.md` después de la auditoría de encoding.
- Script `pnpm dev` configurado para exponer Next.js en la red local mediante `--hostname 0.0.0.0`.
- Sidebar reordenado con jerarquía de trabajo: Dashboard, Presupuestos, Cronogramas, Partidas/APU, Proveedores, Recursos, Reportes, Historial de precios y Configuración.
- Módulo mock `/cronogramas` implementado previo a Supabase: selector de presupuesto, tareas desde partidas, duración sugerida/manual, dependencias fin-a-inicio, Gantt simple, orden recomendado, tareas paralelas y ruta crítica.
- Cálculos puros de cronogramas implementados y testeados en `lib/calculations/schedule.ts`: duración sugerida, orden topológico, fechas, holgura, ruta crítica, grupos paralelos y errores por ciclos/dependencias inválidas.
- CRUD persistente de `/proveedores` conectado a Supabase mediante `lib/data/providers.ts`: listado por organización, creación, edición, desactivación lógica, estados de carga/error/vacío, permisos por rol owner/admin y eventos en `activity_events`.
- CRUD persistente de `/recursos` conectado a Supabase mediante `lib/data/resources.ts`: listado por organización, creación, edición, desactivación lógica, estados de carga/error/vacío, permisos por rol owner/admin, historial de precios en `recurso_precios_historial`, eventos en `activity_events` y contrato para autoactualización futura de borradores.
- Modelo multi-proveedor implementado con `proveedores.disponible_para_cliente`, tabla `recurso_proveedor_precios`, RLS/grants explícitos, seed demo, tipos Supabase regenerados, repositorio `lib/data/quotes.ts` y panel de cotizaciones en `/recursos`.
- `/presupuestos` migrado al borrador persistente de Supabase: agrega partidas, edita metrados, elimina líneas, recalcula totales, resuelve precios cliente, muestra advertencias de fallback, permite override manual y emite versiones oficiales congeladas.
- Exportaciones finales MVP agregadas: Excel/PDF de borrador con etiqueta `BORRADOR`, exportación formal desde versión oficial congelada, detalle APU por partida, exportación cliente con precios cliente congelados, sin proveedores, advertencias rojas/notas y pruebas de filas, nombres de archivo, sanitización Excel y escaping HTML.
- Formateo de fechas de UI robustecido para aceptar fechas simples y timestamps completos de Supabase en proveedores/recursos sin provocar errores de runtime.
- Realtime colaborativo base implementado: `activity_events` dispara Broadcast privado mediante trigger, RLS protege topics `org:*` y `project:*`, y la UI muestra toasts/refetch con debounce en dashboard, presupuestos, partidas/APU, recursos y proveedores.
- Colaboración avanzada implementada: Presence efímero en canales privados, avisos de usuarios viendo/editando, control optimista con `expectedUpdatedAt`, diálogo de resolución de conflictos y RLS de Presence en `realtime.messages`.
- Chunk 4 de Realtime/Presence cerrado: policy `project:*` corregida, clientes limitados a Presence, `actorId` validado contra `auth.uid()`, identidad visible desde `user_profiles`, renovación de token Realtime en `TOKEN_REFRESHED`, sin refetch por eventos propios y toasts con `aria-live`.
- Chunk 1 de bugs financieros y validaciones base cerrado: APU ya no multiplica por `rendimiento_factor`, presupuestos usan costo directo sin doble margen APU, montos se redondean a 2 decimales, cotizaciones respetan vigencia/proveedor activo, cronogramas agrupan paralelos por solapamiento, se bloquea emisión oficial vacía y se congelan motivos de precio fijado en versiones oficiales.
- Chunk 7 de refactor y hardening preventivo cerrado: `lib/data/budgets.ts` queda como fachada pública sobre módulos internos, `PresupuestosWorkspace` centraliza overlays/retries, errores Supabase se sanitizan en producción, HTML imprimible escapa caracteres adicionales y la RPC de onboarding se re-declara con `actor_id`.
- Chunk 8 de cierre de verificación cerrado: se agregó cobertura faltante para selección/override de precio cliente, se endurecieron grants de sequences y perfiles Presence no verificados, `BudgetTable` quedó memoizada, `recalculateDraftTotals` evita re-fetch completo en el camino normal, workspace cachea scope por cliente singleton y se eliminaron duplicaciones en Realtime/Topbar.
- Chunk 2 de integridad de presupuestos cerrado: `emit_official_budget_version` y `add_draft_partida` son RPCs transaccionales, `updateBudgetDraft` usa schema/allowlist, los borradores exigen trazabilidad `created_by`/`updated_by`, onboarding valida membresía activa/RUC, proyectos no cambian de organización y `activity_events` valida tipo/entidad/scope.
- Chunk 3 de seguridad auth/rutas/producción web cerrado: login sanitiza `next`, credenciales demo no se prellenan en producción, Auth usa `NEXT_PUBLIC_APP_URL`, contraseñas fuertes, headers de seguridad, middleware con allowlist/timeout, presupuestos por `/presupuestos/[proyectoId]`, Excel anti fórmula y migración con grants explícitos, `set_updated_at` endurecido y límite de payload de auditoría.
- Goal ampliar-tests cerrado: Vitest quedó en 19 archivos y 119 tests, con cobertura nueva para snapshots oficiales, locks de precio, metrados, eliminación de líneas, cotizaciones multi-proveedor, updates parciales sin defaults implícitos, conflictos optimistas, exportación cliente y precisión monetaria.
- QA presupuestos 2026-05-22: corregida la sincronización entre la selección de línea y el parámetro `?linea=` para que el desglose APU no alterne entre partidas al seleccionar filas.
- Deploy inicial 2026-05-22: GitHub quedó conectado a Vercel, proyecto Vercel `diego-polacks-projects/cyp-sistema-costos-presupuestos` publicado en `https://cyp-sistema-costos-presupuestos.vercel.app`, Supabase remoto `qrzyltggvixlsowxepxh` enlazado, 18 migraciones aplicadas, `supabase/seed.sql` cargado y variables públicas de producción configuradas en Vercel.
- Hardening remoto inicial 2026-05-23: Supabase Auth remoto quedó con Site URL/Redirect URLs de Vercel, confirmación de email, SMTP Resend para `polacklabs.com`, contraseña mínima de 12 caracteres, requisito de minúscula/mayúscula/número, reautenticación para cambio de clave, Cloudflare Turnstile activo, Realtime público desactivado y SSL enforcement externo.
- Recuperación de contraseña 2026-05-25: el email de reset ahora redirige por `/auth/callback?next=/actualizar-clave`, reutilizando la URL autorizada en Supabase para crear la sesión temporal antes de cambiar contraseña. El middleware permite `/actualizar-clave` con sesión activa para no mandar el reset al dashboard.

## Pendientes principales

- Mantener ajustes responsive finos según feedback real y futuros módulos persistentes.
- Ampliar validaciones de presupuestos si el formulario crece.
- Refinar recalculo colaborativo para partidas/APU y presupuestos según feedback real multiusuario.
- Mantener Auth/RLS como base obligatoria; antes de usuarios reales configurar Google OAuth si aplica, definir backups/monitoreo y ejecutar pruebas multiusuario.
- Extender pruebas UI end-to-end para Presence y conflictos optimistas.
- Migrar cronogramas mock a persistencia real cuando existan borradores/versiones colaborativas.
- Evaluar selector de versiones oficiales históricas y exportación de cronogramas cuando pasen a persistencia.
- Mantener Presence colaborativo y conflictos optimistas al migrar cronogramas/reportes.
- Mantener y ampliar tests solo cuando entren nuevos contratos funcionales, especialmente cronogramas persistentes y UI end-to-end de conflictos.

## Auditoría general de faltantes

| Tarea | Prioridad | Estado actual | Faltante concreto | Archivos o zonas relacionadas |
| --- | --- | --- | --- | --- |
| Alinear documentación y encoding | Resuelta | `AGENTS.md` y `docs/*.md` normalizados a español legible | Mantener docs sincronizados en futuros goals | `AGENTS.md`, `docs/*.md` |
| Limpiar affordances sin función | Resuelta en módulos completados | Links `#` eliminados y acciones pendientes deshabilitadas con tooltip en zonas auditadas | Mantener la regla en nuevos módulos | `Topbar`, `Sidebar`, tablas y cards |
| Crear componentes compartidos de UI | Resuelta | `PageHeader`, `DataTable` simple, `EmptyState`, `LoadingState` y `ConfirmDialog` creados y aplicados gradualmente | Mantenerlos como abstracciones mínimas y no convertir `DataTable` en motor avanzado | `components/shared/`, páginas de módulos |
| Revisión responsive y visual real | Resuelta para módulos mock principales | `/presupuestos`, `/recursos`, `/proveedores`, `/partidas` y `/partidas/[id]` revisadas en laptop mediana y desktop 1440px+ | Mantener pulido visual al agregar persistencia y reportes | `/presupuestos`, `/recursos`, `/proveedores`, `/partidas`, `/partidas/[id]` |
| Modelo colaborativo Supabase | Resuelta a nivel de esquema | Migración colaborativa, seed demo y tipos generados desde Supabase local | Conectar desde capa de datos cuando existan auth/RLS y repositorios | `supabase/migrations/`, `supabase/seed.sql`, `lib/supabase/types.ts`, `types/domain.ts` |
| Capa de datos Supabase | Resuelta base | `lib/data/` encapsula Supabase para proveedores, recursos, partidas/APU y presupuestos con scope, errores, loading, mocks temporales y auditoría | Extender repositorios a cronogramas, reportes y realtime cuando se conecten pantallas | `lib/data/`, `lib/supabase/`, `lib/mock-data/` |
| CRUD persistente de proveedores | Resuelta | `/proveedores` usa Supabase con scope de organización, validación Zod, loading/error/vacío, permisos owner/admin y auditoría | Mantener compatibilidad con el futuro modelo multi-proveedor/precios cliente | `/proveedores`, `lib/data/providers.ts`, `lib/validations/providers.ts` |
| CRUD persistente de recursos e historial | Resuelta | `/recursos` usa Supabase con scope de organización, validación Zod, loading/error/vacío, permisos owner/admin, historial de precios y auditoría | Mantener compatibilidad con cotizaciones y autoactualización futura de borradores | `/recursos`, `lib/data/resources.ts`, `recurso_precios_historial`, `activity_events` |
| Multi-proveedor y precios cliente | Resuelta base | Cotizaciones por proveedor, visibilidad cliente, precio cliente automático/fallback/override y snapshots oficiales implementados | Pulir UX según uso real y extender reportes/exportaciones finales | proveedores, recursos, presupuestos, exportaciones |
| CRUD persistente de partidas/APU | Resuelta base | Listado y builder APU usan Supabase con validaciones Zod, snapshots, parciales calculados y auditoría | Recalculo colaborativo y conflictos optimistas futuros | `/partidas`, `/partidas/[id]`, `lib/data/items.ts` |
| Presupuestos con borrador y versiones | Resuelta base | `/presupuestos` usa borrador persistente multi-proyecto, refresca precios vigentes, fija precios y emite versiones oficiales congeladas | Pulir conflictos optimistas y colaboración realtime | `/`, `/presupuestos`, tablas snapshot, versiones |
| Cronogramas mock | Resuelta para MVP mock | `/cronogramas` existe con estado frontend y cálculos puros testeados | Persistir cronogramas cuando presupuestos migren a borradores colaborativos y versiones oficiales | `/cronogramas`, `lib/calculations/schedule.ts` |
| Auth, RLS y ownership | Resuelta base productiva | Supabase Auth email/password, SMTP Resend, confirmación de email remota, CAPTCHA Turnstile, OAuth Google opcional, callback `/auth/callback`, onboarding mínimo, roles y policies RLS implementados y testeados | Configurar Google OAuth si aplica; administrar miembros desde UI en goal posterior | `supabase/migrations/`, `supabase/tests/rls.sql`, `app/login`, `app/auth/callback`, `app/onboarding`, `docs/08-produccion.md` |
| Realtime colaborativo | Resuelta avanzada | Broadcast privado desde auditoria persistida con toasts accesibles, invalidacion/refetch solo para eventos externos, Presence con identidad confiable y conflictos optimistas | Extender a cronogramas persistentes y agregar E2E | `lib/realtime/`, canales Supabase, UI de toasts/presencia |
| Reportes simples | Resuelta MVP | `/reportes` existe como módulo de lectura conectado a Supabase y prioriza la versión oficial más reciente con fallback a borrador activo | Mejoras futuras de plantillas/reportes avanzados si aplica | `/reportes`, `lib/data/reports.ts` |
| Exportaciones finales | Media | Excel/PDF interno y exportación cliente desde versión oficial existen con pruebas | Mejorar plantilla final y anexos APU si aplica | `lib/exports/budget.ts`, `docs/07-exportaciones.md` |
| Testing ampliado | Media | Hay tests de cálculos | Agregar tests de Zod, exports, snapshots y repositorios | `*.test.ts`, `lib/` |
| Tooling Supabase local-first | Resuelta | CLI local, Docker, `supabase/config.toml`, `.env.local`, scripts, reset/seed y generación de tipos configurados y validados | Mantener comandos y tipos sincronizados cuando cambie el esquema | `package.json`, `supabase/config.toml`, `.env.example`, `docs/01-arquitectura.md`, `docs/08-produccion.md` |

## Decisiones técnicas tomadas

- Se usa Next.js 14 App Router como framework principal.
- Se usa React 18 y TypeScript.
- Se usa pnpm como package manager.
- `pnpm dev` escucha en `0.0.0.0` para permitir pruebas desde otros equipos de la misma red local.
- Se usa Tailwind CSS para estilos.
- Se usan componentes propios con Tailwind para mantener control visual.
- shadcn/ui queda como opción futura, no como dependencia obligatoria inmediata.
- Se usa `lucide-react` para iconografía.
- Se usa Zod para validaciones reutilizables en `lib/validations/`.
- Se usa Vitest para pruebas unitarias de cálculos y lógica pura.
- Se usa `xlsx` para exportación Excel de presupuestos mock.
- El PDF mock se resuelve con una vista HTML imprimible y guardado desde el navegador.
- Los datos mock viven fuera de componentes visuales.
- Supabase queda preparado con migraciones, seed data, cliente y capa base `lib/data/`; la UI ya usa persistencia en proveedores, recursos, partidas/APU y presupuestos, mientras cronogramas sigue mock hasta su goal persistente.
- El desarrollo backend será local-first con Supabase CLI + Docker.
- El proyecto Supabase remoto se reserva para staging, producción o migración final.
- `supabase/migrations/` y `supabase/seed.sql` serán la fuente de verdad; no se crearán tablas manualmente en remoto como fuente primaria.
- Los presupuestos deben manejar snapshots para no mutar históricos.
- Los recursos serán canónicos y podrán tener múltiples cotizaciones por proveedor.
- Los proveedores aptos para cliente se marcarán con `disponible_para_cliente`.
- Al emitir versión oficial se congelarán precios internos y precios cliente.
- El precio cliente sugerido será el más caro entre proveedores visibles; si no hay visible, se usará el más caro general con advertencia.
- El sistema separará borrador colaborativo vivo de versiones oficiales congeladas.
- El dashboard de proyecto mostrará la versión oficial más reciente; si no existe, mostrará el borrador.
- Los cronogramas nacerán desde presupuestos: cada partida presupuestada puede convertirse en tarea.
- El MVP de cronogramas usará dependencias fin-a-inicio, duración en días, Gantt simple, ruta crítica, holgura y tareas paralelas.
- La duración será mixta: sugerida por metrado/rendimiento cuando sea posible y manual obligatoria cuando la partida no tenga rendimiento usable.
- `activity_events` será la auditoría permanente; `recurso_precios_historial` seguirá como historial especializado de precios.
- Realtime se usará como transporte de avisos y actualización, no como historial ni fuente de verdad.
- Broadcast será la vía preferida para cambios persistidos y Presence para usuarios viendo/editando.
- La edición colaborativa usará control optimista con aviso de conflicto.
- Los porcentajes financieros y de desperdicio se mantienen en rango `0..100`; el precio unitario `0` sigue permitido para partidas gratuitas, placeholders o promociones.
- `rendimiento_factor` se conserva como dato informativo/de planificación y no altera el parcial financiero APU.

## Backlog inmediato recomendado

1. Migrar cronogramas a borradores colaborativos y versiones oficiales congeladas.
2. Implementar Presence y conflictos colaborativos.
3. Mejorar exportaciones finales y anexos APU si aplica.
4. Ampliar tests de validaciones, exports, snapshots, auditoría, cronogramas y capa de datos.

## Prompts `/goal`

### `/goal auditoria-documentacion-encoding`

Corrige `AGENTS.md` y `docs/*.md` para reflejar el estado real del proyecto después de la auditoría general. Normaliza mojibake/encoding, rutas reales, stack real, comandos, dependencias instaladas y diferencia entre funcionalidad mock y persistente. No cambies código funcional. Actualiza especialmente `docs/01-arquitectura.md`, `docs/04-roadmap-mvp.md` y este documento. Ejecuta una revisión de enlaces internos y resume archivos modificados. Si no aplica `pnpm lint` o `pnpm build` por ser solo documentación, indícalo explícitamente.

Estado: completado el 2026-05-15.

Verificación: revisión de enlaces internos Markdown ejecutada sin enlaces rotos; búsqueda de mojibake residual en `AGENTS.md` y `docs/*.md` ejecutada sin coincidencias.

Nota: no se ejecutaron `pnpm lint` ni `pnpm build` porque este goal modificó solo documentación Markdown y no cambió código funcional.

### `/goal componentes-ui-compartidos`

Crea componentes compartidos mínimos para reducir duplicación: `PageHeader`, `EmptyState`, `LoadingState`, `ConfirmDialog` y, solo si encaja sin sobreingeniería, una `DataTable` simple para tablas actuales. Migra gradualmente las pantallas existentes sin cambiar comportamiento de negocio ni conectar backend. Mantener estética SaaS profesional y texto en español. Ejecuta `pnpm lint` y `pnpm build`, y actualiza `docs/09-avances-y-goals.md` y `docs/05-frontend-ui-ux.md`.

Estado: completado el 2026-05-15.

Verificación: `pnpm lint` y `pnpm build` ejecutados al cierre del goal.

### `/goal revision-responsive-ui`

Levanta la app y revisa visualmente `/presupuestos`, `/recursos`, `/proveedores`, `/partidas` y `/partidas/[id]` en laptop mediana y desktop 1440px+. Ajusta overflow de tablas, espaciados, jerarquía visual, estados vacíos, botones, formularios y accesibilidad básica. No agregues backend ni cambies datos mock. Usa navegador integrado o capturas si está disponible. Ejecuta `pnpm lint` y `pnpm build`, y actualiza `docs/09-avances-y-goals.md`.

Estado: completado el 2026-05-15.

Verificación: revisión con navegador integrado en `1366x768` y `1440x900` para `/presupuestos`, `/recursos`, `/proveedores`, `/partidas` y `/partidas/part-tarrajeo-muros`; pruebas de formularios y estados vacíos en recursos, proveedores, partidas, presupuestos y builder APU; `pnpm lint` y `pnpm build` ejecutados al cierre del goal.

### `/goal preparar-modelo-colaborativo-supabase`

Prepara la base documental y de esquema para colaboración antes de conectar CRUDs reales. Definir organizaciones, miembros, proyectos, miembros de proyecto, roles, auditoría `activity_events`, borradores colaborativos, versiones oficiales congeladas y campos para precio fijado/autoactualizable. No implementar Realtime todavía. Mantener la regla de que el borrador es vivo y las versiones oficiales no se recalculan. Ejecuta `pnpm lint`, `pnpm test`, `pnpm build` si cambia código o migraciones; si solo cambia documentación, omitirlos con nota explícita. Actualiza `AGENTS.md`, `docs/01-arquitectura.md`, `docs/02-modelo-datos.md`, `docs/04-roadmap-mvp.md`, `docs/08-produccion.md` y este documento.

Estado: completado el 2026-05-15.

Verificación: `pnpm lint`, `pnpm test` y `pnpm build` ejecutados al cierre del goal.

Nota: no se ejecutaron migraciones contra Supabase local/remoto porque Supabase CLI y Docker todavía no están disponibles en este entorno.

### `/goal cronogramas-mock-gantt-ruta-critica`

Implementa el módulo mock `/cronogramas` antes de pasar la UI a Supabase. Debe permitir seleccionar un presupuesto, generar tareas iniciales desde sus partidas presupuestadas, editar duración, fecha de inicio y dependencias fin-a-inicio, mostrar una vista Gantt simple, listar tareas en orden, identificar tareas que pueden ejecutarse en paralelo y resaltar la ruta crítica. Si una partida tiene metrado y rendimiento usable, sugerir duración calculada y permitir edición manual; si no tiene rendimiento o está vacío, exigir duración manual antes de calcular el cronograma. Implementar cálculos puros para orden topológico, fechas inicio/fin, holgura, ruta crítica y detección de ciclos/dependencias inválidas. Usar mock data o estado frontend, sin persistencia real todavía. Ejecuta `pnpm lint`, `pnpm build` y actualiza `docs/09-avances-y-goals.md`, `docs/03-calculos.md`, `docs/05-frontend-ui-ux.md` y `docs/06-validaciones-y-testing.md`.

Estado: completado el 2026-05-18.

Verificación: `pnpm test`, `pnpm lint` y `pnpm build` ejecutados al cierre del goal.

### `/goal tooling-supabase-local`

Agrega o documenta tooling para trabajar local-first con Supabase. Instalar/configurar Supabase CLI y validar Docker Desktop o runtime compatible. Definir comandos para `supabase start`, migraciones, reset local, seed, generación de tipos y configuración de `.env.local` apuntando a la URL/anon key locales. Si se agregan scripts en `package.json`, mantenerlos simples y documentados. No conectar todavía un proyecto Supabase remoto salvo que sea necesario para staging; el remoto queda para migración final, staging o producción. Ejecuta `pnpm lint`, `pnpm build` si cambia configuración/código y actualiza `AGENTS.md`, `docs/01-arquitectura.md`, `docs/02-modelo-datos.md`, `docs/08-produccion.md` y este documento.

Estado: completado el 2026-05-18.

Verificación: Docker validado, `pnpm exec supabase --version`, `pnpm run supabase:start`, `pnpm run supabase:reset`, `pnpm run supabase:status`, `pnpm run supabase:types`, `pnpm lint` y `pnpm build` ejecutados al cierre del goal.

Nota: Analytics quedó deshabilitado en `supabase/config.toml` porque en Windows la imagen de analytics requiere Docker expuesto por `tcp://localhost:2375`; el resto del stack local necesario para API, DB, Studio, Auth, Storage y Realtime arrancó correctamente.

### `/goal auth-rls-ownership`

Implementa autenticación básica y seguridad productiva para Supabase. Define `Organización -> Proyecto -> Miembros` como modelo mínimo de ownership, roles por proyecto y policies RLS para impedir acceso cruzado. Este goal debe completarse antes de habilitar colaboración Realtime real. No cambies la UX más de lo necesario. Ejecuta `pnpm lint`, `pnpm test`, `pnpm build` y actualiza `docs/08-produccion.md`, `docs/01-arquitectura.md`, `docs/02-modelo-datos.md` y `docs/09-avances-y-goals.md`.

Estado: completado el 2026-05-18.

Verificación: `pnpm run supabase:reset`, `pnpm run supabase:types`, `pnpm exec supabase test db supabase/tests/rls.sql`, `pnpm lint`, `pnpm test` y `pnpm build` ejecutados al cierre del goal.

Nota: Realtime real sigue pendiente hasta implementar capa de datos persistente, auditoría desde la aplicación y autorización por canal. En local el seed crea `owner@cyp.local`, `editor@cyp.local`, `lector@cyp.local` y `externo@cyp.local` con contraseña `Password123!`.

### `/goal capa-datos-supabase-base`

Crea una capa de datos en `lib/data/` o `lib/repositories/` para encapsular Supabase sin acoplar las páginas directamente al cliente. La capa debe ser consciente de organización/proyecto, ownership, errores, loading y contratos de auditoría. Incluir funciones base para proveedores y recursos: listar, obtener por ID, crear, actualizar y eliminar/desactivar según corresponda. Mantener mocks disponibles como fallback o fuente temporal donde sea necesario. No migres todas las pantallas todavía si el alcance crece demasiado. Ejecuta `pnpm lint`, `pnpm test`, `pnpm build` y actualiza `docs/09-avances-y-goals.md`, `docs/01-arquitectura.md` y `docs/02-modelo-datos.md` si cambia algún contrato.

Estado: completado el 2026-05-19.

Verificación: `pnpm lint`, `pnpm test` y `pnpm build` ejecutados al cierre del goal.

Nota: en ese goal no se agregaron migraciones SQL ni se migraron pantallas; desde el goal posterior `/proveedores` ya usa Supabase y `/recursos` sigue con mocks hasta su goal CRUD persistente.

### `/goal crud-proveedores-persistente`

Conecta `/proveedores` a la capa de datos Supabase. Implementa listar, crear, editar y eliminar/desactivar proveedores con estados de carga, error y vacío, respetando organización/proyecto cuando aplique y registrando eventos de auditoría. Mantener validación Zod, mensajes claros y comportamiento responsive. Evita romper los datos mock si todavía se usan en otros módulos. Ejecuta `pnpm lint`, `pnpm test`, `pnpm build` y actualiza `docs/09-avances-y-goals.md`.

Estado: completado el 2026-05-19.

Verificación: `pnpm run supabase:reset` aplicó migraciones y seed, pero terminó con error transitorio al reiniciar el contenedor local de Storage (`unhealthy` durante readiness); una inspección posterior con Docker confirmó `supabase_storage_Sistema_de_gestion` en `healthy`, `pnpm run supabase:status` confirmó que el stack local quedó corriendo y `pnpm run supabase:types` regeneró tipos correctamente. `pnpm test`, `pnpm lint` y `pnpm build` ejecutados al cierre del goal.

### `/goal crud-recursos-persistente-auditoria`

Conecta `/recursos` a Supabase mediante la capa de datos. Implementa listar, crear, editar, desactivar y consultar historial de precios persistente. Cuando cambie costo unitario o transporte, registrar `recurso_precios_historial` y evento en `activity_events`. Mantener recursos como catálogo canónico y preparar compatibilidad con cotizaciones por proveedor. Preparar el contrato para que borradores puedan autoactualizar precios salvo líneas con precio fijado. Conecta validaciones Zod con coerción numérica para formularios. Ejecuta `pnpm lint`, `pnpm test`, `pnpm build` y actualiza `docs/09-avances-y-goals.md`, `docs/02-modelo-datos.md` y `docs/06-validaciones-y-testing.md` si aplica.

Estado: completado el 2026-05-19.

Verificación: `/recursos` usa Supabase mediante `lib/data/resources.ts` para listar, crear, editar, desactivar y consultar historial persistente; las mutaciones auditadas registran `activity_events` y los cambios de costo/transporte registran `recurso_precios_historial`. Se conectó validación Zod con coerción numérica y quedó preparado el contrato de autoactualización futura para borradores no fijados. `pnpm lint`, `pnpm test` y `pnpm build` ejecutados al cierre del goal.

### `/goal multi-proveedor-precios-cliente`

Implementa el modelo de múltiples cotizaciones por recurso/proveedor y proveedores visibles para cliente. Agrega `disponible_para_cliente` en proveedores, una tabla o contrato equivalente para cotizaciones por recurso, selección automática del precio cliente más caro entre proveedores visibles, fallback al precio más caro general con advertencia, y override manual antes de emitir versión oficial. Preparar snapshots de precios internos y cliente para versiones oficiales. No mostrar proveedores en la exportación cliente. Ejecuta `pnpm lint`, `pnpm test`, `pnpm build` y actualiza `AGENTS.md`, `docs/00-producto.md`, `docs/02-modelo-datos.md`, `docs/06-validaciones-y-testing.md`, `docs/07-exportaciones.md` y este documento.

Estado: completado el 2026-05-19.

Verificación: `pnpm run supabase:reset`, `pnpm run supabase:types`, `pnpm exec supabase test db supabase/tests/rls.sql`, `pnpm lint`, `pnpm test`, `pnpm exec tsc --noEmit` y `pnpm build` ejecutados correctamente.

### `/goal crud-partidas-apu-persistente`

Conecta `/partidas` y `/partidas/[id]` a Supabase. Implementa crear/editar/desactivar partidas y persistir recursos APU asociados con auditoría. El builder debe recalcular parciales, costos por grupo, costo directo y precio unitario usando `lib/calculations/`, quedando listo para recalculo colaborativo posterior. Conecta validaciones Zod con coerción numérica. Ejecuta `pnpm lint`, `pnpm test`, `pnpm build` y actualiza `docs/09-avances-y-goals.md`, `docs/02-modelo-datos.md`, `docs/03-calculos.md` y `docs/06-validaciones-y-testing.md` si aplica.

Verificacion: `/partidas` y `/partidas/[id]` migrados a Supabase mediante `lib/data/items.ts`; crear, editar y desactivar partidas registran `activity_events`; los recursos APU se agregan, editan y eliminan como relaciones persistentes con snapshots y `parcial` recalculado desde `lib/calculations/apu.ts`. El builder usa Zod con coercion numerica y deja GG/utilidad como simulacion editable, manteniendo la regla de presupuesto total. `pnpm lint`, `pnpm test` y `pnpm build` ejecutados.

### `/goal presupuestos-borrador-versiones-oficiales`

Migra `/presupuestos` desde estado mock a persistencia real separando borrador colaborativo y versiones oficiales. Implementa crear/editar borrador, agregar partidas existentes, editar metrados, eliminar líneas, recalcular totales usando capa de datos, autoactualizar precios vigentes cuando corresponda y permitir precio fijado por línea/recurso. Implementa generación de versiones oficiales congeladas tipo `NombreProyecto_Presupuesto_V1`, preservando snapshot completo de partida, recursos APU, precio interno y precio cliente. Antes de emitir versión oficial, permitir revisar y cambiar selección de precio cliente. El dashboard debe mostrar la versión oficial más reciente o, si no existe, el borrador. Ejecuta `pnpm lint`, `pnpm test`, `pnpm build` y actualiza `docs/09-avances-y-goals.md`, `docs/02-modelo-datos.md`, `docs/03-calculos.md`, `docs/06-validaciones-y-testing.md` y `docs/07-exportaciones.md` si aplica.

Estado: completado el 2026-05-20.

Verificación: `/` migrado a dashboard persistente con versión oficial vigente o borrador activo; `/presupuestos` y `/presupuestos/[proyectoId]` crean/editan borrador activo, agregan/eliminan partidas, editan metrados, fijan precios por línea/recurso, refrescan precios vigentes, permiten selección de cotización cliente/override manual y emiten versiones oficiales `NombreProyecto_Presupuesto_V{n}` sin recalcular selecciones cliente explícitas. `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test` y `pnpm build` ejecutados correctamente.

### `/goal realtime-colaboracion-base`

Implementa colaboración realtime base después de persistencia, auditoría, auth/RLS y ownership. Usar Broadcast para cambios persistidos, toasts de actividad, invalidación/refetch y actualización casi inmediata de presupuestos, APU, totales y dashboard. Realtime no debe ser historial ni fuente de verdad; cada cambio debe estar guardado y auditado antes de emitirse. Ejecuta `pnpm lint`, `pnpm test`, `pnpm build` y actualiza `docs/01-arquitectura.md`, `docs/05-frontend-ui-ux.md`, `docs/06-validaciones-y-testing.md`, `docs/08-produccion.md` y este documento.

Estado: completado el 2026-05-20.

Verificacion: Broadcast privado implementado desde `activity_events` con trigger `private.broadcast_activity_event`, policies RLS para `realtime.messages`, helpers y hook en `lib/realtime/`, toasts compartidos e invalidacion/refetch en dashboard, presupuestos, partidas/APU, recursos y proveedores. `pnpm lint`, `pnpm test`, `pnpm build` y pgTAP ejecutados al cierre del goal.

### `/goal presencia-conflictos-colaborativos`

Implementa colaboración avanzada: Presence para usuarios viendo/editando, avisos tipo "María está editando esta partida", detección de cambios mientras un usuario edita y resolución optimista de conflictos. No usar bloqueos estrictos salvo casos puntuales justificados. Los conflictos deben comparar el valor local con el valor persistido más reciente y evitar sobrescrituras silenciosas. Ejecuta `pnpm lint`, `pnpm test`, `pnpm build` y actualiza `docs/01-arquitectura.md`, `docs/05-frontend-ui-ux.md`, `docs/06-validaciones-y-testing.md` y este documento.

Estado: completado el 2026-05-20.

Verificacion: Presence privado implementado en `lib/realtime/` con avisos compartidos de usuarios viendo/editando; RLS de `realtime.messages` ampliado para `presence`; mutaciones editables protegidas con `expectedUpdatedAt`; la UI muestra resolución para cargar remoto o aplicar versión local sin sobrescritura silenciosa. `pnpm lint`, `pnpm test` y `pnpm build` ejecutados al cierre del goal.

### `/goal validaciones-formularios-zod`

Unifica las validaciones de formularios con Zod. Recursos, presupuestos y builder APU no deben mantener validadores manuales duplicados si existe schema equivalente. Agrega coerción/preprocess para inputs numéricos que llegan como string, mensajes de error comprensibles y pruebas unitarias de validación. No cambies persistencia salvo que ya exista capa de datos. Ejecuta `pnpm lint`, `pnpm test`, `pnpm build` y actualiza `docs/06-validaciones-y-testing.md` y `docs/09-avances-y-goals.md`.

Estado: completado el 2026-05-22.

Verificacion: se centralizo `validateFormData` en `lib/validations/form.ts`, se agrego `coercedPercentage`, se conectaron recursos/cotizaciones, presupuestos y builder APU a schemas Zod sin cambiar persistencia, y se agrego cobertura en `lib/validations/form.test.ts`. `pnpm lint`, `pnpm test`, `pnpm exec tsc --noEmit` y `pnpm build` ejecutados al cierre del goal.

### `/goal reportes-simples`

Implementa módulo `/reportes` con reportes MVP simples: resumen por presupuesto, costos por grupo APU, recursos más costosos y totales por estado o proyecto si los datos disponibles lo permiten. Si todavía no hay persistencia, usar una fuente mock clara; si ya hay capa de datos, conectarlo a ella. Cuando existan versiones oficiales, los reportes formales deben priorizar la versión oficial más reciente y distinguir borradores. Agregar navegación real desde Sidebar y botones relacionados. Ejecuta `pnpm lint`, `pnpm build` y actualiza `docs/09-avances-y-goals.md` y `docs/05-frontend-ui-ux.md`.

Estado: completado el 2026-05-22.

Verificacion: se agrego `lib/data/reports.ts` con agregaciones testeadas, ruta `/reportes`, navegacion real desde Sidebar/Topbar y acceso relacionado desde dashboard. `pnpm test -- --run lib/data/reports.test.ts`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build` ejecutados al cierre del goal.

### `/goal exportaciones-finales`

Mejora exportaciones Excel/PDF para el alcance final del MVP. Incluir presupuesto resumido, partidas, resumen financiero y, si el snapshot está disponible, detalle APU por partida. Las exportaciones formales deben salir de versiones oficiales congeladas; un borrador puede exportarse solo con etiqueta clara de borrador. Implementa exportación para cliente con estructura equivalente, precios cliente congelados, sin nombres de proveedores, y marcas rojas/notas cuando un recurso no tenga precio de proveedor visible para cliente. Agrega pruebas para filas exportadas, nombre de archivo y sanitización/escaping HTML. Mantener solución simple y mantenible. Ejecuta `pnpm lint`, `pnpm test`, `pnpm build` y actualiza `docs/07-exportaciones.md` y `docs/09-avances-y-goals.md`.

Estado: completado el 2026-05-22.

Verificacion: se refactorizo `lib/exports/budget.ts` para soportar exportacion interna de borrador y version oficial, ambas con partidas, resumen financiero y detalle APU; la exportacion cliente mantiene precios cliente congelados, oculta proveedores y marca advertencias. La UI de `/presupuestos` distingue `PDF/Excel borrador`, `PDF/Excel oficial` y exportaciones cliente. `pnpm lint`, `pnpm test`, `pnpm build` y verificacion con `@Navegador` ejecutados al cierre del goal.

### `/goal ampliar-tests`

Amplía la suite de pruebas más allá de cálculos. Cubrir validaciones Zod, exportaciones, snapshots de presupuesto, versiones oficiales, auditoría, servicios de datos, cotizaciones multi-proveedor, precio cliente automático/fallback/override, precio autoactualizado/fijado, conflictos optimistas y casos de redondeo/precisión monetaria. Mantener tests rápidos y enfocados. Ejecuta `pnpm test`, `pnpm lint`, `pnpm build` y actualiza `docs/06-validaciones-y-testing.md` y `docs/09-avances-y-goals.md`.

Estado: completado el 2026-05-22.

Verificacion: se agregaron pruebas enfocadas para `lib/data/budgets.test.ts`, `lib/data/quotes.test.ts`, `lib/exports/budget.test.ts` y `lib/validations/form.test.ts`; se corrigieron `updateDraftLineMetrado` y el schema parcial de cotizaciones detectados por la nueva cobertura. `pnpm test`, `pnpm lint`, `pnpm build` y smoke con `@Navegador` ejecutados al cierre.

## Regla de cierre para cada goal

Cada goal con cambios funcionales debe terminar con:

```powershell
pnpm lint
pnpm build
```

Además debe incluir:

- Resumen breve de archivos modificados.
- Estado de verificación.
- Pendientes restantes actualizados en este documento.
- Documentación respectiva actualizada según lo que haya cambiado.
- Nota explícita si no se pudo ejecutar algún comando.

Si el goal solo cambia documentación Markdown, puede omitirse `pnpm lint` y `pnpm build` indicando explícitamente la razón.

## Regla general de actualización documental

Al terminar una o varias tareas, se debe actualizar la documentación relacionada antes de considerar el trabajo cerrado. Como mínimo:

- Cambios de estado, avances o pendientes: actualizar este documento.
- Cambios posteriores al cierre del MVP colaborativo: actualizar `docs/10-post-mvp-goals.md`.
- Cambios de roadmap o prioridades: actualizar `docs/04-roadmap-mvp.md`.
- Cambios de arquitectura, stack, comandos o estructura: actualizar `AGENTS.md` y `docs/01-arquitectura.md`.
- Cambios de modelo de datos: actualizar `docs/02-modelo-datos.md`.
- Cambios de cálculos: actualizar `docs/03-calculos.md`.
- Cambios de UI/UX: actualizar `docs/05-frontend-ui-ux.md`.
- Cambios de validaciones o testing: actualizar `docs/06-validaciones-y-testing.md`.
- Cambios de exportaciones: actualizar `docs/07-exportaciones.md`.
- Cambios de preparación productiva: actualizar `docs/08-produccion.md`.

### Chunk 5: Performance y reduccion de queries

Estado: completado el 2026-05-21.

Verificacion prevista al cierre: `pnpm run supabase:reset`, `pnpm run supabase:types`, `pnpm exec supabase test db supabase/tests/rls.sql`, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`.

Notas: se agregaron RPCs set-based para refresco de precios, recalculo de totales y dashboard; `createBrowserClient()` quedo como singleton; las rutas principales quedaron con wrapper Server Component y child cliente; `lib/data/workspace.ts` centraliza scope/roles; tablas, cronogramas y presupuestos reducen renders y recomputos con memoizacion enfocada.

### Chunk 6: Accesibilidad y consistencia UI

Estado: completado el 2026-05-21.

Verificacion prevista al cierre: `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm build` y smoke con navegador en rutas principales.

Notas: los modales compartidos tienen semantica/foco/teclado accesible; tablas agregan `scope="col"`; filtros de proveedores, recursos y partidas se reflejan en URL; presupuestos persiste la linea seleccionada; formularios principales usan `id/htmlFor` y bloquean campos durante guardado.
