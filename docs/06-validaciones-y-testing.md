# Validaciones y Testing

## Validaciones con Zod

El proyecto ya cuenta con esquemas base en `lib/validations/` para:

- Recursos.
- Proveedores.
- Partidas.
- Recursos de partida.
- Presupuestos.
- LÃ­neas de presupuesto.
- Cotizaciones por recurso/proveedor.
- Override de precio cliente antes de emisiÃ³n oficial.
- Cronogramas futuro.
- Tareas y dependencias de cronograma futuro.

Los esquemas exportan contratos de entrada con `z.infer` para reutilizarlos en futuros formularios, flujos mock y capa de datos.

Estado actual:

- Zod estÃ¡ instalado.
- Los esquemas base existen.
- Proveedores ya usa validaciÃ³n Zod en su flujo persistente.
- Recursos ya usa validaciÃ³n Zod en su flujo persistente, con coerciÃ³n numÃ©rica para costos enviados desde formularios HTML.
- Partidas/APU ya usa validacion Zod en el CRUD persistente, con coercion numerica para rendimiento, jornada, desperdicio global de materiales, cuadrilla, cantidad base, porcentaje aplicado y orden.
- Los catalogos de cabecera de partidas tienen validaciones Zod para crear categorias, subcategorias y unidades desde el modal.
- Presupuestos usa validaciÃ³n de override cliente, schema estricto con allowlist para datos generales del borrador, controles persistentes desde la capa de datos, selecciÃ³n de cotizaciÃ³n cliente por recurso y reglas de precio fijado/autoactualizable.
- Cronogramas usa validaciÃ³n en la funciÃ³n pura `calculateSchedule` para duraciÃ³n, dependencias invÃ¡lidas, autodependencias y ciclos; queda pendiente formalizar esos contratos en esquemas Zod si el formulario crece o pasa a persistencia.

## Reglas generales

- Nombres obligatorios.
- Codigos opcionales en partidas; si existen, no pueden estar vacios y son unicos por organizacion.
- Unidades obligatorias.
- En recursos, la unidad se selecciona desde el mismo catalogo persistente usado por partidas, puede editarse desde el formulario y se guarda tambien como snapshot textual.
- Las categorias y unidades de partida se seleccionan desde catalogos persistentes; subcategoria es opcional y se filtra por categoria.
- Proyecto y versiÃ³n obligatorios en presupuestos.
- Costos no negativos.
- Costos de recursos y campos numericos de partidas/APU aceptan entradas de formulario tipo string y se convierten a nÃºmero antes de persistir.
- Metrados no negativos.
- Cantidades no negativas.
- Rendimiento de partida vacio usa default `1`; rendimiento `0` o negativo se rechaza.
- Jornada de partida vacia usa default `8` y debe ser mayor que `0`.
- Desperdicio global de materiales vacio usa default `5` y debe estar entre `0` y `100`.
- Recursos APU validan campos segun `tipo_calculo_apu`: cuadrilla para mano de obra/equipos `HM`, cantidad base para materiales/equipos fijos y porcentaje aplicado para herramientas manuales.
- Parciales, totales y orden no negativos.
- Strings obligatorios con lÃ­mite mÃ¡ximo por defecto para evitar payloads excesivos antes de Postgres.
- Porcentajes entre 0 y 100.
- Email vÃ¡lido cuando se registre.
- Email vacÃ­o tratado como dato ausente.
- RUC opcional en MVP, pero si existe debe tener 11 dÃ­gitos.
- ContraseÃ±as de Auth con mÃ­nimo 12 caracteres, minÃºscula, mayÃºscula y nÃºmero.
- Costos de cotizaciones por proveedor no negativos.
- Vigencia de cotizaciones consistente: `vigente_hasta` no puede ser anterior a `vigente_desde`.
- Override manual de precio cliente no negativo.
- DuraciÃ³n de tareas de cronograma obligatoria y mayor que 0 cuando no exista rendimiento usable; se permiten fracciones positivas.
- La fecha manual de inicio de cronograma no puede ser anterior al inicio del proyecto.
- Dependencias de cronograma entre tareas existentes.
- Una tarea no puede depender de sÃ­ misma.
- El grafo de dependencias del cronograma no puede tener ciclos.
- Una cotizaciÃ³n cliente seleccionada debe pertenecer a un recurso del presupuesto.
- Un recurso de borrador solo puede autoactualizarse si la lÃ­nea padre no estÃ¡ fijada, el recurso no estÃ¡ fijado, `autoactualizar_precio = true` y `precio_origen = 'catalogo'`.
- Agregar partidas y emitir versiones oficiales se valida server-side dentro de RPCs transaccionales; errores controlados se mapean a validaciÃ³n, conflicto, permisos o no encontrado.
- La auditorÃ­a `activity_events` solo acepta entidades de la whitelist inicial y `entity_id` existente dentro del scope informado.
- La auditoria acepta tambien `partida_categoria`, `partida_subcategoria` y `unidad_medida` para registrar altas de catalogos de partida.
- Las versiones oficiales usan nombre `NombreProyecto_Presupuesto_V{n}`.
- `disponible_para_cliente` debe ser booleano.
- Las mutaciones editables deben enviar `expectedUpdatedAt` y fallar con conflicto si el registro persistido cambiÃ³ desde que el usuario empezÃ³ a editar.

## Testing unitario

El proyecto usa Vitest como runner mÃ­nimo de pruebas unitarias.

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
- `calculateSchedule` para orden topolÃ³gico, fechas, holgura, ruta crÃ­tica, paralelos y errores de dependencias.
- Contratos de capa de datos para proveedores y recursos: validaciÃ³n previa a Supabase, auditorÃ­a, desactivaciÃ³n e historial de precios.
- Contratos de capa de datos para partidas/APU: codigo opcional, defaults de rendimiento/jornada/desperdicio, creacion sin APU, creacion con APU completo, calculo de parciales/subtotales, auditoria, desactivacion y eliminacion de relaciones APU.
- CoerciÃ³n numÃ©rica Zod para costos de recursos.
- Coercion numerica Zod para rendimiento, jornada, desperdicio global y recursos APU.
- SelecciÃ³n de precio cliente visible mÃ¡s caro usando `costo_unitario + costo_transporte`.
- Filtrado de cotizaciones por vigencia y exclusiÃ³n de proveedores inactivos en precios internos/cliente.
- Fallback al precio general mÃ¡s caro con advertencia.
- Override manual como precio cliente congelable.
- ExportaciÃ³n cliente sin revelar proveedores y con escaping HTML.
- Helpers de presupuestos para nombre oficial, regla de autoactualizaciÃ³n de precios, RPC de emisiÃ³n oficial, RPC de agregar partida y allowlist de actualizaciÃ³n de borrador.
- Mutaciones crÃ­ticas de presupuesto para selecciÃ³n de cotizaciÃ³n cliente y override manual de precio cliente.
- Guardia para impedir emitir versiÃ³n oficial de un borrador vacÃ­o.
- Lectura de versiones oficiales congeladas con lÃ­neas y recursos snapshot.
- Mutaciones de presupuesto para metrado, eliminaciÃ³n de lÃ­neas, precio fijado/liberado por lÃ­nea o recurso, auditorÃ­a y conflictos optimistas.
- Repositorio de cotizaciones multi-proveedor: listado ordenado, creaciÃ³n, ediciÃ³n, desactivaciÃ³n, limpieza de preferida interna, auditorÃ­a, refresco de borradores afectados y conflictos optimistas.
- Redondeo monetario a 2 decimales en cÃ¡lculos APU, presupuesto y exportaciÃ³n cliente.
- ExportaciÃ³n cliente con orden estable, fallback a precio interno congelado cuando falta precio cliente snapshot, ocultamiento de proveedores y precisiÃ³n monetaria en totales.
- Validaciones Zod para defaults de cotizaciones, rangos 0/100, vigencia invÃ¡lida, schemas estrictos y campos extra rechazados.
- Paralelos de cronograma agrupados por solapamiento real, fecha manual anterior rechazada y duraciÃ³n fraccionaria positiva permitida.
- Helpers de Realtime para topics privados, parseo de payload, dedupe de eventos y mensajes toast.
- Helpers de Presence para nombre visible, parseo de usuarios conectados y mensajes de ediciÃ³n concurrente.
- Presence oculta nombre/email de perfiles sin email verificado y cae a identidad colaborativa genÃ©rica.
- Helpers de conflictos optimistas para detectar campos persistidos cambiados y exponer detalles de resoluciÃ³n.
- Helpers de seguridad Auth para sanitizar `next`, construir URLs pÃºblicas de Auth y validar contraseÃ±as.
- SanitizaciÃ³n de celdas Excel contra fÃ³rmula injection.
- RLS pgTAP para cotizaciones por organizaciÃ³n, lectura/escritura por rol, aislamiento de usuarios externos, integridad de proyectos, trazabilidad de borradores, onboarding, auditorÃ­a validada y RPCs transaccionales de presupuestos.
- RLS pgTAP para topics privados `org:*` y `project:*` en `realtime.messages`, incluyendo Broadcast y Presence.

Pendiente de ampliar:

- Validaciones Zod restantes en cronogramas persistentes y formularios de presupuestos si crecen.
- Snapshots de presupuesto en casos de restauraciÃ³n/comparaciÃ³n.
- Capa de datos/repositorios para cronogramas persistentes.
- Borrador colaborativo vs versiones oficiales congeladas en escenarios multiusuario.
- Escenarios integrados de UI para precio autoactualizado vs precio fijado en lÃ­neas/recursos de borrador.
- Escenarios integrados de UI para resolver conflictos optimistas en mÃºltiples formularios.
- Pruebas integradas adicionales de snapshots histÃ³ricos en escenarios multiusuario.
- Validaciones Zod formales para cronogramas cuando exista persistencia o formularios mÃ¡s complejos.

## Escenarios manuales

- Crear proveedor.
- Crear recurso con proveedor.
- Editar costo de recurso y verificar historial.
- Crear partida sin APU.
- Crear una categoria, subcategoria y unidad desde los dropdowns del modal de partida y confirmar que quedan seleccionadas y persistidas.
- Crear partida/APU con mano de obra, materiales, equipos `HM`, equipos fijos y herramientas manuales.
- Ver costo directo y precio unitario.
- Crear presupuesto.
- Agregar partida al presupuesto.
- Cambiar metrado y verificar total.
- Editar recurso original y confirmar que presupuesto anterior no cambia.
- Editar recurso original y confirmar que un borrador sin precio fijado recalcula o avisa segÃºn corresponda.
- Editar recurso original y confirmar que una lÃ­nea con precio fijado no se autoactualiza.
- Generar versiÃ³n oficial y confirmar que queda congelada aunque cambie el catÃ¡logo.
- Crear cronograma desde un presupuesto y confirmar que cada partida se convierte en tarea inicial.
- Confirmar que una partida con rendimiento usable propone duraciÃ³n editable.
- Confirmar que una partida sin rendimiento exige duraciÃ³n manual antes de calcular Gantt.
- Agregar dependencias entre tareas y confirmar orden, fechas y tareas paralelas.
- Crear una dependencia cÃ­clica y confirmar que el sistema la bloquea con mensaje claro.
- Confirmar que la ruta crÃ­tica queda resaltada y que las tareas con holgura aparecen diferenciadas.
- Confirmar que un recurso con tres proveedores visibles usa el precio cliente mÃ¡s alto al emitir versiÃ³n oficial.
- Confirmar que un recurso con proveedores internos y visibles usa solo visibles para precio cliente.
- Confirmar que un recurso sin proveedor visible usa el precio mÃ¡s alto general, genera advertencia y marca la exportaciÃ³n cliente.
- Cambiar manualmente la cotizaciÃ³n cliente antes de emitir y confirmar que queda congelada.
- Confirmar que exportaciÃ³n normal y exportaciÃ³n cliente mantienen estructura equivalente, pero usan precios distintos.
- Simular dos usuarios editando el mismo campo y confirmar aviso de conflicto antes de sobrescribir.
- Simular dos usuarios con la misma organizacion y confirmar que un cambio auditado dispara toast/refetch realtime en dashboard y CRUDs.
- Simular dos usuarios en el mismo proyecto y confirmar que cambios de presupuesto actualizan partidas, APU, totales y dashboard por refetch.
- Confirmar que un usuario externo no puede suscribirse a topics realtime de otra organizacion/proyecto.
- Confirmar que cada cambio relevante crea evento de auditorÃ­a con actor, entidad, valores antes/despuÃ©s y fecha.
- Exportar presupuesto a Excel.
- Exportar presupuesto a PDF.

Mientras no exista persistencia, estos escenarios validan comportamiento mock/frontend y no supervivencia al recargar.

## Build

Antes de cerrar una etapa con cambios funcionales:

```powershell
pnpm lint
pnpm build
```

Si hay pruebas o cambios en lÃ³gica:

```powershell
pnpm test
```

Si una tarea solo modifica documentaciÃ³n Markdown, `pnpm lint` y `pnpm build` pueden omitirse con nota explÃ­cita en el cierre.

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

Se ampliÃ³ `lib/data/budgets.test.ts` para cubrir `selectDraftResourceClientQuote` y `overrideDraftClientPrice`. TambiÃ©n se agregÃ³ cobertura de Presence para perfiles sin email verificado y se mantuvo la suite de Realtime para confirmar que las mutaciones propias no disparan refetch redundante.

## Goal ampliar-tests

Estado: completado el 2026-05-22.

Se ampliÃ³ la suite unitaria a 19 archivos y 119 tests, manteniendo Vitest rÃ¡pido y sin depender de Supabase local/remoto. La cobertura nueva refuerza validaciones Zod, exportaciones, snapshots oficiales, auditorÃ­a, servicios de datos, cotizaciones multi-proveedor, precio cliente, locks de precio, conflictos optimistas y redondeo monetario.

Durante el goal se corrigieron dos contratos detectados por las pruebas: `updateDraftLineMetrado` ahora confirma el update con `select().maybeSingle()` antes de auditar/recalcular, y las actualizaciones parciales de cotizaciones usan un schema Zod especÃ­fico sin defaults implÃ­citos para no sobrescribir campos no enviados.

VerificaciÃ³n: `pnpm test`, `pnpm lint`, `pnpm build` y smoke con `@Navegador` ejecutados al cierre.
