"use server";

import { revalidatePath } from "next/cache";
import type { CollectionStatus, CashMovementType } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { writeAudit } from "@/lib/audit";
import { nextFolio } from "@/lib/enrollment-number";
import { allocatePayments, applyDiscount, chargeBalance, deriveChargeStatus, deriveCollectionStatus } from "@/lib/finance";
import { notifyUser } from "@/lib/notify";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { toNumber } from "@/lib/utils";

export async function createChargeAction(formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("finance.write");
  const studentId = String(formData.get("studentId") ?? "");
  const conceptId = String(formData.get("conceptId") ?? "");
  const amount = Number(formData.get("amount") ?? NaN);
  const dueDate = String(formData.get("dueDate") ?? "");
  if (!studentId || !conceptId || Number.isNaN(amount) || !dueDate) return fail("Complete alumno, concepto, monto y vencimiento.");

  const charge = await db.charge.create({
    data: {
      studentId,
      conceptId,
      schoolYearId: String(formData.get("schoolYearId") ?? "") || null,
      description: String(formData.get("description") ?? "") || null,
      amount,
      dueDate: new Date(dueDate),
      status: new Date(dueDate) < new Date() ? "OVERDUE" : "PENDING",
    },
  });
  await refreshStudentCollection(studentId);
  await writeAudit({ actor, action: "FINANCE_CHANGE", module: "finance", entity: "charge", entityId: charge.id });
  revalidatePath("/app/finanzas/estados-de-cuenta");
  return ok();
}

export async function registerPaymentAction(formData: FormData): Promise<ActionResult<{ folio: string }>> {
  const actor = await requirePermission("cash.write");
  const studentId = String(formData.get("studentId") ?? "");
  const methodId = String(formData.get("methodId") ?? "");
  const amount = Number(formData.get("amount") ?? NaN);
  if (!studentId || !methodId || Number.isNaN(amount) || amount <= 0) return fail("Complete alumno, método y monto.");

  const openSession = await db.cashSession.findFirst({
    where: { status: "OPEN", register: { institutionId: actor.institutionId } },
    orderBy: { openedAt: "desc" },
  });

  const charges = await db.charge.findMany({
    where: { studentId, status: { in: ["PENDING", "PARTIAL", "OVERDUE", "AGREEMENT"] } },
    include: { allocations: true },
    orderBy: { dueDate: "asc" },
  });
  const remaining = charges.map((charge) => ({
    chargeId: charge.id,
    remaining: chargeBalance({
      amount: charge.amount,
      surcharge: charge.surcharge,
      discountAmount: charge.discountAmount,
      paid: charge.allocations.reduce((sum, item) => sum + toNumber(item.amount), 0),
    }),
    dueDate: charge.dueDate,
    original: charge.status,
  }));
  const { allocations } = allocatePayments(
    remaining.map((item) => ({ chargeId: item.chargeId, remaining: item.remaining })),
    amount,
  );
  if (allocations.length === 0) return fail("El alumno no tiene cargos pendientes.");

  const folio = await nextFolio({ institutionId: actor.institutionId, key: "receipt" });
  const payment = await db.payment.create({
    data: {
      studentId,
      methodId,
      cashierId: actor.id,
      cashSessionId: openSession?.id,
      folio,
      amount,
      reference: String(formData.get("reference") ?? "") || null,
      notes: String(formData.get("notes") ?? "") || null,
      allocations: { create: allocations },
    },
  });
  const invoiceFolio = await nextFolio({ institutionId: actor.institutionId, key: "invoice" });
  await db.invoice.create({ data: { paymentId: payment.id, folio: invoiceFolio } });

  for (const item of remaining) {
    const paidNow = allocations.find((alloc) => alloc.chargeId === item.chargeId)?.amount ?? 0;
    const left = Number((item.remaining - paidNow).toFixed(2));
    const status = deriveChargeStatus({
      dueDate: item.dueDate,
      remaining: left,
      original: left > 0 && paidNow > 0 ? "PARTIAL" : item.original,
    });
    await db.charge.update({ where: { id: item.chargeId }, data: { status } });
  }

  if (openSession) {
    await db.cashMovement.create({
      data: { sessionId: openSession.id, type: "INCOME", amount, concept: `Pago ${folio}` },
    });
  }

  await refreshStudentCollection(studentId);
  await writeAudit({
    actor,
    action: "PAYMENT_CHANGE",
    module: "cash",
    entity: "payment",
    entityId: payment.id,
    metadata: { folio, amount },
  });
  revalidatePath("/app/finanzas/pagos");
  return ok({ folio }, `Pago registrado con folio ${folio}.`);
}

export async function openCashAction(formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("cash.write");
  const registerId = String(formData.get("registerId") ?? "");
  const openingAmount = Number(formData.get("openingAmount") ?? 0);
  if (!registerId) return fail("Seleccione caja.");
  const existing = await db.cashSession.findFirst({ where: { registerId, status: "OPEN" } });
  if (existing) return fail("Ya hay una sesión abierta en esta caja.");
  const session = await db.cashSession.create({
    data: {
      registerId,
      openedById: actor.id,
      openingAmount,
      movements: { create: { type: "OPENING", amount: openingAmount, concept: "Apertura" } },
    },
  });
  await writeAudit({ actor, action: "FINANCE_CHANGE", module: "cash", entity: "cash_session", entityId: session.id });
  revalidatePath("/app/finanzas/caja");
  return ok();
}

export async function closeCashAction(sessionId: string, formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("cash.write");
  const session = await db.cashSession.findUnique({
    where: { id: sessionId },
    include: { movements: true, payments: true },
  });
  if (!session || session.status === "CLOSED") return fail("Sesión no disponible.");
  const expected =
    toNumber(session.openingAmount) +
    session.movements
      .filter((item) => item.type === "INCOME")
      .reduce((sum, item) => sum + toNumber(item.amount), 0) -
    session.movements
      .filter((item) => item.type === "EXPENSE" || item.type === "REFUND")
      .reduce((sum, item) => sum + toNumber(item.amount), 0);
  const closingAmount = Number(formData.get("closingAmount") ?? expected);
  await db.cashSession.update({
    where: { id: sessionId },
    data: {
      status: "CLOSED",
      closedById: actor.id,
      closedAt: new Date(),
      expectedAmount: expected,
      closingAmount,
      notes: String(formData.get("notes") ?? "") || null,
    },
  });
  await db.cashMovement.create({
    data: { sessionId, type: "CLOSING", amount: closingAmount, concept: "Cierre" },
  });
  await writeAudit({ actor, action: "FINANCE_CHANGE", module: "cash", entity: "cash_session", entityId: sessionId });
  revalidatePath("/app/finanzas/caja");
  return ok();
}

export async function addCashMovementAction(formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("cash.write");
  const sessionId = String(formData.get("sessionId") ?? "");
  const type = String(formData.get("type") ?? "EXPENSE") as CashMovementType;
  const amount = Number(formData.get("amount") ?? NaN);
  const concept = String(formData.get("concept") ?? "").trim();
  if (!sessionId || Number.isNaN(amount) || !concept) return fail("Complete sesión, tipo, concepto y monto.");
  await db.cashMovement.create({ data: { sessionId, type, amount, concept } });
  await writeAudit({ actor, action: "FINANCE_CHANGE", module: "cash", entity: "cash_movement", entityId: sessionId });
  revalidatePath("/app/finanzas/caja");
  return ok();
}

export async function assignScholarshipAction(formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("scholarships.write");
  const scholarshipId = String(formData.get("scholarshipId") ?? "");
  const studentId = String(formData.get("studentId") ?? "");
  if (!scholarshipId || !studentId) return fail("Seleccione beca y alumno.");
  await db.scholarshipAssignment.create({
    data: {
      scholarshipId,
      studentId,
      authorizedById: actor.id,
      notes: String(formData.get("notes") ?? "") || null,
    },
  });
  const scholarship = await db.scholarship.findUnique({ where: { id: scholarshipId } });
  if (scholarship?.conceptId) {
    const charges = await db.charge.findMany({
      where: { studentId, conceptId: scholarship.conceptId, status: { in: ["PENDING", "PARTIAL", "OVERDUE"] } },
    });
    for (const charge of charges) {
      const discountAmount = applyDiscount(toNumber(charge.amount), scholarship.type, toNumber(scholarship.value));
      await db.charge.update({ where: { id: charge.id }, data: { discountAmount } });
    }
  }
  await writeAudit({ actor, action: "FINANCE_CHANGE", module: "scholarships", entity: "scholarship", entityId: scholarshipId });
  revalidatePath("/app/finanzas/becas");
  return ok();
}

export async function createScholarshipAction(formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("scholarships.write");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return fail("El nombre es obligatorio.");
  await db.scholarship.create({
    data: {
      institutionId: actor.institutionId,
      name,
      type: formData.get("type") === "FIXED" ? "FIXED" : "PERCENTAGE",
      value: Number(formData.get("value") ?? 0),
      conceptId: String(formData.get("conceptId") ?? "") || null,
    },
  });
  revalidatePath("/app/finanzas/becas");
  return ok();
}

export async function createDiscountAction(formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("scholarships.write");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return fail("El nombre es obligatorio.");
  await db.discount.create({
    data: {
      institutionId: actor.institutionId,
      name,
      type: formData.get("type") === "FIXED" ? "FIXED" : "PERCENTAGE",
      value: Number(formData.get("value") ?? 0),
      conceptId: String(formData.get("conceptId") ?? "") || null,
    },
  });
  revalidatePath("/app/finanzas/descuentos");
  return ok();
}

export async function sendCollectionRemindersAction(): Promise<ActionResult<{ count: number }>> {
  const actor = await requirePermission("collections.write");
  const due = await db.charge.findMany({
    where: {
      status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
      student: { institutionId: actor.institutionId },
    },
    include: { student: { include: { guardians: { include: { guardian: true } } } } },
    take: 50,
  });
  let count = 0;
  for (const charge of due) {
    await db.collectionReminder.create({
      data: { chargeId: charge.id, channel: "IN_APP", status: "sent" },
    });
    for (const link of charge.student.guardians) {
      await notifyUser({
        userId: link.guardian.userId,
        title: "Recordatorio de pago",
        body: `Hay un cargo pendiente de ${charge.student.firstName} con vencimiento ${charge.dueDate.toISOString().slice(0, 10)}.`,
        href: "/portal/padres/estado-de-cuenta",
        channel: "IN_APP",
      });
    }
    count += 1;
  }
  await writeAudit({ actor, action: "FINANCE_CHANGE", module: "collections", entity: "reminder", metadata: { count } });
  return ok({ count }, `Se generaron ${count} recordatorios internos.`);
}

export async function updateCollectionStatusAction(studentId: string, status: CollectionStatus): Promise<ActionResult> {
  const actor = await requirePermission("collections.write");
  await db.student.update({ where: { id: studentId }, data: { collectionStatus: status } });
  await writeAudit({
    actor,
    action: "STATUS_CHANGE",
    module: "collections",
    entity: "student",
    entityId: studentId,
    metadata: { status },
  });
  revalidatePath("/app/finanzas/cobranza");
  return ok();
}

async function refreshStudentCollection(studentId: string) {
  const charges = await db.charge.findMany({ where: { studentId } });
  const now = Date.now();
  const soon = now + 5 * 86400000;
  const status = deriveCollectionStatus({
    overdueCount: charges.filter((item) => item.status === "OVERDUE").length,
    dueSoonCount: charges.filter((item) => item.status === "PENDING" && item.dueDate.getTime() < soon).length,
    hasAgreement: charges.some((item) => item.status === "AGREEMENT"),
    suspended: false,
  });
  await db.student.update({ where: { id: studentId }, data: { collectionStatus: status } });
}

export async function createConceptAction(formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("finance.write");
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (!name || !code) return fail("Nombre y clave son obligatorios.");
  await db.chargeConcept.create({
    data: {
      institutionId: actor.institutionId,
      name,
      code,
      defaultAmount: Number(formData.get("defaultAmount") ?? 0),
    },
  });
  revalidatePath("/app/finanzas/estados-de-cuenta");
  return ok();
}

