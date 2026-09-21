"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { StudentStatus, Shift, Sex, GuardianRelation, GroupChangeType } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { writeAudit } from "@/lib/audit";
import { hashPassword } from "@/lib/auth/password";
import { nextEnrollmentNumber } from "@/lib/enrollment-number";
import { fail, ok, zodError, type ActionResult } from "@/lib/action-result";

const studentSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  curp: z.string().optional(),
  birthDate: z.string().optional(),
  sex: z.enum(["FEMALE", "MALE", "OTHER", "UNSPECIFIED"]).optional(),
  nationality: z.string().optional(),
  birthPlace: z.string().optional(),
  address: z.string().optional(),
  campusId: z.string().min(1),
  programId: z.string().optional(),
  educationLevelId: z.string().optional(),
  groupId: z.string().optional(),
  shift: z.enum(["MORNING", "AFTERNOON", "EVENING", "MIXED"]).optional(),
  schoolYearId: z.string().optional(),
  term: z.string().optional(),
  status: z.enum([
    "APPLICANT",
    "PRE_ENROLLED",
    "ENROLLED",
    "ACTIVE",
    "TEMPORARY_LEAVE",
    "PERMANENT_LEAVE",
    "GRADUATED",
    "TITLED",
  ]),
});

function formString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value.length ? value : undefined;
}

export async function createStudentAction(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const actor = await requirePermission("students.write");
  const parsed = studentSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formString(formData, "email") ?? "",
    phone: formString(formData, "phone"),
    curp: formString(formData, "curp"),
    birthDate: formString(formData, "birthDate"),
    sex: formString(formData, "sex") ?? "UNSPECIFIED",
    nationality: formString(formData, "nationality"),
    birthPlace: formString(formData, "birthPlace"),
    address: formString(formData, "address"),
    campusId: formData.get("campusId"),
    programId: formString(formData, "programId"),
    educationLevelId: formString(formData, "educationLevelId"),
    groupId: formString(formData, "groupId"),
    shift: formString(formData, "shift"),
    schoolYearId: formString(formData, "schoolYearId"),
    term: formString(formData, "term"),
    status: formString(formData, "status") ?? "APPLICANT",
  });
  if (!parsed.success) return zodError(parsed.error);

  const campus = await db.campus.findFirst({
    where: { id: parsed.data.campusId, institutionId: actor.institutionId },
  });
  if (!campus) return fail("Plantel inválido.");

  const enrollmentNumber = await nextEnrollmentNumber({
    institutionId: actor.institutionId,
    campusId: "",
    campusCode: campus.code,
  });

  const student = await db.student.create({
    data: {
      institutionId: actor.institutionId,
      campusId: parsed.data.campusId,
      enrollmentNumber,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: parsed.data.email || null,
      phone: parsed.data.phone,
      curp: parsed.data.curp,
      birthDate: parsed.data.birthDate ? new Date(parsed.data.birthDate) : null,
      sex: (parsed.data.sex as Sex) ?? "UNSPECIFIED",
      nationality: parsed.data.nationality,
      birthPlace: parsed.data.birthPlace,
      address: parsed.data.address,
      programId: parsed.data.programId,
      educationLevelId: parsed.data.educationLevelId,
      groupId: parsed.data.groupId,
      shift: parsed.data.shift as Shift | undefined,
      schoolYearId: parsed.data.schoolYearId,
      term: parsed.data.term,
      status: parsed.data.status as StudentStatus,
      admissionDate: new Date(),
    },
  });

  if (parsed.data.groupId && parsed.data.schoolYearId) {
    await db.groupEnrollment.create({
      data: {
        studentId: student.id,
        groupId: parsed.data.groupId,
        schoolYearId: parsed.data.schoolYearId,
      },
    });
    await db.groupHistory.create({
      data: { studentId: student.id, groupId: parsed.data.groupId, action: "ENROLL" },
    });
  }

  await writeAudit({
    actor,
    action: "CREATE",
    module: "students",
    entity: "student",
    entityId: student.id,
  });
  revalidatePath("/app/control-escolar/alumnos");
  return ok({ id: student.id }, "Alumno registrado.");
}

export async function updateStudentAction(studentId: string, formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("students.write");
  const existing = await db.student.findFirst({
    where: { id: studentId, institutionId: actor.institutionId },
  });
  if (!existing) return fail("Alumno no encontrado.");

  const parsed = studentSchema.partial().safeParse({
    firstName: formString(formData, "firstName") ?? existing.firstName,
    lastName: formString(formData, "lastName") ?? existing.lastName,
    email: formString(formData, "email") ?? existing.email ?? "",
    phone: formString(formData, "phone"),
    curp: formString(formData, "curp"),
    campusId: formString(formData, "campusId") ?? existing.campusId,
    programId: formString(formData, "programId"),
    groupId: formString(formData, "groupId"),
    status: formString(formData, "status") ?? existing.status,
    schoolYearId: formString(formData, "schoolYearId"),
    term: formString(formData, "term"),
    shift: formString(formData, "shift"),
    address: formString(formData, "address"),
  });
  if (!parsed.success) return zodError(parsed.error);

  await db.student.update({
    where: { id: studentId },
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: parsed.data.email || null,
      phone: parsed.data.phone,
      curp: parsed.data.curp,
      campusId: parsed.data.campusId,
      programId: parsed.data.programId,
      groupId: parsed.data.groupId,
      status: parsed.data.status as StudentStatus | undefined,
      schoolYearId: parsed.data.schoolYearId,
      term: parsed.data.term,
      shift: parsed.data.shift as Shift | undefined,
      address: parsed.data.address,
    },
  });
  await writeAudit({
    actor,
    action: "UPDATE",
    module: "students",
    entity: "student",
    entityId: studentId,
  });
  revalidatePath(`/app/control-escolar/alumnos/${studentId}`);
  return ok(undefined, "Expediente actualizado.");
}

export async function changeStudentStatusAction(studentId: string, status: StudentStatus): Promise<ActionResult> {
  const actor = await requirePermission("students.write");
  await db.student.update({ where: { id: studentId }, data: { status } });
  await writeAudit({
    actor,
    action: "STATUS_CHANGE",
    module: "students",
    entity: "student",
    entityId: studentId,
    metadata: { status },
  });
  revalidatePath("/app/control-escolar/alumnos");
  return ok();
}

export async function enrollApplicantAction(studentId: string, formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("students.write");
  const groupId = String(formData.get("groupId") ?? "");
  const schoolYearId = String(formData.get("schoolYearId") ?? "");
  if (!groupId || !schoolYearId) return fail("Seleccione grupo y ciclo.");

  const student = await db.student.findFirst({
    where: { id: studentId, institutionId: actor.institutionId },
    include: { campus: true, user: true },
  });
  if (!student) return fail("Aspirante no encontrado.");

  let enrollmentNumber = student.enrollmentNumber;
  if (enrollmentNumber.startsWith("ASP-") || student.status === "APPLICANT") {
    enrollmentNumber = await nextEnrollmentNumber({
      institutionId: actor.institutionId,
      campusId: "",
      campusCode: student.campus.code,
    });
  }

  await db.$transaction([
    db.student.update({
      where: { id: student.id },
      data: {
        status: "ACTIVE",
        groupId,
        schoolYearId,
        enrollmentNumber,
        admissionDate: student.admissionDate ?? new Date(),
      },
    }),
    db.groupEnrollment.create({
      data: { studentId: student.id, groupId, schoolYearId },
    }),
    db.groupHistory.create({
      data: { studentId: student.id, groupId, action: "ENROLL", notes: "Inscripción formal" },
    }),
  ]);

  if (student.userId) {
    await db.user.update({ where: { id: student.userId }, data: { role: "STUDENT" } });
  }

  await writeAudit({
    actor,
    action: "ENROLL",
    module: "students",
    entity: "student",
    entityId: student.id,
  });
  revalidatePath("/app/control-escolar/aspirantes");
  return ok(undefined, "Aspirante inscrito y matrícula asignada.");
}

export async function transferGroupAction(formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("groups.write");
  const studentId = String(formData.get("studentId") ?? "");
  const groupId = String(formData.get("groupId") ?? "");
  const action = (String(formData.get("action") ?? "TRANSFER") as GroupChangeType) || "TRANSFER";
  if (!studentId || !groupId) return fail("Datos incompletos.");

  await db.$transaction([
    db.groupEnrollment.updateMany({
      where: { studentId, isActive: true },
      data: { isActive: false, withdrawnAt: new Date() },
    }),
    db.student.update({ where: { id: studentId }, data: { groupId } }),
    db.groupHistory.create({ data: { studentId, groupId, action } }),
  ]);
  const student = await db.student.findUnique({ where: { id: studentId } });
  if (student?.schoolYearId) {
    await db.groupEnrollment.create({
      data: { studentId, groupId, schoolYearId: student.schoolYearId },
    });
  }
  await writeAudit({ actor, action: "UPDATE", module: "groups", entity: "student", entityId: studentId });
  revalidatePath("/app/control-escolar/grupos");
  return ok();
}

export async function createGuardianAction(formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("guardians.write");
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const studentId = formString(formData, "studentId");
  const relation = (formString(formData, "relation") as GuardianRelation) ?? "TUTOR";
  if (!firstName || !lastName || !email) return fail("Nombre, apellidos y correo son obligatorios.");

  const password = process.env.DEMO_PASSWORD ?? "Demo.2026!";
  const user = await db.user.create({
    data: {
      institutionId: actor.institutionId,
      campusId: actor.campusId,
      email,
      passwordHash: await hashPassword(password),
      firstName,
      lastName,
      phone: formString(formData, "phone"),
      role: "GUARDIAN",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
  });
  const guardian = await db.guardian.create({
    data: {
      userId: user.id,
      firstName,
      lastName,
      email,
      phone: formString(formData, "phone"),
      address: formString(formData, "address"),
    },
  });
  if (studentId) {
    await db.studentGuardian.create({
      data: { studentId, guardianId: guardian.id, relation, isPrimary: true },
    });
  }
  await writeAudit({ actor, action: "CREATE", module: "guardians", entity: "guardian", entityId: guardian.id });
  revalidatePath("/app/control-escolar/padres");
  return ok({ id: guardian.id }, "Tutor registrado.");
}

export async function linkGuardianAction(formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("guardians.write");
  const studentId = String(formData.get("studentId") ?? "");
  const guardianId = String(formData.get("guardianId") ?? "");
  const relation = (formString(formData, "relation") as GuardianRelation) ?? "TUTOR";
  const isPrimary = formData.get("isPrimary") === "on";
  if (!studentId || !guardianId) return fail("Seleccione alumno y tutor.");
  await db.studentGuardian.create({
    data: { studentId, guardianId, relation, isPrimary },
  });
  await writeAudit({ actor, action: "UPDATE", module: "guardians", entity: "student_guardian", entityId: studentId });
  revalidatePath("/app/control-escolar/padres");
  return ok();
}

export async function createTeacherAction(formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("teachers.write");
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const campusId = String(formData.get("campusId") ?? actor.campusId ?? "");
  if (!firstName || !lastName || !email || !campusId) return fail("Complete los datos del docente.");
  const user = await db.user.create({
    data: {
      institutionId: actor.institutionId,
      campusId,
      email,
      passwordHash: await hashPassword(process.env.DEMO_PASSWORD ?? "Demo.2026!"),
      firstName,
      lastName,
      role: "TEACHER",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
  });
  await db.teacher.create({
    data: {
      userId: user.id,
      campusId,
      specialty: formString(formData, "specialty"),
      employeeNo: formString(formData, "employeeNo"),
    },
  });
  await writeAudit({ actor, action: "CREATE", module: "teachers", entity: "teacher", entityId: user.id });
  revalidatePath("/app/control-escolar/docentes");
  return ok();
}

export async function createProgramAction(formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("programs.write");
  const name = String(formData.get("name") ?? "").trim();
  const educationLevelId = String(formData.get("educationLevelId") ?? "");
  if (!name || !educationLevelId) return fail("Nombre y nivel son obligatorios.");
  const program = await db.academicProgram.create({
    data: {
      institutionId: actor.institutionId,
      educationLevelId,
      name,
      modality: formString(formData, "modality"),
      duration: formString(formData, "duration"),
      description: formString(formData, "description"),
      requirements: formString(formData, "requirements"),
    },
  });
  await writeAudit({ actor, action: "CREATE", module: "programs", entity: "program", entityId: program.id });
  revalidatePath("/app/control-escolar/programas");
  return ok();
}

export async function createSubjectAction(formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("programs.write");
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (!name || !code) return fail("Nombre y clave son obligatorios.");
  await db.subject.create({
    data: { institutionId: actor.institutionId, name, code, description: formString(formData, "description") },
  });
  revalidatePath("/app/control-escolar/materias");
  return ok();
}

export async function toggleStudyPlanAction(planId: string, isActive: boolean): Promise<ActionResult> {
  const actor = await requirePermission("programs.write");
  await db.studyPlan.update({ where: { id: planId }, data: { isActive } });
  await writeAudit({ actor, action: "UPDATE", module: "programs", entity: "study_plan", entityId: planId });
  revalidatePath("/app/control-escolar/programas");
  return ok();
}

export async function addPlanSubjectAction(formData: FormData): Promise<ActionResult> {
  await requirePermission("programs.write");
  const studyPlanId = String(formData.get("studyPlanId") ?? "");
  const subjectId = String(formData.get("subjectId") ?? "");
  if (!studyPlanId || !subjectId) return fail("Seleccione plan y materia.");
  await db.studyPlanSubject.create({
    data: {
      studyPlanId,
      subjectId,
      term: formString(formData, "term"),
      credits: Number(formData.get("credits") ?? 0),
      hours: Number(formData.get("hours") ?? 0),
    },
  });
  revalidatePath("/app/control-escolar/programas");
  return ok();
}

export async function createGroupAction(formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("groups.write");
  const name = String(formData.get("name") ?? "").trim();
  const campusId = String(formData.get("campusId") ?? "");
  const programId = String(formData.get("programId") ?? "");
  const schoolYearId = String(formData.get("schoolYearId") ?? "");
  if (!name || !campusId || !programId || !schoolYearId) return fail("Complete los datos del grupo.");
  const group = await db.group.create({
    data: {
      institutionId: actor.institutionId,
      name,
      campusId,
      programId,
      schoolYearId,
      studyPlanId: formString(formData, "studyPlanId"),
      shift: (formString(formData, "shift") as Shift) ?? "MORNING",
      roomId: formString(formData, "roomId"),
      titularTeacherId: formString(formData, "titularTeacherId"),
      capacity: Number(formData.get("capacity") ?? 30),
    },
  });
  await writeAudit({ actor, action: "CREATE", module: "groups", entity: "group", entityId: group.id });
  revalidatePath("/app/control-escolar/grupos");
  return ok({ id: group.id });
}

export async function createEducationLevelAction(formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("programs.write");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return fail("El nombre del nivel es obligatorio.");
  await db.educationLevel.create({
    data: { institutionId: actor.institutionId, name, sortOrder: Number(formData.get("sortOrder") ?? 0) },
  });
  revalidatePath("/app/control-escolar/programas");
  return ok();
}
