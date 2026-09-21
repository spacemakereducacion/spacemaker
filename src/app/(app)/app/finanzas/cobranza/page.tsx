import { startOfDay, startOfMonth } from "date-fns";
import { requirePermission } from "@/lib/auth/guards";
import { sendCollectionRemindersAction, updateCollectionStatusAction } from "@/modules/finance/actions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { formatCurrency, toNumber } from "@/lib/utils";
import { COLLECTION_STATUS_LABELS } from "@/lib/constants";

export default async function CollectionsPage() {
  const actor = await requirePermission("collections.read");
  const today = startOfDay(new Date());
  const month = startOfMonth(new Date());
  const [total, overdue, todayPay, monthPay, debtors] = await Promise.all([
    db.charge.aggregate({
      _sum: { amount: true },
      where: { status: { in: ["PENDING", "PARTIAL", "OVERDUE"] }, student: { institutionId: actor.institutionId } },
    }),
    db.charge.aggregate({
      _sum: { amount: true },
      where: { status: "OVERDUE", student: { institutionId: actor.institutionId } },
    }),
    db.payment.aggregate({
      _sum: { amount: true },
      where: { paidAt: { gte: today }, student: { institutionId: actor.institutionId } },
    }),
    db.payment.aggregate({
      _sum: { amount: true },
      where: { paidAt: { gte: month }, student: { institutionId: actor.institutionId } },
    }),
    db.student.findMany({
      where: { institutionId: actor.institutionId, charges: { some: { status: { in: ["PENDING", "OVERDUE", "PARTIAL"] } } } },
      include: { charges: true },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Cobranza"
        description="Cartera, vencidos y recordatorios internos. WhatsApp/SMS/email quedan como adaptadores."
        breadcrumbs={[{ href: "/app", label: "Inicio" }, { label: "Cobranza" }]}
        actions={
          <form
            action={async () => {
              "use server";
              await sendCollectionRemindersAction();
            }}
          >
            <Button type="submit">Enviar recordatorios</Button>
          </form>
        }
      />
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <KpiCard label="Cartera total" value={formatCurrency(toNumber(total._sum.amount))} />
        <KpiCard label="Cartera vencida" value={formatCurrency(toNumber(overdue._sum.amount))} />
        <KpiCard label="Cobranza del día" value={formatCurrency(toNumber(todayPay._sum.amount))} />
        <KpiCard label="Cobranza del mes" value={formatCurrency(toNumber(monthPay._sum.amount))} />
      </div>
      <div className="rounded-2xl border border-border bg-card">
        <Table>
          <THead>
            <TR>
              <TH>Alumno</TH>
              <TH>Estatus</TH>
              <TH>Cargos abiertos</TH>
              <TH></TH>
            </TR>
          </THead>
          <TBody>
            {debtors.map((item) => (
              <TR key={item.id}>
                <TD>
                  {item.firstName} {item.lastName}
                </TD>
                <TD>{COLLECTION_STATUS_LABELS[item.collectionStatus]}</TD>
                <TD>{item.charges.filter((charge) => charge.status !== "PAID").length}</TD>
                <TD>
                  <form
                    action={async () => {
                      "use server";
                      await updateCollectionStatusAction(item.id, "AGREEMENT");
                    }}
                  >
                    <Button size="sm" variant="outline" type="submit">
                      Marcar convenio
                    </Button>
                  </form>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </>
  );
}
