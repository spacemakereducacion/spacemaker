import { requirePermission } from "@/lib/auth/guards";
import { getLinkedStudents, getPortalStudent } from "@/modules/portal/queries";
import { ChildSwitcher } from "@/components/portal/child-switcher";
import { PageHeader } from "@/components/ui/page-header";
import { ATTENDANCE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export default async function GuardianAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  const actor = await requirePermission("portal.guardian");
  const { studentId } = await searchParams;
  const [students, student] = await Promise.all([getLinkedStudents(actor), getPortalStudent(actor, studentId)]);
  return (
    <>
      <PageHeader title="Asistencias" />
      <ChildSwitcher students={students} currentId={student?.id} basePath="/portal/padres/asistencias" />
      <ul className="space-y-2">
        {student?.attendances.map((item) => (
          <li key={item.id} className="rounded-xl border border-border bg-card px-4 py-3">
            {formatDate(item.date)} · {ATTENDANCE_LABELS[item.status]}
          </li>
        ))}
      </ul>
    </>
  );
}
