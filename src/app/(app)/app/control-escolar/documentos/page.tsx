import { requirePermission } from "@/lib/auth/guards";
import { academicOptions, listStudents } from "@/modules/academic/queries";
import { uploadDocumentAction, validateDocumentAction } from "@/modules/operations/actions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { ActionForm } from "@/components/forms/action-form";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DOCUMENT_STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export default async function DocumentsPage() {
  const actor = await requirePermission("documents.read");
  const [options, students, documents] = await Promise.all([
    academicOptions(actor),
    listStudents(actor, {}),
    db.document.findMany({
      where: { student: { institutionId: actor.institutionId } },
      include: { student: true, type: true, uploadedBy: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <>
      <PageHeader title="Expediente digital" breadcrumbs={[{ href: "/app", label: "Inicio" }, { label: "Documentos" }]} />
      <div className="mb-6 max-w-2xl rounded-2xl border border-border bg-card p-5">
        <ActionForm action={uploadDocumentAction} submitLabel="Cargar documento">
          <Field label="Alumno" htmlFor="studentId">
            <Select id="studentId" name="studentId">
              <option value="">Institucional</option>
              {students.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.firstName} {item.lastName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tipo" htmlFor="typeId">
            <Select id="typeId" name="typeId" required>
              {options.documentTypes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Título" htmlFor="title">
            <Input id="title" name="title" required />
          </Field>
          <Field label="Archivo" htmlFor="file">
            <Input id="file" name="file" type="file" required />
          </Field>
          <Field label="Observaciones" htmlFor="notes">
            <Textarea id="notes" name="notes" />
          </Field>
        </ActionForm>
      </div>
      <div className="rounded-2xl border border-border bg-card">
        <Table>
          <THead>
            <TR>
              <TH>Documento</TH>
              <TH>Alumno</TH>
              <TH>Cargó</TH>
              <TH>Fecha</TH>
              <TH>Estatus</TH>
              <TH></TH>
            </TR>
          </THead>
          <TBody>
            {documents.map((item) => (
              <TR key={item.id}>
                <TD>{item.title}</TD>
                <TD>{item.student ? `${item.student.firstName} ${item.student.lastName}` : "—"}</TD>
                <TD>
                  {item.uploadedBy.firstName} {item.uploadedBy.lastName}
                </TD>
                <TD>{formatDate(item.createdAt)}</TD>
                <TD>{DOCUMENT_STATUS_LABELS[item.status]}</TD>
                <TD>
                  <div className="flex gap-2">
                    <form
                      action={async () => {
                        "use server";
                        await validateDocumentAction(item.id, "VALIDATED");
                      }}
                    >
                      <Button size="sm" type="submit">
                        Validar
                      </Button>
                    </form>
                    <form
                      action={async () => {
                        "use server";
                        await validateDocumentAction(item.id, "REJECTED", "Rechazado en revisión");
                      }}
                    >
                      <Button size="sm" variant="outline" type="submit">
                        Rechazar
                      </Button>
                    </form>
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </>
  );
}
