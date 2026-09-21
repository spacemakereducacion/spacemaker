import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth/guards";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { DemoBanner } from "@/components/ui/states";
import { DEMO_NOTICE } from "@/lib/constants";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireStaff();
  const store = await cookies();
  const campusOverride = store.get("sm_campusId")?.value;
  const [unread, campuses, years] = await Promise.all([
    db.notification.count({ where: { userId: actor.id, readAt: null } }),
    db.campus.findMany({
      where: { institutionId: actor.institutionId, isActive: true },
      select: { id: true, name: true },
    }),
    db.schoolYear.findMany({
      where: { institutionId: actor.institutionId },
      select: { id: true, name: true },
      orderBy: { startsOn: "desc" },
    }),
  ]);

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar role={actor.role} variant="staff" />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          user={{ ...actor, campusId: campusOverride || actor.campusId }}
          unread={unread}
          campuses={campuses}
          years={years}
        />
        <main className="flex-1 px-4 py-6 md:px-8">
          <div className="mb-4">
            <DemoBanner text={DEMO_NOTICE} />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
