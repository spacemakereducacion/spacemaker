import { requirePermission } from "@/lib/auth/guards";
import { getLinkedStudents, getPortalStudent } from "@/modules/portal/queries";
import { ChildSwitcher } from "@/components/portal/child-switcher";
import { PageHeader } from "@/components/ui/page-header";
import { chargeBalance } from "@/lib/finance";
import { formatCurrency, toNumber } from "@/lib/utils";

export default async function GuardianStatementPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  const actor = await requirePermission("portal.guardian");
  const { studentId } = await searchParams;
  const [students, student] = await Promise.all([getLinkedStudents(actor), getPortalStudent(actor, studentId)]);
  return (
    <>
      <PageHeader title="Estado de cuenta" />
      <ChildSwitcher students={students} currentId={student?.id} basePath="/portal/padres/estado-de-cuenta" />
      <ul className="space-y-2">
        {student?.charges.map((item) => (
          <li key={item.id} className="rounded-xl border border-border bg-card px-4 py-3">
            {item.concept.name} · {item.status} ·{" "}
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
