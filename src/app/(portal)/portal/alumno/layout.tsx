import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { DemoBanner } from "@/components/ui/states";
import { DEMO_NOTICE } from "@/lib/constants";

export default async function StudentPortalLayout({ children }: { children: React.ReactNode }) {
  const actor = await requirePermission("portal.student");
  const unread = await db.notification.count({ where: { userId: actor.id, readAt: null } });
  return (
    <div className="min-h-screen lg:flex">
      <Sidebar role={actor.role} variant="student" />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={actor} unread={unread} campuses={[]} years={[]} />
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
