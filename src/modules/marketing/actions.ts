"use server";

import { revalidatePath } from "next/cache";
import type { ProspectStage, ProspectSource } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { writeAudit } from "@/lib/audit";
import { hashPassword } from "@/lib/auth/password";
import { fail, ok, type ActionResult } from "@/lib/action-result";

export async function createProspectAction(formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("marketing.write");
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  if (!firstName || !lastName) return fail("Nombre y apellidos son obligatorios.");
  const prospect = await db.prospect.create({
    data: {
      institutionId: actor.institutionId,
      campusId: String(formData.get("campusId") ?? "") || actor.campusId,
      campaignId: String(formData.get("campaignId") ?? "") || null,
      programId: String(formData.get("programId") ?? "") || null,
      ownerId: actor.id,
      firstName,
      lastName,
      email: String(formData.get("email") ?? "") || null,
      phone: String(formData.get("phone") ?? "") || null,
      source: (String(formData.get("source") ?? "OTHER") as ProspectSource) || "OTHER",
      stage: "NEW",
      notes: String(formData.get("notes") ?? "") || null,
    },
  });
  await writeAudit({ actor, action: "CREATE", module: "marketing", entity: "prospect", entityId: prospect.id });
  revalidatePath("/app/marketing/prospectos");
  return ok({ id: prospect.id });
}

export async function updateProspectStageAction(prospectId: string, stage: ProspectStage): Promise<ActionResult> {
  const actor = await requirePermission("marketing.write");
  await db.prospect.update({ where: { id: prospectId }, data: { stage } });
  await writeAudit({
    actor,
    action: "STATUS_CHANGE",
    module: "marketing",
    entity: "prospect",
    entityId: prospectId,
    metadata: { stage },
  });
  revalidatePath("/app/marketing/crm");
  return ok();
}

export async function addFollowUpAction(formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("marketing.write");
  const prospectId = String(formData.get("prospectId") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  if (!prospectId || !notes) return fail("Escriba el seguimiento.");
  await db.prospectFollowUp.create({
    data: {
      prospectId,
      userId: actor.id,
      notes,
      nextDate: String(formData.get("nextDate") ?? "") ? new Date(String(formData.get("nextDate"))) : null,
    },
  });
  await db.prospect.update({
    where: { id: prospectId },
    data: {
      stage: "FOLLOW_UP",
      nextFollowUp: String(formData.get("nextDate") ?? "") ? new Date(String(formData.get("nextDate"))) : null,
    },
  });
  revalidatePath("/app/marketing/seguimientos");
  return ok();
}

export async function convertProspectAction(prospectId: string): Promise<ActionResult<{ studentId: string }>> {
  const actor = await requirePermission("applicants.write");
  const prospect = await db.prospect.findFirst({
    where: { id: prospectId, institutionId: actor.institutionId },
  });
  if (!prospect) return fail("Prospecto no encontrado.");
  if (prospect.studentId) return ok({ studentId: prospect.studentId });

  const campusId = prospect.campusId ?? actor.campusId;
  if (!campusId) return fail("Asigne un plantel al prospecto antes de convertirlo.");

  const email = prospect.email ?? `aspirante.${Date.now()}@spacemaker.local`;
  const user = await db.user.create({
    data: {
      institutionId: actor.institutionId,
      campusId,
      email,
      passwordHash: await hashPassword(process.env.DEMO_PASSWORD ?? "Demo.2026!"),
      firstName: prospect.firstName,
      lastName: prospect.lastName,
      phone: prospect.phone,
      role: "APPLICANT",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
  });
  const student = await db.student.create({
    data: {
      institutionId: actor.institutionId,
      userId: user.id,
      campusId,
      enrollmentNumber: `ASP-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`,
      firstName: prospect.firstName,
      lastName: prospect.lastName,
      email,
      phone: prospect.phone,
      programId: prospect.programId,
      status: "APPLICANT",
    },
  });
  await db.prospect.update({
    where: { id: prospect.id },
    data: { studentId: student.id, stage: "PRE_ENROLLMENT" },
  });
  await writeAudit({ actor, action: "CREATE", module: "marketing", entity: "applicant", entityId: student.id });
  revalidatePath("/app/control-escolar/aspirantes");
  return ok({ studentId: student.id }, "Prospecto convertido en aspirante.");
}

export async function createCampaignAction(formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("marketing.write");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return fail("El nombre de la campaña es obligatorio.");
  await db.marketingCampaign.create({
    data: {
      institutionId: actor.institutionId,
      name,
      channel: (String(formData.get("channel") ?? "OTHER") as ProspectSource) || "OTHER",
      budget: Number(formData.get("budget") ?? 0),
      startsOn: String(formData.get("startsOn") ?? "") ? new Date(String(formData.get("startsOn"))) : null,
      endsOn: String(formData.get("endsOn") ?? "") ? new Date(String(formData.get("endsOn"))) : null,
      notes: String(formData.get("notes") ?? "") || null,
    },
  });
  revalidatePath("/app/marketing/campanas");
  return ok();
}
