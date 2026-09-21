import Link from "next/link";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PROSPECT_STAGE_LABELS } from "@/lib/constants";

export default async function CrmPage() {
  const actor = await requirePermission("marketing.read");
  const grouped = await db.prospect.groupBy({
    by: ["stage"],
    where: { institutionId: actor.institutionId },
    _count: true,
  });
  const prospects = await db.prospect.findMany({
    where: { institutionId: actor.institutionId },
    orderBy: { updatedAt: "desc" },
  });
  const total = prospects.length || 1;
  const enrolled = grouped.find((item) => item.stage === "ENROLLED")?._count ?? 0;
  return (
    <>
      <PageHeader
        title="CRM / embudo"
        description={`Conversión ${(enrolled / total) * 100}%`}
        breadcrumbs={[{ href: "/app", label: "Inicio" }, { label: "CRM" }]}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Object.entries(PROSPECT_STAGE_LABELS).map(([stage, label]) => (
          <Card key={stage}>
            <CardHeader>
              <CardTitle>{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{grouped.find((item) => item.stage === stage)?._count ?? 0}</p>
              <ul className="mt-3 space-y-1 text-sm">
                {prospects
                  .filter((item) => item.stage === stage)
                  .slice(0, 4)
                  .map((item) => (
                    <li key={item.id}>
                      <Link className="underline" href={`/app/marketing/prospectos/${item.id}`}>
                        {item.firstName} {item.lastName}
                      </Link>
                    </li>
                  ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
