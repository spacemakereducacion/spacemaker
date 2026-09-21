# API y Server Actions

La mayor parte del dominio se expone como Server Actions tipadas (no como REST público). Las acciones validan con Zod o comprobaciones explícitas y aplican RBAC.

## HTTP

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/health` | Salud de app + PostgreSQL |
| GET | `/api/export?kind=&format=` | Exporta CSV, XLSX o HTML imprimible. `kind`: alumnos, calificaciones, asistencias, pagos, prospectos |
| GET | `/api/files/[...key]` | Descarga protegida de archivos |

## Dominios de Server Actions

- Auth: `loginAction`, `logoutAction`, `forgotPasswordAction`, `resetPasswordAction`, `verifyEmailAction`
- Control escolar: alta/edición de alumnos, inscripción de aspirantes, tutores, docentes, programas, materias, grupos, cambio de grupo
- Operación académica: horarios (con conflicto), asistencias, calificaciones, documentos
- Finanzas: cargos, pagos con folio, caja, becas, descuentos, recordatorios de cobranza
- Marketing: prospectos, etapas, seguimientos, conversión a aspirante, campañas
- E-learning: cursos, módulos, lecciones, tareas, banco de preguntas, calificación automática
- Comunicación: avisos, mensajes, notificaciones, calendario
- Configuración: institución, planteles, usuarios
- Búsqueda global: `searchGlobal`

## Convenciones

Respuesta uniforme:

```ts
{ ok: true, data?, message? } | { ok: false, error, fieldErrors? }
```

Nunca se confía en ocultar un menú: si el rol no tiene permiso, la acción falla.
