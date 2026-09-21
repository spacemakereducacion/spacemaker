import { requirePermission } from "@/lib/auth/guards";
import { getPortalStudent } from "@/modules/portal/queries";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { DAY_LABELS } from "@/lib/constants";

export default async function StudentSchedulePage() {
  const actor = await requirePermission("portal.student");
  const student = await getPortalStudent(actor);
  const schedules = student?.groupId
    ? await db.schedule.findMany({
        where: { groupId: student.groupId },
        include: { subject: true, room: true },
        orderBy: [{ dayOfWeek: "asc" }, { startsAt: "asc" }],
      })
    : [];
  return (
    <>
      <PageHeader title="Mi horario" />
      <ul className="space-y-2">
        {schedules.map((item) => (
          <li key={item.id} className="rounded-xl border border-border bg-card px-4 py-3">
            {DAY_LABELS[item.dayOfWeek]} {item.startsAt}-{item.endsAt} · {item.subject.name} · {item.room.name}
          </li>
        ))}
      </ul>
    </>
  );
}
