import type { AuditAction, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/auth/session";

type AuditInput = {
  actor?: SessionUser | null;
  action: AuditAction;
  module: string;
  entity: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
  ip?: string | null;
  institutionId?: string | null;
};

export async function writeAudit(input: AuditInput) {
  await db.auditLog.create({
    data: {
      action: input.action,
      module: input.module,
      entity: input.entity,
      entityId: input.entityId ?? null,
      metadata: input.metadata,
      ip: input.ip ?? null,
      userId: input.actor?.id ?? null,
      institutionId: input.institutionId ?? input.actor?.institutionId ?? null,
    },
  });
}
