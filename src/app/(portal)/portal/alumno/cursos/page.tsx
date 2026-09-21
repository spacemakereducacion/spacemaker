import { requirePermission } from "@/lib/auth/guards";
import { getPortalStudent } from "@/modules/portal/queries";
import { submitExamAction } from "@/modules/elearning/actions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { ActionForm } from "@/components/forms/action-form";

export default async function StudentCoursesPage() {
  const actor = await requirePermission("portal.student");
  const student = await getPortalStudent(actor);
  const exams = await db.exam.findMany({
    where: { isPublished: true, course: { enrollments: { some: { studentId: student?.id } } } },
    include: { questions: { include: { options: true } } },
  });
  return (
    <>
      <PageHeader title="Mis cursos" />
      <ul className="mb-8 space-y-3">
        {student?.courseEnrollments.map((item) => (
          <li key={item.id} className="rounded-2xl border border-border bg-card p-4">
            <p className="font-medium">{item.course.title}</p>
            {item.course.modules.map((module) => (
              <p key={module.id} className="text-sm text-muted-foreground">
                {module.title} · {module.lessons.length} lecciones
              </p>
            ))}
          </li>
        ))}
      </ul>
      {exams.map((exam) => (
        <div key={exam.id} className="mb-6 rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 font-semibold">{exam.title}</h2>
          <ActionForm
            action={async (formData) => {
              "use server";
              return submitExamAction(exam.id, formData);
            }}
            submitLabel="Enviar examen"
          >
            {exam.questions.map((question) => (
              <fieldset key={question.id} className="mb-3">
                <legend className="mb-1 text-sm font-medium">{question.prompt}</legend>
                {question.options.map((option) => (
                  <label key={option.id} className="flex items-center gap-2 text-sm">
                    <input type="radio" name={`q_${question.id}`} value={option.id} />
                    {option.label}
                  </label>
                ))}
              </fieldset>
            ))}
          </ActionForm>
        </div>
      ))}
    </>
  );
}
