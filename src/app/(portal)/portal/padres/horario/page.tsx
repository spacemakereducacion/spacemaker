import { requirePermission } from "@/lib/auth/guards";
import { getLinkedStudents, getPortalStudent } from "@/modules/portal/queries";
import { db } from "@/lib/db";
import { ChildSwitcher } from "@/components/portal/child-switcher";
import { PageHeader } from "@/components/ui/page-header";
import { DAY_LABELS } from "@/lib/constants";

export default async function GuardianSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  const actor = await requirePermission("portal.guardian");
  const { studentId } = await searchParams;
  const [students, student] = await Promise.all([getLinkedStudents(actor), getPortalStudent(actor, studentId)]);
  const schedules = student?.groupId
    ? await db.schedule.findMany({
        where: { groupId: student.groupId },
        include: { subject: true, room: true },
      })
    : [];
  return (
    <>
      <PageHeader title="Horario" />
      <ChildSwitcher students={students} currentId={student?.id} basePath="/portal/padres/horario" />
      <ul className="space-y-2">
        {schedules.map((item) => (
          <li key={item.id} className="rounded-xl border border-border bg-card px-4 py-3">
            {DAY_LABELS[item.dayOfWeek]} {item.startsAt}-{item.endsAt} · {item.subject.name}
          </li>
        ))}
      </ul>
    </>
  );
}
