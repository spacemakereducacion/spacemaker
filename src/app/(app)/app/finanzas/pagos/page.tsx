import { requirePermission } from "@/lib/auth/guards";
import { listStudents } from "@/modules/academic/queries";
import { registerPaymentAction } from "@/modules/finance/actions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { ActionForm } from "@/components/forms/action-form";
import { Field, Input, Select } from "@/components/ui/input";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { formatCurrency, formatDateTime, toNumber } from "@/lib/utils";

export default async function PaymentsPage() {
  const actor = await requirePermission("finance.read");
  const [students, methods, payments] = await Promise.all([
    listStudents(actor, {}),
    db.paymentMethod.findMany({ where: { institutionId: actor.institutionId } }),
    db.payment.findMany({
      where: { student: { institutionId: actor.institutionId } },
      include: { student: true, method: true, invoice: true, cashier: true },
      orderBy: { paidAt: "desc" },
    }),
  ]);
  return (
    <>
      <PageHeader title="Pagos y recibos" breadcrumbs={[{ href: "/app", label: "Inicio" }, { label: "Pagos" }]} />
      <div className="mb-6 max-w-xl rounded-2xl border border-border bg-card p-5">
        <ActionForm action={registerPaymentAction} submitLabel="Registrar pago">
          <Field label="Alumno" htmlFor="studentId">
            <Select id="studentId" name="studentId" required>
              {students.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.firstName} {item.lastName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Método" htmlFor="methodId">
            <Select id="methodId" name="methodId" required>
              {methods.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Monto" htmlFor="amount">
            <Input id="amount" name="amount" type="number" step="0.01" required />
          </Field>
          <Field label="Referencia" htmlFor="reference">
            <Input id="reference" name="reference" />
          </Field>
        </ActionForm>
      </div>
      <div className="rounded-2xl border border-border bg-card">
        <Table>
          <THead>
            <TR>
              <TH>Folio</TH>
              <TH>Alumno</TH>
              <TH>Monto</TH>
              <TH>Método</TH>
              <TH>Cajero</TH>
              <TH>Fecha</TH>
            </TR>
          </THead>
          <TBody>
            {payments.map((item) => (
              <TR key={item.id}>
                <TD className="font-medium">{item.folio}</TD>
                <TD>
                  {item.student.firstName} {item.student.lastName}
                </TD>
                <TD>{formatCurrency(toNumber(item.amount))}</TD>
                <TD>{item.method.name}</TD>
                <TD>
                  {item.cashier.firstName} {item.cashier.lastName}
                </TD>
                <TD>{formatDateTime(item.paidAt)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </>
  );
}
