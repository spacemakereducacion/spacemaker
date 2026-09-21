import { Prisma, type ChargeStatus, type CollectionStatus } from "@prisma/client";

export function chargeBalance(charge: {
  amount: Prisma.Decimal | number | string;
  surcharge: Prisma.Decimal | number | string;
  discountAmount: Prisma.Decimal | number | string;
  paid?: number;
}) {
  const amount = Number(charge.amount);
  const surcharge = Number(charge.surcharge);
  const discount = Number(charge.discountAmount);
  const paid = charge.paid ?? 0;
  return Number((amount + surcharge - discount - paid).toFixed(2));
}

export function deriveChargeStatus(params: {
  dueDate: Date;
  remaining: number;
  original: ChargeStatus;
}): ChargeStatus {
  if (params.original === "CANCELLED" || params.original === "AGREEMENT") {
    return params.original;
  }
  if (params.remaining <= 0) return "PAID";
  const due = params.dueDate.getTime();
  const now = Date.now();
  if (due < now) return "OVERDUE";
  const paidSomething = params.remaining > 0 && params.original === "PARTIAL";
  return paidSomething ? "PARTIAL" : "PENDING";
}

export function deriveCollectionStatus(params: {
  overdueCount: number;
  dueSoonCount: number;
  hasAgreement: boolean;
  suspended: boolean;
}): CollectionStatus {
  if (params.suspended) return "ADMIN_SUSPENSION";
  if (params.hasAgreement) return "AGREEMENT";
  if (params.overdueCount > 0) return "OVERDUE";
  if (params.dueSoonCount > 0) return "DUE_SOON";
  return "CURRENT";
}

export function applyDiscount(amount: number, type: "PERCENTAGE" | "FIXED", value: number) {
  if (type === "PERCENTAGE") {
    return Number((amount * (value / 100)).toFixed(2));
  }
  return Number(Math.min(amount, value).toFixed(2));
}

export function allocatePayments(
  remainingByCharge: { chargeId: string; remaining: number }[],
  paymentAmount: number,
) {
  const allocations: { chargeId: string; amount: number }[] = [];
  let leftover = paymentAmount;
  for (const charge of remainingByCharge) {
    if (leftover <= 0) break;
    const applied = Math.min(charge.remaining, leftover);
    if (applied > 0) {
      allocations.push({ chargeId: charge.chargeId, amount: Number(applied.toFixed(2)) });
      leftover = Number((leftover - applied).toFixed(2));
    }
  }
  return { allocations, leftover };
}
