import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/guards";
import { academicOptions, getStudent } from "@/modules/academic/queries";
import { enrollApplicantAction, updateStudentAction } from "@/modules/academic/actions";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ActionForm } from "@/components/forms/action-form";
import { Field, Input, Select } from "@/components/ui/input";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { STUDENT_STATUS_LABELS, DOCUMENT_STATUS_LABELS } from "@/lib/constants";
import { academicSummary } from "@/lib/grades";
import { chargeBalance } from "@/lib/finance";
import { formatCurrency, formatDate, toNumber } from "@/lib/utils";

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requirePermission("students.read");
  const { id } = await params;
  const student = await getStudent(actor, id);
  if (!student) notFound();
  const options = await academicOptions(actor);
  const summary = academicSummary(
    student.grades.map((grade) => ({
      subjectId: grade.subjectId,
      score: toNumber(grade.score),
      maxScore: toNumber(grade.maxScore),
    })),
  );
  const balance = student.charges.reduce(
    (sum, charge) =>
      sum +
      chargeBalance({
        amount: charge.amount,
        surcharge: charge.surcharge,
        discountAmount: charge.discountAmount,
        paid: charge.allocations.reduce((paid, item) => paid + toNumber(item.amount), 0),
      }),
    0,
  );

  async function save(formData: FormData) {
    "use server";
    return updateStudentAction(id, formData);
  }
  async function enroll(formData: FormData) {
    "use server";
    return enrollApplicantAction(id, formData);
  }

  return (
    <>
      <PageHeader
        title={`${student.firstName} ${student.lastName}`}
        description={`Matrícula ${student.enrollmentNumber}`}
        breadcrumbs={[
          { href: "/app", label: "Inicio" },
          { href: "/app/control-escolar/alumnos", label: "Alumnos" },
          { label: student.enrollmentNumber },
        ]}
        actions={<Badge>{STUDENT_STATUS_LABELS[student.status]}</Badge>}
      />
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent>
            <p className="text-xs text-muted-foreground">Promedio</p>
            <p className="text-2xl font-semibold">{summary.average}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs text-muted-foreground">Materias aprobadas</p>
            <p className="text-2xl font-semibold">
              {summary.approved}/{summary.approved + summary.pending}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs text-muted-foreground">Saldo</p>
            <p className="text-2xl font-semibold">{formatCurrency(balance)}</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Datos del expediente</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionForm action={save}>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Nombre" htmlFor="firstName">
                  <Input id="firstName" name="firstName" defaultValue={student.firstName} />
                </Field>
                <Field label="Apellidos" htmlFor="lastName">
                  <Input id="lastName" name="lastName" defaultValue={student.lastName} />
                </Field>
                <Field label="Estatus" htmlFor="status">
                  <Select id="status" name="status" defaultValue={student.status}>
                    {Object.entries(STUDENT_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Grupo" htmlFor="groupId">
                  <Select id="groupId" name="groupId" defaultValue={student.groupId ?? ""}>
                    <option value="">Sin grupo</option>
                    {options.groups.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            </ActionForm>
          </CardContent>
        </Card>
        {student.status === "APPLICANT" || student.status === "PRE_ENROLLED" ? (
          <Card>
            <CardHeader>
              <CardTitle>Inscribir y generar matrícula</CardTitle>
            </CardHeader>
            <CardContent>
              <ActionForm action={enroll} submitLabel="Inscribir">
                <Field label="Grupo" htmlFor="enrollGroup">
                  <Select id="enrollGroup" name="groupId" required>
                    {options.groups.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Ciclo" htmlFor="enrollYear">
                  <Select id="enrollYear" name="schoolYearId" required>
                    {options.years.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              </ActionForm>
            </CardContent>
          </Card>
        ) : null}
        <Card>
          <CardHeader>
            <CardTitle>Padres / tutores</CardTitle>
          </CardHeader>
          <CardContent>
            {student.guardians.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin tutores relacionados.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {student.guardians.map((link) => (
                  <li key={link.id}>
                    {link.guardian.firstName} {link.guardian.lastName} · {link.relation}
                    {link.isPrimary ? " · principal" : ""}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Documentos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>Documento</TH>
                  <TH>Estatus</TH>
                </TR>
              </THead>
              <TBody>
                {student.documents.map((doc) => (
                  <TR key={doc.id}>
                    <TD>{doc.title}</TD>
                    <TD>{DOCUMENT_STATUS_LABELS[doc.status]}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Calificaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>Materia</TH>
                  <TH>Calificación</TH>
                </TR>
              </THead>
              <TBody>
                {student.grades.map((grade) => (
                  <TR key={grade.id}>
                    <TD>{grade.subject.name}</TD>
                    <TD>{toNumber(grade.score)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Historial de grupo</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {student.groupHistory.map((item) => (
                <li key={item.id}>
                  {formatDate(item.createdAt)} · {item.action} · {item.group.name}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
