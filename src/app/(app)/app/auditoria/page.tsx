import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";

export default async function AuditPage() {
  const actor = await requirePermission("audit.read");
  const logs = await db.auditLog.findMany({
    where: { institutionId: actor.institutionId },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <>
      <PageHeader title="Auditoría" breadcrumbs={[{ href: "/app", label: "Inicio" }, { label: "Auditoría" }]} />
      <div className="rounded-2xl border border-border bg-card">
        <Table>
          <THead>
            <TR>
              <TH>Fecha</TH>
              <TH>Usuario</TH>
              <TH>Acción</TH>
              <TH>Módulo</TH>
              <TH>Registro</TH>
            </TR>
          </THead>
          <TBody>
            {logs.map((item) => (
              <TR key={item.id}>
                <TD>{formatDateTime(item.createdAt)}</TD>
                <TD>{item.user ? `${item.user.firstName} ${item.user.lastName}` : "sistema"}</TD>
                <TD>{item.action}</TD>
                <TD>{item.module}</TD>
                <TD>
                  {item.entity} {item.entityId}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </>
  );
}
