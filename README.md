# Space Maker Educación

Plataforma web de gestión escolar (ERP / SIS) para **SPACE MAKER EDUCACIÓN**. Administra alumnos, padres, docentes, control escolar, finanzas, caja, cobranza, marketing, e-learning y portales.

No es un prototipo visual: cada módulo consulta PostgreSQL, valida permisos en backend y maneja errores, vacíos y estados de carga.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4 + componentes propios estilo shadcn
- Prisma 6 + PostgreSQL 16
- Autenticación por sesión JWT (cookie httpOnly) + RBAC
- Vitest

## Requisitos

- Node.js 22+
- PostgreSQL 16
- npm

## Instalación

```bash
cp .env.example .env
# Ajuste DATABASE_URL y AUTH_SECRET
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Con Docker para la base:

```bash
docker compose up -d
```

## Scripts

| Script | Uso |
| --- | --- |
| `npm run dev` | Desarrollo (Turbopack) |
| `npm run build` | Genera Prisma Client y build de producción |
| `npm run start` | Servidor de producción |
| `npm run test` | Pruebas unitarias |
| `npm run typecheck` | TypeScript estricto |
| `npm run db:migrate` | Migraciones de desarrollo |
| `npm run db:seed` | Datos DEMO |
| `npm run lint` | ESLint |

## Usuarios DEMO

Contraseña común: `Demo.2026!`

| Correo | Rol |
| --- | --- |
| admin.demo@spacemaker.local | Superadministrador |
| docente.ana.demo@spacemaker.local | Docente |
| caja.demo@spacemaker.local | Caja |
| alumno1.demo@spacemaker.local | Alumno |
| padre1.demo@spacemaker.local | Padre / tutor |

Los datos están etiquetados como **DEMO** y no representan personas reales.

## Documentación

- [Arquitectura](docs/architecture.md)
- [API](docs/api.md)

## Integraciones pendientes (adaptadores)

- Almacenamiento S3 / R2 / Supabase (`STORAGE_DRIVER`)
- SMTP real (`EMAIL_DRIVER=smtp`)
- WhatsApp, SMS, push
- SSO Google / Microsoft
- Pagos en línea, CFDI, firma digital, videoclases
