import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { logoutAction } from "@/modules/auth/actions";
import { Button } from "@/components/ui/button";
import type { SessionUser } from "@/lib/auth/session";
import { ROLE_LABELS } from "@/lib/constants";
import { fullName, initials } from "@/lib/utils";
import { GlobalSearch } from "@/components/layout/global-search";
import { ContextSelectors } from "@/components/layout/context-selectors";

export function Topbar({
  user,
  unread,
  campuses,
  years,
}: {
  user: SessionUser;
  unread: number;
  campuses: { id: string; name: string }[];
  years: { id: string; name: string }[];
}) {
  return (
    <header className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur md:flex-row md:items-center md:justify-between">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Search className="hidden h-4 w-4 text-muted-foreground md:block" aria-hidden />
        <GlobalSearch />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ContextSelectors campuses={campuses} years={years} currentCampusId={user.campusId} />
        <Link
          href={user.role === "STUDENT" ? "/portal/alumno/avisos" : user.role === "GUARDIAN" ? "/portal/padres/avisos" : "/app/comunicacion/notificaciones"}
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border"
          aria-label={`Notificaciones${unread ? `, ${unread} sin leer` : ""}`}
        >
          <Bell className="h-4 w-4" />
          {unread > 0 ? (
            <span className="absolute -right-1 -top-1 rounded-full bg-accent px-1.5 text-[10px] font-bold text-accent-foreground">
              {unread}
            </span>
          ) : null}
        </Link>
        <div className="flex items-center gap-2 rounded-xl border border-border px-2 py-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {initials(user.firstName, user.lastName)}
          </div>
          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-medium">{fullName(user.firstName, user.lastName)}</p>
            <p className="text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</p>
          </div>
        </div>
        <form action={logoutAction}>
          <Button variant="outline" size="sm" type="submit">
            Salir
          </Button>
        </form>
      </div>
    </header>
  );
}
