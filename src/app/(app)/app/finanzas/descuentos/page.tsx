import { requirePermission } from "@/lib/auth/guards";
import { createDiscountAction } from "@/modules/finance/actions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { ActionForm } from "@/components/forms/action-form";
import { Field, Input, Select } from "@/components/ui/input";

export default async function DiscountsPage() {
  const actor = await requirePermission("scholarships.read");
  const [items, concepts] = await Promise.all([
    db.discount.findMany({ where: { institutionId: actor.institutionId } }),
    db.chargeConcept.findMany({ where: { institutionId: actor.institutionId } }),
  ]);
  return (
    <>
      <PageHeader title="Descuentos" breadcrumbs={[{ href: "/app", label: "Inicio" }, { label: "Descuentos" }]} />
      <div className="mb-6 max-w-lg rounded-2xl border border-border bg-card p-5">
        <ActionForm action={createDiscountAction}>
          <Field label="Nombre" htmlFor="name">
            <Input id="name" name="name" required />
          </Field>
          <Field label="Tipo" htmlFor="type">
            <Select id="type" name="type">
              <option value="PERCENTAGE">Porcentaje</option>
              <option value="FIXED">Cantidad fija</option>
            </Select>
          </Field>
          <Field label="Valor" htmlFor="value">
            <Input id="value" name="value" type="number" step="0.01" required />
          </Field>
          <Field label="Concepto" htmlFor="conceptId">
            <Select id="conceptId" name="conceptId">
              <option value="">Todos</option>
              {concepts.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
        </ActionForm>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="rounded-xl border border-border bg-card px-4 py-3">
            {item.name} · {item.type} {item.value.toString()}
          </li>
        ))}
      </ul>
    </>
  );
}
