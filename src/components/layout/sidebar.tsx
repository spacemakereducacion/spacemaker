"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { staffNav, studentNav, guardianNav } from "@/lib/nav";
import { roleHasPermission, type Permission } from "@/lib/rbac/permissions";
import type { RoleCode } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Sidebar({
  role,
  variant,
}: {
  role: RoleCode;
  variant: "staff" | "student" | "guardian";
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const items =
    variant === "staff"
      ? staffNav.flatMap((section) =>
          section.items
            .filter((item) => !item.permission || roleHasPermission(role, item.permission as Permission))
            .map((item) => ({ ...item, section: section.title })),
        )
      : variant === "student"
        ? studentNav.map((item) => ({ ...item, section: "Portal" }))
        : guardianNav.map((item) => ({ ...item, section: "Portal" }));

  const sections = [...new Set(items.map((item) => item.section))];

  const nav = (
    <nav aria-label="Principal" className="space-y-6">
      {sections.map((section) => (
        <div key={section}>
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
            {section}
          </p>
          <ul className="space-y-1">
            {items
              .filter((item) => item.section === section)
              .map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "block rounded-lg px-3 py-2 text-sm text-sidebar-foreground/85 hover:bg-white/10",
                        active && "bg-white/15 font-medium text-white",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-sidebar px-4 py-3 lg:hidden">
        <span className="text-sm font-semibold text-white">Space Maker</span>
        <Button variant="ghost" size="icon" aria-label={open ? "Cerrar menú" : "Abrir menú"} onClick={() => setOpen((v) => !v)}>
          {open ? <X className="text-white" /> : <Menu className="text-white" />}
        </Button>
      </div>
      {open ? (
        <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />
      ) : null}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-72 overflow-y-auto bg-sidebar p-5 text-sidebar-foreground transition lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="mb-8 hidden lg:block">
          <p className="text-xs uppercase tracking-[0.2em] text-accent">ERP / SIS</p>
          <h1 className="mt-1 text-lg font-semibold leading-tight text-white">Space Maker Educación</h1>
        </div>
        {nav}
      </aside>
    </>
  );
}
