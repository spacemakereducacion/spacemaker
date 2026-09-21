import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { formatDateTime } from "@/lib/utils";

export default async function StudentNoticesPage() {
  const actor = await requirePermission("portal.student");
  const items = await db.announcement.findMany({
    where: { institutionId: actor.institutionId },
    orderBy: { publishedAt: "desc" },
    take: 20,
  });
  return (
    <>
      <PageHeader title="Avisos" />
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-2xl border border-border bg-card p-4">
            <p className="font-medium">{item.title}</p>
            <p className="text-xs text-muted-foreground">{formatDateTime(item.publishedAt)}</p>
            <p className="mt-2 text-sm">{item.body}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
