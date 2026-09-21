import { requirePermission } from "@/lib/auth/guards";
import { getPortalStudent } from "@/modules/portal/queries";
import { PageHeader } from "@/components/ui/page-header";
import { ATTENDANCE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export default async function StudentAttendancePage() {
  const actor = await requirePermission("portal.student");
  const student = await getPortalStudent(actor);
  return (
    <>
      <PageHeader title="Mis asistencias" />
      <ul className="space-y-2">
        {student?.attendances.map((item) => (
          <li key={item.id} className="rounded-xl border border-border bg-card px-4 py-3">
            {formatDate(item.date)} · {item.subject?.name ?? "General"} · {ATTENDANCE_LABELS[item.status]}
          </li>
        ))}
      </ul>
    </>
  );
}
