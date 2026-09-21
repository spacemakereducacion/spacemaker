import { requirePermission } from "@/lib/auth/guards";
import { addCashMovementAction, closeCashAction, openCashAction } from "@/modules/finance/actions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { ActionForm } from "@/components/forms/action-form";
import { Field, Input, Select } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDateTime, toNumber } from "@/lib/utils";

export default async function CashPage() {
  const actor = await requirePermission("cash.read");
  const [registers, sessions] = await Promise.all([
    db.cashRegister.findMany({ where: { institutionId: actor.institutionId } }),
    db.cashSession.findMany({
      where: { register: { institutionId: actor.institutionId } },
      include: { register: true, openedBy: true, movements: true, payments: true },
      orderBy: { openedAt: "desc" },
      take: 8,
    }),
  ]);
  const open = sessions.find((item) => item.status === "OPEN");

  async function close(formData: FormData) {
    "use server";
    if (!open) return { ok: false, error: "No hay sesión abierta." };
    return closeCashAction(open.id, formData);
  }

  return (
    <>
      <PageHeader title="Caja" breadcrumbs={[{ href: "/app", label: "Inicio" }, { label: "Caja" }]} />
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Apertura</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionForm action={openCashAction} submitLabel="Abrir caja">
              <Field label="Caja" htmlFor="registerId">
                <Select id="registerId" name="registerId" required>
                  {registers.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Fondo inicial" htmlFor="openingAmount">
                <Input id="openingAmount" name="openingAmount" type="number" step="0.01" defaultValue={0} />
              </Field>
            </ActionForm>
          </CardContent>
        </Card>
        {open ? (
          <Card>
            <CardHeader>
              <CardTitle>Sesión abierta · {open.register.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">
                Apertura {formatCurrency(toNumber(open.openingAmount))} · Pagos {open.payments.length}
              </p>
              <ActionForm action={addCashMovementAction} submitLabel="Registrar movimiento">
                <input type="hidden" name="sessionId" value={open.id} />
                <Field label="Tipo" htmlFor="type">
                  <Select id="type" name="type">
                    <option value="INCOME">Ingreso</option>
                    <option value="EXPENSE">Egreso</option>
                    <option value="REFUND">Devolución</option>
                  </Select>
                </Field>
                <Field label="Concepto" htmlFor="concept">
                  <Input id="concept" name="concept" required />
                </Field>
                <Field label="Monto" htmlFor="amount">
                  <Input id="amount" name="amount" type="number" step="0.01" required />
                </Field>
              </ActionForm>
              <ActionForm action={close} submitLabel="Cerrar caja">
                <Field label="Efectivo contado" htmlFor="closingAmount">
                  <Input id="closingAmount" name="closingAmount" type="number" step="0.01" required />
                </Field>
              </ActionForm>
            </CardContent>
          </Card>
        ) : null}
      </div>
      <ul className="space-y-2 text-sm">
        {sessions.map((item) => (
          <li key={item.id} className="rounded-xl border border-border bg-card px-4 py-3">
            {item.register.name} · {item.status} · {formatDateTime(item.openedAt)} · {item.openedBy.firstName}
          </li>
        ))}
      </ul>
    </>
  );
}
