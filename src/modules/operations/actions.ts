"use server";

import { revalidatePath } from "next/cache";
import type { AttendanceStatus, DocumentStatus, GradeType } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { writeAudit } from "@/lib/audit";
import { findScheduleConflicts } from "@/lib/schedule";
import { notifyUser } from "@/lib/notify";
import { getStorage, ALLOWED_UPLOAD_TYPES, MAX_UPLOAD_BYTES } from "@/lib/storage";
import { fail, ok, type ActionResult } from "@/lib/action-result";

export async function createScheduleAction(formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("schedules.write");
  const payload = {
    groupId: String(formData.get("groupId") ?? ""),
    subjectId: String(formData.get("subjectId") ?? ""),
    teacherId: String(formData.get("teacherId") ?? ""),
    roomId: String(formData.get("roomId") ?? ""),
    dayOfWeek: Number(formData.get("dayOfWeek") ?? 0),
    startsAt: String(formData.get("startsAt") ?? ""),
    endsAt: String(formData.get("endsAt") ?? ""),
  };
  if (!payload.groupId || !payload.subjectId || !payload.teacherId || !payload.roomId) {
    return fail("Complete materia, docente, grupo y aula.");
  }
  if (payload.startsAt >= payload.endsAt) return fail("La hora final debe ser posterior a la inicial.");

  const existing = await db.schedule.findMany({
    where: {
      OR: [{ teacherId: payload.teacherId }, { roomId: payload.roomId }, { groupId: payload.groupId }],
    },
  });
  const teacherHits = findScheduleConflicts(payload, existing.filter((item) => item.teacherId === payload.teacherId));
  const roomHits = findScheduleConflicts(payload, existing.filter((item) => item.roomId === payload.roomId));
  const groupHits = findScheduleConflicts(payload, existing.filter((item) => item.groupId === payload.groupId));
  if (teacherHits.length) return fail("El docente ya tiene clase en ese horario.");
  if (roomHits.length) return fail("El aula ya está ocupada en ese horario.");
  if (groupHits.length) return fail("El grupo ya tiene clase en ese horario.");

  await db.schedule.create({ data: payload });
  await writeAudit({ actor, action: "CREATE", module: "schedules", entity: "schedule", entityId: payload.groupId });
  revalidatePath("/app/control-escolar/horarios");
  return ok();
}

export async function saveAttendanceAction(formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("attendance.write");
  const groupId = String(formData.get("groupId") ?? "");
  const subjectId = String(formData.get("subjectId") ?? "");
  const date = String(formData.get("date") ?? "");
  if (!groupId || !date || !subjectId) return fail("Grupo, materia y fecha son obligatorios.");

  const students = await db.student.findMany({ where: { groupId, status: "ACTIVE" } });
  for (const student of students) {
    const status = String(formData.get(`status_${student.id}`) ?? "PRESENT") as AttendanceStatus;
    await db.attendance.upsert({
      where: {
        studentId_groupId_subjectId_date: {
          studentId: student.id,
          groupId,
          subjectId,
          date: new Date(date),
        },
      },
      update: { status, recordedById: actor.id },
      create: {
        studentId: student.id,
        groupId,
        subjectId,
        date: new Date(date),
        status,
        recordedById: actor.id,
      },
    });

    if ((status === "ABSENT" || status === "LATE") && student.userId) {
      const links = await db.studentGuardian.findMany({
        where: { studentId: student.id },
        include: { guardian: true },
      });
      for (const link of links) {
        await notifyUser({
          userId: link.guardian.userId,
          title: status === "ABSENT" ? "Falta registrada" : "Retardo registrado",
          body: `${student.firstName} ${student.lastName} tiene una asistencia ${status === "ABSENT" ? "falta" : "con retardo"} el ${date}.`,
          href: "/portal/padres/asistencias",
          channel: "IN_APP",
        });
      }
    }
  }

  await writeAudit({ actor, action: "CREATE", module: "attendance", entity: "attendance", entityId: groupId });
  revalidatePath("/app/control-escolar/asistencias");
  return ok(undefined, "Asistencia guardada.");
}

export async function saveGradeAction(formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("grades.write");
  const studentId = String(formData.get("studentId") ?? "");
  const subjectId = String(formData.get("subjectId") ?? "");
  const score = Number(formData.get("score") ?? NaN);
  const maxScore = Number(formData.get("maxScore") ?? 10);
  if (!studentId || !subjectId || Number.isNaN(score)) return fail("Complete alumno, materia y calificación.");
  if (score < 0 || score > maxScore) return fail("La calificación está fuera de rango.");

  const grade = await db.grade.create({
    data: {
      studentId,
      subjectId,
      evaluationPeriodId: String(formData.get("evaluationPeriodId") ?? "") || null,
      type: (String(formData.get("type") ?? "ORDINARY") as GradeType) || "ORDINARY",
      score,
      maxScore,
      observations: String(formData.get("observations") ?? "") || null,
      recordedById: actor.id,
    },
  });
  await writeAudit({
    actor,
    action: "GRADE_CHANGE",
    module: "grades",
    entity: "grade",
    entityId: grade.id,
    metadata: { studentId, subjectId, score },
  });
  revalidatePath("/app/control-escolar/calificaciones");
  return ok();
}

export async function updateGradeAction(gradeId: string, formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("grades.write");
  const score = Number(formData.get("score") ?? NaN);
  if (Number.isNaN(score)) return fail("Calificación inválida.");
  const previous = await db.grade.findUnique({ where: { id: gradeId } });
  await db.grade.update({
    where: { id: gradeId },
    data: {
      score,
      observations: String(formData.get("observations") ?? "") || null,
      recordedById: actor.id,
    },
  });
  await writeAudit({
    actor,
    action: "GRADE_CHANGE",
    module: "grades",
    entity: "grade",
    entityId: gradeId,
    metadata: { previous: previous?.score.toString(), next: score },
  });
  revalidatePath("/app/control-escolar/calificaciones");
  return ok();
}

export async function uploadDocumentAction(formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("documents.write");
  const studentId = String(formData.get("studentId") ?? "") || null;
  const typeId = String(formData.get("typeId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const file = formData.get("file");
  if (!typeId || !title) return fail("Seleccione tipo y título.");
  if (!(file instanceof File) || file.size === 0) return fail("Adjunte un archivo.");
  if (file.size > MAX_UPLOAD_BYTES) return fail("El archivo supera 15 MB.");
  if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) return fail("Tipo de archivo no permitido.");

  const stored = await getStorage().put({
    buffer: Buffer.from(await file.arrayBuffer()),
    mimeType: file.type,
    originalName: file.name,
    folder: `documents/${actor.institutionId}`,
  });

  const document = await db.document.create({
    data: {
      studentId,
      typeId,
      title,
      storageKey: stored.key,
      mimeType: stored.mimeType,
      sizeBytes: stored.sizeBytes,
      notes: String(formData.get("notes") ?? "") || null,
      uploadedById: actor.id,
    },
  });
  await writeAudit({ actor, action: "DOCUMENT_UPLOAD", module: "documents", entity: "document", entityId: document.id });
  revalidatePath("/app/control-escolar/documentos");
  return ok();
}

export async function validateDocumentAction(documentId: string, status: DocumentStatus, notes?: string): Promise<ActionResult> {
  const actor = await requirePermission("documents.validate");
  await db.document.update({
    where: { id: documentId },
    data: {
      status,
      notes,
      validatedById: actor.id,
      validatedAt: new Date(),
    },
  });
  await writeAudit({
    actor,
    action: "DOCUMENT_VALIDATE",
    module: "documents",
    entity: "document",
    entityId: documentId,
    metadata: { status },
  });
  revalidatePath("/app/control-escolar/documentos");
  return ok();
}
