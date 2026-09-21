import type { Permission } from "@/lib/rbac/permissions";

export type NavItem = {
  href: string;
  label: string;
  permission?: Permission;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const staffNav: NavSection[] = [
  {
    title: "Inicio",
    items: [{ href: "/app", label: "Dashboard", permission: "dashboard.read" }],
  },
  {
    title: "Control escolar",
    items: [
      { href: "/app/control-escolar/alumnos", label: "Alumnos", permission: "students.read" },
      { href: "/app/control-escolar/aspirantes", label: "Aspirantes", permission: "applicants.read" },
      { href: "/app/control-escolar/padres", label: "Padres / tutores", permission: "guardians.read" },
      { href: "/app/control-escolar/docentes", label: "Docentes", permission: "teachers.read" },
      { href: "/app/control-escolar/grupos", label: "Grupos", permission: "groups.read" },
      { href: "/app/control-escolar/programas", label: "Programas", permission: "programs.read" },
      { href: "/app/control-escolar/materias", label: "Materias", permission: "programs.read" },
      { href: "/app/control-escolar/horarios", label: "Horarios", permission: "schedules.read" },
      { href: "/app/control-escolar/asistencias", label: "Asistencias", permission: "attendance.read" },
      { href: "/app/control-escolar/calificaciones", label: "Calificaciones", permission: "grades.read" },
      { href: "/app/control-escolar/documentos", label: "Documentos", permission: "documents.read" },
    ],
  },
  {
    title: "Finanzas",
    items: [
      { href: "/app/finanzas/estados-de-cuenta", label: "Estado de cuenta", permission: "finance.read" },
      { href: "/app/finanzas/cobranza", label: "Cobranza", permission: "collections.read" },
      { href: "/app/finanzas/caja", label: "Caja", permission: "cash.read" },
      { href: "/app/finanzas/pagos", label: "Pagos", permission: "finance.read" },
      { href: "/app/finanzas/becas", label: "Becas", permission: "scholarships.read" },
      { href: "/app/finanzas/descuentos", label: "Descuentos", permission: "scholarships.read" },
    ],
  },
  {
    title: "Marketing",
    items: [
      { href: "/app/marketing/prospectos", label: "Prospectos", permission: "marketing.read" },
      { href: "/app/marketing/crm", label: "CRM / embudo", permission: "marketing.read" },
      { href: "/app/marketing/seguimientos", label: "Seguimientos", permission: "marketing.read" },
      { href: "/app/marketing/campanas", label: "Campañas", permission: "marketing.read" },
    ],
  },
  {
    title: "E-learning",
    items: [
      { href: "/app/elearning/cursos", label: "Cursos", permission: "elearning.read" },
      { href: "/app/elearning/actividades", label: "Actividades", permission: "elearning.read" },
      { href: "/app/elearning/examenes", label: "Exámenes", permission: "elearning.read" },
    ],
  },
  {
    title: "Comunicación",
    items: [
      { href: "/app/comunicacion/avisos", label: "Avisos", permission: "communication.read" },
      { href: "/app/comunicacion/mensajes", label: "Mensajes", permission: "communication.read" },
      { href: "/app/comunicacion/notificaciones", label: "Notificaciones", permission: "communication.read" },
      { href: "/app/calendario", label: "Calendario", permission: "calendar.read" },
    ],
  },
  {
    title: "Sistema",
    items: [
      { href: "/app/reportes", label: "Reportes", permission: "reports.read" },
      { href: "/app/auditoria", label: "Auditoría", permission: "audit.read" },
      { href: "/app/usuarios", label: "Usuarios", permission: "users.read" },
      { href: "/app/configuracion", label: "Configuración", permission: "settings.read" },
    ],
  },
];

export const studentNav: NavItem[] = [
  { href: "/portal/alumno", label: "Inicio" },
  { href: "/portal/alumno/materias", label: "Materias" },
  { href: "/portal/alumno/horario", label: "Horario" },
  { href: "/portal/alumno/calificaciones", label: "Calificaciones" },
  { href: "/portal/alumno/asistencias", label: "Asistencias" },
  { href: "/portal/alumno/tareas", label: "Tareas" },
  { href: "/portal/alumno/cursos", label: "Cursos" },
  { href: "/portal/alumno/pagos", label: "Pagos" },
  { href: "/portal/alumno/documentos", label: "Documentos" },
  { href: "/portal/alumno/avisos", label: "Avisos" },
];

export const guardianNav: NavItem[] = [
  { href: "/portal/padres", label: "Inicio" },
  { href: "/portal/padres/calificaciones", label: "Calificaciones" },
  { href: "/portal/padres/asistencias", label: "Asistencias" },
  { href: "/portal/padres/horario", label: "Horario" },
  { href: "/portal/padres/tareas", label: "Tareas" },
  { href: "/portal/padres/estado-de-cuenta", label: "Estado de cuenta" },
  { href: "/portal/padres/documentos", label: "Documentos" },
  { href: "/portal/padres/avisos", label: "Avisos" },
];
