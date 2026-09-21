import { requirePermission } from "@/lib/auth/guards";
import { addQuestionAction, createExamAction } from "@/modules/elearning/actions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { ActionForm } from "@/components/forms/action-form";
import { Field, Input, Select, Textarea } from "@/components/ui/input";

export default async function ExamsPage() {
  const actor = await requirePermission("elearning.read");
  const [courses, exams] = await Promise.all([
    db.course.findMany({ where: { institutionId: actor.institutionId } }),
    db.exam.findMany({
      where: { institutionId: actor.institutionId },
      include: { questions: { include: { options: true } }, attempts: true },
    }),
  ]);
  return (
    <>
      <PageHeader title="Exámenes" breadcrumbs={[{ href: "/app", label: "Inicio" }, { label: "Exámenes" }]} />
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <ActionForm action={createExamAction} submitLabel="Crear examen">
            <Field label="Título" htmlFor="title">
              <Input id="title" name="title" required />
            </Field>
            <Field label="Curso" htmlFor="courseId">
              <Select id="courseId" name="courseId">
                <option value="">Banco general</option>
                {courses.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Minutos" htmlFor="timeLimitMin">
              <Input id="timeLimitMin" name="timeLimitMin" type="number" />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isPublished" /> Publicar
            </label>
          </ActionForm>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <ActionForm action={addQuestionAction} submitLabel="Agregar pregunta">
            <Field label="Examen" htmlFor="examId">
              <Select id="examId" name="examId">
                {exams.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Pregunta" htmlFor="prompt">
              <Textarea id="prompt" name="prompt" required />
            </Field>
            <Field label="Opción 1" htmlFor="option1">
              <Input id="option1" name="option1" />
            </Field>
            <Field label="Opción 2" htmlFor="option2">
              <Input id="option2" name="option2" />
            </Field>
            <Field label="Opción 3" htmlFor="option3">
              <Input id="option3" name="option3" />
            </Field>
            <Field label="Correcta" htmlFor="correct">
              <Select id="correct" name="correct" defaultValue="1">
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </Select>
            </Field>
          </ActionForm>
        </div>
      </div>
      <ul className="space-y-3">
        {exams.map((exam) => (
          <li key={exam.id} className="rounded-2xl border border-border bg-card p-4">
            <p className="font-medium">
              {exam.title} · {exam.questions.length} preguntas · {exam.attempts.length} intentos
            </p>
            <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
              {exam.questions.map((question) => (
                <li key={question.id}>{question.prompt}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </>
  );
}
