import Link from "next/link";
import { requirePermission } from "@/lib/auth/guards";
import { listStudents } from "@/modules/academic/queries";
import { createChargeAction } from "@/modules/finance/actions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { ActionForm } from "@/components/forms/action-form";
import { Field, Input, Select } from "@/components/ui/input";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { chargeBalance } from "@/lib/finance";
import { formatCurrency, toNumber } from "@/lib/utils";
import { CHARGE_STATUS_LABELS, COLLECTION_STATUS_LABELS } from "@/lib/constants";

export default async function StatementsPage() {
  const actor = await requirePermission("finance.read");
  const [students, concepts, years] = await Promise.all([
    listStudents(actor, {}),
    db.chargeConcept.findMany({ where: { institutionId: actor.institutionId } }),
    db.schoolYear.findMany({ where: { institutionId: actor.institutionId } }),
  ]);
  const charges = await db.charge.findMany({
    where: { student: { institutionId: actor.institutionId } },
    include: { student: true, concept: true, allocations: true },
    orderBy: { dueDate: "asc" },
  });

  return (
    <>
      <PageHeader title="Estados de cuenta" breadcrumbs={[{ href: "/app", label: "Inicio" }, { label: "Finanzas" }]} />
      <div className="mb-6 max-w-2xl rounded-2xl border border-border bg-card p-5">
        <ActionForm action={createChargeAction} submitLabel="Crear cargo">
          <Field label="Alumno" htmlFor="studentId">
            <Select id="studentId" name="studentId" required>
              {students.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.firstName} {item.lastName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Concepto" htmlFor="conceptId">
            <Select id="conceptId" name="conceptId" required>
              {concepts.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Monto" htmlFor="amount">
            <Input id="amount" name="amount" type="number" step="0.01" required />
          </Field>
          <Field label="Vencimiento" htmlFor="dueDate">
            <Input id="dueDate" name="dueDate" type="date" required />
          </Field>
          <Field label="Ciclo" htmlFor="schoolYearId">
            <Select id="schoolYearId" name="schoolYearId">
              <option value="">Sin ciclo</option>
              {years.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
        </ActionForm>
      </div>
      <div className="rounded-2xl border border-border bg-card">
        <Table>
          <THead>
            <TR>
              <TH>Alumno</TH>
              <TH>Concepto</TH>
              <TH>Saldo</TH>
              <TH>Estatus</TH>
              <TH>Cobranza</TH>
            </TR>
          </THead>
          <TBody>
            {charges.map((item) => (
              <TR key={item.id}>
                <TD>
                  <Link className="underline" href={`/app/control-escolar/alumnos/${item.student.id}`}>
                    {item.student.firstName} {item.student.lastName}
                  </Link>
                </TD>
                <TD>{item.concept.name}</TD>
                <TD>
                  {formatCurrency(
                    chargeBalance({
                      amount: item.amount,
                      surcharge: item.surcharge,
                      discountAmount: item.discountAmount,
                      paid: item.allocations.reduce((sum, alloc) => sum + toNumber(alloc.amount), 0),
                    }),
                  )}
                </TD>
                <TD>{CHARGE_STATUS_LABELS[item.status]}</TD>
                <TD>{COLLECTION_STATUS_LABELS[item.student.collectionStatus]}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </>
  );
}
