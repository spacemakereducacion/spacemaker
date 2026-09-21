import { requirePermission } from "@/lib/auth/guards";
import { createAssignmentAction } from "@/modules/elearning/actions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { ActionForm } from "@/components/forms/action-form";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";

export default async function ActivitiesPage() {
  const actor = await requirePermission("elearning.read");
  const [courses, assignments] = await Promise.all([
    db.course.findMany({ where: { institutionId: actor.institutionId } }),
    db.assignment.findMany({
      where: { course: { institutionId: actor.institutionId } },
      include: { course: true, submissions: { include: { student: true } } },
    }),
  ]);
  return (
    <>
      <PageHeader title="Actividades" breadcrumbs={[{ href: "/app", label: "Inicio" }, { label: "Actividades" }]} />
      <div className="mb-6 max-w-xl rounded-2xl border border-border bg-card p-5">
        <ActionForm action={createAssignmentAction}>
          <Field label="Curso" htmlFor="courseId">
            <Select id="courseId" name="courseId" required>
              {courses.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Título" htmlFor="title">
            <Input id="title" name="title" required />
          </Field>
          <Field label="Descripción" htmlFor="description">
            <Textarea id="description" name="description" />
          </Field>
          <Field label="Fecha límite" htmlFor="dueAt">
            <Input id="dueAt" name="dueAt" type="datetime-local" />
          </Field>
        </ActionForm>
      </div>
      <ul className="space-y-3">
        {assignments.map((item) => (
          <li key={item.id} className="rounded-2xl border border-border bg-card p-4">
            <p className="font-medium">
              {item.title} · {item.course.title}
            </p>
            <p className="text-sm text-muted-foreground">Entrega {item.dueAt ? formatDate(item.dueAt) : "sin fecha"}</p>
            <ul className="mt-2 text-sm">
              {item.submissions.map((submission) => (
                <li key={submission.id}>
                  {submission.student.firstName} {submission.student.lastName} · {submission.score?.toString() ?? "sin calificar"}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </>
  );
}
