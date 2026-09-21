"use server";

import { revalidatePath } from "next/cache";
import type { AnnouncementScope, CalendarScope } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission, requireSession } from "@/lib/auth/guards";
import { writeAudit } from "@/lib/audit";
import { notifyUser } from "@/lib/notify";
import { fail, ok, type ActionResult } from "@/lib/action-result";

export async function createAnnouncementAction(formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("communication.write");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !body) return fail("Título y mensaje son obligatorios.");
  const announcement = await db.announcement.create({
    data: {
      institutionId: actor.institutionId,
      authorId: actor.id,
      title,
      body,
      scope: (String(formData.get("scope") ?? "INSTITUTION") as AnnouncementScope) || "INSTITUTION",
      groupId: String(formData.get("groupId") ?? "") || null,
      campusId: String(formData.get("campusId") ?? "") || null,
    },
  });
  const users = await db.user.findMany({
    where: { institutionId: actor.institutionId, status: "ACTIVE" },
    select: { id: true },
    take: 200,
  });
  await db.notification.createMany({
    data: users.map((user) => ({
      userId: user.id,
      title,
      body,
      href: "/app/comunicacion/avisos",
    })),
  });
  await writeAudit({ actor, action: "CREATE", module: "communication", entity: "announcement", entityId: announcement.id });
  revalidatePath("/app/comunicacion/avisos");
  return ok();
}

export async function sendMessageAction(formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("communication.write");
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const recipientId = String(formData.get("recipientId") ?? "");
  if (!subject || !body || !recipientId) return fail("Complete destinatario, asunto y mensaje.");
  const thread = await db.messageThread.create({ data: { subject } });
  const message = await db.message.create({
    data: { threadId: thread.id, senderId: actor.id, body },
  });
  await db.messageRecipient.create({ data: { messageId: message.id, userId: recipientId } });
  await notifyUser({
    userId: recipientId,
    title: `Mensaje: ${subject}`,
    body,
    href: "/app/comunicacion/mensajes",
  });
  revalidatePath("/app/comunicacion/mensajes");
  return ok();
}

export async function markNotificationReadAction(id: string): Promise<ActionResult> {
  const actor = await requireSession();
  await db.notification.updateMany({
    where: { id, userId: actor.id },
    data: { readAt: new Date() },
  });
  return ok();
}

export async function createEventAction(formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("calendar.write");
  const title = String(formData.get("title") ?? "").trim();
  const startsAt = String(formData.get("startsAt") ?? "");
  const endsAt = String(formData.get("endsAt") ?? "");
  if (!title || !startsAt || !endsAt) return fail("Complete título y fechas.");
  await db.calendarEvent.create({
    data: {
      institutionId: actor.institutionId,
      title,
      description: String(formData.get("description") ?? "") || null,
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      scope: (String(formData.get("scope") ?? "INSTITUTION") as CalendarScope) || "INSTITUTION",
      groupId: String(formData.get("groupId") ?? "") || null,
      campusId: String(formData.get("campusId") ?? "") || null,
    },
  });
  revalidatePath("/app/calendario");
  return ok();
}
