import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import {
  SESSION_COOKIE,
  SESSION_COOKIE_CHIPS,
  SESSION_COOKIE_JS,
} from "@/lib/constants";
import { defaultHome, isStaffRole, roleHasPermission, type Permission } from "@/lib/rbac/permissions";
import type { RoleCode } from "@prisma/client";
import { attachSessionCookies, authSecretBytes, readSessionToken, withSessionHandoff } from "@/lib/auth/cookie";

function secret() {
  return authSecretBytes();
}

function redirectTo(path: string) {
  return new NextResponse(null, {
    status: 303,
    headers: { Location: path },
  });
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
  const publicPaths = ["/login", "/recuperar", "/restablecer", "/verificar", "/api/health", "/api/auth/login"];
  if (publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return NextResponse.next();
  }
  if (pathname.startsWith("/_next") || pathname.startsWith("/images") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  const token = readSessionToken({
    cookie: (name) => request.cookies.get(name)?.value,
    searchParam: (name) => request.nextUrl.searchParams.get(name) ?? undefined,
  });

  if (!token) {
    if (pathname === "/") return redirectTo("/login");
    return redirectTo(`/login?next=${encodeURIComponent(pathname)}`);
  }

  try {
    const { payload } = await jwtVerify(token, secret());
    const role = payload.role as RoleCode;
    const requestHeaders = new Headers(request.headers);
    requestHeaders.delete("x-sm-session");
    requestHeaders.set("x-sm-session", token);

    const continueWithSession = (dest?: string) => {
      if (dest) {
        const response = redirectTo(withSessionHandoff(dest, token));
        attachSessionCookies(response.headers, token, request);
        return response;
      }
      const response = NextResponse.next({ request: { headers: requestHeaders } });
      attachSessionCookies(response.headers, token, request);
      return response;
    };

    if (pathname === "/") {
      return continueWithSession(defaultHome(role));
    }
    if (pathname.startsWith("/app") && !isStaffRole(role)) {
      return continueWithSession(defaultHome(role));
    }
    const match = routePermissions.find((item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`));
    if (match && !roleHasPermission(role, match.permission)) {
      return continueWithSession(defaultHome(role));
    }
    return continueWithSession();
  } catch {
    const login = redirectTo("/login");
    login.headers.append("Set-Cookie", `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`);
    login.headers.append(
      "Set-Cookie",
      `${SESSION_COOKIE_CHIPS}=; Path=/; Max-Age=0; HttpOnly; SameSite=None; Secure; Partitioned`,
    );
    login.headers.append("Set-Cookie", `${SESSION_COOKIE_JS}=; Path=/; Max-Age=0; SameSite=Lax`);
    return login;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
