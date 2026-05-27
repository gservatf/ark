# CÃ¡lculos

## Principios

- Las funciones de cÃ¡lculo deben ser puras y testeables.
- La UI solo debe invocar funciones de cÃ¡lculo y mostrar resultados.
- Los costos y porcentajes no pueden ser negativos.
- Los porcentajes deben estar entre 0 y 100 salvo decisiÃ³n tÃ©cnica explÃ­cita.
- La moneda del MVP es `PEN`.
- Las funciones lanzan `RangeError` cuando reciben valores no finitos, negativos o porcentajes fuera de rango.
- Las salidas monetarias pÃºblicas de cÃ¡lculo se redondean a 2 decimales para evitar drift de floating point.
- Los recalculos de borradores colaborativos y actualizaciones recibidas por Realtime deben seguir usando estas funciones puras; la colaboraciÃ³n no debe introducir fÃ³rmulas financieras en componentes visuales.

## Archivos

- `lib/calculations/apu.ts`
- `lib/calculations/budget.ts`
- `lib/calculations/schedule.ts`
- `lib/calculations/apu.test.ts`
- `lib/calculations/budget.test.ts`
- `lib/calculations/schedule.test.ts`

## Funciones APU

- `calculateApuResourcePartial`
- `calculateApuResourceValues`
- `calculateApuDirectCost`
- `calculateApuUnitPrice`

### Cantidad y parcial de recurso APU

El APU se calcula desde el contexto de la partida: `rendimiento` default `1`, `jornada_horas` default `8` y `desperdicio_materiales_porcentaje` default `5`.

```text
mano_obra_rendimiento:
cantidad = cuadrilla * jornada_horas / rendimiento
parcial = cantidad * (costo_unitario_snapshot + costo_transporte_snapshot)

material_desperdicio:
cantidad = cantidad_base * (1 + desperdicio_materiales_porcentaje / 100)
parcial = cantidad * (costo_unitario_snapshot + costo_transporte_snapshot)

equipo_hm_rendimiento:
cantidad = cuadrilla * jornada_horas / rendimiento
parcial = cantidad * (costo_unitario_snapshot + costo_transporte_snapshot)

equipo_cantidad_fija:
cantidad = cantidad_base
parcial = cantidad * (costo_unitario_snapshot + costo_transporte_snapshot)

herramientas_porcentaje_mano_obra:
parcial = subtotal_mano_obra * porcentaje_aplicado / 100
```

La cantidad final queda en `cantidad`; para materiales, `cantidad_base` es la cantidad sin desperdicio. Para herramientas manuales, el default de `porcentaje_aplicado` es `3`.

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

### Parcial de lÃ­nea

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

1. Cantidades y parciales de recursos APU con `calculateApuResourceValues`.
2. Costo directo de la lÃ­nea con `calculateApuDirectCost`.
3. Precio unitario de la lÃ­nea como costo directo APU, sin gastos generales ni utilidad dentro del APU.
4. Parcial de lÃ­nea con `calculateBudgetLinePartial`.
5. Totales del borrador con `calculateBudgetTotals`.

Una lÃ­nea con `precio_fijado = true` conserva su precio unitario. Un recurso solo se refresca si la lÃ­nea padre no estÃ¡ fijada, el recurso no estÃ¡ fijado, `autoactualizar_precio = true` y `precio_origen = 'catalogo'`.

La versiÃ³n oficial no ejecuta fÃ³rmulas contra el catÃ¡logo vivo al emitirse: copia los valores vigentes del borrador y congela precio interno, precio cliente, origen, cotizaciones, advertencias y motivos de precio fijado.

## Redondeo

- Redondear a 2 decimales al devolver parciales y totales monetarios pÃºblicos.
- Los totales de presupuesto se calculan desde parciales ya redondeados y devuelven subtotal, mÃ¡rgenes, IGV y total redondeados.
- Evitar introducir redondeos adicionales en UI o componentes visuales.

## Funciones cronograma

El mÃ³dulo de cronogramas usa funciones puras y testeables, sin lÃ³gica de planificaciÃ³n embebida en componentes visuales.

Funciones implementadas:

- `suggestScheduleDurationDays`
- `calculateSchedule`

### DuraciÃ³n sugerida

```text
duracion_sugerida_dias = ceil(metrado / rendimiento)
```

La duraciÃ³n sugerida solo aplica si `metrado > 0` y `rendimiento > 0`. Si el rendimiento estÃ¡ vacÃ­o, no finito o en cero, el usuario debe ingresar duraciÃ³n manual.

### Dependencias MVP

El MVP usa dependencias fin-a-inicio y dÃ­as calendario:

```text
inicio_sucesora >= fin_predecesora
fecha_fin = fecha_inicio + duracion_dias - 1
```

Una tarea sin dependencias puede iniciar en la fecha base del cronograma. Si tiene fecha de inicio manual posterior a sus dependencias, se respeta esa fecha; si es anterior a sus dependencias, prevalece la restricciÃ³n de dependencias. Si la fecha manual es anterior al inicio del proyecto, el cÃ¡lculo lanza error. Varias tareas que solapan sus intervalos se agrupan como paralelas aunque tengan distinta profundidad de dependencias.

### Orden, validaciones y errores

`calculateSchedule` valida que:

- Todas las tareas tengan duraciÃ³n mayor que 0; se permiten fracciones positivas como `0.5`.
- La fecha manual de inicio no sea anterior a la fecha base del proyecto.
- Las dependencias apunten a tareas existentes.
- Una tarea no dependa de sÃ­ misma.
- No existan ciclos en el grafo de dependencias.

El orden topolÃ³gico se devuelve para que la UI liste una secuencia recomendada sin recalcular dependencias.

### Ruta crÃ­tica

La ruta crÃ­tica se define como el conjunto de tareas con holgura cero dentro del camino que determina la fecha fin del cronograma.

```text
holgura = inicio_tardio - inicio_temprano
tarea_critica = holgura == 0
```

La funciÃ³n devuelve fechas tempranas, fechas tardÃ­as, holgura, tareas crÃ­ticas, duraciÃ³n total del cronograma y grupos paralelos para que la UI solo renderice resultados.
