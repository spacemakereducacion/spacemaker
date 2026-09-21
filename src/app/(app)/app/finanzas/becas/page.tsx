import { requirePermission } from "@/lib/auth/guards";
import { listStudents } from "@/modules/academic/queries";
import { assignScholarshipAction, createScholarshipAction } from "@/modules/finance/actions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { ActionForm } from "@/components/forms/action-form";
import { Field, Input, Select } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ScholarshipsPage() {
  const actor = await requirePermission("scholarships.read");
  const [items, students, concepts] = await Promise.all([
    db.scholarship.findMany({
      where: { institutionId: actor.institutionId },
      include: { assignments: { include: { student: true, authorizedBy: true } } },
    }),
    listStudents(actor, {}),
    db.chargeConcept.findMany({ where: { institutionId: actor.institutionId } }),
  ]);
  return (
    <>
      <PageHeader title="Becas" breadcrumbs={[{ href: "/app", label: "Inicio" }, { label: "Becas" }]} />
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Nueva beca</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionForm action={createScholarshipAction}>
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
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Asignar beca</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionForm action={assignScholarshipAction} submitLabel="Autorizar">
              <Field label="Beca" htmlFor="scholarshipId">
                <Select id="scholarshipId" name="scholarshipId" required>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Alumno" htmlFor="studentId">
                <Select id="studentId" name="studentId" required>
                  {students.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.firstName} {item.lastName}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Notas de autorización" htmlFor="notes">
                <Input id="notes" name="notes" />
              </Field>
            </ActionForm>
          </CardContent>
        </Card>
      </div>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-2xl border border-border bg-card p-4">
            <p className="font-medium">
              {item.name} · {item.type} {item.value.toString()}
            </p>
            <ul className="mt-2 text-sm text-muted-foreground">
              {item.assignments.map((assignment) => (
                <li key={assignment.id}>
                  {assignment.student.firstName} {assignment.student.lastName} · autorizó{" "}
                  {assignment.authorizedBy.firstName} {assignment.authorizedBy.lastName}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </>
  );
}
