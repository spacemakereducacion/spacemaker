import { requirePermission } from "@/lib/auth/guards";
import { markNotificationReadAction } from "@/modules/communication/actions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";

export default async function NotificationsPage() {
  const actor = await requirePermission("communication.read");
  const items = await db.notification.findMany({
    where: { userId: actor.id },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
  return (
    <>
      <PageHeader title="Notificaciones" breadcrumbs={[{ href: "/app", label: "Inicio" }, { label: "Notificaciones" }]} />
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
            <div>
              <p className="font-medium">{item.title}</p>
              <p className="text-sm text-muted-foreground">
                {item.body} · {formatDateTime(item.createdAt)}
              </p>
            </div>
            {!item.readAt ? (
              <form
                action={async () => {
                  "use server";
                  await markNotificationReadAction(item.id);
                }}
              >
                <Button size="sm" variant="outline" type="submit">
                  Marcar leída
                </Button>
              </form>
            ) : null}
          </li>
        ))}
      </ul>
    </>
  );
}
