# Producción

## Estado actual

El proyecto tiene un primer despliegue productivo funcional en Vercel con Supabase remoto enlazado. La app está publicada en `https://cyp-sistema-costos-presupuestos.vercel.app`, el proyecto Vercel es `diego-polacks-projects/cyp-sistema-costos-presupuestos` y Supabase remoto usa el ref `qrzyltggvixlsowxepxh`. El 2026-05-22 se aplicaron las 18 migraciones locales al remoto, se cargó `supabase/seed.sql`, se configuraron variables públicas de producción en Vercel y el deployment quedó `Ready`. También se configuraron Site URL/Redirect URLs de Auth, confirmación de email, reglas fuertes de contraseña, reautenticación para cambio de clave y SSL enforcement remoto.

El proyecto todavía no debe considerarse producción final para usuarios reales. Supabase local-first ya está configurado y validado con migraciones, seed, tipos generados, Supabase Auth email/password endurecido, RLS por organización/proyecto, CRUDs persistentes principales, auditoría desde la aplicación, Realtime por Broadcast privado, Presence con identidad confiable, headers de seguridad web y RPCs transaccionales para las mutaciones críticas de presupuestos. Faltan cronogramas persistentes y endurecimiento remoto que requiere credenciales externas: SMTP propio, CAPTCHA con Cloudflare Turnstile, Google OAuth si aplica, verificación de `Allow public access` en Realtime y pruebas con usuarios reales.

La estrategia acordada sigue siendo desarrollar primero contra Supabase local con Supabase CLI y Docker. El proyecto Supabase remoto queda como entorno de deploy/staging inicial, no como fuente primaria de cambios de esquema durante el desarrollo.

La producción completa queda fuera del cierre del MVP colaborativo. Los goals posteriores a ese cierre viven en [Post-MVP, feature complete y goals](10-post-mvp-goals.md).

## Pendientes fuera del mock inicial

- Endurecimiento remoto de Auth para staging/producción: SMTP real, Google OAuth si aplica, rate limits revisados con SMTP propio, CAPTCHA configurado en Supabase remoto y política de signup público.
- Extender Presence y resolución de conflictos a cronogramas cuando se vuelvan persistentes.
- Conexión productiva completa para cronogramas, reportes y módulos pendientes.
- Backups y recuperación.
- Monitoreo de errores.
- Ambientes separados: desarrollo, staging y producción.
- Proyecto Supabase remoto ya enlazado para deploy inicial; mantener cambios de esquema desde migraciones versionadas locales.
- Importación masiva de recursos.
- Versionado formal de partidas.
- Aprobaciones de presupuestos.
- Plantillas de reportes personalizables.

## Seguridad

- No exponer claves privadas de Supabase.
- Usar variables de entorno.
- Validar datos en cliente y servidor.
- RLS ya está aplicado sobre tablas públicas y debe mantenerse antes de usar datos reales de clientes.
- Realtime base usa canales privados autorizados por RLS en `realtime.messages`; en staging/producción debe mantenerse deshabilitado `Allow public access`.
- Los clientes solo publican Presence; Broadcast de cambios persistidos sale desde trigger SQL sobre `activity_events`.
- Presence valida `payload.actorId = auth.uid()` y muestra identidad desde `user_profiles`, no desde `user_metadata` ni desde el payload efímero.
- Evitar que la UI consulte Supabase directamente sin una capa de datos controlada.
- No confiar en eventos realtime como fuente de verdad ni como historial permanente.
- No exponer detalles crudos de errores Supabase en producción; los mensajes de errores no controlados deben ser genéricos y los detalles internos solo deben quedar disponibles en desarrollo/test.
- En local se permite email/password sin confirmación para iterar rápido; en staging/producción se debe habilitar confirmación de email y SMTP propio antes de signup público.
- Las contraseñas ya exigen mínimo 12 caracteres con minúscula, mayúscula y número en UI y `supabase/config.toml`; `secure_password_change` queda activo.
- Los redirects de Auth deben usar `NEXT_PUBLIC_APP_URL` y el remoto debe restringir Site URL / Additional Redirect URLs a dominios propios.
- Google OAuth usa `/auth/callback` para intercambiar el código por sesión; ese callback debe estar permitido en Supabase y en Google Cloud.
- La app incluye CSP, `frame-ancestors 'none'`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy: same-origin`, `Permissions-Policy` y HSTS solo en producción.
- La app incluye soporte opcional de Cloudflare Turnstile en login, registro y recuperación de clave. Solo se muestra cuando `NEXT_PUBLIC_TURNSTILE_SITE_KEY` existe; para activarlo por completo también se debe guardar el Secret Key en Supabase Auth > Bot and Abuse Protection.

## Datos

- Definir política de backups.
- Definir estrategia de migraciones.
- Mantener seed data separado de datos reales.
- Documentar cualquier cambio de esquema.
- Probar migraciones primero en Supabase local antes de aplicarlas a staging o producción.
- Evitar cambios manuales de esquema en el panel remoto que no existan en `supabase/migrations/`.
- Mantener `supabase/config.toml`, `supabase/migrations/` y `supabase/seed.sql` como fuentes del entorno local.
- Regenerar `lib/supabase/types.ts` con `pnpm run supabase:types` cuando cambie el esquema o las RPC.
- Mantener pruebas RLS en `supabase/tests/rls.sql` y ejecutarlas con `pnpm exec supabase test db supabase/tests/rls.sql` después de cambios de seguridad.
- Preservar snapshots de presupuestos para evitar mutación histórica.
- Mantener emisión oficial y agregado de partidas dentro de RPCs transaccionales; no volver a dividir esas escrituras críticas en múltiples inserts desde TypeScript.
- Mantener validación de `activity_events` por whitelist de entidad y existencia/scope para que la auditoría no se ensucie con referencias arbitrarias.
- Mantener `user_profiles` como tabla derivada de `auth.users`; no permitir escrituras directas desde cliente.
- Definir retención de `activity_events` y política de consulta para auditoría.
- `activity_events` limita payloads JSON a 50000 caracteres por campo serializado para evitar almacenamiento excesivo accidental.
- Asegurar que las versiones oficiales no se recalculen automáticamente.

## Operación

- Registrar errores de exportación.
- Medir tiempos de carga en tablas grandes.
- Revisar performance de filtros y búsquedas.
- Agregar índices cuando las consultas reales lo requieran.
- Monitorear latencia de Broadcast/Presence, renovacion de tokens Realtime y degradar a refetch manual si un canal falla.
- Monitorear errores de suscripcion realtime; la UI debe conservar `Recargar` como fallback operativo.
- Registrar y revisar conflictos de edición optimista frecuentes.

## Camino recomendado

1. Crear capa de datos Supabase consciente de organización/proyecto.
2. Migrar CRUDs persistentes con auditoría desde la aplicación.
3. Completar MVP funcional persistente con auditoría.
4. Conectar borradores colaborativos y versiones oficiales congeladas desde la capa de datos.
5. Implementar Presence y conflictos colaborativos con permisos verificados.
6. Crear/enlazar proyecto Supabase remoto para staging.
7. Aplicar migraciones versionadas al remoto.
8. Deshabilitar `Allow public access` en Realtime remoto y probar canales privados.
9. Probar con datos reales controlados.
10. Ajustar permisos, reportes y exportaciones.
11. Publicar producción.

Estado 2026-05-22: pasos 6, 7 y 11 ejecutados para un deploy inicial controlado. Site URL/Redirect URLs, confirmación de email, reglas de contraseña y SSL enforcement remoto quedaron aplicados. Los pasos que requieren credenciales externas de Auth, Realtime, backups y verificación multiusuario siguen pendientes antes de exponer la app a usuarios reales.

Los pasos 5 a 10 corresponden principalmente al backlog post-MVP y deben sincronizarse con `docs/10-post-mvp-goals.md`.

## Performance de consultas

- Los refrescos de precios de borradores se ejecutan con RPCs set-based (`refresh_draft_current_prices` y `refresh_draft_current_prices_for_resources`) para evitar loops de queries desde TypeScript.
- `recalculate_budget_draft_totals` mantiene el recalculo financiero dentro de Postgres y `list_budget_dashboard_projects` entrega agregados de dashboard sin exponer proyectos ajenos ni traer lineas completas.
- Despues de cambiar migraciones/RPCs de performance se debe ejecutar `pnpm run supabase:reset`, `pnpm run supabase:types` y pgTAP antes de validar UI.

## Checklist Supabase remoto

Estos pasos no se ejecutan en el repo local. Son tareas de configuración en el dashboard de Supabase remoto + Vercel al momento del deploy productivo. Marcar cada ítem antes de exponer la app a usuarios reales. Referencias: `SEG-13` y `SEG-26` en `docs/11-bugs-y-optimizaciones.md`.

### Auth y URLs

- [x] **Site URL**: seteado al dominio público de Vercel (`https://cyp-sistema-costos-presupuestos.vercel.app`).
- [x] **Additional Redirect URLs**: agregados `https://cyp-sistema-costos-presupuestos.vercel.app` y `https://cyp-sistema-costos-presupuestos.vercel.app/auth/callback`.
- [x] **OAuth callback**: `https://cyp-sistema-costos-presupuestos.vercel.app/auth/callback` queda permitido en Supabase Auth para cuando se habilite Google OAuth.
- [x] **`NEXT_PUBLIC_APP_URL`** en Vercel: seteado a `https://cyp-sistema-costos-presupuestos.vercel.app` para producción.

### Google OAuth

- [ ] **Supabase Auth Provider Google**: habilitar Google en el dashboard remoto con Client ID y Client Secret.
- [ ] **Google Cloud Authorized redirect URI**: agregar el callback de Supabase Auth (`https://<project-ref>.supabase.co/auth/v1/callback`) o el equivalente del proyecto remoto.
- [ ] **Google Cloud Authorized JavaScript origins**: agregar el dominio público de Vercel y, si se prueba local, `http://127.0.0.1:3000`.
- [ ] **Local opcional**: para Supabase CLI, setear `GOOGLE_OAUTH_CLIENT_ID` y `GOOGLE_OAUTH_CLIENT_SECRET`, habilitar `[auth.external.google]` y reiniciar/resetear Supabase local.

### Confirmación de email y SMTP

- [x] **`enable_confirmations = true`** en `[auth.email]` del dashboard remoto (en local queda en `false` para iterar rápido).
- [ ] **SMTP propio**: configurar `[auth.email.smtp]` con un proveedor real (SendGrid, AWS SES, Mailgun, etc.). Sin SMTP propio, Supabase usa rate limits muy estrictos.
- [ ] **`max_frequency` y `email_sent`**: ajustar rate limits según volumen esperado de signups y resets. Defaults muy bajos para tráfico real.

### Anti-abuso

- [ ] **CAPTCHA**: activar `turnstile` (Cloudflare) en Supabase remoto cuando existan Site Key y Secret Key. La UI ya soporta `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
- [x] **`secure_password_change = true`**: activo en remoto. Exige re-autenticación al cambiar contraseña.
- [x] **Password requirements**: remoto alineado con local (`minimum_password_length = 12`, `password_requirements = "lower_upper_letters_digits"`). Considerar ampliar a `lower_upper_letters_digits_symbols` si el target lo justifica.

### Realtime y seguridad de red

- [ ] **Realtime: `Allow public access = false`**. Los canales del proyecto se autorizan vía RLS en `realtime.messages`.
- [ ] **Network restrictions**: si el target lo requiere, configurar `db.network_restrictions` con CIDRs específicos.
- [ ] **Backups**: confirmar que Supabase remoto tiene backups automáticos activos y un plan de retención adecuado.
- [x] **SSL enforcement remoto**: activado para exigir SSL en conexiones externas a Postgres.

### Verificación post-deploy

- [ ] Probar signup completo (email confirmado).
- [ ] Probar `resetPasswordForEmail` (debe enviar email vía SMTP propio).
- [ ] Probar CAPTCHA en signup desde IP nueva.
- [ ] Probar colaboración Realtime entre dos usuarios reales.
- [ ] Verificar que el dashboard remoto reporte 0 errores de auth en las primeras 24h.
