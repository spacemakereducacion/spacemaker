import type { StudentStatus } from "@prisma/client";
import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/auth/session";
import { staffCampusFilter } from "@/lib/auth/guards";

export async function listStudents(
  actor: SessionUser,
  params: { q?: string; status?: StudentStatus | "ALL"; campusId?: string },
) {
  const campusId = params.campusId || staffCampusFilter(actor);
  return db.student.findMany({
    where: {
      institutionId: actor.institutionId,
      campusId: campusId || undefined,
      status: params.status && params.status !== "ALL" ? params.status : undefined,
      OR: params.q
        ? [
            { firstName: { contains: params.q, mode: "insensitive" } },
            { lastName: { contains: params.q, mode: "insensitive" } },
            { enrollmentNumber: { contains: params.q, mode: "insensitive" } },
          ]
        : undefined,
    },
    include: { campus: true, program: true, group: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    take: 100,
  });
}

export async function getStudent(actor: SessionUser, id: string) {
  return db.student.findFirst({
    where: { id, institutionId: actor.institutionId },
    include: {
      campus: true,
      program: true,
      group: true,
      educationLevel: true,
      schoolYear: true,
      user: true,
      guardians: { include: { guardian: true } },
      documents: { include: { type: true, uploadedBy: true } },
      grades: { include: { subject: true, evaluationPeriod: true } },
      attendances: { include: { subject: true }, orderBy: { date: "desc" }, take: 30 },
      charges: { include: { concept: true, allocations: true } },
      payments: { include: { method: true, invoice: true }, orderBy: { paidAt: "desc" } },
      enrollments: { include: { group: true, schoolYear: true } },
      groupHistory: { include: { group: true }, orderBy: { createdAt: "desc" } },
    },
  });
}

export async function listGuardians(actor: SessionUser, q?: string) {
  return db.guardian.findMany({
    where: {
      user: { institutionId: actor.institutionId },
      OR: q
        ? [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ]
        : undefined,
    },
    include: { students: { include: { student: true } }, user: true },
    orderBy: { lastName: "asc" },
  });
}

export async function getGuardian(id: string, actor: SessionUser) {
  return db.guardian.findFirst({
    where: { id, user: { institutionId: actor.institutionId } },
    include: { students: { include: { student: true } }, user: true },
  });
}

export async function listTeachers(actor: SessionUser) {
  return db.teacher.findMany({
    where: { campusId: staffCampusFilter(actor), user: { institutionId: actor.institutionId } },
    include: { user: true, campus: true, titularGroups: true },
    orderBy: { user: { lastName: "asc" } },
  });
}

export async function listPrograms(actor: SessionUser) {
  return db.academicProgram.findMany({
    where: { institutionId: actor.institutionId },
    include: { educationLevel: true, studyPlans: { include: { subjects: { include: { subject: true } } } } },
    orderBy: { name: "asc" },
  });
}

export async function listSubjects(actor: SessionUser) {
  return db.subject.findMany({
    where: { institutionId: actor.institutionId },
    orderBy: { name: "asc" },
  });
}

export async function listGroups(actor: SessionUser) {
  return db.group.findMany({
    where: { institutionId: actor.institutionId, campusId: staffCampusFilter(actor) },
    include: {
      campus: true,
      program: true,
      schoolYear: true,
      titularTeacher: { include: { user: true } },
      _count: { select: { currentStudents: true, enrollments: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getGroup(id: string, actor: SessionUser) {
  return db.group.findFirst({
    where: { id, institutionId: actor.institutionId },
    include: {
      campus: true,
      program: true,
      schoolYear: true,
      room: true,
      titularTeacher: { include: { user: true } },
      currentStudents: true,
      schedules: { include: { subject: true, teacher: { include: { user: true } }, room: true } },
      history: { include: { student: true }, orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
}

export async function academicOptions(actor: SessionUser) {
  const campusId = staffCampusFilter(actor);
  const [campuses, programs, groups, levels, years, teachers, rooms, subjects, documentTypes, periods] =
    await Promise.all([
      db.campus.findMany({ where: { institutionId: actor.institutionId, isActive: true } }),
      db.academicProgram.findMany({ where: { institutionId: actor.institutionId, isActive: true } }),
      db.group.findMany({ where: { institutionId: actor.institutionId, campusId, isActive: true } }),
      db.educationLevel.findMany({ where: { institutionId: actor.institutionId } }),
      db.schoolYear.findMany({ where: { institutionId: actor.institutionId }, orderBy: { startsOn: "desc" } }),
      db.teacher.findMany({
        where: { user: { institutionId: actor.institutionId } },
        include: { user: true },
      }),
      db.room.findMany({ where: { institutionId: actor.institutionId, campusId } }),
      db.subject.findMany({ where: { institutionId: actor.institutionId, isActive: true } }),
      db.documentType.findMany({ where: { institutionId: actor.institutionId } }),
      db.evaluationPeriod.findMany({
        where: { schoolYear: { institutionId: actor.institutionId } },
        orderBy: { sortOrder: "asc" },
      }),
    ]);
  return { campuses, programs, groups, levels, years, teachers, rooms, subjects, documentTypes, periods };
}
