# Arquitectura — Space Maker Educación

## Resumen

Aplicación full-stack Next.js (App Router) + TypeScript + Prisma + PostgreSQL. El backend no se separó en otro servicio: las mutaciones viven en Server Actions y las lecturas en queries de servidor. Los permisos se validan **siempre en backend**.

## Capas

- `src/app` — rutas, layouts y API HTTP (`/api/health`, `/api/export`, `/api/files`)
- `src/modules` — casos de uso por dominio (auth, academic, finance, marketing, elearning, communication, reports, settings, portal, search)
- `src/lib` — autenticación, RBAC, auditoría, almacenamiento, correo, notificaciones, finanzas, horarios, calificaciones
- `src/components` — UI reutilizable y shell (sidebar, topbar, búsqueda)
- `prisma` — esquema, migraciones y seed DEMO

## Autenticación

Sesión JWT firmada con `jose` en cookie httpOnly `sm_session`. Contraseñas con bcrypt (12 rounds). Recuperación y verificación usan tokens SHA-256 con expiración. SSO Google/Microsoft está preparado en `src/lib/auth/oauth.ts` pero no se activa sin credenciales.

## RBAC y multiplantel

14 roles. La matriz está en `src/lib/rbac/permissions.ts`. Middleware protege prefijos de ruta; cada acción llama `requirePermission`. Superadministrador y Director general ven todos los planteles; el resto se acota por `campusId`. Padres y alumnos solo acceden a registros vinculados.

## Almacenamiento

Adaptador local (`STORAGE_DRIVER=local`). S3 / R2 / Supabase están declarados como adaptadores no configurados. La descarga de documentos valida permisos y deja auditoría.

## Canales externos

Correo, WhatsApp, SMS y push usan adaptadores `console` hasta que existan credenciales SMTP o de proveedor. No se simula un envío real.

## Auditoría

`writeAudit` registra login, logout, CRUD, cambios de calificación/pago, permisos y descargas.

## Extensibilidad

Pensado para crecer hacia app móvil, pagos en línea, facturación electrónica, firma digital y videoclases: los módulos de dominio ya están separados y los integradores externos son interfaces.
