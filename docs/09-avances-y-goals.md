# Avances, Pendientes y Goals

Ultima actualizacion: 2026-05-27.

Este documento es el tablero vivo del MVP persistente colaborativo. El roadmap general estÃ¡ en [Roadmap MVP](04-roadmap-mvp.md); aquÃ­ se registra quÃ© ya estÃ¡ hecho, quÃ© falta y cuÃ¡les son los prÃ³ximos prompts `/goal` para avanzar por etapas. El backlog posterior al MVP vive en [Post-MVP, feature complete y goals](10-post-mvp-goals.md).

## Estado actual

El proyecto tiene una app Next.js 14 funcional con dashboard persistente en `/`, pantalla mock para cronogramas, reportes MVP persistentes en `/reportes`, CRUD persistente de proveedores, recursos y partidas/APU conectado a Supabase, catalogos persistentes de categorias/subcategorias/unidades para partidas, cotizaciones multi-proveedor por recurso, proveedores visibles para cliente, creaciÃ³n de proyectos desde dashboard/topbar mediante RPC auditada, bÃºsqueda global navegable, campanita de actividad persistente basada en `activity_events`, `/presupuestos` y `/presupuestos/[proyectoId]` conectados al borrador persistente multi-proyecto y versiones oficiales emitidas por RPC transaccional, historial persistente de precios de recursos, cÃ¡lculos puros corregidos para costo directo APU/redondeo monetario, validaciones Zod base endurecidas, suite Vitest ampliada para contratos crÃ­ticos de datos/exportaciones/conflictos, exportaciÃ³n interna a Excel/PDF, exportaciÃ³n cliente desde versiones oficiales, migraciones Supabase, seed data PerÃº extendido, cliente Supabase preparado, auth email/password endurecido, RLS por organizaciÃ³n/proyecto, hardening preventivo de errores/exportaciones, cierre de bugs/reaperturas del Chunk 8, tooling Supabase local-first configurado y primer deploy productivo controlado en Vercel + Supabase remoto con Site URL/Redirect URLs, confirmaciÃ³n de email, SMTP Resend, Cloudflare Turnstile, reglas fuertes de contraseÃ±a, Realtime pÃºblico desactivado y SSL enforcement configurados.

La UI actual usa Supabase para `/`, `/proveedores`, `/recursos`, `/partidas`, `/partidas/[id]`, `/presupuestos` y `/reportes`; cronogramas sigue con flujo mock/frontend hasta su goal persistente. `/recursos` consulta historial persistente y gestiona cotizaciones por proveedor. `/partidas` gestiona cabeceras y recursos APU persistentes con auditorÃ­a. `/presupuestos` crea o carga el borrador activo del proyecto, permite editar datos generales, agregar partidas, fijar precios por lÃ­nea/recurso, revisar precios cliente, elegir cotizaciÃ³n cliente, aplicar override manual, refrescar precios vigentes y emitir versiones oficiales congeladas. `/reportes` resume presupuestos, costos por grupo APU, recursos mÃ¡s costosos y totales por estado/proyecto, priorizando versiones oficiales. El topbar ya usa proyectos reales, permite cambiar/crear proyecto, buscar entidades principales y abrir actividad reciente desde la campanita. Realtime colaborativo usa Broadcast privado desde `activity_events`, Presence efÃ­mero con identidad desde `user_profiles` y resoluciÃ³n optimista de conflictos con `updated_at` en dashboard, presupuestos y CRUDs. Supabase local estÃ¡ operativo con CLI local del repo + Docker, migraciones/seed/RLS validados, pruebas pgTAP de seguridad y tipos generados desde la base local. Supabase remoto queda enlazado como deploy/staging inicial, no como fuente primaria de cambios de esquema.

Seguir todos los goals de este documento debe llevar a un MVP completo y colaborativo, no a un producto feature complete final. Las mejoras posteriores quedan separadas en `docs/10-post-mvp-goals.md`.

## Avance por etapas

| Etapa | Estado | Avance | Hecho | Pendiente | VerificaciÃ³n |
| --- | --- | ---: | --- | --- | --- |
| 1. Base del proyecto | En progreso avanzado | 85% | Git inicializado, Next.js 14 App Router, React 18, TypeScript, Tailwind, pnpm, lucide-react, alias `@/*`, scripts base y componentes UI compartidos mÃ­nimos | RevisiÃ³n documental continua | `pnpm lint`, `pnpm build` han pasado |
| 2. Modelo y datos | En progreso avanzado | 98% | Tipos TS, migraciones Supabase, Auth/RLS, seed data PerÃº extendido con usuarios demo, tabla `recurso_proveedor_precios`, proveedores visibles para cliente, campos vivos/snapshot de precio cliente, motivos de precio fijado congelados, scripts Supabase, tipos generados desde Supabase local y capa `lib/data/` para proveedores, recursos, cotizaciones, partidas/APU, proyectos, actividad y presupuestos | Conectar cronogramas a persistencia | `pnpm lint`, `pnpm test` y `pnpm build` ejecutados |
| 3. CÃ¡lculos y validaciones | En progreso avanzado | 94% | FÃ³rmulas documentadas, `lib/calculations/*` implementado, Vitest configurado, costo directo APU sin doble margen, redondeo monetario, cotizaciones con vigencia/proveedor activo, cronogramas con paralelos por solapamiento, esquemas Zod base conectados y cobertura ampliada para validaciones/exportaciones/repositorios/conflictos | Ampliar validaciones de presupuestos si el formulario crece y formalizar Zod de cronogramas persistentes cuando aplique | `pnpm lint`, `pnpm test` y `pnpm build` ejecutados |
| 4. UI base | En progreso avanzado | 91% | `AppLayout`, `Sidebar`, `Topbar`, `Button`, `StatCard`, `PageHeader`, `EmptyState`, `LoadingState`, `ConfirmDialog`, `DataTable`, dashboard, selector real de proyecto, bÃºsqueda global, campanita de actividad, pantallas mock principales, affordances falsas limpiadas y revisiÃ³n responsive amplia | Ajustes finos futuros segÃºn feedback real de uso | `pnpm lint`, `pnpm test`, `pnpm build` han pasado |
| 5. CRUDs base | En progreso persistente avanzado | 90% | `/proveedores`, `/recursos` y `/partidas` conectados a Supabase con validaciÃ³n Zod, auditorÃ­a, historial de precios, proveedores visibles para cliente, cotizaciones por recurso/proveedor y recursos APU persistentes | Pulir conflictos optimistas futuros | `pnpm lint`, `pnpm test` y `pnpm build` ejecutados |
| 6. Partidas/APU | Resuelta base persistente | 99% | `/partidas` y `/partidas/[id]` usan Supabase con modal de creacion/edicion, cabecera tecnica separada del APU, catalogos persistentes de categoria/subcategoria/unidad con alta rapida desde dropdown, codigo opcional, subcategoria, jornada, desperdicio global de materiales, guardado sin APU, recursos APU por tipo de calculo, subtotales y auditoria | Recalculo colaborativo fino y E2E visual cuando se amplie QA | `pnpm run supabase:reset`, `pnpm run supabase:types`, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build` ejecutados |
| 7. Presupuestos | Resuelta base persistente | 99% | `/presupuestos` usa borrador activo de Supabase, crea borrador si falta, edita datos generales/metrados, agrega/elimina partidas, fija precios por lÃ­nea/recurso, refresca precios vigentes, revisa precios cliente, permite elegir cotizaciÃ³n/override manual, agrega partidas y emite versiones oficiales mediante RPCs transaccionales; el workspace y repositorio quedaron refactorizados internamente sin romper imports pÃºblicos | Quedan mejoras futuras de UX fina segÃºn uso real | `pnpm run supabase:types`, pgTAP, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build` han pasado |
| 8. Cronogramas | En progreso avanzado mock | 75% | `/cronogramas` implementado con selector de presupuesto, tareas desde partidas, duraciÃ³n sugerida/manual, dependencias fin-a-inicio, Gantt simple, tareas paralelas, orden topolÃ³gico, holgura y ruta crÃ­tica | Persistencia futura en borradores/versiones y validaciones Zod formales si el formulario crece | `pnpm test`, `pnpm lint`, `pnpm build` han pasado |
| 9. Reportes y exportaciones | Resuelta base MVP | 88% | `/reportes` implementado con resumen por presupuesto, costos por grupo APU, recursos mÃ¡s costosos, totales por estado/proyecto, prioridad de versiÃ³n oficial y fallback a borrador; Excel/PDF interno final con borrador etiquetado, versiÃ³n oficial congelada, resumen financiero, partidas, detalle APU, exportaciÃ³n cliente sin proveedores, advertencias rojas y tests de exportaciÃ³n | Selector de versiones oficiales histÃ³ricas y exportaciÃ³n de cronogramas quedan post-MVP | `pnpm lint`, `pnpm test`, `pnpm build` y `@Navegador` |
| 10. ColaboraciÃ³n realtime | Resuelta avanzada | 90% | Broadcast privado desde `activity_events`, topics `org:*`/`project:*`, RLS en `realtime.messages`, renovaciÃ³n de token, toasts accesibles, dedupe, debounce, Presence con identidad desde `user_profiles`, avisos de ediciÃ³n y resoluciÃ³n optimista de conflictos con `updated_at` | Pruebas UI end-to-end futuras y extender a cronogramas persistentes | `pnpm lint`, `pnpm test`, `pnpm build` y pgTAP |
| 11. Pulido final | En progreso | 38% | Build inicial exitoso, verificaciones visuales previas y revisiÃ³n responsive en laptop mediana/desktop para mÃ³dulos mock principales | Pulido final posterior a persistencia, auth, colaboraciÃ³n y reportes | `pnpm lint`, `pnpm build` han pasado |

## Avances completados

- Repo Git inicializado.
- DocumentaciÃ³n base creada en `docs/`.
- App Next.js 14 App Router + React 18 + TypeScript creada.
- Tailwind CSS configurado.
- `lucide-react`, `zod`, `vitest`, `xlsx` y `@supabase/supabase-js` instalados.
- Dashboard `/` conectado a Supabase con proyectos accesibles por RLS, versiÃ³n oficial vigente o borrador activo y enlace a detalle.
- CreaciÃ³n de proyectos nuevos conectada a Supabase desde dashboard y topbar mediante `create_project_with_current_member`; al crear, navega a `/presupuestos/[proyectoId]`. El dashboard vacÃ­o muestra un CTA principal para crear el primer proyecto.
- Topbar conectado a proyectos reales con selector jerarquico de organizacion/proyecto, bÃºsqueda global navegable, boton de notificaciones para invitaciones y campanita de actividad persistente.
- MÃ³dulo `/reportes` conectado a Supabase con resumen por presupuesto/proyecto, costos por grupo APU, recursos mÃ¡s costosos, totales por estado y distinciÃ³n visible entre versiÃ³n oficial y borrador activo.
- Dashboard y flujo persistente inicial de `/presupuestos` implementados.
- Layout base creado con `AppLayout`, `Sidebar` y `Topbar`.
- QA UI/Auth/Layout 2026-05-21: Topbar agrega navegaciÃ³n mÃ³vil para mantener acceso global cuando el Sidebar de escritorio estÃ¡ oculto; se corrigieron textos visibles de sesiÃ³n/cierre de sesiÃ³n.
- QA UI/workflows 2026-05-21: se recorrieron con Navegador dashboard, presupuestos, cronogramas, recursos, proveedores, partidas y detalle APU; se corrigieron textos visibles/exportables sin tilde y no quedaron errores de consola en el smoke final.
- Componentes principales de presupuesto creados: KPI cards, tabla, resumen financiero, tabla mini de recursos, tabs y desglose APU.
- Datos mock separados en `lib/mock-data/`.
- Tipos de dominio creados en `types/domain.ts`.
- Funciones puras de cÃ¡lculo APU y presupuesto creadas en `lib/calculations/`.
- Vitest configurado con pruebas unitarias para cÃ¡lculos.
- Esquemas base de validaciÃ³n creados en `lib/validations/`.
- MÃ³dulo `/recursos` conectado a Supabase con bÃºsqueda, filtros, formulario validado con Zod, desactivaciÃ³n con confirmaciÃ³n e historial persistente de precios.
- MÃ³dulo `/proveedores` conectado a Supabase con CRUD, bÃºsqueda por nombre/RUC, filtro por visibilidad cliente, formulario reutilizable, desactivaciÃ³n con confirmaciÃ³n y estados vacÃ­os.
- MÃ³dulo `/partidas` conectado a Supabase con listado, filtros, mÃ©tricas, crear/editar/desactivar partidas, estados loading/error/vacÃ­o y auditorÃ­a.
- Catalogos 2026-05-27: categorias, subcategorias y unidades viven en tablas por organizacion, tienen RLS/grants, seed demo, tipos Supabase generados y repositorio `lib/data/partida-catalogs.ts`. `/partidas` usa dropdowns con alta rapida para cabecera y `/recursos` usa el mismo catalogo de unidades; las unidades se pueden crear y editar desde ambos flujos.
- Fix `/partidas` 2026-05-27: el modal de edicion hidrata los recursos APU existentes, permite editar cada linea desde la tabla del popup y sincroniza altas, cambios y eliminaciones al guardar.
- Detalle `/partidas/[id]` conectado a Supabase con builder APU persistente, snapshots de recursos, parciales calculados, costos por grupo, costo directo y simulaciÃ³n de precio unitario.
- MÃ³dulo `/presupuestos` evolucionado a flujo persistente multi-proyecto con creaciÃ³n/ediciÃ³n de borrador activo, partidas existentes, metrados editables, eliminaciÃ³n de lÃ­neas, precios fijados por lÃ­nea/recurso, refresco de precios vigentes, selecciÃ³n de cotizaciÃ³n cliente, override manual, emisiÃ³n oficial y snapshots de recursos APU.
- Exportaciones mock de presupuesto agregadas en frontend: Excel con `xlsx` y PDF mediante vista imprimible usando partidas snapshot.
- MigraciÃ³n inicial Supabase creada con tablas mÃ­nimas, enums, foreign keys, checks, triggers `updated_at` e Ã­ndices bÃ¡sicos.
- Seed data PerÃº creado con proveedores, recursos, historial, partidas/APU y presupuesto demo con snapshots.
- Cliente Supabase preparado en `lib/supabase/` con variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- MigraciÃ³n colaborativa Supabase creada con organizaciones, miembros, proyectos, roles, `activity_events`, borradores colaborativos, versiones oficiales congeladas y controles de precio fijado/autoactualizable.
- Seed data PerÃº extendido con organizaciÃ³n demo, proyecto demo, borrador activo, versiÃ³n oficial congelada y evento de auditorÃ­a demo sin actor.
- Tipos de `lib/supabase/types.ts` generados desde Supabase local y `types/domain.ts` actualizado para cubrir el modelo colaborativo.
- Arquitectura colaborativa definida documentalmente: borrador colaborativo vivo, versiones oficiales congeladas, auditorÃ­a completa, Broadcast, Presence y conflictos optimistas.
- Estrategia Supabase local-first definida: desarrollo persistente con Supabase CLI + Docker; Supabase remoto solo para staging, producciÃ³n o migraciÃ³n final.
- Tooling Supabase local-first configurado: CLI local `supabase`, `supabase/config.toml`, scripts pnpm para start/stop/status/reset/migrate/types, `.env.local` local y seed/migraciones validados con `supabase db reset`.
- Auth/RLS productivo base implementado: `@supabase/ssr`, rutas `/login`, `/registro`, `/recuperar-clave`, `/actualizar-clave`, `/auth/callback`, `/onboarding`, login email/password, opciÃ³n OAuth Google, middleware de sesiÃ³n, RPC de bootstrap de organizaciÃ³n/proyecto, policies RLS sobre tablas pÃºblicas y usuarios demo locales.
- Pruebas pgTAP de RLS agregadas en `supabase/tests/rls.sql` para anon, owner, editor, lector, externo, versiones oficiales y auditorÃ­a con actor propio.
- Modelo multi-proveedor definido documentalmente: recursos canÃ³nicos, mÃºltiples cotizaciones por proveedor, proveedores visibles para cliente y exportaciÃ³n cliente con precios cliente congelados.
- Limpieza de affordances falsas en mÃ³dulos completados: links `#` eliminados, acciones pendientes deshabilitadas con tooltip y navegaciÃ³n conectada cuando existe ruta real.
- DocumentaciÃ³n normalizada a UTF-8 correcto en `AGENTS.md` y `docs/*.md` despuÃ©s de la auditorÃ­a de encoding.
- Script `pnpm dev` configurado para exponer Next.js en la red local mediante `--hostname 0.0.0.0`.
- Sidebar reordenado con jerarquÃ­a de trabajo: Dashboard, Presupuestos, Cronogramas, Partidas/APU, Proveedores, Recursos, Reportes, Historial de precios y ConfiguraciÃ³n.
- MÃ³dulo mock `/cronogramas` implementado previo a Supabase: selector de presupuesto, tareas desde partidas, duraciÃ³n sugerida/manual, dependencias fin-a-inicio, Gantt simple, orden recomendado, tareas paralelas y ruta crÃ­tica.
- CÃ¡lculos puros de cronogramas implementados y testeados en `lib/calculations/schedule.ts`: duraciÃ³n sugerida, orden topolÃ³gico, fechas, holgura, ruta crÃ­tica, grupos paralelos y errores por ciclos/dependencias invÃ¡lidas.
- CRUD persistente de `/proveedores` conectado a Supabase mediante `lib/data/providers.ts`: listado por organizaciÃ³n, creaciÃ³n, ediciÃ³n, desactivaciÃ³n lÃ³gica, estados de carga/error/vacÃ­o, permisos por rol owner/admin y eventos en `activity_events`.
- CRUD persistente de `/recursos` conectado a Supabase mediante `lib/data/resources.ts`: listado por organizaciÃ³n, creaciÃ³n, ediciÃ³n, desactivaciÃ³n lÃ³gica, estados de carga/error/vacÃ­o, permisos por rol owner/admin, historial de precios en `recurso_precios_historial`, eventos en `activity_events` y contrato para autoactualizaciÃ³n futura de borradores.
- Modelo multi-proveedor implementado con `proveedores.disponible_para_cliente`, tabla `recurso_proveedor_precios`, RLS/grants explÃ­citos, seed demo, tipos Supabase regenerados, repositorio `lib/data/quotes.ts` y panel de cotizaciones en `/recursos`.
- `/presupuestos` migrado al borrador persistente de Supabase: agrega partidas, edita metrados, elimina lÃ­neas, recalcula totales, resuelve precios cliente, muestra advertencias de fallback, permite override manual y emite versiones oficiales congeladas.
- Exportaciones finales MVP agregadas: Excel/PDF de borrador con etiqueta `BORRADOR`, exportaciÃ³n formal desde versiÃ³n oficial congelada, detalle APU por partida, exportaciÃ³n cliente con precios cliente congelados, sin proveedores, advertencias rojas/notas y pruebas de filas, nombres de archivo, sanitizaciÃ³n Excel y escaping HTML.
- Formateo de fechas de UI robustecido para aceptar fechas simples y timestamps completos de Supabase en proveedores/recursos sin provocar errores de runtime.
- Realtime colaborativo base implementado: `activity_events` dispara Broadcast privado mediante trigger, RLS protege topics `org:*` y `project:*`, y la UI muestra toasts/refetch con debounce en dashboard, presupuestos, partidas/APU, recursos y proveedores.
- ColaboraciÃ³n avanzada implementada: Presence efÃ­mero en canales privados, avisos de usuarios viendo/editando, control optimista con `expectedUpdatedAt`, diÃ¡logo de resoluciÃ³n de conflictos y RLS de Presence en `realtime.messages`.
- Chunk 4 de Realtime/Presence cerrado: policy `project:*` corregida, clientes limitados a Presence, `actorId` validado contra `auth.uid()`, identidad visible desde `user_profiles`, renovaciÃ³n de token Realtime en `TOKEN_REFRESHED`, sin refetch por eventos propios y toasts con `aria-live`.
- El modelo APU vigente ya no conserva el campo legacy de factor de rendimiento por recurso; la productividad se expresa mediante `rendimiento`, `jornada_horas` y `cuadrilla` segun el tipo de calculo.
- Chunk 7 de refactor y hardening preventivo cerrado: `lib/data/budgets.ts` queda como fachada pÃºblica sobre mÃ³dulos internos, `PresupuestosWorkspace` centraliza overlays/retries, errores Supabase se sanitizan en producciÃ³n, HTML imprimible escapa caracteres adicionales y la RPC de onboarding se re-declara con `actor_id`.
- Chunk 8 de cierre de verificaciÃ³n cerrado: se agregÃ³ cobertura faltante para selecciÃ³n/override de precio cliente, se endurecieron grants de sequences y perfiles Presence no verificados, `BudgetTable` quedÃ³ memoizada, `recalculateDraftTotals` evita re-fetch completo en el camino normal, workspace cachea scope por cliente singleton y se eliminaron duplicaciones en Realtime/Topbar.
- Chunk 2 de integridad de presupuestos cerrado: `emit_official_budget_version` y `add_draft_partida` son RPCs transaccionales, `updateBudgetDraft` usa schema/allowlist, los borradores exigen trazabilidad `created_by`/`updated_by`, onboarding valida membresÃ­a activa/RUC, proyectos no cambian de organizaciÃ³n y `activity_events` valida tipo/entidad/scope.
- Chunk 3 de seguridad auth/rutas/producciÃ³n web cerrado: login sanitiza `next`, credenciales demo no se prellenan en producciÃ³n, Auth usa `NEXT_PUBLIC_APP_URL`, contraseÃ±as fuertes, headers de seguridad, middleware con allowlist/timeout, presupuestos por `/presupuestos/[proyectoId]`, Excel anti fÃ³rmula y migraciÃ³n con grants explÃ­citos, `set_updated_at` endurecido y lÃ­mite de payload de auditorÃ­a.
- Goal ampliar-tests cerrado: Vitest quedÃ³ en 19 archivos y 119 tests, con cobertura nueva para snapshots oficiales, locks de precio, metrados, eliminaciÃ³n de lÃ­neas, cotizaciones multi-proveedor, updates parciales sin defaults implÃ­citos, conflictos optimistas, exportaciÃ³n cliente y precisiÃ³n monetaria.
- QA presupuestos 2026-05-22: corregida la sincronizaciÃ³n entre la selecciÃ³n de lÃ­nea y el parÃ¡metro `?linea=` para que el desglose APU no alterne entre partidas al seleccionar filas.
- Deploy inicial 2026-05-22: GitHub quedÃ³ conectado a Vercel, proyecto Vercel `diego-polacks-projects/cyp-sistema-costos-presupuestos` publicado en `https://cyp-sistema-costos-presupuestos.vercel.app`, Supabase remoto `qrzyltggvixlsowxepxh` enlazado, 18 migraciones aplicadas, `supabase/seed.sql` cargado y variables pÃºblicas de producciÃ³n configuradas en Vercel.
- Hardening remoto inicial 2026-05-23: Supabase Auth remoto quedÃ³ con Site URL/Redirect URLs de Vercel, confirmaciÃ³n de email, SMTP Resend para `polacklabs.com`, contraseÃ±a mÃ­nima de 12 caracteres, requisito de minÃºscula/mayÃºscula/nÃºmero, reautenticaciÃ³n para cambio de clave, Cloudflare Turnstile activo, Realtime pÃºblico desactivado y SSL enforcement externo.
- RecuperaciÃ³n de contraseÃ±a 2026-05-25: el email de reset ahora redirige por `/auth/callback?next=/actualizar-clave`, reutilizando la URL autorizada en Supabase para crear la sesiÃ³n temporal antes de cambiar contraseÃ±a. El middleware permite `/actualizar-clave` con sesiÃ³n activa para no mandar el reset al dashboard, y el dashboard muestra un toast de confirmaciÃ³n cuando el cambio se guarda.
- Onboarding 2026-05-25: la primera experiencia ya no pide organizaciÃ³n/RUC/proyecto. Pide nombre y apellido, guarda el perfil visible, crea una organizaciÃ³n vacÃ­a automÃ¡tica para ownership/RLS y manda al dashboard; si no hay proyectos, el dashboard muestra un CTA para crear el primero.

## Pendientes principales

- Mantener ajustes responsive finos segÃºn feedback real y futuros mÃ³dulos persistentes.
- Ampliar validaciones de presupuestos si el formulario crece.
- Refinar recalculo colaborativo para partidas/APU y presupuestos segÃºn feedback real multiusuario.
- Mantener Auth/RLS como base obligatoria; antes de usuarios reales definir backups/monitoreo y ejecutar pruebas multiusuario.
- Extender pruebas UI end-to-end para Presence y conflictos optimistas.
- Migrar cronogramas mock a persistencia real cuando existan borradores/versiones colaborativas.
- Evaluar selector de versiones oficiales histÃ³ricas y exportaciÃ³n de cronogramas cuando pasen a persistencia.
- Mantener Presence colaborativo y conflictos optimistas al migrar cronogramas/reportes.
- Mantener y ampliar tests solo cuando entren nuevos contratos funcionales, especialmente cronogramas persistentes y UI end-to-end de conflictos.

## AuditorÃ­a general de faltantes

| Tarea | Prioridad | Estado actual | Faltante concreto | Archivos o zonas relacionadas |
| --- | --- | --- | --- | --- |
| Alinear documentaciÃ³n y encoding | Resuelta | `AGENTS.md` y `docs/*.md` normalizados a espaÃ±ol legible | Mantener docs sincronizados en futuros goals | `AGENTS.md`, `docs/*.md` |
| Limpiar affordances sin funciÃ³n | Resuelta en mÃ³dulos completados | Links `#` eliminados y acciones pendientes deshabilitadas con tooltip en zonas auditadas | Mantener la regla en nuevos mÃ³dulos | `Topbar`, `Sidebar`, tablas y cards |
| Crear componentes compartidos de UI | Resuelta | `PageHeader`, `DataTable` simple, `EmptyState`, `LoadingState` y `ConfirmDialog` creados y aplicados gradualmente | Mantenerlos como abstracciones mÃ­nimas y no convertir `DataTable` en motor avanzado | `components/shared/`, pÃ¡ginas de mÃ³dulos |
| RevisiÃ³n responsive y visual real | Resuelta para mÃ³dulos mock principales | `/presupuestos`, `/recursos`, `/proveedores`, `/partidas` y `/partidas/[id]` revisadas en laptop mediana y desktop 1440px+ | Mantener pulido visual al agregar persistencia y reportes | `/presupuestos`, `/recursos`, `/proveedores`, `/partidas`, `/partidas/[id]` |
| Modelo colaborativo Supabase | Resuelta a nivel de esquema | MigraciÃ³n colaborativa, seed demo y tipos generados desde Supabase local | Conectar desde capa de datos cuando existan auth/RLS y repositorios | `supabase/migrations/`, `supabase/seed.sql`, `lib/supabase/types.ts`, `types/domain.ts` |
| Capa de datos Supabase | Resuelta base | `lib/data/` encapsula Supabase para proveedores, recursos, partidas/APU y presupuestos con scope, errores, loading, mocks temporales y auditorÃ­a | Extender repositorios a cronogramas, reportes y realtime cuando se conecten pantallas | `lib/data/`, `lib/supabase/`, `lib/mock-data/` |
| CRUD persistente de proveedores | Resuelta | `/proveedores` usa Supabase con scope de organizaciÃ³n, validaciÃ³n Zod, loading/error/vacÃ­o, permisos owner/admin y auditorÃ­a | Mantener compatibilidad con el futuro modelo multi-proveedor/precios cliente | `/proveedores`, `lib/data/providers.ts`, `lib/validations/providers.ts` |
| CRUD persistente de recursos e historial | Resuelta | `/recursos` usa Supabase con scope de organizaciÃ³n, validaciÃ³n Zod, loading/error/vacÃ­o, permisos owner/admin, historial de precios y auditorÃ­a | Mantener compatibilidad con cotizaciones y autoactualizaciÃ³n futura de borradores | `/recursos`, `lib/data/resources.ts`, `recurso_precios_historial`, `activity_events` |
| Multi-proveedor y precios cliente | Resuelta base | Cotizaciones por proveedor, visibilidad cliente, precio cliente automÃ¡tico/fallback/override y snapshots oficiales implementados | Pulir UX segÃºn uso real y extender reportes/exportaciones finales | proveedores, recursos, presupuestos, exportaciones |
| CRUD persistente de partidas/APU | Resuelta base | Listado y builder APU usan Supabase con validaciones Zod, snapshots, parciales calculados y auditorÃ­a | Recalculo colaborativo y conflictos optimistas futuros | `/partidas`, `/partidas/[id]`, `lib/data/items.ts` |
| Presupuestos con borrador y versiones | Resuelta base | `/presupuestos` usa borrador persistente multi-proyecto, refresca precios vigentes, fija precios y emite versiones oficiales congeladas | Pulir conflictos optimistas y colaboraciÃ³n realtime | `/`, `/presupuestos`, tablas snapshot, versiones |
| Cronogramas mock | Resuelta para MVP mock | `/cronogramas` existe con estado frontend y cÃ¡lculos puros testeados | Persistir cronogramas cuando presupuestos migren a borradores colaborativos y versiones oficiales | `/cronogramas`, `lib/calculations/schedule.ts` |
| Auth, RLS y ownership | Resuelta base productiva | Supabase Auth email/password, SMTP Resend, confirmaciÃ³n de email remota, CAPTCHA Turnstile, OAuth Google, callback `/auth/callback`, onboarding de perfil con workspace vacÃ­o automÃ¡tico, roles y policies RLS implementados y testeados | Administrar miembros desde UI en goal posterior | `supabase/migrations/`, `supabase/tests/rls.sql`, `app/login`, `app/auth/callback`, `app/onboarding`, `docs/08-produccion.md` |
| Realtime colaborativo | Resuelta avanzada | Broadcast privado desde auditoria persistida con toasts accesibles, invalidacion/refetch solo para eventos externos, Presence con identidad confiable y conflictos optimistas | Extender a cronogramas persistentes y agregar E2E | `lib/realtime/`, canales Supabase, UI de toasts/presencia |
| Reportes simples | Resuelta MVP | `/reportes` existe como mÃ³dulo de lectura conectado a Supabase y prioriza la versiÃ³n oficial mÃ¡s reciente con fallback a borrador activo | Mejoras futuras de plantillas/reportes avanzados si aplica | `/reportes`, `lib/data/reports.ts` |
| Exportaciones finales | Media | Excel/PDF interno y exportaciÃ³n cliente desde versiÃ³n oficial existen con pruebas | Mejorar plantilla final y anexos APU si aplica | `lib/exports/budget.ts`, `docs/07-exportaciones.md` |
| Testing ampliado | Media | Hay tests de cÃ¡lculos | Agregar tests de Zod, exports, snapshots y repositorios | `*.test.ts`, `lib/` |
| Tooling Supabase local-first | Resuelta | CLI local, Docker, `supabase/config.toml`, `.env.local`, scripts, reset/seed y generaciÃ³n de tipos configurados y validados | Mantener comandos y tipos sincronizados cuando cambie el esquema | `package.json`, `supabase/config.toml`, `.env.example`, `docs/01-arquitectura.md`, `docs/08-produccion.md` |

## Decisiones tÃ©cnicas tomadas

- Se usa Next.js 14 App Router como framework principal.
- Se usa React 18 y TypeScript.
- Se usa pnpm como package manager.
- `pnpm dev` escucha en `0.0.0.0` para permitir pruebas desde otros equipos de la misma red local.
- Se usa Tailwind CSS para estilos.
- Se usan componentes propios con Tailwind para mantener control visual.
- shadcn/ui queda como opciÃ³n futura, no como dependencia obligatoria inmediata.
- Se usa `lucide-react` para iconografÃ­a.
- Se usa Zod para validaciones reutilizables en `lib/validations/`.
- Se usa Vitest para pruebas unitarias de cÃ¡lculos y lÃ³gica pura.
- Se usa `xlsx` para exportaciÃ³n Excel de presupuestos mock.
- El PDF mock se resuelve con una vista HTML imprimible y guardado desde el navegador.
- Los datos mock viven fuera de componentes visuales.
- Supabase queda preparado con migraciones, seed data, cliente y capa base `lib/data/`; la UI ya usa persistencia en proveedores, recursos, partidas/APU y presupuestos, mientras cronogramas sigue mock hasta su goal persistente.
- El desarrollo backend serÃ¡ local-first con Supabase CLI + Docker.
- El proyecto Supabase remoto se reserva para staging, producciÃ³n o migraciÃ³n final.
- `supabase/migrations/` y `supabase/seed.sql` serÃ¡n la fuente de verdad; no se crearÃ¡n tablas manualmente en remoto como fuente primaria.
- Los presupuestos deben manejar snapshots para no mutar histÃ³ricos.
- Los recursos serÃ¡n canÃ³nicos y podrÃ¡n tener mÃºltiples cotizaciones por proveedor.
- Los proveedores aptos para cliente se marcarÃ¡n con `disponible_para_cliente`.
- Al emitir versiÃ³n oficial se congelarÃ¡n precios internos y precios cliente.
- El precio cliente sugerido serÃ¡ el mÃ¡s caro entre proveedores visibles; si no hay visible, se usarÃ¡ el mÃ¡s caro general con advertencia.
- El sistema separarÃ¡ borrador colaborativo vivo de versiones oficiales congeladas.
- El dashboard de proyecto mostrarÃ¡ la versiÃ³n oficial mÃ¡s reciente; si no existe, mostrarÃ¡ el borrador.
- Los cronogramas nacerÃ¡n desde presupuestos: cada partida presupuestada puede convertirse en tarea.
- El MVP de cronogramas usarÃ¡ dependencias fin-a-inicio, duraciÃ³n en dÃ­as, Gantt simple, ruta crÃ­tica, holgura y tareas paralelas.
- La duraciÃ³n serÃ¡ mixta: sugerida por metrado/rendimiento cuando sea posible y manual obligatoria cuando la partida no tenga rendimiento usable.
- `activity_events` serÃ¡ la auditorÃ­a permanente; `recurso_precios_historial` seguirÃ¡ como historial especializado de precios.
- Realtime se usarÃ¡ como transporte de avisos y actualizaciÃ³n, no como historial ni fuente de verdad.
- Broadcast serÃ¡ la vÃ­a preferida para cambios persistidos y Presence para usuarios viendo/editando.
- La ediciÃ³n colaborativa usarÃ¡ control optimista con aviso de conflicto.
- Los porcentajes financieros y de desperdicio se mantienen en rango `0..100`; el precio unitario `0` sigue permitido para partidas gratuitas, placeholders o promociones.
- El modelo APU vigente ya no conserva el campo legacy de factor de rendimiento por recurso; la productividad se expresa mediante `rendimiento`, `jornada_horas` y `cuadrilla` segun el tipo de calculo.

## Backlog inmediato recomendado

1. Migrar cronogramas a borradores colaborativos y versiones oficiales congeladas.
2. Implementar Presence y conflictos colaborativos.
3. Mejorar exportaciones finales y anexos APU si aplica.
4. Ampliar tests de validaciones, exports, snapshots, auditorÃ­a, cronogramas y capa de datos.

## Prompts `/goal`

### `/goal auditoria-documentacion-encoding`

Corrige `AGENTS.md` y `docs/*.md` para reflejar el estado real del proyecto despuÃ©s de la auditorÃ­a general. Normaliza mojibake/encoding, rutas reales, stack real, comandos, dependencias instaladas y diferencia entre funcionalidad mock y persistente. No cambies cÃ³digo funcional. Actualiza especialmente `docs/01-arquitectura.md`, `docs/04-roadmap-mvp.md` y este documento. Ejecuta una revisiÃ³n de enlaces internos y resume archivos modificados. Si no aplica `pnpm lint` o `pnpm build` por ser solo documentaciÃ³n, indÃ­calo explÃ­citamente.

Estado: completado el 2026-05-15.

VerificaciÃ³n: revisiÃ³n de enlaces internos Markdown ejecutada sin enlaces rotos; bÃºsqueda de mojibake residual en `AGENTS.md` y `docs/*.md` ejecutada sin coincidencias.

Nota: no se ejecutaron `pnpm lint` ni `pnpm build` porque este goal modificÃ³ solo documentaciÃ³n Markdown y no cambiÃ³ cÃ³digo funcional.

### `/goal componentes-ui-compartidos`

Crea componentes compartidos mÃ­nimos para reducir duplicaciÃ³n: `PageHeader`, `EmptyState`, `LoadingState`, `ConfirmDialog` y, solo si encaja sin sobreingenierÃ­a, una `DataTable` simple para tablas actuales. Migra gradualmente las pantallas existentes sin cambiar comportamiento de negocio ni conectar backend. Mantener estÃ©tica SaaS profesional y texto en espaÃ±ol. Ejecuta `pnpm lint` y `pnpm build`, y actualiza `docs/09-avances-y-goals.md` y `docs/05-frontend-ui-ux.md`.

Estado: completado el 2026-05-15.

VerificaciÃ³n: `pnpm lint` y `pnpm build` ejecutados al cierre del goal.

### `/goal revision-responsive-ui`

Levanta la app y revisa visualmente `/presupuestos`, `/recursos`, `/proveedores`, `/partidas` y `/partidas/[id]` en laptop mediana y desktop 1440px+. Ajusta overflow de tablas, espaciados, jerarquÃ­a visual, estados vacÃ­os, botones, formularios y accesibilidad bÃ¡sica. No agregues backend ni cambies datos mock. Usa navegador integrado o capturas si estÃ¡ disponible. Ejecuta `pnpm lint` y `pnpm build`, y actualiza `docs/09-avances-y-goals.md`.

Estado: completado el 2026-05-15.

VerificaciÃ³n: revisiÃ³n con navegador integrado en `1366x768` y `1440x900` para `/presupuestos`, `/recursos`, `/proveedores`, `/partidas` y `/partidas/part-tarrajeo-muros`; pruebas de formularios y estados vacÃ­os en recursos, proveedores, partidas, presupuestos y builder APU; `pnpm lint` y `pnpm build` ejecutados al cierre del goal.

### `/goal preparar-modelo-colaborativo-supabase`

Prepara la base documental y de esquema para colaboraciÃ³n antes de conectar CRUDs reales. Definir organizaciones, miembros, proyectos, miembros de proyecto, roles, auditorÃ­a `activity_events`, borradores colaborativos, versiones oficiales congeladas y campos para precio fijado/autoactualizable. No implementar Realtime todavÃ­a. Mantener la regla de que el borrador es vivo y las versiones oficiales no se recalculan. Ejecuta `pnpm lint`, `pnpm test`, `pnpm build` si cambia cÃ³digo o migraciones; si solo cambia documentaciÃ³n, omitirlos con nota explÃ­cita. Actualiza `AGENTS.md`, `docs/01-arquitectura.md`, `docs/02-modelo-datos.md`, `docs/04-roadmap-mvp.md`, `docs/08-produccion.md` y este documento.

Estado: completado el 2026-05-15.

VerificaciÃ³n: `pnpm lint`, `pnpm test` y `pnpm build` ejecutados al cierre del goal.

Nota: no se ejecutaron migraciones contra Supabase local/remoto porque Supabase CLI y Docker todavÃ­a no estÃ¡n disponibles en este entorno.

### `/goal cronogramas-mock-gantt-ruta-critica`

Implementa el mÃ³dulo mock `/cronogramas` antes de pasar la UI a Supabase. Debe permitir seleccionar un presupuesto, generar tareas iniciales desde sus partidas presupuestadas, editar duraciÃ³n, fecha de inicio y dependencias fin-a-inicio, mostrar una vista Gantt simple, listar tareas en orden, identificar tareas que pueden ejecutarse en paralelo y resaltar la ruta crÃ­tica. Si una partida tiene metrado y rendimiento usable, sugerir duraciÃ³n calculada y permitir ediciÃ³n manual; si no tiene rendimiento o estÃ¡ vacÃ­o, exigir duraciÃ³n manual antes de calcular el cronograma. Implementar cÃ¡lculos puros para orden topolÃ³gico, fechas inicio/fin, holgura, ruta crÃ­tica y detecciÃ³n de ciclos/dependencias invÃ¡lidas. Usar mock data o estado frontend, sin persistencia real todavÃ­a. Ejecuta `pnpm lint`, `pnpm build` y actualiza `docs/09-avances-y-goals.md`, `docs/03-calculos.md`, `docs/05-frontend-ui-ux.md` y `docs/06-validaciones-y-testing.md`.

Estado: completado el 2026-05-18.

VerificaciÃ³n: `pnpm test`, `pnpm lint` y `pnpm build` ejecutados al cierre del goal.

### `/goal tooling-supabase-local`

Agrega o documenta tooling para trabajar local-first con Supabase. Instalar/configurar Supabase CLI y validar Docker Desktop o runtime compatible. Definir comandos para `supabase start`, migraciones, reset local, seed, generaciÃ³n de tipos y configuraciÃ³n de `.env.local` apuntando a la URL/anon key locales. Si se agregan scripts en `package.json`, mantenerlos simples y documentados. No conectar todavÃ­a un proyecto Supabase remoto salvo que sea necesario para staging; el remoto queda para migraciÃ³n final, staging o producciÃ³n. Ejecuta `pnpm lint`, `pnpm build` si cambia configuraciÃ³n/cÃ³digo y actualiza `AGENTS.md`, `docs/01-arquitectura.md`, `docs/02-modelo-datos.md`, `docs/08-produccion.md` y este documento.

Estado: completado el 2026-05-18.

VerificaciÃ³n: Docker validado, `pnpm exec supabase --version`, `pnpm run supabase:start`, `pnpm run supabase:reset`, `pnpm run supabase:status`, `pnpm run supabase:types`, `pnpm lint` y `pnpm build` ejecutados al cierre del goal.

Nota: Analytics quedÃ³ deshabilitado en `supabase/config.toml` porque en Windows la imagen de analytics requiere Docker expuesto por `tcp://localhost:2375`; el resto del stack local necesario para API, DB, Studio, Auth, Storage y Realtime arrancÃ³ correctamente.

### `/goal auth-rls-ownership`

Implementa autenticaciÃ³n bÃ¡sica y seguridad productiva para Supabase. Define `OrganizaciÃ³n -> Proyecto -> Miembros` como modelo mÃ­nimo de ownership, roles por proyecto y policies RLS para impedir acceso cruzado. Este goal debe completarse antes de habilitar colaboraciÃ³n Realtime real. No cambies la UX mÃ¡s de lo necesario. Ejecuta `pnpm lint`, `pnpm test`, `pnpm build` y actualiza `docs/08-produccion.md`, `docs/01-arquitectura.md`, `docs/02-modelo-datos.md` y `docs/09-avances-y-goals.md`.

Estado: completado el 2026-05-18.

VerificaciÃ³n: `pnpm run supabase:reset`, `pnpm run supabase:types`, `pnpm exec supabase test db supabase/tests/rls.sql`, `pnpm lint`, `pnpm test` y `pnpm build` ejecutados al cierre del goal.

Nota: Realtime real sigue pendiente hasta implementar capa de datos persistente, auditorÃ­a desde la aplicaciÃ³n y autorizaciÃ³n por canal. En local el seed crea `owner@cyp.local`, `editor@cyp.local`, `lector@cyp.local` y `externo@cyp.local` con contraseÃ±a `Password123!`.

### `/goal capa-datos-supabase-base`

Crea una capa de datos en `lib/data/` o `lib/repositories/` para encapsular Supabase sin acoplar las pÃ¡ginas directamente al cliente. La capa debe ser consciente de organizaciÃ³n/proyecto, ownership, errores, loading y contratos de auditorÃ­a. Incluir funciones base para proveedores y recursos: listar, obtener por ID, crear, actualizar y eliminar/desactivar segÃºn corresponda. Mantener mocks disponibles como fallback o fuente temporal donde sea necesario. No migres todas las pantallas todavÃ­a si el alcance crece demasiado. Ejecuta `pnpm lint`, `pnpm test`, `pnpm build` y actualiza `docs/09-avances-y-goals.md`, `docs/01-arquitectura.md` y `docs/02-modelo-datos.md` si cambia algÃºn contrato.

Estado: completado el 2026-05-19.

VerificaciÃ³n: `pnpm lint`, `pnpm test` y `pnpm build` ejecutados al cierre del goal.

Nota: en ese goal no se agregaron migraciones SQL ni se migraron pantallas; desde el goal posterior `/proveedores` ya usa Supabase y `/recursos` sigue con mocks hasta su goal CRUD persistente.

### `/goal crud-proveedores-persistente`

Conecta `/proveedores` a la capa de datos Supabase. Implementa listar, crear, editar y eliminar/desactivar proveedores con estados de carga, error y vacÃ­o, respetando organizaciÃ³n/proyecto cuando aplique y registrando eventos de auditorÃ­a. Mantener validaciÃ³n Zod, mensajes claros y comportamiento responsive. Evita romper los datos mock si todavÃ­a se usan en otros mÃ³dulos. Ejecuta `pnpm lint`, `pnpm test`, `pnpm build` y actualiza `docs/09-avances-y-goals.md`.

Estado: completado el 2026-05-19.

VerificaciÃ³n: `pnpm run supabase:reset` aplicÃ³ migraciones y seed, pero terminÃ³ con error transitorio al reiniciar el contenedor local de Storage (`unhealthy` durante readiness); una inspecciÃ³n posterior con Docker confirmÃ³ `supabase_storage_Sistema_de_gestion` en `healthy`, `pnpm run supabase:status` confirmÃ³ que el stack local quedÃ³ corriendo y `pnpm run supabase:types` regenerÃ³ tipos correctamente. `pnpm test`, `pnpm lint` y `pnpm build` ejecutados al cierre del goal.

### `/goal crud-recursos-persistente-auditoria`

Conecta `/recursos` a Supabase mediante la capa de datos. Implementa listar, crear, editar, desactivar y consultar historial de precios persistente. Cuando cambie costo unitario o transporte, registrar `recurso_precios_historial` y evento en `activity_events`. Mantener recursos como catÃ¡logo canÃ³nico y preparar compatibilidad con cotizaciones por proveedor. Preparar el contrato para que borradores puedan autoactualizar precios salvo lÃ­neas con precio fijado. Conecta validaciones Zod con coerciÃ³n numÃ©rica para formularios. Ejecuta `pnpm lint`, `pnpm test`, `pnpm build` y actualiza `docs/09-avances-y-goals.md`, `docs/02-modelo-datos.md` y `docs/06-validaciones-y-testing.md` si aplica.

Estado: completado el 2026-05-19.

VerificaciÃ³n: `/recursos` usa Supabase mediante `lib/data/resources.ts` para listar, crear, editar, desactivar y consultar historial persistente; las mutaciones auditadas registran `activity_events` y los cambios de costo/transporte registran `recurso_precios_historial`. Se conectÃ³ validaciÃ³n Zod con coerciÃ³n numÃ©rica y quedÃ³ preparado el contrato de autoactualizaciÃ³n futura para borradores no fijados. `pnpm lint`, `pnpm test` y `pnpm build` ejecutados al cierre del goal.

### `/goal multi-proveedor-precios-cliente`

Implementa el modelo de mÃºltiples cotizaciones por recurso/proveedor y proveedores visibles para cliente. Agrega `disponible_para_cliente` en proveedores, una tabla o contrato equivalente para cotizaciones por recurso, selecciÃ³n automÃ¡tica del precio cliente mÃ¡s caro entre proveedores visibles, fallback al precio mÃ¡s caro general con advertencia, y override manual antes de emitir versiÃ³n oficial. Preparar snapshots de precios internos y cliente para versiones oficiales. No mostrar proveedores en la exportaciÃ³n cliente. Ejecuta `pnpm lint`, `pnpm test`, `pnpm build` y actualiza `AGENTS.md`, `docs/00-producto.md`, `docs/02-modelo-datos.md`, `docs/06-validaciones-y-testing.md`, `docs/07-exportaciones.md` y este documento.

Estado: completado el 2026-05-19.

VerificaciÃ³n: `pnpm run supabase:reset`, `pnpm run supabase:types`, `pnpm exec supabase test db supabase/tests/rls.sql`, `pnpm lint`, `pnpm test`, `pnpm exec tsc --noEmit` y `pnpm build` ejecutados correctamente.

### `/goal crud-partidas-apu-persistente`

Conecta `/partidas` y `/partidas/[id]` a Supabase. Implementa crear/editar/desactivar partidas y persistir recursos APU asociados con auditorÃ­a. El builder debe recalcular parciales, costos por grupo, costo directo y precio unitario usando `lib/calculations/`, quedando listo para recalculo colaborativo posterior. Conecta validaciones Zod con coerciÃ³n numÃ©rica. Ejecuta `pnpm lint`, `pnpm test`, `pnpm build` y actualiza `docs/09-avances-y-goals.md`, `docs/02-modelo-datos.md`, `docs/03-calculos.md` y `docs/06-validaciones-y-testing.md` si aplica.

Verificacion: `/partidas` y `/partidas/[id]` migrados a Supabase mediante `lib/data/items.ts`; crear, editar y desactivar partidas registran `activity_events`; los recursos APU se agregan, editan y eliminan como relaciones persistentes con snapshots y `parcial` recalculado desde `lib/calculations/apu.ts`. El builder usa Zod con coercion numerica y deja GG/utilidad como simulacion editable, manteniendo la regla de presupuesto total. `pnpm lint`, `pnpm test` y `pnpm build` ejecutados.

### `/goal presupuestos-borrador-versiones-oficiales`

Migra `/presupuestos` desde estado mock a persistencia real separando borrador colaborativo y versiones oficiales. Implementa crear/editar borrador, agregar partidas existentes, editar metrados, eliminar lÃ­neas, recalcular totales usando capa de datos, autoactualizar precios vigentes cuando corresponda y permitir precio fijado por lÃ­nea/recurso. Implementa generaciÃ³n de versiones oficiales congeladas tipo `NombreProyecto_Presupuesto_V1`, preservando snapshot completo de partida, recursos APU, precio interno y precio cliente. Antes de emitir versiÃ³n oficial, permitir revisar y cambiar selecciÃ³n de precio cliente. El dashboard debe mostrar la versiÃ³n oficial mÃ¡s reciente o, si no existe, el borrador. Ejecuta `pnpm lint`, `pnpm test`, `pnpm build` y actualiza `docs/09-avances-y-goals.md`, `docs/02-modelo-datos.md`, `docs/03-calculos.md`, `docs/06-validaciones-y-testing.md` y `docs/07-exportaciones.md` si aplica.

Estado: completado el 2026-05-20.

VerificaciÃ³n: `/` migrado a dashboard persistente con versiÃ³n oficial vigente o borrador activo; `/presupuestos` y `/presupuestos/[proyectoId]` crean/editan borrador activo, agregan/eliminan partidas, editan metrados, fijan precios por lÃ­nea/recurso, refrescan precios vigentes, permiten selecciÃ³n de cotizaciÃ³n cliente/override manual y emiten versiones oficiales `NombreProyecto_Presupuesto_V{n}` sin recalcular selecciones cliente explÃ­citas. `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test` y `pnpm build` ejecutados correctamente.

### `/goal realtime-colaboracion-base`

Implementa colaboraciÃ³n realtime base despuÃ©s de persistencia, auditorÃ­a, auth/RLS y ownership. Usar Broadcast para cambios persistidos, toasts de actividad, invalidaciÃ³n/refetch y actualizaciÃ³n casi inmediata de presupuestos, APU, totales y dashboard. Realtime no debe ser historial ni fuente de verdad; cada cambio debe estar guardado y auditado antes de emitirse. Ejecuta `pnpm lint`, `pnpm test`, `pnpm build` y actualiza `docs/01-arquitectura.md`, `docs/05-frontend-ui-ux.md`, `docs/06-validaciones-y-testing.md`, `docs/08-produccion.md` y este documento.

Estado: completado el 2026-05-20.

Verificacion: Broadcast privado implementado desde `activity_events` con trigger `private.broadcast_activity_event`, policies RLS para `realtime.messages`, helpers y hook en `lib/realtime/`, toasts compartidos e invalidacion/refetch en dashboard, presupuestos, partidas/APU, recursos y proveedores. `pnpm lint`, `pnpm test`, `pnpm build` y pgTAP ejecutados al cierre del goal.

### `/goal presencia-conflictos-colaborativos`

Implementa colaboraciÃ³n avanzada: Presence para usuarios viendo/editando, avisos tipo "MarÃ­a estÃ¡ editando esta partida", detecciÃ³n de cambios mientras un usuario edita y resoluciÃ³n optimista de conflictos. No usar bloqueos estrictos salvo casos puntuales justificados. Los conflictos deben comparar el valor local con el valor persistido mÃ¡s reciente y evitar sobrescrituras silenciosas. Ejecuta `pnpm lint`, `pnpm test`, `pnpm build` y actualiza `docs/01-arquitectura.md`, `docs/05-frontend-ui-ux.md`, `docs/06-validaciones-y-testing.md` y este documento.

Estado: completado el 2026-05-20.

Verificacion: Presence privado implementado en `lib/realtime/` con avisos compartidos de usuarios viendo/editando; RLS de `realtime.messages` ampliado para `presence`; mutaciones editables protegidas con `expectedUpdatedAt`; la UI muestra resoluciÃ³n para cargar remoto o aplicar versiÃ³n local sin sobrescritura silenciosa. `pnpm lint`, `pnpm test` y `pnpm build` ejecutados al cierre del goal.

### `/goal validaciones-formularios-zod`

Unifica las validaciones de formularios con Zod. Recursos, presupuestos y builder APU no deben mantener validadores manuales duplicados si existe schema equivalente. Agrega coerciÃ³n/preprocess para inputs numÃ©ricos que llegan como string, mensajes de error comprensibles y pruebas unitarias de validaciÃ³n. No cambies persistencia salvo que ya exista capa de datos. Ejecuta `pnpm lint`, `pnpm test`, `pnpm build` y actualiza `docs/06-validaciones-y-testing.md` y `docs/09-avances-y-goals.md`.

Estado: completado el 2026-05-22.

Verificacion: se centralizo `validateFormData` en `lib/validations/form.ts`, se agrego `coercedPercentage`, se conectaron recursos/cotizaciones, presupuestos y builder APU a schemas Zod sin cambiar persistencia, y se agrego cobertura en `lib/validations/form.test.ts`. `pnpm lint`, `pnpm test`, `pnpm exec tsc --noEmit` y `pnpm build` ejecutados al cierre del goal.

### `/goal reportes-simples`

Implementa mÃ³dulo `/reportes` con reportes MVP simples: resumen por presupuesto, costos por grupo APU, recursos mÃ¡s costosos y totales por estado o proyecto si los datos disponibles lo permiten. Si todavÃ­a no hay persistencia, usar una fuente mock clara; si ya hay capa de datos, conectarlo a ella. Cuando existan versiones oficiales, los reportes formales deben priorizar la versiÃ³n oficial mÃ¡s reciente y distinguir borradores. Agregar navegaciÃ³n real desde Sidebar y botones relacionados. Ejecuta `pnpm lint`, `pnpm build` y actualiza `docs/09-avances-y-goals.md` y `docs/05-frontend-ui-ux.md`.

Estado: completado el 2026-05-22.

Verificacion: se agrego `lib/data/reports.ts` con agregaciones testeadas, ruta `/reportes`, navegacion real desde Sidebar/Topbar y acceso relacionado desde dashboard. `pnpm test -- --run lib/data/reports.test.ts`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build` ejecutados al cierre del goal.

### `/goal exportaciones-finales`

Mejora exportaciones Excel/PDF para el alcance final del MVP. Incluir presupuesto resumido, partidas, resumen financiero y, si el snapshot estÃ¡ disponible, detalle APU por partida. Las exportaciones formales deben salir de versiones oficiales congeladas; un borrador puede exportarse solo con etiqueta clara de borrador. Implementa exportaciÃ³n para cliente con estructura equivalente, precios cliente congelados, sin nombres de proveedores, y marcas rojas/notas cuando un recurso no tenga precio de proveedor visible para cliente. Agrega pruebas para filas exportadas, nombre de archivo y sanitizaciÃ³n/escaping HTML. Mantener soluciÃ³n simple y mantenible. Ejecuta `pnpm lint`, `pnpm test`, `pnpm build` y actualiza `docs/07-exportaciones.md` y `docs/09-avances-y-goals.md`.

Estado: completado el 2026-05-22.

Verificacion: se refactorizo `lib/exports/budget.ts` para soportar exportacion interna de borrador y version oficial, ambas con partidas, resumen financiero y detalle APU; la exportacion cliente mantiene precios cliente congelados, oculta proveedores y marca advertencias. La UI de `/presupuestos` distingue `PDF/Excel borrador`, `PDF/Excel oficial` y exportaciones cliente. `pnpm lint`, `pnpm test`, `pnpm build` y verificacion con `@Navegador` ejecutados al cierre del goal.

### `/goal ampliar-tests`

AmplÃ­a la suite de pruebas mÃ¡s allÃ¡ de cÃ¡lculos. Cubrir validaciones Zod, exportaciones, snapshots de presupuesto, versiones oficiales, auditorÃ­a, servicios de datos, cotizaciones multi-proveedor, precio cliente automÃ¡tico/fallback/override, precio autoactualizado/fijado, conflictos optimistas y casos de redondeo/precisiÃ³n monetaria. Mantener tests rÃ¡pidos y enfocados. Ejecuta `pnpm test`, `pnpm lint`, `pnpm build` y actualiza `docs/06-validaciones-y-testing.md` y `docs/09-avances-y-goals.md`.

Estado: completado el 2026-05-22.

Verificacion: se agregaron pruebas enfocadas para `lib/data/budgets.test.ts`, `lib/data/quotes.test.ts`, `lib/exports/budget.test.ts` y `lib/validations/form.test.ts`; se corrigieron `updateDraftLineMetrado` y el schema parcial de cotizaciones detectados por la nueva cobertura. `pnpm test`, `pnpm lint`, `pnpm build` y smoke con `@Navegador` ejecutados al cierre.

## Regla de cierre para cada goal

Cada goal con cambios funcionales debe terminar con:

```powershell
pnpm lint
pnpm build
```

AdemÃ¡s debe incluir:

- Resumen breve de archivos modificados.
- Estado de verificaciÃ³n.
- Pendientes restantes actualizados en este documento.
- DocumentaciÃ³n respectiva actualizada segÃºn lo que haya cambiado.
- Nota explÃ­cita si no se pudo ejecutar algÃºn comando.

Si el goal solo cambia documentaciÃ³n Markdown, puede omitirse `pnpm lint` y `pnpm build` indicando explÃ­citamente la razÃ³n.

## Regla general de actualizaciÃ³n documental

Al terminar una o varias tareas, se debe actualizar la documentaciÃ³n relacionada antes de considerar el trabajo cerrado. Como mÃ­nimo:

- Cambios de estado, avances o pendientes: actualizar este documento.
- Cambios posteriores al cierre del MVP colaborativo: actualizar `docs/10-post-mvp-goals.md`.
- Cambios de roadmap o prioridades: actualizar `docs/04-roadmap-mvp.md`.
- Cambios de arquitectura, stack, comandos o estructura: actualizar `AGENTS.md` y `docs/01-arquitectura.md`.
- Cambios de modelo de datos: actualizar `docs/02-modelo-datos.md`.
- Cambios de cÃ¡lculos: actualizar `docs/03-calculos.md`.
- Cambios de UI/UX: actualizar `docs/05-frontend-ui-ux.md`.
- Cambios de validaciones o testing: actualizar `docs/06-validaciones-y-testing.md`.
- Cambios de exportaciones: actualizar `docs/07-exportaciones.md`.
- Cambios de preparaciÃ³n productiva: actualizar `docs/08-produccion.md`.

### Chunk 5: Performance y reduccion de queries

Estado: completado el 2026-05-21.

Verificacion prevista al cierre: `pnpm run supabase:reset`, `pnpm run supabase:types`, `pnpm exec supabase test db supabase/tests/rls.sql`, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`.

Notas: se agregaron RPCs set-based para refresco de precios, recalculo de totales y dashboard; `createBrowserClient()` quedo como singleton; las rutas principales quedaron con wrapper Server Component y child cliente; `lib/data/workspace.ts` centraliza scope/roles; tablas, cronogramas y presupuestos reducen renders y recomputos con memoizacion enfocada.

### Chunk 6: Accesibilidad y consistencia UI

Estado: completado el 2026-05-21.

Verificacion prevista al cierre: `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm build` y smoke con navegador en rutas principales.

Notas: los modales compartidos tienen semantica/foco/teclado accesible; tablas agregan `scope="col"`; filtros de proveedores, recursos y partidas se reflejan en URL; presupuestos persiste la linea seleccionada; formularios principales usan `id/htmlFor` y bloquean campos durante guardado.
## Actualizacion 2026-05-25 - Multi-organizacion

- Cada usuario tiene una organizacion personal por defecto y puede crear organizaciones de empresa.
- El Topbar recuerda la organizacion/proyecto activos por navegador, lista proyectos como carpetas dentro de cada organizacion y crea proyectos mediante `create_project_in_organization`.
- `/configuracion/organizaciones` permite crear empresas, invitar colaboradores a organizacion con proyecto opcional, revocar/rechazar/aceptar invitaciones y copiar enlaces; Resend envia correo si `RESEND_API_KEY` esta configurado.
- Verificacion: `supabase db reset`, `supabase test db`, `vitest run`, `tsc --noEmit`, `next lint` y `next build` pasan.

### Ajuste UX multi-organizacion 2026-05-25

- Cambiar organizacion/proyecto desde el selector superior conserva la seccion actual cuando la ruta sigue siendo valida.
- El menu de perfil enlaza a `Mis organizaciones`; el Sidebar deja `Configuracion` para `/configuracion/proyecto`.
- Se reintrodujo el boton de notificaciones para invitaciones recibidas, con acciones de aceptar/rechazar.
- Verificacion: `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test`, `pnpm build` y smoke con Browser en local.

### Ajuste permisos multi-proyecto 2026-05-25

- Las invitaciones ahora permiten seleccionar varios proyectos actuales y activar inclusion automatica en proximos proyectos.
- El formulario de invitacion acepta multiples correos separados por espacios, comas o saltos de linea y crea una invitacion individual por correo con los mismos permisos.
- Los admins de organizacion quedan con todos los proyectos actuales/futuros marcados y bloqueados por defecto.
- Los roles visibles de proyecto se simplificaron a `Lector`, `Editor` y `Admin`; `presupuestador` queda solo como compatibilidad tecnica en el enum historico.
- RLS reconoce acceso global a proyectos por miembro de organizacion con rol predeterminado, incluyendo proyectos creados despues de aceptar la invitacion.
- Verificacion: `pnpm run supabase:reset`, `pnpm run supabase:types`, `pnpm exec supabase test db supabase/tests/rls.sql`, `pnpm exec tsc --noEmit` y smoke con Browser en local.

### Hotfix invitaciones 2026-05-25

- `RESEND_API_KEY` quedo documentado tambien en `.env.local` local como variable esperada.
- La lista de invitaciones enviadas muestra solo invitaciones pendientes.
- Owners/admins ven en Notificaciones las invitaciones aceptadas o rechazadas dentro de la organizacion activa.
- Verificacion: `pnpm run supabase:reset` aplico migraciones y seed localmente, pero cerro con aviso de healthcheck en Storage; luego pasaron `pnpm exec supabase test db supabase/tests/rls.sql`, `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test` y `pnpm build`.

### Gestion de permisos 2026-05-25

- `/configuracion/organizaciones` incorpora la seccion `Miembros y permisos` para owners/admins.
- Cada miembro muestra nombre, correo, rol de organizacion y resumen de acceso; al desplegarlo se editan rol de organizacion, acceso a todos/futuros proyectos, rol por defecto y proyectos especificos.
- Se agregaron RPCs `list_organization_member_permissions` y `update_organization_member_permissions` con validaciones para owner, self-edit, admins y proyectos dentro de la organizacion.
- RLS tests cubren listado/edicion por owner y bloqueo para miembros no admin.
- Verificacion: `pnpm run supabase:reset`, `pnpm run supabase:types`, `pnpm exec supabase test db supabase/tests/rls.sql`, `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test` y `pnpm build`.

### Hotfix admin de proyecto 2026-05-25

- Se agrego `can_manage_organization_catalog` para que un usuario con rol `Admin` en al menos un proyecto pueda gestionar proveedores, recursos, cotizaciones, partidas y APU de la organizacion.
- Recursos, Proveedores, Partidas y detalle APU ahora habilitan acciones si el usuario es admin de proyecto u organizacion.
- La policy de `activity_events` ahora permite auditoria de catalogo para admins de proyecto; esto evita el falso error post-guardado y vuelve a disparar broadcast realtime.
- Proveedores mantiene acciones separadas: activar/desactivar cambia estado, y eliminar intenta quitar fisicamente el proveedor solo si no hay historicos protegidos.
- Realtime en `/proveedores` aplica parches locales para eventos de proveedor externos: agrega, actualiza o quita solo la fila afectada y deja el refetch completo como fallback para eventos no cubiertos.
- Realtime en `/recursos` aplica parches locales para recursos, proveedores auxiliares y cotizaciones del recurso seleccionado; evita mover la tabla y usa recarga completa solo como fallback.
- Los toasts de actividad se cierran automaticamente a los 5 segundos, ademas de permitir cierre manual.
- La gestion de miembros, invitaciones y creacion de proyectos sigue limitada a owner/admin de organizacion.
- RLS tests cubren que un admin de proyecto puede crear/eliminar proveedor sin vinculos protegidos, crear recurso, crear partida y registrar auditoria de proveedor, mientras el lector vuelve a quedar sin ese permiso.
- Verificacion: `pnpm run supabase:reset`, `pnpm run supabase:types`, `pnpm exec supabase test db supabase/tests/rls.sql`, `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test` y `pnpm build`.
