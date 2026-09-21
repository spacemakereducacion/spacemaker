import { requirePermission } from "@/lib/auth/guards";
import { getPortalStudent } from "@/modules/portal/queries";
import { submitAssignmentAction } from "@/modules/elearning/actions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { ActionForm } from "@/components/forms/action-form";
import { Field, Select, Textarea } from "@/components/ui/input";

export default async function StudentAssignmentsPage() {
  const actor = await requirePermission("portal.student");
  const student = await getPortalStudent(actor);
  const assignments = await db.assignment.findMany({
    where: { course: { enrollments: { some: { studentId: student?.id } } } },
  });
  return (
    <>
      <PageHeader title="Tareas" />
      <div className="max-w-xl rounded-2xl border border-border bg-card p-5">
        <ActionForm action={submitAssignmentAction} submitLabel="Enviar tarea">
          <Field label="Tarea" htmlFor="assignmentId">
            <Select id="assignmentId" name="assignmentId" required>
              {assignments.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Respuesta" htmlFor="content">
            <Textarea id="content" name="content" required />
          </Field>
        </ActionForm>
      </div>
    </>
  );
}
