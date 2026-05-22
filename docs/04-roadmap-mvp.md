# Roadmap MVP

Este documento define el objetivo general del MVP. El seguimiento operativo de avances, pendientes y prompts `/goal` vive en [Avances, pendientes y goals](09-avances-y-goals.md). El backlog posterior al MVP vive en [Post-MVP, feature complete y goals](10-post-mvp-goals.md).

## Estado resumido

El MVP avanza con frontend funcional, cronogramas mock, cÃ¡lculos, validaciones base, exportaciones, Supabase local-first, Auth/RLS, CRUD persistente de proveedores/recursos, cotizaciones multi-proveedor y presupuestos persistentes con versiones oficiales. TodavÃ­a faltan partidas/APU persistentes, cronogramas persistentes, reportes y Realtime.

La direcciÃ³n colaborativa queda definida desde ahora: Supabase/Postgres serÃ¡ la base para borradores colaborativos, auditorÃ­a completa, versiones oficiales congeladas, Realtime, presencia y resoluciÃ³n optimista de conflictos. La implementaciÃ³n realtime queda despuÃ©s de preparar modelo, auth/RLS y CRUD persistente.

Seguir todos los goals de `docs/09-avances-y-goals.md` debe llevar a un **MVP persistente colaborativo**, no a un producto feature complete final. Las etapas de producciÃ³n final, administraciÃ³n SaaS, importaciÃ³n masiva, aprobaciones avanzadas, reportes avanzados, observabilidad, performance y billing se gestionan en `docs/10-post-mvp-goals.md`.

TambiÃ©n entra en el MVP colaborativo el modelo multi-proveedor: recursos canÃ³nicos con mÃºltiples cotizaciones por proveedor, proveedores marcados como disponibles para cliente y exportaciÃ³n de presupuesto para cliente con precios cliente congelados.

Antes de conectar la UI a Supabase tambiÃ©n entra un mÃ³dulo de cronogramas mock. El flujo objetivo queda `Recursos -> Partidas/APU -> Presupuestos -> Cronogramas -> Reportes`. El cronograma debe nacer desde partidas presupuestadas, proponer duraciÃ³n cuando exista metrado y rendimiento usable, exigir duraciÃ³n manual cuando el rendimiento estÃ© vacÃ­o, permitir dependencias simples y mostrar Gantt, ruta crÃ­tica y tareas paralelas.

## Etapa 1: Base del proyecto

Estado: en progreso avanzado.

Hecho:

- App Next.js 14 App Router con React 18, TypeScript y pnpm.
- Tailwind CSS configurado.
- `lucide-react` instalado.
- Alias y estructura base de carpetas.
- Layout base con `AppLayout`, `Sidebar` y `Topbar`.
- Dashboard real en `/` con datos mock.

Pendiente:

- Mantener documentaciÃ³n y reglas del repo actualizadas.
- Evaluar shadcn/ui solo si aporta valor real sin complejidad innecesaria.

## Etapa 2: Modelo y datos

Estado: en progreso avanzado.

Hecho:

- Tipos TypeScript principales en `types/domain.ts`.
- MigraciÃ³n inicial Supabase con tablas mÃ­nimas, relaciones, checks, triggers e Ã­ndices.
- MigraciÃ³n colaborativa Supabase con organizaciones, miembros, proyectos, roles, `activity_events`, borradores vivos, versiones oficiales congeladas y campos de precio fijado/autoactualizable.
- Seed data PerÃº con proveedores, recursos, historial, partidas/APU, presupuesto demo legacy, organizaciÃ³n/proyecto demo, borrador activo y versiÃ³n oficial congelada.
- Cliente Supabase tipado en `lib/supabase/`.
- `.env.example`, `.env.local` local ignorado, `supabase/config.toml` y scripts pnpm para Supabase local.
- Migraciones y seed validados con Supabase local; tipos generados desde la base local.

Pendiente:

- Conectar partidas/APU y cronogramas a persistencia.
- Mantener RLS/auth y tipos Supabase sincronizados con cada cambio de esquema.

DecisiÃ³n de entorno:

- El backend persistente se desarrollarÃ¡ primero contra Supabase local.
- El proyecto Supabase remoto se usarÃ¡ reciÃ©n para staging, producciÃ³n o migraciÃ³n final.
- Las migraciones versionadas del repo serÃ¡n la fuente de verdad tanto para local como para remoto.

## Etapa 3: CÃ¡lculos y validaciones

Estado: en progreso avanzado.

Hecho:

- Funciones puras de cÃ¡lculo APU.
- Funciones puras de cÃ¡lculo de presupuesto.
- Vitest configurado con pruebas de cÃ¡lculos.
- Esquemas Zod base en `lib/validations/`.

Pendiente:

- Conectar Zod a todos los formularios cuando se avance hacia CRUD persistente.
- Ampliar pruebas de validaciones, exports, snapshots y capa de datos.

## Etapa 4: UI base

Estado: en progreso avanzado.

Hecho:

- Layout base y navegaciÃ³n principal.
- Componentes propios con Tailwind.
- `Button` y `StatCard` reutilizables.
- Dashboard `/` y pantallas mock principales.
- Limpieza de affordances falsas en mÃ³dulos completados: sin enlaces `#`; acciones pendientes deshabilitadas o conectadas a rutas reales.

Pendiente:

- Crear componentes compartidos mÃ­nimos: `PageHeader`, `EmptyState`, `LoadingState`, `ConfirmDialog` y, si aporta claridad, `DataTable`.
- Hacer revisiÃ³n responsive amplia si se requieren ajustes finos adicionales.

## Etapa 5: CRUDs base

Estado: en progreso persistente avanzado.

Hecho:

- `/recursos` con bÃºsqueda, filtros, formulario visual, activaciÃ³n/inactivaciÃ³n mock e historial visual de precios.
- `/proveedores` conectado a Supabase con CRUD, bÃºsqueda, formulario reutilizable, visibilidad cliente y estados vacÃ­os.
- `/recursos` conectado a Supabase con CRUD, historial de precios y cotizaciones por proveedor.

Pendiente:

- Conectar partidas/APU a capa de datos Supabase.

## Etapa 6: Partidas/APU

Estado: en progreso persistente inicial.

Hecho:

- `/partidas` con listado, filtros y mÃ©tricas.
- `/partidas/[id]` con detalle y builder APU editable en memoria.
- CÃ¡lculos reales por grupo, costo directo y precio unitario.

Pendiente:

- CRUD persistente de partidas/APU.
- Validaciones Zod conectadas al builder.
- Persistencia de recursos APU asociados.

## Etapa 7: Presupuestos

Estado: en progreso avanzado mock.

Hecho:

- `/presupuestos` con flujo persistente sobre borrador activo.
- Cargar presupuesto desde Supabase.
- Agregar partidas existentes.
- Editar metrados.
- Eliminar lÃ­neas.
- Recalcular totales.
- Congelar snapshots de partida y snapshots completos de recursos APU por lÃ­nea.
- Revisar precios cliente, mostrar advertencias de fallback y aplicar override manual.
- Emitir versiones oficiales congeladas.

Pendiente:

- Pulir flujo multi-proyecto, conflictos optimistas y dashboard con versiÃ³n oficial vigente o borrador.

## Etapa 8: Cronogramas

Estado: planificada mock, previa a Supabase.

Pendiente:

- Implementar `/cronogramas`.
- Seleccionar presupuesto fuente.
- Generar tareas iniciales desde partidas presupuestadas.
- Permitir editar fecha de inicio, duraciÃ³n y dependencias fin-a-inicio.
- Sugerir duraciÃ³n con metrado/rendimiento cuando exista rendimiento usable.
- Exigir duraciÃ³n manual cuando la partida no tenga rendimiento.
- Calcular orden topolÃ³gico, fechas inicio/fin, holgura, tareas paralelas y ruta crÃ­tica con funciones puras.
- Detectar ciclos o dependencias invÃ¡lidas con mensajes claros.
- Mostrar Gantt simple y lista de tareas en orden.

## Etapa 9: ColaboraciÃ³n realtime

Estado: resuelta avanzada, pendiente de refinamientos UI/e2e.

Hecho:

- Conectar la aplicaciÃ³n a la auditorÃ­a general `activity_events`.
- Usar Broadcast para toasts, invalidaciÃ³n/refetch y cambios casi inmediatos.
- Mantener Realtime como transporte de avisos, no como historial.
- Usar Presence para usuarios viendo/editando.
- Manejar conflictos con edición optimista y avisos claros.

Pendiente:

- Agregar pruebas end-to-end futuras para escenarios multiusuario reales.

## Etapa 10: Reportes y exportaciones

Estado: en progreso inicial.

Hecho:

- ExportaciÃ³n mock a Excel con `xlsx`.
- Vista HTML imprimible para guardar PDF desde navegador.

Pendiente:

- Implementar `/reportes`.
- Mejorar exportaciones finales.
- Mejorar exportaciones finales con plantillas y anexos APU si aplica.
- Agregar pruebas de exportaciÃ³n y sanitizaciÃ³n/escaping.
- Incluir detalle APU en exportaciones finales cuando aplique.

## Etapa 11: Pulido final

Estado: pendiente.

Hecho:

- `pnpm lint`, `pnpm test`, `pnpm exec tsc --noEmit` y `pnpm build` han pasado en verificaciones previas.
- VerificaciÃ³n visual headless inicial realizada en pantallas mock principales.

Pendiente:

- RevisiÃ³n visual amplia en navegador.
- Responsive fino en laptop/desktop.
- Accesibilidad bÃ¡sica.
- Limpieza final previa a producciÃ³n.


