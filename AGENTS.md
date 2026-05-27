# C y P - Sistema de Costos y Presupuestos

Este repositorio contiene la planificaciÃ³n e implementaciÃ³n progresiva de **C y P**, un sistema web tipo SaaS para gestionar costos y presupuestos de construcciÃ³n.

El flujo principal del producto es:

```text
Recursos -> Partidas/APU -> Presupuestos -> Cronogramas -> Reportes
```

## Estado actual

- Proyecto inicializado como repositorio Git.
- AplicaciÃ³n Next.js 14 App Router + React 18 + TypeScript creada.
- Tailwind CSS configurado.
- `lucide-react`, `zod`, `vitest`, `xlsx` y `@supabase/supabase-js` instalados.
- Dashboard real en `/` implementado con acceso a presupuestos por ruta `/presupuestos/<proyectoId>`.
- `/presupuestos` conectado al borrador persistente de Supabase con partidas, metrados editables, eliminaciÃ³n de lÃ­neas, totales, revisiÃ³n de precios cliente, override manual y emisiÃ³n de versiones oficiales congeladas.
- Cronogramas definidos como mÃ³dulo MVP previo a Supabase: inicialmente mock/frontend desde partidas presupuestadas, con Gantt, ruta crÃ­tica, dependencias simples y duraciÃ³n mixta sugerida/manual.
- Layout base creado con `AppLayout`, `Sidebar` y `Topbar`.
- Componentes principales de presupuesto creados: KPI cards, tabla de presupuesto, resumen financiero, recursos mini y tabs APU con snapshots APU mock por lÃ­nea.
- Pantallas funcionales creadas para `/presupuestos`, `/recursos`, `/proveedores`, `/partidas` y `/partidas/[id]`; `/presupuestos`, `/recursos` y `/proveedores` ya usan Supabase.
- Datos mock separados en `lib/mock-data/`.
- Tipos de dominio creados en `types/domain.ts`.
- CÃ¡lculos puros implementados en `lib/calculations/`.
- Zod instalado y esquemas base creados en `lib/validations/`; todavÃ­a no estÃ¡n conectados a todos los formularios.
- ExportaciÃ³n interna de presupuestos a Excel con `xlsx`, PDF mediante vista HTML imprimible y exportaciÃ³n cliente desde versiÃ³n oficial congelada.
- MigraciÃ³n inicial Supabase, seed data PerÃº, `.env.example` y cliente Supabase tipado preparados.
- MigraciÃ³n colaborativa Supabase preparada con organizaciones, proyectos, miembros, auditorÃ­a `activity_events`, borradores vivos, versiones oficiales congeladas, precio fijado/autoactualizable y precios cliente.
- MigraciÃ³n multi-proveedor preparada con `proveedores.disponible_para_cliente`, `recurso_proveedor_precios`, RLS/grants explÃ­citos, seed demo y snapshots cliente.
- Seed demo extendido con organizaciÃ³n/proyecto, borrador activo y versiÃ³n oficial congelada; no incluye miembros reales porque Supabase Auth todavÃ­a no estÃ¡ configurado.
- DecisiÃ³n de arquitectura colaborativa documentada: Supabase/Postgres serÃ¡ la base para borradores colaborativos, auditorÃ­a permanente, versiones oficiales congeladas, Realtime y presencia.
- Limpieza de affordances falsas aplicada en los mÃ³dulos completados: no usar `href="#"`; conectar rutas reales o deshabilitar con tooltip.
- `pnpm lint`, `pnpm test`, `pnpm exec tsc --noEmit` y `pnpm build` han pasado en verificaciones previas.
- Supabase CLI local agregada como dev dependency (`supabase`) y Docker Desktop validado en este entorno.
- Supabase local-first configurado con `supabase/config.toml`, `.env.local` local ignorado, scripts pnpm, migraciones, seed y tipos generados desde la base local.
- Ya hay conexiÃ³n real de UI a Supabase para proveedores, recursos, cotizaciones, partidas/APU, catalogos de cabecera de partidas y presupuestos; todavÃ­a faltan cronogramas persistentes.
- Partidas/APU redisenado al formato tradicional de obra: creacion/edicion en modal por pasos, cabecera tecnica separada del APU, codigo opcional, subcategoria, jornada, desperdicio global de materiales, rendimiento default `1`, guardado sin APU y recursos calculados por tipo (`mano_obra_rendimiento`, `material_desperdicio`, `equipo_hm_rendimiento`, `equipo_cantidad_fija`, `herramientas_porcentaje_mano_obra`).
- Realtime colaborativo implementado con Broadcast privado desde `activity_events`, Presence efÃ­mero y resoluciÃ³n optimista de conflictos con `updated_at`.
- Primer deploy productivo controlado realizado en Vercel + Supabase remoto: GitHub conectado a Vercel, Supabase remoto enlazado, migraciones/seed aplicados, variables pÃºblicas configuradas, Site URL/Redirect URLs de Auth, confirmaciÃ³n de email, SMTP con Resend, CAPTCHA con Cloudflare Turnstile, Google OAuth, reglas fuertes de contraseÃ±a, Realtime pÃºblico desactivado y SSL enforcement remoto aplicados. TodavÃ­a quedan checklists remotos para backups y pruebas multiusuario antes de usuarios reales.

- Multi-organizacion implementada: cada usuario conserva una organizacion personal por defecto, puede crear organizaciones de empresa, cambiar organizacion/proyecto activo desde el Topbar con persistencia por navegador, crear proyectos dentro de la organizacion activa, gestionar invitaciones a organizacion con seleccion multiple de proyectos e inclusion automatica en proyectos futuros, y administrar permisos de miembros por organizacion/proyecto desde `/configuracion/organizaciones`. El menu de perfil apunta a organizaciones, el Sidebar reserva Configuracion para `/configuracion/proyecto` y las invitaciones aparecen tambien en notificaciones. Las invitaciones se guardan en Supabase y envian correo por Resend si existe `RESEND_API_KEY`. Roles visibles de proyecto: lector, editor y admin.
- Un admin de proyecto puede gestionar el catalogo operativo de su organizacion para trabajar en ese proyecto: proveedores, recursos, cotizaciones, partidas, categorias/subcategorias/unidades de partida y APU. Esto no lo convierte en admin de organizacion: invitar usuarios, crear proyectos y cambiar permisos siguen reservados a owner/admin de organizacion.

## Stack oficial

- Framework: Next.js 14 App Router.
- Runtime UI: React 18.
- Lenguaje: TypeScript.
- Package manager: pnpm.
- Estilos: Tailwind CSS.
- UI: componentes propios con Tailwind.
- Iconos: lucide-react.
- Backend previsto: Supabase/PostgreSQL.
- Cliente backend instalado: `@supabase/supabase-js`.
- Validaciones: Zod.
- Excel: xlsx.
- Testing unitario: Vitest.

Herramientas previstas pero no instaladas actualmente:

- Formularios: React Hook Form.
- Tablas avanzadas: TanStack Table solo cuando sea necesario.
- GrÃ¡ficos simples: Recharts solo si el reporte lo justifica.
- shadcn/ui: opcional si aporta valor sin complejidad innecesaria.
- PDF dedicado: solo si la vista imprimible deja de ser suficiente.

## Comandos reales

```powershell
pnpm install
pnpm dev
pnpm test
pnpm lint
pnpm build
pnpm exec tsc --noEmit
pnpm run supabase:start
pnpm run supabase:stop
pnpm run supabase:status
pnpm run supabase:reset
pnpm run supabase:migrate
pnpm run supabase:types
```

`pnpm dev` expone Next.js en `0.0.0.0`, por lo que la app queda disponible en la laptop y en la red local usando la IP LAN del equipo.

Rutas principales actuales:

```text
http://127.0.0.1:3000/
http://127.0.0.1:3000/presupuestos
http://127.0.0.1:3000/presupuestos/<proyectoId>
http://<IP-LAN-DE-LA-LAPTOP>:3000/
http://<IP-LAN-DE-LA-LAPTOP>:3000/presupuestos
https://cyp-sistema-costos-presupuestos.vercel.app/
https://cyp-sistema-costos-presupuestos.vercel.app/presupuestos
```

Variables pÃºblicas esperadas en `.env.local`:

```powershell
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-local>
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000
# Opcional server-side para invitaciones de producto con Resend.
RESEND_API_KEY=<resend-api-key>
# Opcional si se activa CAPTCHA en Supabase remoto.
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<turnstile-site-key>
# Opcional para OAuth Google local si se habilita [auth.external.google].
GOOGLE_OAUTH_CLIENT_ID=<google-client-id>
GOOGLE_OAUTH_CLIENT_SECRET=<google-client-secret>
```

## Ãndice de documentaciÃ³n

- [Producto](docs/00-producto.md)
- [Arquitectura](docs/01-arquitectura.md)
- [Modelo de datos](docs/02-modelo-datos.md)
- [CÃ¡lculos](docs/03-calculos.md)
- [Roadmap MVP](docs/04-roadmap-mvp.md)
- [Frontend UI/UX](docs/05-frontend-ui-ux.md)
- [Validaciones y testing](docs/06-validaciones-y-testing.md)
- [Exportaciones](docs/07-exportaciones.md)
- [ProducciÃ³n](docs/08-produccion.md)
- [Avances, pendientes y goals](docs/09-avances-y-goals.md)
- [Post-MVP, feature complete y goals](docs/10-post-mvp-goals.md)
- [Bugs y optimizaciones](docs/11-bugs-y-optimizaciones.md)

## Reglas de arquitectura

- Respetar una separaciÃ³n clara entre UI, datos, validaciones, cÃ¡lculos y exportaciones.
- No poner lÃ³gica financiera dentro de componentes visuales.
- Mantener los cÃ¡lculos previstos en `lib/calculations/apu.ts` y `lib/calculations/budget.ts`.
- Mantener los esquemas Zod en `lib/validations/`.
- Mantener datos mock y seed data fuera de la UI.
- Usar datos mock en frontend hasta que el goal correspondiente prepare la capa de datos persistente.
- Durante desarrollo backend, usar Supabase local mediante CLI como fuente principal; no depender de un proyecto remoto para iterar migraciones.
- Mantener migraciones y seed como fuente de verdad del esquema local y futuro remoto.
- Encapsular Supabase en una capa de datos antes de conectar pantallas; no acoplar pÃ¡ginas directamente al cliente.
- Congelar snapshots en presupuestos para preservar el valor histÃ³rico.
- Separar presupuesto borrador de presupuesto oficial: el borrador es colaborativo, editable y puede recalcular con precios vigentes; cada versiÃ³n oficial queda congelada e inmutable.
- Modelar recursos como catÃ¡logo canÃ³nico y cotizaciones/precios por proveedor; no duplicar recursos solo porque varios proveedores ofrecen el mismo material.
- Marcar proveedores aptos para cliente con `disponible_para_cliente`; la exportaciÃ³n cliente usa precios cliente congelados y no revela proveedores ni costos internos.
- Usar `activity_events` como auditorÃ­a permanente de cambios; Realtime solo transporta avisos/actualizaciones y no reemplaza historial.
- Modelar colaboraciÃ³n sobre `OrganizaciÃ³n -> Proyecto -> Miembros`, con roles y RLS antes de exponer datos reales o canales Realtime.
- Usar Broadcast para eventos persistidos y Presence para estado efÃ­mero como usuarios viendo/editando; evitar depender de Postgres Changes directo en muchas tablas para producciÃ³n.
- Manejar conflictos con ediciÃ³n optimista usando `expectedUpdatedAt`: si un dato cambiÃ³ mientras el usuario editaba, avisar, mostrar campos cambiados y permitir cargar remoto o aplicar una sobrescritura explÃ­cita sobre la versiÃ³n persistida mÃ¡s reciente.
- No dejar enlaces `#` ni botones activos sin acciÃ³n real; conectar a rutas reales o deshabilitar con tooltip.
- Evitar complejidad innecesaria: el objetivo es un MVP sÃ³lido, limpio y funcional.

## Regla de documentaciÃ³n al cerrar tareas

- Al terminar una o varias tareas, actualizar la documentaciÃ³n respectiva antes de dar el trabajo por cerrado.
- Si cambia el estado general del proyecto, actualizar `docs/09-avances-y-goals.md`.
- Si el cambio es posterior al MVP colaborativo, actualizar `docs/10-post-mvp-goals.md`.
- Si cambia el alcance o el orden del MVP, actualizar `docs/04-roadmap-mvp.md`.
- Si cambia arquitectura, estructura, comandos o stack, actualizar `AGENTS.md` y `docs/01-arquitectura.md`.
- Si se agregan o cambian reglas de datos, cÃ¡lculos, validaciones, exportaciones o producciÃ³n, actualizar el documento `docs/` correspondiente.
- Cada cierre debe mencionar quÃ© documentaciÃ³n fue actualizada o indicar explÃ­citamente que no aplicaba actualizarla.

## Orden recomendado de implementaciÃ³n

1. Mantener actualizado el seguimiento en `docs/09-avances-y-goals.md`.
2. Crear componentes compartidos mÃ­nimos para reducir duplicaciÃ³n.
3. Hacer una revisiÃ³n responsive amplia si se requieren ajustes finos adicionales.
4. Implementar cronogramas mock desde presupuestos con Gantt, ruta crÃ­tica, tareas paralelas, dependencias simples y duraciÃ³n mixta.
5. Agregar auth, RLS y ownership por organizaciÃ³n/proyecto antes de colaboraciÃ³n real.
6. Crear capa de datos Supabase consciente de organizaciÃ³n/proyecto.
7. Migrar proveedores y recursos a CRUD persistente con auditorÃ­a.
8. Migrar partidas/APU a CRUD persistente con cÃ¡lculos, validaciones y auditorÃ­a.
9. Pulir presupuestos persistentes con multi-proyecto, conflictos optimistas y dashboard de versiÃ³n vigente.
10. Migrar cronogramas a borradores colaborativos y versiones oficiales congeladas.
11. Implementar Presence y conflictos colaborativos.
12. Implementar reportes simples.
13. Mejorar exportaciones finales.
14. Ampliar tests de validaciones, exports, snapshots, auditorÃ­a, cronogramas y capa de datos.
15. DespuÃ©s del MVP colaborativo, continuar con `docs/10-post-mvp-goals.md` para producciÃ³n final, administraciÃ³n SaaS, importaciones, planificaciÃ³n avanzada, reportes avanzados, observabilidad, performance y billing si aplica.

## Criterios generales

- Todo el texto visible de la aplicaciÃ³n debe estar en espaÃ±ol.
- La UI debe sentirse moderna, profesional y usable en laptop mediana y desktop.
- Los formularios deben ser simples y tener mensajes de error comprensibles.
- Los cambios de precio de recursos deben registrar historial cuando exista persistencia o estado mock equivalente.
- Los presupuestos anteriores no deben cambiar automÃ¡ticamente cuando cambie un recurso o una partida.
- Cada goal que cambie cÃ³digo funcional debe terminar con `pnpm lint`, `pnpm build` y actualizaciÃ³n de pendientes en `docs/09-avances-y-goals.md`.
- Si un goal solo cambia documentaciÃ³n, puede omitirse `pnpm lint` y `pnpm build` indicando explÃ­citamente la razÃ³n.
