# Frontend UI/UX

## DirecciÃ³n visual

La interfaz debe sentirse como un SaaS profesional para gestiÃ³n de construcciÃ³n:

- Sidebar navy oscuro.
- Topbar clara.
- Cards blancas.
- Bordes redondeados moderados.
- Sombras suaves.
- Azul como color principal.
- Acentos naranja/amarillo de construcciÃ³n.
- Verde para variaciones positivas.
- Tablas limpias y legibles.
- Todo el texto visible en espaÃ±ol.

## Layout

- `AppLayout`: estructura principal con sidebar, topbar y Ã¡rea de contenido.
- `Sidebar`: navegaciÃ³n por mÃ³dulos.
- `Topbar`: navegacion movil, selector jerarquico de organizacion/proyecto, busqueda global navegable, notificaciones de invitacion, campanita de actividad persistente y menu de perfil.
- `PageHeader`: cabecera compartida para tÃ­tulo, eyebrow, descripciÃ³n, breadcrumbs, enlace de retorno y acciones.
- `EmptyState`: estado vacÃ­o compartido para tablas, paneles y vistas sin registros.
- `LoadingState`: skeleton discreto disponible para futuros flujos con datos persistentes.
- `ConfirmDialog`: confirmaciÃ³n compartida para acciones destructivas o de advertencia.
- `ConflictResolutionDialog`: resoluciÃ³n de cambios concurrentes con acciones para cargar remoto o aplicar la versiÃ³n local sobre la versiÃ³n persistida mÃ¡s reciente.
- `PresenceBar`: aviso no bloqueante de usuarios viendo/editando el registro o vista actual.
- `DataTable`: shell simple para tablas actuales con tÃ­tulo, descripciÃ³n, acciones, scroll horizontal, footer y estado vacÃ­o. No reemplaza lÃ³gica de filas, cÃ¡lculos ni controles especÃ­ficos de cada mÃ³dulo.

## NavegaciÃ³n

Orden jerÃ¡rquico del sidebar:

- Dashboard
- Presupuestos
- Cronogramas
- Partidas/APU
- Proveedores
- Recursos
- Reportes
- Historial de precios
- ConfiguraciÃ³n

Rutas reales:

- Dashboard: `/`
- Callback OAuth: `/auth/callback`
- Presupuestos: `/presupuestos` y `/presupuestos/[proyectoId]`
- Cronogramas: `/cronogramas`
- Partidas/APU: `/partidas`
- Detalle de partida/APU: `/partidas/[id]`
- Proveedores: `/proveedores`
- Recursos: `/recursos`
- Reportes: `/reportes`

Rutas pendientes:

- Historial de precios como pantalla dedicada.
- ConfiguraciÃ³n: `/configuracion`

Las rutas que todavÃ­a no existen no deben usar `href="#"`. Deben mostrarse deshabilitadas con tooltip o texto claro hasta que el mÃ³dulo se implemente.

## Dashboard

Debe mostrar:

- Presupuestos/proyectos activos.
- Presupuesto total acumulado.
- Cantidad de partidas por proyecto.
- Porcentaje de avance por partidas completadas.
- Gasto ejecutado estimado como suma de parciales de partidas completadas.
- Acceso real al detalle de cada presupuesto mediante `/presupuestos/[proyectoId]`.
- Accion para crear proyecto nuevo con nombre, cliente y ubicacion; al guardar abre `/presupuestos/[proyectoId]`.

## Topbar

- El selector superior lista proyectos reales accesibles por permisos y navega a `/presupuestos/[proyectoId]`.
- El selector permite crear un proyecto nuevo con formulario minimo: nombre, cliente y ubicacion.
- La busqueda global encuentra proyectos, partidas, recursos y proveedores; cada resultado navega a su ruta real.
- La campanita abre actividad reciente desde `activity_events`; reemplaza al boton de correo pendiente.
- Los avisos realtime siguen apareciendo como toasts accesibles y quedan disponibles en el historial persistente de actividad.

## Login

- `/login` permite ingreso por correo/contraseña y muestra un botón secundario "Continuar con Google".
- Si Google OAuth no está configurado en Supabase, el botón debe mostrar un error comprensible sin romper el formulario de correo.
- Usuarios nuevos que ingresen por Google sin organización activa continúan al onboarding existente.

## Recursos

Vista lista:

- BÃºsqueda por nombre.
- Filtro por tipo.
- Filtro por proveedor.
- Estado activo/inactivo.
- AcciÃ³n para crear recurso en mock frontend.

Detalle/estado visual:

- Datos principales.
- Historial de precios mock.
- AcciÃ³n editar.
- AcciÃ³n desactivar con confirmaciÃ³n.

Formulario:

- Nombre.
- Tipo.
- Unidad.
- Costo unitario actual.
- Proveedor.
- Transporte aplica.
- Costo transporte.
- EspecificaciÃ³n.
- Marca.
- Fuente de precio.
- Estado.

## Proveedores

CRUD frontend mock con bÃºsqueda por nombre o RUC.

Campos visibles:

- Nombre.
- RUC.
- Contacto.
- TelÃ©fono.
- Email.

## Partidas/APU

Vista lista:

- CÃ³digo.
- Nombre.
- Unidad.
- CategorÃ­a.
- Precio unitario estimado.
- Estado.

Builder APU:

- Datos de partida.
- Recursos agrupados por materiales, mano de obra y equipos/herramientas.
- Cantidades, unidades, costos snapshot, desperdicio y parcial.
- Resumen de costo directo y precio unitario.

## Presupuestos

Vista dashboard/lista:

- Proyecto.
- Cliente.
- UbicaciÃ³n.
- Estado.
- Total.
- Ãšltima actualizaciÃ³n.
- Avance y gasto ejecutado cuando la vista se muestre como resumen de proyectos.

Detalle:

- Cabecera del presupuesto.
- Tabla de partidas presupuestadas.
- Metrado editable.
- Parcial automÃ¡tico.
- Resumen financiero.
- Botones de exportar Excel/PDF.
- El detalle APU dentro de presupuestos debe leer snapshots de la lÃ­nea activa, incluyendo recursos APU congelados, no recursos vivos del catÃ¡logo.
- Las tablas de partidas y APU deben tener scroll horizontal controlado en laptop cuando el ancho no alcance.

## ColaboraciÃ³n UI

- Los mÃ³dulos persistentes muestran Presence como aviso contextual no bloqueante.
- Si otro usuario estÃ¡ editando el mismo recurso, proveedor, partida, APU o lÃ­nea de presupuesto, la UI avisa sin impedir la ediciÃ³n local.
- La identidad mostrada por Presence se resuelve desde `user_profiles`; el payload realtime solo transporta `actorId` y estado efÃ­mero, nunca un nombre confiable enviado por el cliente.
- Los conflictos se muestran en un diÃ¡logo claro: cargar remoto descarta el intento local y refresca; aplicar mi versiÃ³n reintenta sobre el `updated_at` persistido mÃ¡s reciente.
- La UI nunca debe sobrescribir silenciosamente un registro cuyo `updated_at` cambiÃ³ mientras el usuario editaba.

## Cronogramas

MÃ³dulo MVP mock disponible en `/cronogramas`.

Vista principal:

- Selector de presupuesto fuente.
- GeneraciÃ³n inicial de tareas desde las partidas presupuestadas.
- Tabla editable de tareas con partida origen, duraciÃ³n, fecha de inicio, fecha fin, dependencias, holgura y estado.
- Vista Gantt simple para revisar secuencia, solapes y tareas paralelas.
- Resaltado de ruta crÃ­tica.
- Panel o lista de tareas en orden recomendado.
- Panel de grupos de tareas paralelas.

Reglas UX:

- Si la partida tiene rendimiento usable, mostrar duraciÃ³n sugerida y permitir editarla con duraciÃ³n manual.
- Si la partida no tiene rendimiento o estÃ¡ vacÃ­o, pedir duraciÃ³n manual con mensaje claro.
- Si existen ciclos o dependencias invÃ¡lidas, bloquear el cÃ¡lculo y explicar quÃ© tarea causa el problema.
- El Gantt MVP se renderiza con barras simples en CSS, sin librerÃ­a pesada.
- La acciÃ³n de guardado se mantiene deshabilitada porque todavÃ­a no existe persistencia real.

## Reportes

Modulo MVP disponible en `/reportes`.

Vista principal:

- Resumen ejecutivo por presupuesto/proyecto accesible.
- KPI de presupuestos reportados, subtotal acumulado, total acumulado y recurso mas costoso.
- Tabla de resumen por presupuesto con proyecto, cliente, fuente, subtotal, total, partidas y acceso real a `/presupuestos/[proyectoId]`.
- Distribucion de costos por grupo APU usando barras CSS simples.
- Ranking de recursos mas costosos agrupados por nombre snapshot, tipo, unidad y grupo.
- Totales por estado/fuente cuando los datos disponibles lo permiten.

Reglas UX:

- Si existe version oficial emitida, el reporte formal usa la version oficial mas reciente y la marca como `Vx oficial`.
- Si no existe version oficial, el reporte usa el borrador activo y lo marca como `Borrador activo`.
- Los reportes son de lectura y no reemplazan las exportaciones oficiales.
- No se usan graficos pesados en el MVP; las visualizaciones son tablas y barras CSS consistentes con el sistema visual actual.

## Estados UX

- Estados vacÃ­os con acciÃ³n clara.
- Loading states discretos.
- Mensajes de Ã©xito/error comprensibles.
- Toasts de actividad colaborativa para avisar cambios guardados por otros usuarios.
- Toasts de actividad colaborativa con regiÃ³n `aria-live="polite"` para lectores de pantalla.
- Refetch silencioso con debounce cuando llega Broadcast privado de Supabase de otro usuario; las mutaciones propias no disparan refetch redundante.
- Si el canal realtime falla, mostrar aviso discreto y mantener la acciÃ³n manual `Recargar`.
- ConfirmaciÃ³n antes de eliminar o desactivar.
- No mostrar errores tÃ©cnicos al usuario final.
- No mostrar botones o links que parezcan funcionales si no ejecutan acciÃ³n. Conectar a una ruta real, deshabilitar con tooltip o convertir a texto informativo.
- Usar `EmptyState`, `LoadingState` y `ConfirmDialog` compartidos cuando el comportamiento sea estÃ¡ndar.
- Usar `ActivityToasts` para avisos realtime en dashboard, presupuestos, partidas/APU, recursos y proveedores.
- En `/proveedores`, los cambios realtime de proveedores deben aplicarse como parches locales de fila para no mover scroll, filtros ni estado de carga; usar recarga completa solo como fallback.
- En `/recursos`, los cambios realtime de recursos, proveedores auxiliares y cotizaciones del recurso seleccionado deben aplicarse sin recargar la pagina completa ni mover la tabla.
- Usar `DataTable` solo como contenedor visual de tablas; si una tabla necesita lÃ³gica avanzada futura, evaluar TanStack Table en ese goal.

## Responsive

- Priorizar laptop mediana y desktop.
- Sidebar puede colapsar en pantallas menores.
- Tablas deben permitir scroll horizontal controlado cuando sea necesario.
- Formularios deben usar una o dos columnas segÃºn ancho disponible.
- En vistas con tabla principal y panel lateral, el panel debe pasar debajo en laptop mediana y desktop 1440px cuando comprima la tabla. El layout lateral queda reservado para anchos amplios.
- Las cabeceras de tablas, footers y barras de acciones deben usar `min-w-0`, wrapping controlado y scroll interno, evitando overflow del contenido principal.
- Las acciones con icono deben tener nombre accesible especifico cuando se repiten por fila.

## Chunk 6 - Accesibilidad y consistencia UI

- Los modales compartidos (`ConfirmDialog` y `ConflictResolutionDialog`) deben mantenerse como dialogos accesibles: `role="dialog"`, `aria-modal`, titulo/descripción enlazados, foco inicial, cierre con Escape, trap de Tab y restauración de foco.
- Las tablas deben declarar `scope="col"` en todos los headers; columnas de acciones sin texto visible deben conservar `aria-label`.
- Los filtros de proveedores, recursos y partidas viven tambien en la URL para soportar refresh/enlaces compartibles. Presupuestos persiste la linea seleccionada con `linea=<id>`.
- Los formularios principales usan `id`/`htmlFor` explicitos y deshabilitan campos durante guardado para evitar ediciones a medio submit.

## Multi-organizacion

- El Topbar combina selector de organizacion y proyecto en forma de arbol: cada organizacion despliega sus proyectos y la accion de crear proyecto dentro de ese contexto.
- Cambiar organizacion o proyecto conserva la seccion actual cuando la ruta sigue siendo valida; solo evita quedarse en un detalle de presupuesto que ya no pertenece al contexto seleccionado.
- `/configuracion/organizaciones` queda enlazado desde el menu de perfil y permite crear organizaciones de empresa, revisar organizaciones disponibles, invitar colaboradores con proyecto opcional y aceptar/rechazar invitaciones recibidas.
- La misma pantalla incluye `Miembros y permisos`: owners/admins ven miembros con nombre y correo, despliegan cada miembro, revisan proyectos accesibles y editan rol de organizacion, acceso a todos/futuros proyectos, rol por defecto y roles especificos por proyecto.
- Los admins de proyecto ven habilitadas las acciones de catalogo operativo necesarias para trabajar: crear/editar proveedores, recursos, cotizaciones, partidas y APU. La UI sigue reservando invitaciones, creacion de proyectos y matriz de permisos para admins de organizacion.
- En proveedores, activar/desactivar y eliminar son acciones separadas. Eliminar usa confirmacion propia y puede fallar si existen historicos que deban conservarse.
- Las invitaciones usan seleccion multiple de proyectos con checkboxes y una casilla para incluir automaticamente al usuario en proyectos futuros.
- El campo de correos de invitacion acepta uno o varios correos separados por espacios, comas o saltos de linea, aplicando las mismas propiedades de acceso a todos.
- Si el rol de organizacion es `Admin`, la UI marca todos los proyectos, activa futuros proyectos y bloquea esas opciones; el rol de proyecto queda como `Admin`.
- Los roles visibles de proyecto se simplifican a `Lector`, `Editor` y `Admin`.
- La Configuracion del Sidebar apunta a `/configuracion/proyecto` y queda reservada para ajustes del proyecto activo.
- El boton de notificaciones del Topbar muestra invitaciones recibidas y permite aceptarlas o rechazarlas sin salir del contexto actual.
- Para owners/admins, el mismo panel muestra decisiones recientes del equipo: invitaciones aceptadas o rechazadas. Las invitaciones enviadas solo listan pendientes.
- El dashboard adapta el empty state: en espacios personales invita a crear el primer proyecto; en organizaciones de empresa sin proyectos asignados explica que un owner/admin debe asignar acceso.
