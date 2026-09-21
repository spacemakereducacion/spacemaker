import { redirect } from "next/navigation";
import type { RoleCode } from "@prisma/client";
import { db } from "@/lib/db";
import { getSession, type SessionUser } from "@/lib/auth/session";
import {
  defaultHome,
  isStaffRole,
  roleHasPermission,
  type Permission,
} from "@/lib/rbac/permissions";

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly status = 401,
  ) {
    super(message);
  }
}

export class ForbiddenError extends Error {
  constructor(message = "No tiene permiso para esta acción.") {
    super(message);
  }
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.status !== "ACTIVE") {
    redirect("/login?error=inactive");
  }
  return session;
}

export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const session = await requireSession();
  const extras = await db.userPermission.findMany({
    where: { userId: session.id },
  });
  const extraGrant = extras.find((item) => item.permission === permission && item.granted);
  const extraDeny = extras.find((item) => item.permission === permission && !item.granted);
  if (extraDeny || (!roleHasPermission(session.role, permission) && !extraGrant)) {
    redirect(defaultHome(session.role));
  }
  return session;
}

export async function requireStaff() {
  const session = await requireSession();
  if (!isStaffRole(session.role)) {
    redirect(defaultHome(session.role));
  }
  return session;
}

export function canAccessCampus(actor: SessionUser, campusId: string | null | undefined, allCampusIds: string[] = []) {
  if (!campusId) return true;
  if (actor.role === "SUPER_ADMIN" || actor.role === "GENERAL_DIRECTOR") return true;
  if (actor.campusId === campusId) return true;
  return allCampusIds.includes(campusId);
}

export async function assertStudentScope(actor: SessionUser, studentId: string) {
  if (actor.role === "STUDENT") {
    const student = await db.student.findFirst({
      where: { id: studentId, userId: actor.id },
    });
    if (!student) throw new ForbiddenError("Solo puede consultar su propia información.");
    return student;
  }

  if (actor.role === "GUARDIAN") {
    const link = await db.studentGuardian.findFirst({
      where: { studentId, guardian: { userId: actor.id } },
    });
    if (!link) throw new ForbiddenError("Solo puede consultar alumnos relacionados con su cuenta.");
    return link;
  }

  if (!isStaffRole(actor.role)) {
    throw new ForbiddenError();
  }
}

export async function getActorStudentIds(actor: SessionUser) {
  if (actor.role === "STUDENT") {
    const student = await db.student.findFirst({ where: { userId: actor.id }, select: { id: true } });
    return student ? [student.id] : [];
  }
  if (actor.role === "GUARDIAN") {
    const links = await db.studentGuardian.findMany({
      where: { guardian: { userId: actor.id } },
      select: { studentId: true },
    });
    return links.map((link) => link.studentId);
  }
  return null;
}

export function staffCampusFilter(actor: SessionUser) {
  if (actor.role === "SUPER_ADMIN" || actor.role === "GENERAL_DIRECTOR") return undefined;
  return actor.campusId ?? undefined;
}

export function roleAllowed(actor: SessionUser, roles: RoleCode[]) {
  return roles.includes(actor.role);
}
