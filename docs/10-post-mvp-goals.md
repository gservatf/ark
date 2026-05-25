# Post-MVP, Feature Complete y Goals

Última actualización: 2026-05-18.

Este documento continúa el tablero de [Avances, pendientes y goals](09-avances-y-goals.md) una vez cerrado el MVP persistente colaborativo. El objetivo ya no es validar el flujo principal, sino convertir **C y P** en un producto SaaS más completo, operable y listo para crecer con usuarios reales.

## Estado esperado al iniciar

Este backlog debe iniciarse cuando el MVP colaborativo esté completo:

- Supabase local-first configurado y migraciones versionadas.
- Auth, RLS y ownership por organización/proyecto funcionando.
- CRUD persistente de proveedores, recursos, partidas/APU y presupuestos.
- Borrador colaborativo y versiones oficiales congeladas.
- Auditoría general y Realtime base.
- Presence, conflictos optimistas, cronogramas MVP, reportes simples y exportaciones finales MVP.
- Tests ampliados para cálculos, validaciones, snapshots, auditoría y capa de datos.

Si alguno de esos puntos sigue pendiente, debe permanecer en `docs/09-avances-y-goals.md` y no moverse a este backlog.

## Avance por etapas post-MVP

| Etapa | Estado | Avance | Objetivo | Pendiente principal | Verificación |
| --- | --- | ---: | --- | --- | --- |
| 1. Producción y ambientes | Pendiente | 0% | Llevar el MVP a staging/producción con Supabase remoto y despliegue controlado | Proyecto remoto, migraciones, env vars, dominio, backups y smoke tests | Pendiente |
| 2. Administración SaaS | En progreso | 70% | Gestionar organizaciones, usuarios, roles e invitaciones desde UI | Organizaciones personales/empresa, selector activo, invitaciones multi-proyecto y matriz editable de permisos por miembro implementadas; falta ownership transfer y suspension/remocion formal de miembros | Verificado 2026-05-25 |
| 3. Importación y catálogo | Pendiente | 0% | Acelerar carga de recursos, proveedores y partidas | Importación masiva, validación de plantillas y deduplicación | Pendiente |
| 4. Aprobaciones y workflow | Pendiente | 0% | Formalizar revisión, aprobación y emisión de presupuestos | Estados, permisos, comentarios y bloqueo de versiones | Pendiente |
| 5. Reportes avanzados | Pendiente | 0% | Pasar de reportes simples a análisis gerencial | Filtros, comparativos, dashboards y gráficos | Pendiente |
| 6. Planificación avanzada | Pendiente | 0% | Convertir cronogramas MVP en planificación de obra completa | Calendarios, recursos, línea base, curva S, colaboración y alertas | Pendiente |
| 7. Exportaciones y plantillas | Pendiente | 0% | Crear documentos más profesionales y configurables | Plantillas, membrete, anexos APU, cronograma y formatos por cliente | Pendiente |
| 8. Operación y observabilidad | Pendiente | 0% | Mantener el SaaS confiable con usuarios reales | Monitoreo, logs, auditoría operativa y alertas | Pendiente |
| 9. Escalabilidad y performance | Pendiente | 0% | Preparar tablas grandes, búsquedas y uso concurrente | Índices, paginación, caché y pruebas de carga | Pendiente |
| 10. Comercialización SaaS | Pendiente | 0% | Preparar planes, límites y facturación si el producto se vende como SaaS | Planes, billing, límites y onboarding | Pendiente |

## Backlog recomendado post-MVP

1. Publicar staging con Supabase remoto usando migraciones versionadas.
2. Preparar producción: dominio, variables, backups, smoke tests y checklist de seguridad.
3. Crear administración de organizaciones, miembros, roles e invitaciones.
4. Implementar importación masiva de recursos/proveedores/partidas.
5. Agregar workflow de aprobación de presupuestos y comentarios.
6. Mejorar reportes con filtros, comparativos y gráficos.
7. Evolucionar cronogramas a planificación avanzada con calendarios laborales, feriados, jornadas, dependencias avanzadas, lead/lag, recursos/cuadrillas, línea base, curva S, colaboración y alertas.
8. Mejorar exportaciones con plantillas, membrete, anexos y cronograma profesional.
9. Implementar observabilidad: logs, errores, métricas y alertas.
10. Optimizar performance para datos grandes y concurrencia real.
11. Evaluar planes SaaS, límites, onboarding y facturación.

## Prompts `/goal`

### `/goal staging-supabase-remoto`

Configura un ambiente staging usando un proyecto Supabase remoto. Enlaza el proyecto con Supabase CLI, aplica migraciones versionadas, configura variables de entorno de staging y ejecuta seed controlado si corresponde. No crear tablas manualmente desde el panel remoto. Ejecuta `pnpm lint`, `pnpm test`, `pnpm build` y smoke tests básicos contra staging. Actualiza `AGENTS.md`, `docs/01-arquitectura.md`, `docs/08-produccion.md`, `docs/09-avances-y-goals.md` si cambia el estado del MVP y este documento.

Estado: pendiente.

### `/goal produccion-checklist-despliegue`

Prepara producción después de validar staging. Definir dominio, variables de producción, política de backups, recuperación, checklist de RLS, revisión de claves, verificación de migraciones y smoke tests post-deploy. No mezclar datos demo con producción. Ejecuta verificaciones completas y actualiza `docs/08-produccion.md` y este documento.

Estado: pendiente.

### `/goal administracion-organizaciones-miembros`

Crea UI y capa de datos para administrar organizaciones, miembros, invitaciones y roles. Debe respetar RLS, registrar auditoría y evitar que usuarios sin permisos cambien miembros o roles. Ejecuta `pnpm lint`, `pnpm test`, `pnpm build` y actualiza `docs/01-arquitectura.md`, `docs/02-modelo-datos.md`, `docs/05-frontend-ui-ux.md`, `docs/08-produccion.md` y este documento.

Estado: pendiente.

### `/goal importacion-masiva-catalogo`

Implementa importación masiva de proveedores, recursos y partidas/APU desde Excel/CSV. Incluir plantilla descargable, validación previa, vista de errores, deduplicación por RUC/código/nombre y confirmación antes de guardar. Registrar auditoría por importación. Ejecuta `pnpm lint`, `pnpm test`, `pnpm build` y actualiza `docs/02-modelo-datos.md`, `docs/06-validaciones-y-testing.md`, `docs/07-exportaciones.md` si aplica y este documento.

Estado: pendiente.

### `/goal workflow-aprobaciones-presupuestos`

Agrega flujo formal de revisión y aprobación de presupuestos. Incluir estados, permisos por rol, comentarios, bloqueo de edición en versiones oficiales, trazabilidad de aprobaciones y posibilidad de emitir nueva versión desde borrador. Ejecuta `pnpm lint`, `pnpm test`, `pnpm build` y actualiza `docs/00-producto.md`, `docs/02-modelo-datos.md`, `docs/05-frontend-ui-ux.md`, `docs/08-produccion.md` y este documento.

Estado: pendiente.

### `/goal reportes-avanzados`

Mejora `/reportes` con filtros por proyecto, cliente, estado, fechas, especialidad, recurso y proveedor. Agregar comparativos entre versiones oficiales, recursos más incidentes, variaciones de precios y gráficos simples si aportan claridad. Ejecuta `pnpm lint`, `pnpm test`, `pnpm build` y actualiza `docs/05-frontend-ui-ux.md`, `docs/07-exportaciones.md` si aplica y este documento.

Estado: pendiente.

### `/goal planificacion-avanzada-cronogramas`

Evoluciona el módulo MVP de cronogramas hacia planificación de obra completa. Agrega calendarios laborales, feriados, jornadas, tipos de dependencia adicionales, lead/lag, recursos/cuadrillas, disponibilidad, nivelación de recursos, línea base vs avance real, curva S y valorizaciones por tiempo. Preparar colaboración realtime sobre tareas del cronograma, alertas de retrasos y avisos cuando cambie la ruta crítica. Ejecuta `pnpm lint`, `pnpm test`, `pnpm build` y actualiza `docs/00-producto.md`, `docs/02-modelo-datos.md`, `docs/03-calculos.md`, `docs/05-frontend-ui-ux.md`, `docs/06-validaciones-y-testing.md`, `docs/07-exportaciones.md` si aplica y este documento.

Estado: pendiente.

### `/goal plantillas-exportacion-profesionales`

Mejora exportaciones con plantillas configurables, membrete, datos de empresa, anexos APU, resumen ejecutivo y formatos por cliente. Mantener snapshots oficiales como fuente formal. Ejecuta `pnpm lint`, `pnpm test`, `pnpm build` y actualiza `docs/07-exportaciones.md` y este documento.

Estado: pendiente.

### `/goal observabilidad-operacion`

Agrega estrategia de operación: logging de errores relevantes, medición de tiempos de carga, monitoreo de fallos de Realtime, alertas básicas, revisión de eventos de auditoría y documentación de soporte. Ejecuta verificaciones aplicables y actualiza `docs/08-produccion.md` y este documento.

Estado: pendiente.

### `/goal performance-escalabilidad`

Optimiza el sistema para catálogos y presupuestos grandes. Revisar índices reales, paginación, búsqueda, queries de reportes, tamaño de payloads Realtime, carga inicial y pruebas con datos voluminosos. Ejecuta `pnpm lint`, `pnpm test`, `pnpm build` y pruebas de performance acordadas. Actualiza `docs/01-arquitectura.md`, `docs/02-modelo-datos.md`, `docs/08-produccion.md` y este documento.

Estado: pendiente.

### `/goal planes-billing-saas`

Evalúa e implementa, solo si el producto se comercializa como SaaS, planes, límites de uso, facturación, estado de suscripción, restricciones por organización y onboarding inicial. No introducir billing antes de que producción esté estable. Ejecuta verificaciones completas y actualiza `docs/00-producto.md`, `docs/01-arquitectura.md`, `docs/08-produccion.md` y este documento.

Estado: pendiente.

## Regla de cierre para cada goal post-MVP

Cada goal funcional debe terminar con:

```powershell
pnpm lint
pnpm test
pnpm build
```

Además debe incluir:

- Resumen breve de archivos modificados.
- Estado de verificación.
- Riesgos productivos o de datos revisados.
- Documentación relacionada actualizada.
- Nota explícita si no se pudo ejecutar algún comando.

Si el goal solo cambia documentación Markdown, puede omitirse `pnpm lint`, `pnpm test` y `pnpm build` indicando explícitamente la razón.

## Regla documental post-MVP

- Cambios de operación, despliegue, seguridad, backups o monitoreo: actualizar `docs/08-produccion.md`.
- Cambios de modelo, roles, billing o importaciones: actualizar `docs/02-modelo-datos.md`.
- Cambios de producto o alcance comercial: actualizar `docs/00-producto.md`.
- Cambios de arquitectura o ambientes: actualizar `AGENTS.md` y `docs/01-arquitectura.md`.
- Cambios de reportes, cronogramas o exportaciones: actualizar `docs/07-exportaciones.md` si afecta documentos generados, y `docs/03-calculos.md` si afecta planificación.
- Cambios de UI/UX: actualizar `docs/05-frontend-ui-ux.md`.
