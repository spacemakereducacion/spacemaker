import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { formatDateTime } from "@/lib/utils";

export default async function FollowUpsPage() {
  const actor = await requirePermission("marketing.read");
  const rows = await db.prospectFollowUp.findMany({
    where: { prospect: { institutionId: actor.institutionId } },
    include: { prospect: true, user: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return (
    <>
      <PageHeader title="Seguimientos" breadcrumbs={[{ href: "/app", label: "Inicio" }, { label: "Seguimientos" }]} />
      <ul className="space-y-2">
        {rows.map((item) => (
          <li key={item.id} className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
            {formatDateTime(item.createdAt)} · {item.prospect.firstName} {item.prospect.lastName} · {item.user.firstName}:{" "}
            {item.notes}
          </li>
        ))}
      </ul>
    </>
  );
}
