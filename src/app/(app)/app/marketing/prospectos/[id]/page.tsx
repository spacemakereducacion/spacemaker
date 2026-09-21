import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/guards";
import { addFollowUpAction, convertProspectAction, updateProspectStageAction } from "@/modules/marketing/actions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { ActionForm } from "@/components/forms/action-form";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PROSPECT_STAGE_LABELS } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";

export default async function ProspectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requirePermission("marketing.read");
  const { id } = await params;
  const prospect = await db.prospect.findFirst({
    where: { id, institutionId: actor.institutionId },
    include: { followUps: { include: { user: true }, orderBy: { createdAt: "desc" } }, program: true },
  });
  if (!prospect) notFound();

  return (
    <>
      <PageHeader
        title={`${prospect.firstName} ${prospect.lastName}`}
        description={`${PROSPECT_STAGE_LABELS[prospect.stage]} · ${prospect.program?.name ?? "Sin programa"}`}
        breadcrumbs={[
          { href: "/app", label: "Inicio" },
          { href: "/app/marketing/prospectos", label: "Prospectos" },
          { label: prospect.lastName },
        ]}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {Object.keys(PROSPECT_STAGE_LABELS).map((stage) => (
          <form
            key={stage}
            action={async () => {
              "use server";
              await updateProspectStageAction(id, stage as import("@prisma/client").ProspectStage);
            }}
          >
            <Button size="sm" variant={prospect.stage === stage ? "default" : "outline"} type="submit">
              {PROSPECT_STAGE_LABELS[stage]}
            </Button>
          </form>
        ))}
      </div>
      <form
        action={async () => {
          "use server";
          await convertProspectAction(id);
        }}
        className="mb-6"
      >
        <Button type="submit">Convertir en aspirante</Button>
      </form>
      <div className="max-w-xl rounded-2xl border border-border bg-card p-5">
        <ActionForm action={addFollowUpAction} submitLabel="Guardar seguimiento">
          <input type="hidden" name="prospectId" value={prospect.id} />
          <Field label="Notas" htmlFor="notes">
            <Textarea id="notes" name="notes" required />
          </Field>
          <Field label="Próximo seguimiento" htmlFor="nextDate">
            <Input id="nextDate" name="nextDate" type="datetime-local" />
          </Field>
        </ActionForm>
        <ul className="mt-4 space-y-2 text-sm">
          {prospect.followUps.map((item) => (
            <li key={item.id}>
              {formatDateTime(item.createdAt)} · {item.user.firstName}: {item.notes}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
