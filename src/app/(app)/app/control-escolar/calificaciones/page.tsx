import { requirePermission } from "@/lib/auth/guards";
import { academicOptions, listStudents } from "@/modules/academic/queries";
import { saveGradeAction } from "@/modules/operations/actions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { ActionForm } from "@/components/forms/action-form";
import { Field, Input, Select } from "@/components/ui/input";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { academicSummary } from "@/lib/grades";
import { toNumber } from "@/lib/utils";

export default async function GradesPage() {
  const actor = await requirePermission("grades.read");
  const [options, students, grades] = await Promise.all([
    academicOptions(actor),
    listStudents(actor, { status: "ACTIVE" }),
    db.grade.findMany({
      where: { student: { institutionId: actor.institutionId } },
      include: { student: true, subject: true, evaluationPeriod: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);
  const summary = academicSummary(
    grades.map((grade) => ({
      subjectId: grade.subjectId,
      score: toNumber(grade.score),
      maxScore: toNumber(grade.maxScore),
    })),
  );

  return (
    <>
      <PageHeader
        title="Calificaciones"
        description={`Promedio general ${summary.average} · ${summary.approved} materias aprobadas · ${summary.pending} pendientes`}
        breadcrumbs={[{ href: "/app", label: "Inicio" }, { label: "Calificaciones" }]}
      />
      <div className="mb-6 max-w-2xl rounded-2xl border border-border bg-card p-5">
        <ActionForm action={saveGradeAction} submitLabel="Registrar calificación">
          <Field label="Alumno" htmlFor="studentId">
            <Select id="studentId" name="studentId" required>
              {students.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.firstName} {item.lastName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Materia" htmlFor="subjectId">
            <Select id="subjectId" name="subjectId" required>
              {options.subjects.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Periodo" htmlFor="evaluationPeriodId">
            <Select id="evaluationPeriodId" name="evaluationPeriodId">
              <option value="">Sin periodo</option>
              {options.periods.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tipo" htmlFor="type">
            <Select id="type" name="type" defaultValue="ORDINARY">
              <option value="ORDINARY">Ordinaria</option>
              <option value="RECOVERY">Recuperación</option>
              <option value="EXTRAORDINARY">Extraordinario</option>
            </Select>
          </Field>
          <Field label="Calificación" htmlFor="score">
            <Input id="score" name="score" type="number" step="0.1" min="0" max="10" required />
          </Field>
          <Field label="Observaciones" htmlFor="observations">
            <Input id="observations" name="observations" />
          </Field>
        </ActionForm>
      </div>
      <div className="rounded-2xl border border-border bg-card">
        <Table>
          <THead>
            <TR>
              <TH>Alumno</TH>
              <TH>Materia</TH>
              <TH>Tipo</TH>
              <TH>Calificación</TH>
            </TR>
          </THead>
          <TBody>
            {grades.map((item) => (
              <TR key={item.id}>
                <TD>
                  {item.student.firstName} {item.student.lastName}
                </TD>
                <TD>{item.subject.name}</TD>
                <TD>{item.type}</TD>
                <TD>{toNumber(item.score)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </>
  );
}
