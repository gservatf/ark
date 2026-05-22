# Cálculos

## Principios

- Las funciones de cálculo deben ser puras y testeables.
- La UI solo debe invocar funciones de cálculo y mostrar resultados.
- Los costos y porcentajes no pueden ser negativos.
- Los porcentajes deben estar entre 0 y 100 salvo decisión técnica explícita.
- La moneda del MVP es `PEN`.
- Las funciones lanzan `RangeError` cuando reciben valores no finitos, negativos o porcentajes fuera de rango.
- Las salidas monetarias públicas de cálculo se redondean a 2 decimales para evitar drift de floating point.
- Los recalculos de borradores colaborativos y actualizaciones recibidas por Realtime deben seguir usando estas funciones puras; la colaboración no debe introducir fórmulas financieras en componentes visuales.

## Archivos

- `lib/calculations/apu.ts`
- `lib/calculations/budget.ts`
- `lib/calculations/schedule.ts`
- `lib/calculations/apu.test.ts`
- `lib/calculations/budget.test.ts`
- `lib/calculations/schedule.test.ts`

## Funciones APU

- `calculateApuResourcePartial`
- `calculateApuDirectCost`
- `calculateApuUnitPrice`

### Parcial de recurso APU

```text
base = cantidad * costo_unitario_snapshot
transporte = cantidad * costo_transporte_snapshot
desperdicio = base * desperdicio_porcentaje / 100
parcial = base + transporte + desperdicio
```

`rendimiento_factor` no multiplica ni divide el parcial financiero. Queda como dato informativo o de planificación; si en el futuro se convierte rendimiento a cantidad, esa conversión debe ser explícita antes de llamar al cálculo financiero.

### Costo directo APU

```text
costo_materiales = suma parciales grupo materiales
costo_mano_obra = suma parciales grupo mano_obra
costo_equipos_herramientas = suma parciales grupo equipos_herramientas
costo_directo = costo_materiales + costo_mano_obra + costo_equipos_herramientas
```

### Precio unitario APU

```text
gastos_generales = costo_directo * gastos_generales_porcentaje / 100
utilidad = costo_directo * utilidad_porcentaje / 100
precio_unitario = costo_directo + gastos_generales + utilidad
```

En partidas/APU persistentes, el valor persistido por recurso es el `parcial`; el costo directo y el precio unitario se derivan al consultar o renderizar. Los porcentajes de gastos generales y utilidad no se guardan por partida: pertenecen al presupuesto total y se calculan con `calculateBudgetTotals` sobre el subtotal de todas las partidas. El detalle APU puede mostrar una simulacion editable para revisar sensibilidad, sin convertirla en dato oficial de la partida.

## Funciones presupuesto

- `calculateBudgetLinePartial`
- `calculateBudgetTotals`
- `shouldAutoUpdateDraftResourcePrice` como regla de capa de datos para decidir si un recurso vivo del borrador puede refrescarse con precios vigentes.

### Parcial de línea

```text
parcial_partida = metrado * precio_unitario_snapshot
```

### Totales

```text
subtotal = suma de parciales
gastos_generales_total = subtotal * gastos_generales_porcentaje / 100
utilidad_total = subtotal * utilidad_porcentaje / 100
subtotal_con_margen = subtotal + gastos_generales_total + utilidad_total
igv_total = subtotal_con_margen * igv_porcentaje / 100
total = subtotal_con_margen + igv_total
```

## Recalculo de borradores persistentes

Cuando se agrega una partida, se refrescan precios vigentes o se cambia un metrado, la capa `lib/data/budgets.ts` recalcula en este orden:

1. Parciales de recursos APU con `calculateApuResourcePartial`.
2. Costo directo de la línea con `calculateApuDirectCost`.
3. Precio unitario de la línea como costo directo APU, sin gastos generales ni utilidad dentro del APU.
4. Parcial de línea con `calculateBudgetLinePartial`.
5. Totales del borrador con `calculateBudgetTotals`.

Una línea con `precio_fijado = true` conserva su precio unitario. Un recurso solo se refresca si la línea padre no está fijada, el recurso no está fijado, `autoactualizar_precio = true` y `precio_origen = 'catalogo'`.

La versión oficial no ejecuta fórmulas contra el catálogo vivo al emitirse: copia los valores vigentes del borrador y congela precio interno, precio cliente, origen, cotizaciones, advertencias y motivos de precio fijado.

## Redondeo

- Redondear a 2 decimales al devolver parciales y totales monetarios públicos.
- Los totales de presupuesto se calculan desde parciales ya redondeados y devuelven subtotal, márgenes, IGV y total redondeados.
- Evitar introducir redondeos adicionales en UI o componentes visuales.

## Funciones cronograma

El módulo de cronogramas usa funciones puras y testeables, sin lógica de planificación embebida en componentes visuales.

Funciones implementadas:

- `suggestScheduleDurationDays`
- `calculateSchedule`

### Duración sugerida

```text
duracion_sugerida_dias = ceil(metrado / rendimiento)
```

La duración sugerida solo aplica si `metrado > 0` y `rendimiento > 0`. Si el rendimiento está vacío, no finito o en cero, el usuario debe ingresar duración manual.

### Dependencias MVP

El MVP usa dependencias fin-a-inicio y días calendario:

```text
inicio_sucesora >= fin_predecesora
fecha_fin = fecha_inicio + duracion_dias - 1
```

Una tarea sin dependencias puede iniciar en la fecha base del cronograma. Si tiene fecha de inicio manual posterior a sus dependencias, se respeta esa fecha; si es anterior a sus dependencias, prevalece la restricción de dependencias. Si la fecha manual es anterior al inicio del proyecto, el cálculo lanza error. Varias tareas que solapan sus intervalos se agrupan como paralelas aunque tengan distinta profundidad de dependencias.

### Orden, validaciones y errores

`calculateSchedule` valida que:

- Todas las tareas tengan duración mayor que 0; se permiten fracciones positivas como `0.5`.
- La fecha manual de inicio no sea anterior a la fecha base del proyecto.
- Las dependencias apunten a tareas existentes.
- Una tarea no dependa de sí misma.
- No existan ciclos en el grafo de dependencias.

El orden topológico se devuelve para que la UI liste una secuencia recomendada sin recalcular dependencias.

### Ruta crítica

La ruta crítica se define como el conjunto de tareas con holgura cero dentro del camino que determina la fecha fin del cronograma.

```text
holgura = inicio_tardio - inicio_temprano
tarea_critica = holgura == 0
```

La función devuelve fechas tempranas, fechas tardías, holgura, tareas críticas, duración total del cronograma y grupos paralelos para que la UI solo renderice resultados.
