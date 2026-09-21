import Link from "next/link";
import { requirePermission } from "@/lib/auth/guards";
import { listStudents } from "@/modules/academic/queries";
import { PageHeader } from "@/components/ui/page-header";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/states";
import { STUDENT_STATUS_LABELS } from "@/lib/constants";

export default async function ApplicantsPage() {
  const actor = await requirePermission("applicants.read");
  const pre = await listStudents(actor, { status: "PRE_ENROLLED" });
  const applicants = await listStudents(actor, { status: "APPLICANT" });
  const rows = [...applicants, ...pre];
  return (
    <>
      <PageHeader
        title="Aspirantes"
        description="Flujo de preinscripción, documentos e inscripción formal."
        breadcrumbs={[{ href: "/app", label: "Inicio" }, { label: "Aspirantes" }]}
      />
      {rows.length === 0 ? (
        <EmptyState title="No hay aspirantes" description="Convierta un prospecto o registre un alumno en estatus aspirante." />
      ) : (
        <div className="rounded-2xl border border-border bg-card">
          <Table>
            <THead>
              <TR>
                <TH>Folio</TH>
                <TH>Nombre</TH>
                <TH>Estatus</TH>
                <TH>Programa</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((row) => (
                <TR key={row.id}>
                  <TD>
                    <Link className="underline" href={`/app/control-escolar/alumnos/${row.id}`}>
                      {row.enrollmentNumber}
                    </Link>
                  </TD>
                  <TD>
                    {row.firstName} {row.lastName}
                  </TD>
                  <TD>{STUDENT_STATUS_LABELS[row.status]}</TD>
                  <TD>{row.program?.name ?? "—"}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      )}
    </>
  );
}
