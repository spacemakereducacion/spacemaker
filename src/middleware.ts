import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE } from "@/lib/constants";
import { defaultHome, isStaffRole, roleHasPermission, type Permission } from "@/lib/rbac/permissions";
import type { RoleCode } from "@prisma/client";

function secret() {
  return new TextEncoder().encode(process.env.AUTH_SECRET ?? "");
}

const routePermissions: Array<{ prefix: string; permission: Permission }> = [
  { prefix: "/app/control-escolar/alumnos", permission: "students.read" },
  { prefix: "/app/control-escolar/aspirantes", permission: "applicants.read" },
  { prefix: "/app/control-escolar/padres", permission: "guardians.read" },
  { prefix: "/app/control-escolar/docentes", permission: "teachers.read" },
  { prefix: "/app/control-escolar/grupos", permission: "groups.read" },
  { prefix: "/app/control-escolar/programas", permission: "programs.read" },
  { prefix: "/app/control-escolar/materias", permission: "programs.read" },
  { prefix: "/app/control-escolar/horarios", permission: "schedules.read" },
  { prefix: "/app/control-escolar/asistencias", permission: "attendance.read" },
  { prefix: "/app/control-escolar/calificaciones", permission: "grades.read" },
  { prefix: "/app/control-escolar/documentos", permission: "documents.read" },
  { prefix: "/app/finanzas/cobranza", permission: "collections.read" },
  { prefix: "/app/finanzas/caja", permission: "cash.read" },
  { prefix: "/app/finanzas/becas", permission: "scholarships.read" },
  { prefix: "/app/finanzas/descuentos", permission: "scholarships.read" },
  { prefix: "/app/finanzas", permission: "finance.read" },
  { prefix: "/app/marketing", permission: "marketing.read" },
  { prefix: "/app/elearning", permission: "elearning.read" },
  { prefix: "/app/comunicacion", permission: "communication.read" },
  { prefix: "/app/calendario", permission: "calendar.read" },
  { prefix: "/app/reportes", permission: "reports.read" },
  { prefix: "/app/auditoria", permission: "audit.read" },
  { prefix: "/app/usuarios", permission: "users.read" },
  { prefix: "/app/configuracion", permission: "settings.read" },
  { prefix: "/app", permission: "dashboard.read" },
  { prefix: "/portal/alumno", permission: "portal.student" },
  { prefix: "/portal/padres", permission: "portal.guardian" },
  { prefix: "/portal/aspirante", permission: "portal.applicant" },
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const publicPaths = ["/login", "/recuperar", "/restablecer", "/verificar", "/api/health"];
  if (publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return NextResponse.next();
  }
  if (pathname.startsWith("/_next") || pathname.startsWith("/images") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    if (pathname === "/") return NextResponse.redirect(new URL("/login", request.url));
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  try {
    const { payload } = await jwtVerify(token, secret());
    const role = payload.role as RoleCode;
    if (pathname === "/") {
      return NextResponse.redirect(new URL(defaultHome(role), request.url));
    }
    if (pathname.startsWith("/app") && !isStaffRole(role)) {
      return NextResponse.redirect(new URL(defaultHome(role), request.url));
    }
    const match = routePermissions.find((item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`));
    if (match && !roleHasPermission(role, match.permission)) {
      return NextResponse.redirect(new URL(defaultHome(role), request.url));
    }
    return NextResponse.next();
  } catch {
    const login = new URL("/login", request.url);
    return NextResponse.redirect(login);
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
