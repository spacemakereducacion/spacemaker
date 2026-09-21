"use server";

import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { roleHasPermission } from "@/lib/rbac/permissions";

export type SearchHit = {
  category: string;
  id: string;
  title: string;
  subtitle?: string;
  href: string;
};

export async function searchGlobal(query: string): Promise<ActionResult<SearchHit[]>> {
  const actor = await requirePermission("search.read").catch(() => null);
  if (!actor) return fail("No autorizado.");
  const q = query.trim();
  if (q.length < 2) return ok([]);

  const results: SearchHit[] = [];
  const campusId =
    actor.role === "SUPER_ADMIN" || actor.role === "GENERAL_DIRECTOR" ? undefined : actor.campusId ?? undefined;

  if (roleHasPermission(actor.role, "students.read") || roleHasPermission(actor.role, "applicants.read")) {
    const students = await db.student.findMany({
      where: {
        institutionId: actor.institutionId,
        campusId,
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { enrollmentNumber: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 6,
    });
    for (const student of students) {
      results.push({
        category: "Alumnos",
        id: student.id,
        title: `${student.firstName} ${student.lastName}`,
        subtitle: student.enrollmentNumber,
        href: `/app/control-escolar/alumnos/${student.id}`,
      });
    }
  }

  if (roleHasPermission(actor.role, "guardians.read")) {
    const guardians = await db.guardian.findMany({
      where: {
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
        user: { institutionId: actor.institutionId },
      },
      take: 4,
    });
    for (const guardian of guardians) {
      results.push({
        category: "Padres / tutores",
        id: guardian.id,
        title: `${guardian.firstName} ${guardian.lastName}`,
        subtitle: guardian.email ?? undefined,
        href: `/app/control-escolar/padres/${guardian.id}`,
      });
    }
  }

  if (roleHasPermission(actor.role, "teachers.read")) {
    const teachers = await db.teacher.findMany({
      where: {
        campusId,
        user: {
          institutionId: actor.institutionId,
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
          ],
        },
      },
      include: { user: true },
      take: 4,
    });
    for (const teacher of teachers) {
      results.push({
        category: "Docentes",
        id: teacher.id,
        title: `${teacher.user.firstName} ${teacher.user.lastName}`,
        subtitle: teacher.specialty ?? undefined,
        href: "/app/control-escolar/docentes",
      });
    }
  }

  if (roleHasPermission(actor.role, "groups.read")) {
    const groups = await db.group.findMany({
      where: {
        institutionId: actor.institutionId,
        campusId,
        name: { contains: q, mode: "insensitive" },
      },
      take: 4,
    });
    for (const group of groups) {
      results.push({
        category: "Grupos",
        id: group.id,
        title: group.name,
        href: `/app/control-escolar/grupos/${group.id}`,
      });
    }
  }

  if (roleHasPermission(actor.role, "marketing.read")) {
    const prospects = await db.prospect.findMany({
      where: {
        institutionId: actor.institutionId,
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 4,
    });
    for (const prospect of prospects) {
      results.push({
        category: "Prospectos",
        id: prospect.id,
        title: `${prospect.firstName} ${prospect.lastName}`,
        subtitle: prospect.email ?? undefined,
        href: `/app/marketing/prospectos/${prospect.id}`,
      });
    }
  }

  if (roleHasPermission(actor.role, "finance.read")) {
    const payments = await db.payment.findMany({
      where: {
        folio: { contains: q, mode: "insensitive" },
        student: { institutionId: actor.institutionId },
      },
      include: { student: true },
      take: 4,
    });
    for (const payment of payments) {
      results.push({
        category: "Pagos",
        id: payment.id,
        title: payment.folio,
        subtitle: `${payment.student.firstName} ${payment.student.lastName}`,
        href: "/app/finanzas/pagos",
      });
    }
  }

  if (roleHasPermission(actor.role, "documents.read")) {
    const documents = await db.document.findMany({
      where: {
        title: { contains: q, mode: "insensitive" },
        student: { institutionId: actor.institutionId },
      },
      take: 4,
    });
    for (const document of documents) {
      results.push({
        category: "Documentos",
        id: document.id,
        title: document.title,
        href: "/app/control-escolar/documentos",
      });
    }
  }

  return ok(results);
}
