import { requirePermission } from "@/lib/auth/guards";
import { listSubjects } from "@/modules/academic/queries";
import { createSubjectAction } from "@/modules/academic/actions";
import { PageHeader } from "@/components/ui/page-header";
import { ActionForm } from "@/components/forms/action-form";
import { Field, Input } from "@/components/ui/input";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function SubjectsPage() {
  const actor = await requirePermission("programs.read");
  const rows = await listSubjects(actor);
  return (
    <>
      <PageHeader title="Materias" breadcrumbs={[{ href: "/app", label: "Inicio" }, { label: "Materias" }]} />
      <div className="mb-6 max-w-lg rounded-2xl border border-border bg-card p-5">
        <ActionForm action={createSubjectAction}>
          <Field label="Nombre" htmlFor="name">
            <Input id="name" name="name" required />
          </Field>
          <Field label="Clave" htmlFor="code">
            <Input id="code" name="code" required />
          </Field>
        </ActionForm>
      </div>
      <div className="rounded-2xl border border-border bg-card">
        <Table>
          <THead>
            <TR>
              <TH>Clave</TH>
              <TH>Nombre</TH>
              <TH>Estatus</TH>
            </TR>
          </THead>
          <TBody>
            {rows.map((row) => (
              <TR key={row.id}>
                <TD>{row.code}</TD>
                <TD>{row.name}</TD>
                <TD>
                  <Badge tone={row.isActive ? "success" : "warning"}>{row.isActive ? "Activa" : "Inactiva"}</Badge>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </>
  );
}
