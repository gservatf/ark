# Arquitectura

## Stack real instalado

- Next.js 14 App Router con React 18 y TypeScript.
- Tailwind CSS para estilos.
- Componentes propios con Tailwind.
- `lucide-react` para iconografía.
- `@supabase/supabase-js` como cliente preparado para Supabase/PostgreSQL.
- `@supabase/ssr` para autenticacion Supabase con cookies en App Router y middleware.
- Zod para validaciones.
- `xlsx` para exportación Excel.
- Vitest para pruebas unitarias de cálculos y lógica pura.

## Herramientas previstas

- Supabase CLI instalada como dev dependency (`supabase`) para desarrollo local, migraciones, reset, seed y generación de tipos.
- Docker Desktop validado para levantar Supabase local.
- React Hook Form para formularios persistentes; no está instalado todavía.
- TanStack Table solo si las tablas actuales necesitan ordenamiento/paginación avanzada; no está instalado.
- Recharts solo si el módulo de reportes lo justifica; no está instalado.
- shadcn/ui queda como opción futura si aporta valor sin complejidad innecesaria; no está instalado.
- PDF dedicado queda pendiente; el MVP mock usa vista HTML imprimible.

## Estructura real

```text
app/
  page.tsx
  recursos/
  proveedores/
  partidas/
  presupuestos/
  cronogramas/
  reportes/
components/
  layout/
  projects/
  shared/
  recursos/
  proveedores/
  partidas/
  presupuestos/
lib/
  calculations/
  data/
  exports/
  mock-data/
  supabase/
  validations/
types/
supabase/
  migrations/
  seed.sql
docs/
```

No existe todavía ruta real para `app/configuracion/` ni una pantalla dedicada de historial de precios.

## Rutas

Rutas existentes:

- `/`
- `/login`
- `/registro`
- `/recuperar-clave`
- `/actualizar-clave`
- `/onboarding`
- `/recursos`
- `/proveedores`
- `/partidas`
- `/partidas/[id]`
- `/presupuestos`
- `/presupuestos/[proyectoId]`
- `/cronogramas`
- `/reportes`

En desarrollo, `pnpm dev` ejecuta Next.js con `--hostname 0.0.0.0`, así que las rutas se pueden abrir desde la laptop con `http://127.0.0.1:3000/` o desde otro equipo de la misma red local con `http://<IP-LAN-DE-LA-LAPTOP>:3000/`.

Rutas pendientes:

- `/configuracion`
- Historial de precios como módulo dedicado.

## Capas

- UI: componentes visuales, formularios mock y tablas.
- Mock data: datos frontend en `lib/mock-data/` mientras no exista persistencia real.
- Validación: esquemas Zod reutilizables en `lib/validations/`.
- Capa de datos: repositorios y contratos en `lib/data/` para encapsular Supabase, errores, loading, scope organizacion/proyecto, mocks temporales y auditoria. Ya cubre proveedores, recursos, cotizaciones multi-proveedor, proyectos, organizaciones, invitaciones, permisos de miembros, actividad reciente y presupuestos/versiones; las mutaciones críticas de presupuestos, creación de proyectos y edición de permisos usan RPCs transaccionales en Postgres. `lib/data/budgets.ts` queda como fachada pública compatible sobre submódulos internos de presupuestos.
- Busqueda global: `lib/search/global.ts` construye resultados navegables para proyectos, partidas, recursos y proveedores desde datos ya autorizados por RLS.
- Realtime base: utilidades en `lib/realtime/` para topics privados, payloads de actividad, dedupe, debounce y suscripcion Broadcast.
- Datos persistentes: Supabase preparado en `lib/supabase/`; las pantallas no deben importarlo directamente cuando se conecten a persistencia.
- Autenticacion: Supabase Auth email/password y OAuth Google opcional con clientes SSR/browser, callback `/auth/callback`, middleware de sesion y onboarding minimo de perfil con organizacion personal automatica.
- Colaboración futura: Supabase/Postgres será la fuente de verdad para organizaciones, proyectos, borradores, versiones oficiales, auditoría y eventos persistidos.
- Cálculos: funciones puras para APU y presupuestos en `lib/calculations/`; cronogramas deberá agregar funciones puras para orden topológico, fechas, holgura y ruta crítica.
- Exportaciones: generación frontend de Excel y vista imprimible en `lib/exports/`.
- Tipos: contratos TypeScript compartidos en `types/domain.ts` y tipos Supabase en `lib/supabase/types.ts`.

## Arquitectura colaborativa planificada

La base de esquema para colaboración y su hardening Auth/RLS ya está preparada, pero su conexión real queda después de la capa de datos y CRUD persistente.

Decisiones base:

- Fuente de verdad: Postgres/Supabase. La UI no decide estado final sin persistencia.
- Ownership: `Organización -> Proyecto -> Miembros`, con roles por organización y por proyecto.
- Seguridad: todas las tablas públicas tienen RLS activo. `anon` no tiene policies de lectura/escritura; `authenticated` solo opera dentro de sus organizaciones/proyectos autorizados.
- Roles efectivos: `owner/admin` de organización administran todos sus proyectos; `admin/presupuestador/editor/lector` de proyecto controlan lectura, edición y emisión de versiones.
- Auditoría: tabla `activity_events` para registrar actor, entidad, acción, valores antes/después, campos modificados, proyecto, presupuesto y fecha.
- Realtime: Broadcast privado para avisar cambios persistidos, toasts e invalidación/refetch.
- Presence: usar canales efímeros para usuarios viendo/editando, sin persistirlo como historial.
- Conflictos: edición optimista con `updated_at`; si el registro cambió mientras se editaba, la capa de datos devuelve el valor local, el valor persistido y los campos cambiados antes de permitir sobrescritura explícita.
- Recalculo: cualquier actualización recibida debe pasar por la capa de datos y las funciones puras de `lib/calculations/`; no se agregan fórmulas financieras en componentes visuales.

No se usará Realtime como historial. Los eventos realtime pueden perderse o llegar tarde; la auditoría persistente y los datos guardados son la fuente confiable.

## Realtime base implementado

El flujo realtime base usa `activity_events` como puerta unica de salida:

1. Una mutacion guarda datos reales en Supabase mediante la capa `lib/data/`.
2. La misma mutacion registra auditoria en `public.activity_events`.
3. Un trigger `private.broadcast_activity_event` emite `realtime.send(...)` despues del insert auditado.
4. La UI recibe `activity_event` en canales privados y ejecuta refetch desde repositorios.

Topics activos:

- `org:{organizacion_id}` para Broadcast de dashboard, catalogos y CRUDs de organizacion.
- `project:{proyecto_id}` para Broadcast de presupuestos, borradores, lineas, recursos APU, totales y versiones.
- `presence:org:{organizacion_id}` y `presence:project:{proyecto_id}` para Presence efimero. Presence usa topics dedicados para no colisionar con el canal Broadcast cuando el cliente Supabase es singleton.

La autorizacion vive en RLS sobre `realtime.messages`: los topics `org:*` exigen membresia activa de organizacion y los topics `project:*` exigen `public.can_read_project(...)`. La UI instancia canales con `private: true`, actualiza el token inicial y los `TOKEN_REFRESHED` con `supabase.realtime.setAuth(...)`, y siempre trata Broadcast como aviso efimero. El payload no contiene snapshots completos ni datos financieros sensibles; solo IDs, entidad, accion, actor, metadata minima y fecha para decidir refetch/toast. Los clientes no publican Broadcast directo; solo el trigger SQL emite cambios persistidos.

## Presence y conflictos colaborativos

Presence usa topics privados dedicados, con RLS de lectura/escritura en `realtime.messages` para `presence`. La policy INSERT exige que `payload.actorId = auth.uid()` y el topic pertenezca a una organizacion/proyecto visible para el usuario. La UI publica estado minimo por usuario: actor, vista actual, objetivo visto/editado y timestamp. La identidad visible no se toma del payload: se resuelve desde `public.user_profiles`, tabla sincronizada desde `auth.users` y visible solo para miembros activos con organizacion compartida. Ese estado solo alimenta indicadores como "Maria esta editando esta partida" y no bloquea formularios.

La resolución de conflictos vive en `lib/data/`. Las mutaciones editables reciben `expectedUpdatedAt` desde la fila que el usuario tenía al empezar a editar y escriben con condición atómica sobre `updated_at`. Si no se actualiza ninguna fila, se consulta la versión persistida más reciente y se devuelve `DataError` con código `conflict`, detalle de campos modificados y snapshot persistido. La UI ofrece dos acciones: cargar remoto o aplicar la versión local sobre el valor persistido más reciente; si otro cambio entra en medio, el segundo intento vuelve a fallar con conflicto.

## Borradores y versiones oficiales

- Un proyecto puede tener un borrador colaborativo activo.
- El borrador es editable, puede recalcular con precios actuales y puede recibir cambios de varios usuarios.
- Agregar partidas y emitir versiones oficiales se ejecuta en RPCs SQL transaccionales (`add_draft_partida`, `emit_official_budget_version`) para bloquear el borrador, calcular `orden`/`numero_version`, congelar snapshots y auditar sin escrituras parciales.
- Las líneas del borrador pueden marcar precios fijados para no autoactualizarse con el catálogo.
- La migración garantiza un único borrador activo por proyecto mediante índice único parcial.
- Las líneas y recursos del borrador usan `precio_fijado`, `autoactualizar_precio`, `motivo_precio_fijado` y `precio_origen`.
- Al emitir un presupuesto formal se crea una versión oficial congelada.
- Las versiones oficiales conservan snapshots completos de partidas y recursos APU.
- Las versiones oficiales no tienen triggers de recalculo y quedan preparadas para congelar precio interno y precio cliente.
- El dashboard del proyecto muestra la versión oficial más reciente; si no hay versión oficial, muestra el borrador.

## Estado de Supabase

- Existe migración inicial en `supabase/migrations/20260514000000_initial_schema.sql`.
- Existe migración colaborativa en `supabase/migrations/20260515000000_collaborative_model.sql`.
- Existe seed data Perú en `supabase/seed.sql`, extendido con organización/proyecto demo, borrador activo y versión oficial congelada.
- Existe `supabase/config.toml`; Analytics está deshabilitado en local para evitar el requisito de Docker expuesto por TCP en Windows.
- Existe `.env.example` con valores guia para Supabase local, URL publica de app y `.env.local` local ignorado por Git.
- Existe cliente tipado en `lib/supabase/client.ts`.
- Existen clientes SSR/browser en `lib/supabase/server.ts` y `lib/supabase/browser.ts`, con compatibilidad entre `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Existe `middleware.ts` para proteger rutas y redirigir a `/login` u `/onboarding` según sesión y membresía.
- Existe hardening web base: headers de seguridad en `next.config.mjs`, middleware con matcher allowlist y timeout/fallback ante errores de Supabase.
- Existe migración Auth/RLS en `supabase/migrations/20260518000000_auth_rls_ownership.sql`.
- Existe migración multi-proveedor en `supabase/migrations/20260519155643_multi_provider_client_prices.sql`.
- Existe suite pgTAP de RLS en `supabase/tests/rls.sql`, incluyendo cotizaciones por organización y policies de lectura/escritura para Broadcast y Presence en topics privados de Realtime.
- Existe migración de integridad transaccional `supabase/migrations/20260520150000_budget_integrity_transactions.sql` con RPCs de presupuestos, bloqueo de cambio de organización de proyectos, defaults/policies de trazabilidad de borradores, validación de onboarding y whitelist/scope de auditoría.
- Existe migración preventiva `supabase/migrations/20260521155627_chunk7_refactor_hardening.sql` que re-declara la RPC de onboarding con `actor_id` y `set search_path = ''`.
- Existe migración `20260521172537_presence_dedicated_topics.sql` que autoriza topics dedicados de Presence (`presence:org:*`, `presence:project:*`) y evita que Realtime reutilice el canal Broadcast ya suscrito para el mismo proyecto/organización.
- Existe migración `20260522165506_create_project_activity_center.sql` con RPC transaccional para crear proyectos adicionales, membresía admin del creador y auditoría `entity_type = 'proyecto'`.
- Existe migración `20260525090532_onboarding_profile_workspace.sql` para que onboarding guarde nombre/apellido, actualice `user_profiles.display_name` y cree una organización vacía de ownership sin forzar proyecto inicial.
- Existe migración `20260525100520_multi_organization_invitations.sql` para distinguir organizaciones `personal | empresa`, resolver organizaciones/proyectos por organización activa, crear empresas, crear proyectos dentro del scope activo e invitar usuarios con varios proyectos seleccionados o acceso automatico a proyectos futuros.
- Existe migración `20260525163547_organization_member_permissions.sql` para listar la matriz de miembros/proyectos y actualizar roles de organizacion, acceso a todos los proyectos, rol por defecto y accesos especificos por proyecto con validaciones server-side.
- Los tipos de Supabase en `lib/supabase/types.ts` se generaron desde la base local con `pnpm run supabase:types`.
- Las migraciones y `supabase/seed.sql` fueron validadas con `pnpm run supabase:reset` en Supabase local.
- Existe capa base en `lib/data/` para proveedores, recursos, cotizaciones, partidas/APU, proyectos, actividad y presupuestos. La UI ya consulta y persiste estos módulos en Supabase; cronogramas sigue pendiente de persistencia.

## Estrategia Supabase local-first

Durante el desarrollo del backend, el proyecto debe trabajar primero contra Supabase local usando Supabase CLI y Docker. El proyecto remoto de Supabase queda reservado para staging, producción o migración final.

Flujo local:

- Ejecutar Supabase local con `pnpm run supabase:start`.
- Consultar URLs y claves públicas locales con `pnpm run supabase:status`.
- Aplicar migraciones pendientes con `pnpm run supabase:migrate`.
- Reiniciar la base, aplicar migraciones y cargar `supabase/seed.sql` con `pnpm run supabase:reset`.
- Configurar `.env.local` con `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321` y la clave pública local que entrega la CLI.
- Generar tipos desde la base local y actualizar `lib/supabase/types.ts` con `pnpm run supabase:types`.
- Detener el stack local con `pnpm run supabase:stop`.
- Mantener el esquema en migraciones versionadas, no en cambios manuales hechos en un panel remoto.

Cuando llegue la fase final, se creará o enlazará un proyecto Supabase remoto, se aplicarán las mismas migraciones, se configurarán variables de staging/producción y se validará con datos reales controlados.

## Reglas

- La UI no debe contener fórmulas financieras.
- Los snapshots se crean al agregar partidas al presupuesto; en el mock actual incluyen datos de partida y recursos APU por línea.
- Los cronogramas deben nacer desde presupuestos y sus partidas snapshot; la UI no debe calcular ruta crítica o fechas directamente si existe una función pura disponible.
- Los datos seed y mock no deben vivir dentro de componentes visuales.
- Las pantallas no deben exponer enlaces `#` ni botones activos sin acción real; las funciones pendientes deben quedar deshabilitadas o claramente informadas.
- El cliente Supabase usa `NEXT_PUBLIC_SUPABASE_URL` y prefiere `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; `NEXT_PUBLIC_SUPABASE_ANON_KEY` queda como fallback temporal.
- Los redirects de Auth usan `NEXT_PUBLIC_APP_URL`; si falta en local, la app cae a `http://127.0.0.1:3000`.
- OAuth Google usa `signInWithOAuth({ provider: "google" })` y `redirectTo = NEXT_PUBLIC_APP_URL/auth/callback`; el callback intercambia el `code` por sesión con `exchangeCodeForSession`.
- Las rutas de presupuestos por proyecto usan `/presupuestos/[proyectoId]`; el query param `?proyecto=` queda solo como compatibilidad temporal.
- El selector superior de proyecto y la búsqueda global deben navegar a rutas reales; no deben quedar como controles deshabilitados si ya existe dato persistente.
- En desarrollo persistente esas variables deben apuntar al Supabase local; las credenciales remotas se reservan para staging/producción.
- Mientras no exista CRUD persistente, las pantallas siguen usando datos mock.
- Las pantallas no deben acoplarse directamente al cliente Supabase; deben usar `lib/data/` o una capa superior basada en esos repositorios.
- La capa de datos exige `organizacionId` para proveedores/recursos, `actorId` para mutaciones auditadas y registra `activity_events` despues de cambios exitosos.
- Los errores crudos de Supabase no deben exponerse en producción; la capa de datos conserva solo detalles controlados necesarios para flujos como conflictos optimistas.
- Supabase Auth y RLS ya están implementados como requisito previo para datos reales.
- La colaboración realtime usa Broadcast privado desde auditoria persistida, Presence efímero y resolución optimista de conflictos con `updated_at`.

## Performance y reduccion de queries

- `lib/data/workspace.ts` concentra la resolucion de usuario, organizaciones disponibles, organizacion activa recordada en `localStorage`, proyectos, roles y `DataScope`; las rutas principales reutilizan ese resolver en vez de duplicar el waterfall de auth/membresias.
- En browser, `lib/data/workspace.ts` cachea la resolucion de workspace por instancia singleton de Supabase e invalida resultados fallidos, para que refetches Realtime y navegacion cliente no repitan `auth.getUser()` + membresias cuando el scope ya fue resuelto.
- Las rutas principales (`/`, `/proveedores`, `/recursos`, `/partidas`, `/partidas/[id]`, `/presupuestos`, `/presupuestos/[proyectoId]`) usan wrapper Server Component y child cliente para conservar formularios, Presence y mutaciones.
- `createBrowserClient()` es singleton module-level para no recrear cliente Supabase ni listeners de Auth en cada handler.
- La migracion `20260521143659_chunk5_performance_query_reduction.sql` agrega `refresh_draft_current_prices`, `refresh_draft_current_prices_for_resources`, `recalculate_budget_draft_totals` y `list_budget_dashboard_projects`.
- La migracion `20260521170219_chunk8_budget_recalculate_bundle.sql` hace que `recalculate_budget_draft_totals` devuelva el bundle actualizado de borrador para evitar un re-fetch completo en el camino normal.
- El dashboard obtiene agregados desde SQL; el refresco de precios y totales de borradores se ejecuta set-based en Postgres y respeta precios fijados, overrides cliente, vigencia de cotizaciones y proveedor activo.
