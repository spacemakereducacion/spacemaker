import { db } from "@/lib/db";
import { ForbiddenError } from "@/lib/auth/guards";
import type { SessionUser } from "@/lib/auth/session";

export async function getLinkedStudents(actor: SessionUser) {
  if (actor.role === "STUDENT") {
    return db.student.findMany({
      where: { userId: actor.id },
      include: { group: true, program: true, campus: true },
    });
  }
  if (actor.role === "GUARDIAN") {
    const links = await db.studentGuardian.findMany({
      where: { guardian: { userId: actor.id } },
      include: { student: { include: { group: true, program: true, campus: true } } },
    });
    return links.map((link) => link.student);
  }
  throw new ForbiddenError();
}

export async function getPortalStudent(actor: SessionUser, studentId?: string) {
  const students = await getLinkedStudents(actor);
  const student = studentId ? students.find((item) => item.id === studentId) : students[0];
  if (!student) return null;
  return db.student.findUnique({
    where: { id: student.id },
    include: {
      group: true,
      program: true,
      campus: true,
      grades: { include: { subject: true, evaluationPeriod: true } },
      attendances: { include: { subject: true }, orderBy: { date: "desc" }, take: 40 },
      charges: { include: { concept: true, allocations: true } },
      payments: { include: { method: true, invoice: true } },
      documents: { include: { type: true } },
      courseEnrollments: { include: { course: { include: { modules: { include: { lessons: true } } } } } },
      assignmentSubmissions: { include: { assignment: true } },
    },
  });
}
