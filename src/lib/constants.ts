export const APP_NAME = "Space Maker Educación";
export const SESSION_COOKIE = "sm_session";

export const DEMO_NOTICE =
  "Datos DEMO de Space Maker Educación. No corresponden a personas reales.";

export const PASSING_SCORE = 6;

export const DAY_LABELS: Record<number, string> = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
  7: "Domingo",
};

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Superadministrador",
  GENERAL_DIRECTOR: "Director general",
  ACADEMIC_DIRECTOR: "Director académico",
  SCHOOL_CONTROL: "Control escolar",
  ADMINISTRATION: "Administración",
  FINANCE: "Finanzas",
  CASHIER: "Caja",
  COLLECTIONS: "Cobranza",
  MARKETING: "Marketing",
  TEACHER: "Docente",
  PSYCHOPEDAGOGY: "Psicopedagogía",
  GUARDIAN: "Padre / tutor",
  STUDENT: "Alumno",
  APPLICANT: "Aspirante",
};

export const STUDENT_STATUS_LABELS: Record<string, string> = {
  APPLICANT: "Aspirante",
  PRE_ENROLLED: "Preinscrito",
  ENROLLED: "Inscrito",
  ACTIVE: "Activo",
  TEMPORARY_LEAVE: "Baja temporal",
  PERMANENT_LEAVE: "Baja definitiva",
  GRADUATED: "Egresado",
  TITLED: "Titulado",
};

export const SHIFT_LABELS: Record<string, string> = {
  MORNING: "Matutino",
  AFTERNOON: "Vespertino",
  EVENING: "Nocturno",
  MIXED: "Mixto",
};

export const ATTENDANCE_LABELS: Record<string, string> = {
  PRESENT: "Presente",
  ABSENT: "Falta",
  LATE: "Retardo",
  JUSTIFIED: "Justificada",
};

export const CHARGE_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  PARTIAL: "Parcial",
  PAID: "Pagado",
  OVERDUE: "Vencido",
  CANCELLED: "Cancelado",
  AGREEMENT: "Convenio",
};

export const COLLECTION_STATUS_LABELS: Record<string, string> = {
  CURRENT: "Al corriente",
  DUE_SOON: "Próximo a vencer",
  OVERDUE: "Vencido",
  AGREEMENT: "Convenio",
  ADMIN_SUSPENSION: "Suspensión administrativa",
};

export const PROSPECT_STAGE_LABELS: Record<string, string> = {
  NEW: "Nuevo",
  CONTACTED: "Contactado",
  INFO_SENT: "Información enviada",
  FOLLOW_UP: "Seguimiento",
  VISIT: "Visita",
  PRE_ENROLLMENT: "Preinscripción",
  ENROLLED: "Inscrito",
  LOST: "Perdido",
};

export const DOCUMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  VALIDATED: "Validado",
  REJECTED: "Rechazado",
  EXPIRED: "Vencido",
};

export const SEX_LABELS: Record<string, string> = {
  FEMALE: "Femenino",
  MALE: "Masculino",
  OTHER: "Otro",
  UNSPECIFIED: "No especificado",
};

export const STAFF_ROLES = [
  "SUPER_ADMIN",
  "GENERAL_DIRECTOR",
  "ACADEMIC_DIRECTOR",
  "SCHOOL_CONTROL",
  "ADMINISTRATION",
  "FINANCE",
  "CASHIER",
  "COLLECTIONS",
  "MARKETING",
  "TEACHER",
  "PSYCHOPEDAGOGY",
] as const;
