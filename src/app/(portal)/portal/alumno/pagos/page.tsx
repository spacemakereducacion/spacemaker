import { requirePermission } from "@/lib/auth/guards";
import { getPortalStudent } from "@/modules/portal/queries";
import { PageHeader } from "@/components/ui/page-header";
import { chargeBalance } from "@/lib/finance";
import { CHARGE_STATUS_LABELS } from "@/lib/constants";
import { formatCurrency, formatDate, toNumber } from "@/lib/utils";

export default async function StudentPaymentsPage() {
  const actor = await requirePermission("portal.student");
  const student = await getPortalStudent(actor);
  return (
    <>
      <PageHeader title="Mis pagos" />
      <ul className="space-y-2">
        {student?.charges.map((item) => (
          <li key={item.id} className="rounded-xl border border-border bg-card px-4 py-3">
            {item.concept.name} · {CHARGE_STATUS_LABELS[item.status]} · vence {formatDate(item.dueDate)} · saldo{" "}
            {formatCurrency(
              chargeBalance({
                amount: item.amount,
                surcharge: item.surcharge,
                discountAmount: item.discountAmount,
                paid: item.allocations.reduce((sum, alloc) => sum + toNumber(alloc.amount), 0),
              }),
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
