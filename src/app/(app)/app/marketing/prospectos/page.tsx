import Link from "next/link";
import { requirePermission } from "@/lib/auth/guards";
import { createProspectAction } from "@/modules/marketing/actions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { ActionForm } from "@/components/forms/action-form";
import { Field, Input, Select } from "@/components/ui/input";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { PROSPECT_STAGE_LABELS } from "@/lib/constants";

export default async function ProspectsPage() {
  const actor = await requirePermission("marketing.read");
  const [rows, campuses, programs, campaigns] = await Promise.all([
    db.prospect.findMany({
      where: { institutionId: actor.institutionId },
      include: { program: true, owner: true },
      orderBy: { createdAt: "desc" },
    }),
    db.campus.findMany({ where: { institutionId: actor.institutionId } }),
    db.academicProgram.findMany({ where: { institutionId: actor.institutionId } }),
    db.marketingCampaign.findMany({ where: { institutionId: actor.institutionId } }),
  ]);
  return (
    <>
      <PageHeader title="Prospectos" breadcrumbs={[{ href: "/app", label: "Inicio" }, { label: "Prospectos" }]} />
      <div className="mb-6 max-w-2xl rounded-2xl border border-border bg-card p-5">
        <ActionForm action={createProspectAction} submitLabel="Registrar prospecto">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Nombre" htmlFor="firstName">
              <Input id="firstName" name="firstName" required />
            </Field>
            <Field label="Apellidos" htmlFor="lastName">
              <Input id="lastName" name="lastName" required />
            </Field>
            <Field label="Correo" htmlFor="email">
              <Input id="email" name="email" type="email" />
            </Field>
            <Field label="Teléfono" htmlFor="phone">
              <Input id="phone" name="phone" />
            </Field>
            <Field label="Fuente" htmlFor="source">
              <Select id="source" name="source">
                <option value="WEBSITE">Página web</option>
                <option value="FACEBOOK">Facebook</option>
                <option value="INSTAGRAM">Instagram</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="PHONE">Llamada</option>
                <option value="REFERRAL">Recomendación</option>
                <option value="EVENT">Evento</option>
                <option value="OTHER">Otro</option>
              </Select>
            </Field>
            <Field label="Programa de interés" htmlFor="programId">
              <Select id="programId" name="programId">
                <option value="">Sin definir</option>
                {programs.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Plantel" htmlFor="campusId">
              <Select id="campusId" name="campusId">
                {campuses.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Campaña" htmlFor="campaignId">
              <Select id="campaignId" name="campaignId">
                <option value="">Sin campaña</option>
                {campaigns.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </ActionForm>
      </div>
      <div className="rounded-2xl border border-border bg-card">
        <Table>
          <THead>
            <TR>
              <TH>Prospecto</TH>
              <TH>Etapa</TH>
              <TH>Programa</TH>
              <TH>Ejecutivo</TH>
            </TR>
          </THead>
          <TBody>
            {rows.map((item) => (
              <TR key={item.id}>
                <TD>
                  <Link className="underline" href={`/app/marketing/prospectos/${item.id}`}>
                    {item.firstName} {item.lastName}
                  </Link>
                </TD>
                <TD>{PROSPECT_STAGE_LABELS[item.stage]}</TD>
                <TD>{item.program?.name ?? "—"}</TD>
                <TD>{item.owner ? `${item.owner.firstName} ${item.owner.lastName}` : "—"}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </>
  );
}
