# Exportaciones

## Estado actual

Las exportaciones finales del MVP usan una solución simple y mantenible:

- Excel se genera en frontend con `xlsx`.
- PDF se genera desde una vista HTML imprimible del navegador.
- No se incorpora una librería PDF dedicada mientras la vista imprimible sea suficiente.
- Las exportaciones formales salen de versiones oficiales congeladas.
- Un borrador puede exportarse solo con etiqueta clara `BORRADOR`.

## Presupuesto interno

La exportación interna soporta dos fuentes:

- `source: "official"`: usa `presupuesto_versiones`, `presupuesto_version_partidas` y `presupuesto_version_partida_recursos`. Es la salida formal.
- `source: "draft"`: usa el borrador activo, sus partidas y recursos APU vivos. Se marca como `BORRADOR` en título, metadatos y nombre de archivo.

Contenido de Excel/PDF:

- Presupuesto resumido.
- Metadatos de proyecto, cliente, ubicación, versión, estado de exportación, fecha y moneda.
- Tabla de partidas con orden, código, partida, unidad, metrado, precio unitario y parcial.
- Resumen financiero con subtotal, gastos generales, utilidad, subtotal con margen, IGV y total.
- Detalle APU por partida cuando existe snapshot de recursos.

Reglas:

- Las versiones oficiales no consultan precios vivos.
- Las partidas y recursos APU salen desde snapshots congelados.
- Los borradores se exportan como datos vivos identificados explícitamente.
- Los nombres de archivo se sanitizan y distinguen `borrador`, `v{numero_version}` y fecha.
- Las celdas string peligrosas para Excel se prefijan si empiezan con `=`, `+`, `-`, `@`, tab o carriage return.

## Exportación para cliente

La exportación cliente sale siempre de una versión oficial congelada y conserva una estructura equivalente a la exportación interna.

Contenido:

- Presupuesto para cliente.
- Metadatos de versión oficial.
- Partidas con precio unitario cliente y parcial cliente.
- Resumen financiero recalculado desde precios cliente congelados.
- Detalle APU por partida con precio cliente por recurso.
- Notas de advertencia cuando un recurso no tiene precio de proveedor visible para cliente.

Reglas:

- No mostrar nombres de proveedores.
- No revelar IDs de proveedores ni costos internos.
- Usar `precio_cliente_snapshot` cuando exista.
- Si falta `precio_cliente_snapshot`, usar el snapshot interno como fallback de compatibilidad, manteniendo la nota congelada si existe.
- Marcar en rojo en la vista imprimible las filas con `precio_cliente_advertencia_snapshot`.
- No recalcular precios cliente desde cotizaciones vivas al reexportar una versión oficial.

## PDF

La vista imprimible HTML:

- Escapa texto con el helper local antes de insertarlo en nodos de texto.
- No usa HTML arbitrario, scripts ni URLs dinámicas.
- Incluye un botón `Guardar como PDF` que desaparece al imprimir.
- Mantiene estilos simples, legibles y aptos para impresión.

## Pruebas

La cobertura actual en `lib/exports/budget.test.ts` verifica:

- Filas oficiales con partidas, resumen financiero y APU.
- Borradores con etiqueta `BORRADOR`.
- Exportación cliente sin proveedores y con notas de advertencia.
- Nombres de archivo para borrador, oficial y cliente.
- Sanitización anti fórmula en Excel.
- Escaping HTML en exportaciones internas y cliente, incluyendo detalle APU.
- Marcado rojo de advertencias cliente en HTML imprimible.

## Pendientes post-MVP

- Evaluar una librería PDF dedicada solo si se requiere maquetación profesional más compleja.
- Agregar selector de versión oficial si el usuario necesita exportar versiones anteriores desde la UI.
- Evaluar exportación de cronogramas con Gantt, ruta crítica, línea base y avance cuando el módulo persistente exista.
