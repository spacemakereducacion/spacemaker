import { requirePermission } from "@/lib/auth/guards";
import { createCampaignAction } from "@/modules/marketing/actions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { ActionForm } from "@/components/forms/action-form";
import { Field, Input, Select } from "@/components/ui/input";
import { formatCurrency, toNumber } from "@/lib/utils";

export default async function CampaignsPage() {
  const actor = await requirePermission("marketing.read");
  const campaigns = await db.marketingCampaign.findMany({
    where: { institutionId: actor.institutionId },
    include: { prospects: true },
  });
  return (
    <>
      <PageHeader title="Campañas" breadcrumbs={[{ href: "/app", label: "Inicio" }, { label: "Campañas" }]} />
      <div className="mb-6 max-w-xl rounded-2xl border border-border bg-card p-5">
        <ActionForm action={createCampaignAction}>
          <Field label="Nombre" htmlFor="name">
            <Input id="name" name="name" required />
          </Field>
          <Field label="Canal" htmlFor="channel">
            <Select id="channel" name="channel">
              <option value="INSTAGRAM">Instagram</option>
              <option value="FACEBOOK">Facebook</option>
              <option value="WEBSITE">Web</option>
              <option value="EVENT">Evento</option>
              <option value="OTHER">Otro</option>
            </Select>
          </Field>
          <Field label="Presupuesto" htmlFor="budget">
            <Input id="budget" name="budget" type="number" step="0.01" />
          </Field>
        </ActionForm>
      </div>
      <ul className="space-y-3">
        {campaigns.map((item) => {
          const enrolled = item.prospects.filter((prospect) => prospect.stage === "ENROLLED").length;
          const cost = item.prospects.length ? toNumber(item.budget) / item.prospects.length : 0;
          return (
            <li key={item.id} className="rounded-2xl border border-border bg-card p-4">
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-muted-foreground">
                Presupuesto {formatCurrency(toNumber(item.budget))} · Prospectos {item.prospects.length} · Inscripciones{" "}
                {enrolled} · Costo por prospecto {formatCurrency(cost)}
              </p>
            </li>
          );
        })}
      </ul>
    </>
  );
}
