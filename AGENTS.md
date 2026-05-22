# C y P - Sistema de Costos y Presupuestos

Este repositorio contiene la planificación e implementación progresiva de **C y P**, un sistema web tipo SaaS para gestionar costos y presupuestos de construcción.

El flujo principal del producto es:

```text
Recursos -> Partidas/APU -> Presupuestos -> Cronogramas -> Reportes
```

## Estado actual

- Proyecto inicializado como repositorio Git.
- Aplicación Next.js 14 App Router + React 18 + TypeScript creada.
- Tailwind CSS configurado.
- `lucide-react`, `zod`, `vitest`, `xlsx` y `@supabase/supabase-js` instalados.
- Dashboard real en `/` implementado con acceso a presupuestos por ruta `/presupuestos/<proyectoId>`.
- `/presupuestos` conectado al borrador persistente de Supabase con partidas, metrados editables, eliminación de líneas, totales, revisión de precios cliente, override manual y emisión de versiones oficiales congeladas.
- Cronogramas definidos como módulo MVP previo a Supabase: inicialmente mock/frontend desde partidas presupuestadas, con Gantt, ruta crítica, dependencias simples y duración mixta sugerida/manual.
- Layout base creado con `AppLayout`, `Sidebar` y `Topbar`.
- Componentes principales de presupuesto creados: KPI cards, tabla de presupuesto, resumen financiero, recursos mini y tabs APU con snapshots APU mock por línea.
- Pantallas funcionales creadas para `/presupuestos`, `/recursos`, `/proveedores`, `/partidas` y `/partidas/[id]`; `/presupuestos`, `/recursos` y `/proveedores` ya usan Supabase.
- Datos mock separados en `lib/mock-data/`.
- Tipos de dominio creados en `types/domain.ts`.
- Cálculos puros implementados en `lib/calculations/`.
- Zod instalado y esquemas base creados en `lib/validations/`; todavía no están conectados a todos los formularios.
- Exportación interna de presupuestos a Excel con `xlsx`, PDF mediante vista HTML imprimible y exportación cliente desde versión oficial congelada.
- Migración inicial Supabase, seed data Perú, `.env.example` y cliente Supabase tipado preparados.
- Migración colaborativa Supabase preparada con organizaciones, proyectos, miembros, auditoría `activity_events`, borradores vivos, versiones oficiales congeladas, precio fijado/autoactualizable y precios cliente.
- Migración multi-proveedor preparada con `proveedores.disponible_para_cliente`, `recurso_proveedor_precios`, RLS/grants explícitos, seed demo y snapshots cliente.
- Seed demo extendido con organización/proyecto, borrador activo y versión oficial congelada; no incluye miembros reales porque Supabase Auth todavía no está configurado.
- Decisión de arquitectura colaborativa documentada: Supabase/Postgres será la base para borradores colaborativos, auditoría permanente, versiones oficiales congeladas, Realtime y presencia.
- Limpieza de affordances falsas aplicada en los módulos completados: no usar `href="#"`; conectar rutas reales o deshabilitar con tooltip.
- `pnpm lint`, `pnpm test`, `pnpm exec tsc --noEmit` y `pnpm build` han pasado en verificaciones previas.
- Supabase CLI local agregada como dev dependency (`supabase`) y Docker Desktop validado en este entorno.
- Supabase local-first configurado con `supabase/config.toml`, `.env.local` local ignorado, scripts pnpm, migraciones, seed y tipos generados desde la base local.
- Ya hay conexión real de UI a Supabase para proveedores, recursos, cotizaciones, partidas/APU y presupuestos; todavía faltan cronogramas persistentes.
- Realtime colaborativo implementado con Broadcast privado desde `activity_events`, Presence efímero y resolución optimista de conflictos con `updated_at`.
- Bugs/reaperturas de los chunks 1-8 cerrados en el repo; solo quedan checklists remotos de deploy documentados para CAPTCHA y redirect URLs de Supabase/Vercel.

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
- Gráficos simples: Recharts solo si el reporte lo justifica.
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
```

Variables públicas esperadas en `.env.local`:

```powershell
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-local>
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000
# Opcional para OAuth Google local si se habilita [auth.external.google].
GOOGLE_OAUTH_CLIENT_ID=<google-client-id>
GOOGLE_OAUTH_CLIENT_SECRET=<google-client-secret>
```

## Índice de documentación

- [Producto](docs/00-producto.md)
- [Arquitectura](docs/01-arquitectura.md)
- [Modelo de datos](docs/02-modelo-datos.md)
- [Cálculos](docs/03-calculos.md)
- [Roadmap MVP](docs/04-roadmap-mvp.md)
- [Frontend UI/UX](docs/05-frontend-ui-ux.md)
- [Validaciones y testing](docs/06-validaciones-y-testing.md)
- [Exportaciones](docs/07-exportaciones.md)
- [Producción](docs/08-produccion.md)
- [Avances, pendientes y goals](docs/09-avances-y-goals.md)
- [Post-MVP, feature complete y goals](docs/10-post-mvp-goals.md)
- [Bugs y optimizaciones](docs/11-bugs-y-optimizaciones.md)

## Reglas de arquitectura

- Respetar una separación clara entre UI, datos, validaciones, cálculos y exportaciones.
- No poner lógica financiera dentro de componentes visuales.
- Mantener los cálculos previstos en `lib/calculations/apu.ts` y `lib/calculations/budget.ts`.
- Mantener los esquemas Zod en `lib/validations/`.
- Mantener datos mock y seed data fuera de la UI.
- Usar datos mock en frontend hasta que el goal correspondiente prepare la capa de datos persistente.
- Durante desarrollo backend, usar Supabase local mediante CLI como fuente principal; no depender de un proyecto remoto para iterar migraciones.
- Mantener migraciones y seed como fuente de verdad del esquema local y futuro remoto.
- Encapsular Supabase en una capa de datos antes de conectar pantallas; no acoplar páginas directamente al cliente.
- Congelar snapshots en presupuestos para preservar el valor histórico.
- Separar presupuesto borrador de presupuesto oficial: el borrador es colaborativo, editable y puede recalcular con precios vigentes; cada versión oficial queda congelada e inmutable.
- Modelar recursos como catálogo canónico y cotizaciones/precios por proveedor; no duplicar recursos solo porque varios proveedores ofrecen el mismo material.
- Marcar proveedores aptos para cliente con `disponible_para_cliente`; la exportación cliente usa precios cliente congelados y no revela proveedores ni costos internos.
- Usar `activity_events` como auditoría permanente de cambios; Realtime solo transporta avisos/actualizaciones y no reemplaza historial.
- Modelar colaboración sobre `Organización -> Proyecto -> Miembros`, con roles y RLS antes de exponer datos reales o canales Realtime.
- Usar Broadcast para eventos persistidos y Presence para estado efímero como usuarios viendo/editando; evitar depender de Postgres Changes directo en muchas tablas para producción.
- Manejar conflictos con edición optimista usando `expectedUpdatedAt`: si un dato cambió mientras el usuario editaba, avisar, mostrar campos cambiados y permitir cargar remoto o aplicar una sobrescritura explícita sobre la versión persistida más reciente.
- No dejar enlaces `#` ni botones activos sin acción real; conectar a rutas reales o deshabilitar con tooltip.
- Evitar complejidad innecesaria: el objetivo es un MVP sólido, limpio y funcional.

## Regla de documentación al cerrar tareas

- Al terminar una o varias tareas, actualizar la documentación respectiva antes de dar el trabajo por cerrado.
- Si cambia el estado general del proyecto, actualizar `docs/09-avances-y-goals.md`.
- Si el cambio es posterior al MVP colaborativo, actualizar `docs/10-post-mvp-goals.md`.
- Si cambia el alcance o el orden del MVP, actualizar `docs/04-roadmap-mvp.md`.
- Si cambia arquitectura, estructura, comandos o stack, actualizar `AGENTS.md` y `docs/01-arquitectura.md`.
- Si se agregan o cambian reglas de datos, cálculos, validaciones, exportaciones o producción, actualizar el documento `docs/` correspondiente.
- Cada cierre debe mencionar qué documentación fue actualizada o indicar explícitamente que no aplicaba actualizarla.

## Orden recomendado de implementación

1. Mantener actualizado el seguimiento en `docs/09-avances-y-goals.md`.
2. Crear componentes compartidos mínimos para reducir duplicación.
3. Hacer una revisión responsive amplia si se requieren ajustes finos adicionales.
4. Implementar cronogramas mock desde presupuestos con Gantt, ruta crítica, tareas paralelas, dependencias simples y duración mixta.
5. Agregar auth, RLS y ownership por organización/proyecto antes de colaboración real.
6. Crear capa de datos Supabase consciente de organización/proyecto.
7. Migrar proveedores y recursos a CRUD persistente con auditoría.
8. Migrar partidas/APU a CRUD persistente con cálculos, validaciones y auditoría.
9. Pulir presupuestos persistentes con multi-proyecto, conflictos optimistas y dashboard de versión vigente.
10. Migrar cronogramas a borradores colaborativos y versiones oficiales congeladas.
11. Implementar Presence y conflictos colaborativos.
12. Implementar reportes simples.
13. Mejorar exportaciones finales.
14. Ampliar tests de validaciones, exports, snapshots, auditoría, cronogramas y capa de datos.
15. Después del MVP colaborativo, continuar con `docs/10-post-mvp-goals.md` para producción final, administración SaaS, importaciones, planificación avanzada, reportes avanzados, observabilidad, performance y billing si aplica.

## Criterios generales

- Todo el texto visible de la aplicación debe estar en español.
- La UI debe sentirse moderna, profesional y usable en laptop mediana y desktop.
- Los formularios deben ser simples y tener mensajes de error comprensibles.
- Los cambios de precio de recursos deben registrar historial cuando exista persistencia o estado mock equivalente.
- Los presupuestos anteriores no deben cambiar automáticamente cuando cambie un recurso o una partida.
- Cada goal que cambie código funcional debe terminar con `pnpm lint`, `pnpm build` y actualización de pendientes en `docs/09-avances-y-goals.md`.
- Si un goal solo cambia documentación, puede omitirse `pnpm lint` y `pnpm build` indicando explícitamente la razón.
