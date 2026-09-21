import { requirePermission } from "@/lib/auth/guards";
import { getPortalStudent } from "@/modules/portal/queries";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";

export default async function StudentSubjectsPage() {
  const actor = await requirePermission("portal.student");
  const student = await getPortalStudent(actor);
  const subjects = student?.groupId
    ? await db.schedule.findMany({
        where: { groupId: student.groupId },
        include: { subject: true, teacher: { include: { user: true } } },
      })
    : [];
  const unique = new Map(subjects.map((item) => [item.subjectId, item]));
  return (
    <>
      <PageHeader title="Mis materias" />
      <ul className="space-y-2">
        {[...unique.values()].map((item) => (
          <li key={item.id} className="rounded-xl border border-border bg-card px-4 py-3">
            {item.subject.name} · {item.teacher.user.firstName} {item.teacher.user.lastName}
          </li>
        ))}
      </ul>
    </>
  );
}
