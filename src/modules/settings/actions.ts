"use server";

import { revalidatePath } from "next/cache";
import type { RoleCode, UserStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { writeAudit } from "@/lib/audit";
import { hashPassword } from "@/lib/auth/password";
import { fail, ok, type ActionResult } from "@/lib/action-result";

export async function updateInstitutionAction(formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("settings.write");
  await db.institution.update({
    where: { id: actor.institutionId },
    data: {
      name: String(formData.get("name") ?? ""),
      legalName: String(formData.get("legalName") ?? "") || null,
      address: String(formData.get("address") ?? "") || null,
      phone: String(formData.get("phone") ?? "") || null,
      email: String(formData.get("email") ?? "") || null,
      website: String(formData.get("website") ?? "") || null,
      primaryColor: String(formData.get("primaryColor") ?? "#0B3D4A"),
      secondaryColor: String(formData.get("secondaryColor") ?? "#1A7A6D"),
      accentColor: String(formData.get("accentColor") ?? "#D4A017"),
      taxId: String(formData.get("taxId") ?? "") || null,
      fiscalAddress: String(formData.get("fiscalAddress") ?? "") || null,
      fiscalEmail: String(formData.get("fiscalEmail") ?? "") || null,
      enrollmentPrefix: String(formData.get("enrollmentPrefix") ?? "SM"),
      enrollmentFormat: String(formData.get("enrollmentFormat") ?? "{prefix}-{year}-{seq}"),
      currentSchoolYearId: String(formData.get("currentSchoolYearId") ?? "") || null,
    },
  });
  await writeAudit({ actor, action: "UPDATE", module: "settings", entity: "institution", entityId: actor.institutionId });
  revalidatePath("/app/configuracion");
  return ok(undefined, "Institución actualizada.");
}

export async function createCampusAction(formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("settings.write");
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (!name || !code) return fail("Nombre y código son obligatorios.");
  await db.campus.create({
    data: {
      institutionId: actor.institutionId,
      name,
      code,
      address: String(formData.get("address") ?? "") || null,
      phone: String(formData.get("phone") ?? "") || null,
    },
  });
  revalidatePath("/app/configuracion");
  return ok();
}

export async function createUserAction(formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("users.write");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const role = String(formData.get("role") ?? "") as RoleCode;
  if (!email || !firstName || !lastName || !role) return fail("Complete los datos del usuario.");
  const user = await db.user.create({
    data: {
      institutionId: actor.institutionId,
      campusId: String(formData.get("campusId") ?? "") || actor.campusId,
      email,
      firstName,
      lastName,
      phone: String(formData.get("phone") ?? "") || null,
      role,
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      passwordHash: await hashPassword(String(formData.get("password") ?? process.env.DEMO_PASSWORD ?? "Demo.2026!")),
    },
  });
  await writeAudit({
    actor,
    action: "PERMISSION_CHANGE",
    module: "users",
    entity: "user",
    entityId: user.id,
    metadata: { role },
  });
  revalidatePath("/app/usuarios");
  return ok();
}

export async function updateUserStatusAction(userId: string, status: UserStatus): Promise<ActionResult> {
  const actor = await requirePermission("users.write");
  await db.user.update({ where: { id: userId }, data: { status } });
  await writeAudit({
    actor,
    action: "PERMISSION_CHANGE",
    module: "users",
    entity: "user",
    entityId: userId,
    metadata: { status },
  });
  revalidatePath("/app/usuarios");
  return ok();
}
