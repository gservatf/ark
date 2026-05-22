# Validaciones y Testing

## Validaciones con Zod

El proyecto ya cuenta con esquemas base en `lib/validations/` para:

- Recursos.
- Proveedores.
- Partidas.
- Recursos de partida.
- Presupuestos.
- Líneas de presupuesto.
- Cotizaciones por recurso/proveedor.
- Override de precio cliente antes de emisión oficial.
- Cronogramas futuro.
- Tareas y dependencias de cronograma futuro.

Los esquemas exportan contratos de entrada con `z.infer` para reutilizarlos en futuros formularios, flujos mock y capa de datos.

Estado actual:

- Zod está instalado.
- Los esquemas base existen.
- Proveedores ya usa validación Zod en su flujo persistente.
- Recursos ya usa validación Zod en su flujo persistente, con coerción numérica para costos enviados desde formularios HTML.
- Partidas/APU ya usa validacion Zod en el CRUD persistente, con coercion numerica para rendimiento, cantidad, desperdicio, factor de rendimiento y orden.
- Presupuestos usa validación de override cliente, schema estricto con allowlist para datos generales del borrador, controles persistentes desde la capa de datos, selección de cotización cliente por recurso y reglas de precio fijado/autoactualizable.
- Cronogramas usa validación en la función pura `calculateSchedule` para duración, dependencias inválidas, autodependencias y ciclos; queda pendiente formalizar esos contratos en esquemas Zod si el formulario crece o pasa a persistencia.

## Reglas generales

- Nombres obligatorios.
- Códigos obligatorios cuando correspondan.
- Unidades obligatorias.
- Proyecto y versión obligatorios en presupuestos.
- Costos no negativos.
- Costos de recursos y campos numericos de partidas/APU aceptan entradas de formulario tipo string y se convierten a número antes de persistir.
- Metrados no negativos.
- Cantidades no negativas.
- Rendimientos y factores de rendimiento deben ser mayores que 0 cuando existan; vacío/null significa sin rendimiento usable.
- Parciales, totales y orden no negativos.
- Strings obligatorios con límite máximo por defecto para evitar payloads excesivos antes de Postgres.
- Porcentajes entre 0 y 100.
- Email válido cuando se registre.
- Email vacío tratado como dato ausente.
- RUC opcional en MVP, pero si existe debe tener 11 dígitos.
- Contraseñas de Auth con mínimo 12 caracteres, minúscula, mayúscula y número.
- Costos de cotizaciones por proveedor no negativos.
- Vigencia de cotizaciones consistente: `vigente_hasta` no puede ser anterior a `vigente_desde`.
- Override manual de precio cliente no negativo.
- Duración de tareas de cronograma obligatoria y mayor que 0 cuando no exista rendimiento usable; se permiten fracciones positivas.
- La fecha manual de inicio de cronograma no puede ser anterior al inicio del proyecto.
- Dependencias de cronograma entre tareas existentes.
- Una tarea no puede depender de sí misma.
- El grafo de dependencias del cronograma no puede tener ciclos.
- Una cotización cliente seleccionada debe pertenecer a un recurso del presupuesto.
- Un recurso de borrador solo puede autoactualizarse si la línea padre no está fijada, el recurso no está fijado, `autoactualizar_precio = true` y `precio_origen = 'catalogo'`.
- Agregar partidas y emitir versiones oficiales se valida server-side dentro de RPCs transaccionales; errores controlados se mapean a validación, conflicto, permisos o no encontrado.
- La auditoría `activity_events` solo acepta entidades de la whitelist inicial y `entity_id` existente dentro del scope informado.
- Las versiones oficiales usan nombre `NombreProyecto_Presupuesto_V{n}`.
- `disponible_para_cliente` debe ser booleano.
- Las mutaciones editables deben enviar `expectedUpdatedAt` y fallar con conflicto si el registro persistido cambió desde que el usuario empezó a editar.

## Testing unitario

El proyecto usa Vitest como runner mínimo de pruebas unitarias.

Comando:

```powershell
pnpm test
```

Tests existentes:

- `calculateApuResourcePartial`.
- `calculateApuDirectCost`.
- `calculateApuUnitPrice`.
- `calculateBudgetLinePartial`.
- `calculateBudgetTotals`.
- `suggestScheduleDurationDays`.
- `calculateSchedule` para orden topológico, fechas, holgura, ruta crítica, paralelos y errores de dependencias.
- Contratos de capa de datos para proveedores y recursos: validación previa a Supabase, auditoría, desactivación e historial de precios.
- Contratos de capa de datos para partidas/APU: validacion previa a Supabase, calculo de parcial, auditoria, desactivacion y eliminacion de relaciones APU.
- Coerción numérica Zod para costos de recursos.
- Coercion numerica Zod para rendimiento y recursos APU.
- Selección de precio cliente visible más caro usando `costo_unitario + costo_transporte`.
- Filtrado de cotizaciones por vigencia y exclusión de proveedores inactivos en precios internos/cliente.
- Fallback al precio general más caro con advertencia.
- Override manual como precio cliente congelable.
- Exportación cliente sin revelar proveedores y con escaping HTML.
- Helpers de presupuestos para nombre oficial, regla de autoactualización de precios, RPC de emisión oficial, RPC de agregar partida y allowlist de actualización de borrador.
- Mutaciones críticas de presupuesto para selección de cotización cliente y override manual de precio cliente.
- Guardia para impedir emitir versión oficial de un borrador vacío.
- Lectura de versiones oficiales congeladas con líneas y recursos snapshot.
- Mutaciones de presupuesto para metrado, eliminación de líneas, precio fijado/liberado por línea o recurso, auditoría y conflictos optimistas.
- Repositorio de cotizaciones multi-proveedor: listado ordenado, creación, edición, desactivación, limpieza de preferida interna, auditoría, refresco de borradores afectados y conflictos optimistas.
- Redondeo monetario a 2 decimales en cálculos APU, presupuesto y exportación cliente.
- Exportación cliente con orden estable, fallback a precio interno congelado cuando falta precio cliente snapshot, ocultamiento de proveedores y precisión monetaria en totales.
- Validaciones Zod para defaults de cotizaciones, rangos 0/100, vigencia inválida, schemas estrictos y campos extra rechazados.
- Paralelos de cronograma agrupados por solapamiento real, fecha manual anterior rechazada y duración fraccionaria positiva permitida.
- Helpers de Realtime para topics privados, parseo de payload, dedupe de eventos y mensajes toast.
- Helpers de Presence para nombre visible, parseo de usuarios conectados y mensajes de edición concurrente.
- Presence oculta nombre/email de perfiles sin email verificado y cae a identidad colaborativa genérica.
- Helpers de conflictos optimistas para detectar campos persistidos cambiados y exponer detalles de resolución.
- Helpers de seguridad Auth para sanitizar `next`, construir URLs públicas de Auth y validar contraseñas.
- Sanitización de celdas Excel contra fórmula injection.
- RLS pgTAP para cotizaciones por organización, lectura/escritura por rol, aislamiento de usuarios externos, integridad de proyectos, trazabilidad de borradores, onboarding, auditoría validada y RPCs transaccionales de presupuestos.
- RLS pgTAP para topics privados `org:*` y `project:*` en `realtime.messages`, incluyendo Broadcast y Presence.

Pendiente de ampliar:

- Validaciones Zod restantes en cronogramas persistentes y formularios de presupuestos si crecen.
- Snapshots de presupuesto en casos de restauración/comparación.
- Capa de datos/repositorios para cronogramas persistentes.
- Borrador colaborativo vs versiones oficiales congeladas en escenarios multiusuario.
- Escenarios integrados de UI para precio autoactualizado vs precio fijado en líneas/recursos de borrador.
- Escenarios integrados de UI para resolver conflictos optimistas en múltiples formularios.
- Pruebas integradas adicionales de snapshots históricos en escenarios multiusuario.
- Validaciones Zod formales para cronogramas cuando exista persistencia o formularios más complejos.

## Escenarios manuales

- Crear proveedor.
- Crear recurso con proveedor.
- Editar costo de recurso y verificar historial.
- Crear partida/APU con recursos.
- Ver costo directo y precio unitario.
- Crear presupuesto.
- Agregar partida al presupuesto.
- Cambiar metrado y verificar total.
- Editar recurso original y confirmar que presupuesto anterior no cambia.
- Editar recurso original y confirmar que un borrador sin precio fijado recalcula o avisa según corresponda.
- Editar recurso original y confirmar que una línea con precio fijado no se autoactualiza.
- Generar versión oficial y confirmar que queda congelada aunque cambie el catálogo.
- Crear cronograma desde un presupuesto y confirmar que cada partida se convierte en tarea inicial.
- Confirmar que una partida con rendimiento usable propone duración editable.
- Confirmar que una partida sin rendimiento exige duración manual antes de calcular Gantt.
- Agregar dependencias entre tareas y confirmar orden, fechas y tareas paralelas.
- Crear una dependencia cíclica y confirmar que el sistema la bloquea con mensaje claro.
- Confirmar que la ruta crítica queda resaltada y que las tareas con holgura aparecen diferenciadas.
- Confirmar que un recurso con tres proveedores visibles usa el precio cliente más alto al emitir versión oficial.
- Confirmar que un recurso con proveedores internos y visibles usa solo visibles para precio cliente.
- Confirmar que un recurso sin proveedor visible usa el precio más alto general, genera advertencia y marca la exportación cliente.
- Cambiar manualmente la cotización cliente antes de emitir y confirmar que queda congelada.
- Confirmar que exportación normal y exportación cliente mantienen estructura equivalente, pero usan precios distintos.
- Simular dos usuarios editando el mismo campo y confirmar aviso de conflicto antes de sobrescribir.
- Simular dos usuarios con la misma organizacion y confirmar que un cambio auditado dispara toast/refetch realtime en dashboard y CRUDs.
- Simular dos usuarios en el mismo proyecto y confirmar que cambios de presupuesto actualizan partidas, APU, totales y dashboard por refetch.
- Confirmar que un usuario externo no puede suscribirse a topics realtime de otra organizacion/proyecto.
- Confirmar que cada cambio relevante crea evento de auditoría con actor, entidad, valores antes/después y fecha.
- Exportar presupuesto a Excel.
- Exportar presupuesto a PDF.

Mientras no exista persistencia, estos escenarios validan comportamiento mock/frontend y no supervivencia al recargar.

## Build

Antes de cerrar una etapa con cambios funcionales:

```powershell
pnpm lint
pnpm build
```

Si hay pruebas o cambios en lógica:

```powershell
pnpm test
```

Si una tarea solo modifica documentación Markdown, `pnpm lint` y `pnpm build` pueden omitirse con nota explícita en el cierre.

## Chunk 5 - Performance y repositorios

El cierre de performance agrega cobertura pgTAP para las RPCs `refresh_draft_current_prices`, `refresh_draft_current_prices_for_resources`, `recalculate_budget_draft_totals` y `list_budget_dashboard_projects`, validando permisos y scope. En Vitest, `lib/data/budgets.test.ts` cubre llamadas RPC de dashboard/refresco y `lib/data/data.test.ts` confirma que auditoria ignora metadata tecnica en `getChangedFields`.

## Chunk 6 - Accesibilidad y URL state

Se agregaron pruebas unitarias para helpers puros de estado URL en `lib/ui/url-state.test.ts`, cubriendo parseo de filtros, descarte de valores invalidos, serializacion sin defaults y persistencia/remocion de parametros opcionales como `linea`.

La verificacion de accesibilidad visual/teclado se complementa con smoke en navegador: login demo, filtros con URL, refresh y modales con Tab/Shift+Tab/Escape.

## Goal validaciones-formularios-zod

Estado: completado el 2026-05-22.

Se centralizo el mapeo de errores de formularios en `lib/validations/form.ts` mediante `validateFormData`, para que los formularios reutilicen `safeParse` y reciban `{ data, errors }` sin repetir `flatten().fieldErrors` en cada pantalla.

Se agrego `coercedPercentage` en `lib/validations/shared.ts` y se reutilizo junto a los helpers numericos existentes para recursos, cotizaciones, presupuestos y builder APU. Los porcentajes de borrador, metrados y override manual de precio cliente ahora aceptan strings de inputs HTML y se validan con Zod antes de persistir.

Cobertura agregada en `lib/validations/form.test.ts`: recursos, cotizaciones, presupuestos, builder APU y helper central de errores por campo.

Verificacion: `pnpm lint`, `pnpm test`, `pnpm exec tsc --noEmit` y `pnpm build` ejecutados correctamente al cierre.

## Chunk 8 - Cierre de bugs

Se amplió `lib/data/budgets.test.ts` para cubrir `selectDraftResourceClientQuote` y `overrideDraftClientPrice`. También se agregó cobertura de Presence para perfiles sin email verificado y se mantuvo la suite de Realtime para confirmar que las mutaciones propias no disparan refetch redundante.

## Goal ampliar-tests

Estado: completado el 2026-05-22.

Se amplió la suite unitaria a 19 archivos y 119 tests, manteniendo Vitest rápido y sin depender de Supabase local/remoto. La cobertura nueva refuerza validaciones Zod, exportaciones, snapshots oficiales, auditoría, servicios de datos, cotizaciones multi-proveedor, precio cliente, locks de precio, conflictos optimistas y redondeo monetario.

Durante el goal se corrigieron dos contratos detectados por las pruebas: `updateDraftLineMetrado` ahora confirma el update con `select().maybeSingle()` antes de auditar/recalcular, y las actualizaciones parciales de cotizaciones usan un schema Zod específico sin defaults implícitos para no sobrescribir campos no enviados.

Verificación: `pnpm test`, `pnpm lint`, `pnpm build` y smoke con `@Navegador` ejecutados al cierre.
