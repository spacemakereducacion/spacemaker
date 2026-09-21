"use server";

import { revalidatePath } from "next/cache";
import type { LessonContentType, QuestionType } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission, requireSession, assertStudentScope } from "@/lib/auth/guards";
import { writeAudit } from "@/lib/audit";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { toNumber } from "@/lib/utils";

export async function createCourseAction(formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("elearning.write");
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return fail("El título es obligatorio.");
  const course = await db.course.create({
    data: {
      institutionId: actor.institutionId,
      title,
      description: String(formData.get("description") ?? "") || null,
      teacherId: String(formData.get("teacherId") ?? "") || null,
      durationHours: Number(formData.get("durationHours") ?? 0) || null,
    },
  });
  await writeAudit({ actor, action: "CREATE", module: "elearning", entity: "course", entityId: course.id });
  revalidatePath("/app/elearning/cursos");
  return ok({ id: course.id });
}

export async function addModuleAction(formData: FormData): Promise<ActionResult> {
  await requirePermission("elearning.write");
  const courseId = String(formData.get("courseId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!courseId || !title) return fail("Complete curso y título.");
  const count = await db.courseModule.count({ where: { courseId } });
  await db.courseModule.create({ data: { courseId, title, sortOrder: count + 1 } });
  revalidatePath("/app/elearning/cursos");
  return ok();
}

export async function addLessonAction(formData: FormData): Promise<ActionResult> {
  await requirePermission("elearning.write");
  const moduleId = String(formData.get("moduleId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!moduleId || !title) return fail("Complete módulo y título.");
  await db.lesson.create({
    data: {
      moduleId,
      title,
      contentType: (String(formData.get("contentType") ?? "TEXT") as LessonContentType) || "TEXT",
      content: String(formData.get("content") ?? "") || null,
      durationMin: Number(formData.get("durationMin") ?? 0) || null,
    },
  });
  revalidatePath("/app/elearning/cursos");
  return ok();
}

export async function enrollCourseAction(formData: FormData): Promise<ActionResult> {
  await requirePermission("elearning.write");
  const courseId = String(formData.get("courseId") ?? "");
  const studentId = String(formData.get("studentId") ?? "");
  if (!courseId || !studentId) return fail("Seleccione curso y alumno.");
  await db.courseEnrollment.create({ data: { courseId, studentId } });
  revalidatePath("/app/elearning/cursos");
  return ok();
}

export async function markLessonProgressAction(lessonId: string, studentId: string, progressPct: number): Promise<ActionResult> {
  const actor = await requireSession();
  await assertStudentScope(actor, studentId);
  await db.lessonProgress.upsert({
    where: { lessonId_studentId: { lessonId, studentId } },
    update: { progressPct, completedAt: progressPct >= 100 ? new Date() : null },
    create: { lessonId, studentId, progressPct, completedAt: progressPct >= 100 ? new Date() : null },
  });
  return ok();
}

export async function createAssignmentAction(formData: FormData): Promise<ActionResult> {
  await requirePermission("elearning.write");
  const courseId = String(formData.get("courseId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!courseId || !title) return fail("Complete curso y título.");
  await db.assignment.create({
    data: {
      courseId,
      title,
      description: String(formData.get("description") ?? "") || null,
      dueAt: String(formData.get("dueAt") ?? "") ? new Date(String(formData.get("dueAt"))) : null,
    },
  });
  revalidatePath("/app/elearning/actividades");
  return ok();
}

export async function submitAssignmentAction(formData: FormData): Promise<ActionResult> {
  const actor = await requireSession();
  const assignmentId = String(formData.get("assignmentId") ?? "");
  const student = await db.student.findFirst({ where: { userId: actor.id } });
  if (!student) return fail("No hay expediente de alumno asociado.");
  await db.assignmentSubmission.upsert({
    where: { assignmentId_studentId: { assignmentId, studentId: student.id } },
    update: { content: String(formData.get("content") ?? "") },
    create: { assignmentId, studentId: student.id, content: String(formData.get("content") ?? "") },
  });
  return ok(undefined, "Tarea enviada.");
}

export async function createExamAction(formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("elearning.write");
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return fail("El título es obligatorio.");
  const exam = await db.exam.create({
    data: {
      institutionId: actor.institutionId,
      courseId: String(formData.get("courseId") ?? "") || null,
      title,
      timeLimitMin: Number(formData.get("timeLimitMin") ?? 0) || null,
      maxAttempts: Number(formData.get("maxAttempts") ?? 1),
      randomize: formData.get("randomize") === "on",
      isPublished: formData.get("isPublished") === "on",
    },
  });
  revalidatePath("/app/elearning/examenes");
  return ok({ id: exam.id });
}

export async function addQuestionAction(formData: FormData): Promise<ActionResult> {
  await requirePermission("elearning.write");
  const examId = String(formData.get("examId") ?? "") || null;
  const prompt = String(formData.get("prompt") ?? "").trim();
  const type = (String(formData.get("type") ?? "MULTIPLE_CHOICE") as QuestionType) || "MULTIPLE_CHOICE";
  if (!prompt) return fail("Escriba la pregunta.");
  const question = await db.question.create({
    data: {
      examId,
      type,
      prompt,
      points: Number(formData.get("points") ?? 1),
      explanation: String(formData.get("explanation") ?? "") || null,
    },
  });
  const options = [1, 2, 3, 4]
    .map((index) => ({
      label: String(formData.get(`option${index}`) ?? "").trim(),
      isCorrect: formData.get("correct") === String(index),
    }))
    .filter((item) => item.label);
  if (options.length) {
    await db.questionOption.createMany({
      data: options.map((item) => ({ questionId: question.id, ...item })),
    });
  }
  revalidatePath("/app/elearning/examenes");
  return ok();
}

export async function submitExamAction(examId: string, formData: FormData): Promise<ActionResult<{ score: number }>> {
  const actor = await requireSession();
  const student = await db.student.findFirst({ where: { userId: actor.id } });
  if (!student) return fail("No hay expediente de alumno asociado.");
  const exam = await db.exam.findUnique({
    where: { id: examId },
    include: { questions: { include: { options: true } } },
  });
  if (!exam) return fail("Examen no encontrado.");
  const attempts = await db.examAttempt.count({ where: { examId, studentId: student.id } });
  if (attempts >= exam.maxAttempts) return fail("Ya agotó el número de intentos.");

  const attempt = await db.examAttempt.create({
    data: { examId, studentId: student.id, submittedAt: new Date() },
  });

  let earned = 0;
  let max = 0;
  for (const question of exam.questions) {
    max += toNumber(question.points);
    const selected = String(formData.get(`q_${question.id}`) ?? "");
    const option = question.options.find((item) => item.id === selected);
    const isCorrect =
      question.type === "TRUE_FALSE" || question.type === "MULTIPLE_CHOICE"
        ? Boolean(option?.isCorrect)
        : null;
    if (isCorrect) earned += toNumber(question.points);
    await db.examAnswer.create({
      data: {
        attemptId: attempt.id,
        questionId: question.id,
        optionId: option?.id,
        textValue: option ? null : selected,
        isCorrect,
      },
    });
  }
  const score = max === 0 ? 0 : Number(((earned / max) * 10).toFixed(2));
  await db.examAttempt.update({ where: { id: attempt.id }, data: { score } });
  return ok({ score }, `Calificación automática: ${score}`);
}
