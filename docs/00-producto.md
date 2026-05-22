# Producto

## Visión

**C y P** es un sistema web para gestionar costos y presupuestos de construcción. Está pensado para que una persona no técnica pueda armar presupuestos usando partidas/APU previamente creadas por usuarios con conocimiento técnico.

## Usuarios objetivo

- Administradores de obra o presupuestadores que crean recursos, proveedores, partidas y presupuestos.
- Usuarios operativos que seleccionan partidas existentes, ingresan metrados y generan reportes.
- Gerencia o clientes internos que revisan presupuestos resumidos y exportaciones.

## Flujo principal

```text
Recursos -> Partidas/APU -> Presupuestos -> Cronogramas -> Reportes
```

1. Se registran proveedores y recursos.
2. Se crean partidas/APU como recetas constructivas.
3. Se arma un presupuesto usando partidas existentes y metrados.
4. Se arma un cronograma base usando las partidas presupuestadas.
5. Se generan reportes y exportaciones.

## Colaboración planificada

La dirección del producto es evolucionar hacia un sistema colaborativo en tiempo real para equipos de obra y presupuestos. No será solo "varios usuarios con acceso", sino un flujo donde varias personas puedan trabajar sobre el mismo proyecto/presupuesto, ver cambios casi al instante y conservar trazabilidad completa.

Principios definidos:

- El trabajo diario ocurre en un borrador colaborativo editable y dinámico.
- El borrador puede recalcular con precios vigentes de recursos, proveedores y partidas.
- Cada línea o recurso del borrador puede fijar/bloquear precio cuando se necesite conservar un valor manual.
- Cuando el equipo emite un presupuesto formal, se crea una versión oficial congelada, por ejemplo `NombreProyecto_Presupuesto_V1`.
- Las versiones oficiales no se actualizan automáticamente aunque cambien precios del catálogo.
- Si se emite una nueva versión, la anterior queda como histórico y la nueva pasa a ser la oficial vigente.
- El dashboard del proyecto muestra la versión oficial más reciente; si no existe una versión oficial, muestra el estado actual del borrador.
- Todo cambio relevante debe quedar registrado en auditoría permanente.

## Proveedores y presupuesto para cliente

El catálogo debe diferenciar entre el control interno de costos y la presentación comercial al cliente.

Principios definidos:

- Un recurso es canónico, por ejemplo `Cemento Portland Tipo I`.
- Un mismo recurso puede tener múltiples cotizaciones por proveedor.
- Los proveedores pueden marcarse con `disponible_para_cliente` cuando sean adecuados para una cotización verificable o presentable al cliente.
- El presupuesto interno usa la cotización interna seleccionada y congelada.
- El presupuesto para cliente usa precios cliente congelados, no muestra proveedores y mantiene una estructura equivalente al presupuesto normal.
- Al emitir una versión oficial, el sistema propone para cliente el precio más alto entre proveedores visibles para cliente.
- Si no existe precio visible para cliente, usa el precio más alto de la base general, genera advertencia y marca el recurso/partida en la exportación cliente.
- El usuario puede aplicar override manual de precio cliente antes de emitir la versión oficial.
- La implementación actual usa el total unitario `costo_unitario + costo_transporte` para comparar precios cliente.

## Módulos MVP

- Dashboard con métricas, últimos presupuestos y accesos rápidos.
- Recursos con CRUD, filtros, búsqueda e historial de precios.
- Proveedores con CRUD básico y marca `disponible_para_cliente`.
- Partidas/APU con recursos asociados y cálculo de precio unitario.
- Presupuestos persistentes con borrador activo, partidas, metrados, snapshots, revisión de precios cliente, emisión oficial, exportación interna y exportación para cliente.
- Cronogramas desde presupuestos con tareas por partida, duración mixta sugerida/manual, dependencias simples, Gantt, ruta crítica y tareas paralelas.
- Reportes simples: presupuesto resumido, presupuesto detallado, APU por partida, recursos e historial.

El alcance MVP actual debe entenderse como **MVP persistente colaborativo**. Al completar los goals de `docs/09-avances-y-goals.md`, el producto debería cubrir el flujo principal con persistencia, colaboración base, versiones oficiales, reportes simples y exportaciones finales.

Las capacidades posteriores a ese MVP viven en [Post-MVP, feature complete y goals](10-post-mvp-goals.md). Ese backlog cubre producción final, administración SaaS, importaciones masivas, aprobaciones formales, reportes avanzados, plantillas, observabilidad, performance y billing si aplica.

## Estado funcional actual

- Ya existen pantallas funcionales para dashboard, recursos, proveedores, partidas/APU, presupuestos y cronogramas.
- `/proveedores`, `/recursos` y `/presupuestos` usan Supabase con persistencia; partidas/APU y cronogramas todavía conservan flujo mock/frontend.
- Supabase alimenta proveedores, recursos, cotizaciones y presupuestos con borrador/versiones oficiales.
- Los reportes siguen pendientes como módulo real.

## Regla clave

Cuando se crea un presupuesto, los precios y datos principales usados deben quedar congelados como snapshot. Si luego cambia el precio de un recurso o se edita una partida, el presupuesto anterior no debe cambiar automáticamente.

La regla aplica a presupuestos oficiales. Los borradores colaborativos son espacios vivos y pueden actualizarse con precios vigentes salvo que una línea tenga precio fijado.

## Criterios de aceptación del MVP persistente

- El usuario puede crear recursos y proveedores.
- El usuario puede crear partidas/APU usando recursos existentes.
- El sistema calcula el precio unitario de una partida.
- El usuario puede crear un presupuesto y agregar partidas.
- El usuario puede ingresar metrados y ver parciales automáticos.
- El sistema calcula subtotal, gastos generales, utilidad, IGV y total.
- El usuario puede generar un cronograma base desde las partidas del presupuesto.
- El sistema puede sugerir duración cuando exista metrado y rendimiento usable; si el rendimiento está vacío, el usuario debe ingresar duración manual.
- El usuario puede definir dependencias simples entre tareas y ver Gantt, ruta crítica y tareas ejecutables en paralelo.
- Los precios del presupuesto quedan congelados como snapshot.
- El usuario puede exportar a Excel o PDF.
- El usuario puede generar una exportación para cliente con precios cliente congelados y advertencias visibles cuando falte referencia de proveedor apto para cliente.
- La interfaz se ve moderna, ordenada y profesional.
- El código queda componentizado, limpio y con cálculos separados de la UI.
