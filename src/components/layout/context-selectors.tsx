"use client";

import { useTransition } from "react";
import { setContextAction } from "@/modules/settings/context-actions";

export function ContextSelectors({
  campuses,
  years,
  currentCampusId,
}: {
  campuses: { id: string; name: string }[];
  years: { id: string; name: string }[];
  currentCampusId: string | null;
}) {
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      <label className="sr-only" htmlFor="campus-select">
        Plantel
      </label>
      <select
        id="campus-select"
        defaultValue={currentCampusId ?? ""}
        disabled={pending}
        className="h-10 max-w-40 rounded-lg border border-border bg-card px-2 text-xs"
        onChange={(event) => start(() => setContextAction("campusId", event.target.value))}
      >
        <option value="">Todos los planteles</option>
        {campuses.map((campus) => (
          <option key={campus.id} value={campus.id}>
            {campus.name}
          </option>
        ))}
      </select>
      <label className="sr-only" htmlFor="year-select">
        Ciclo escolar
      </label>
      <select
        id="year-select"
        disabled={pending}
        className="h-10 max-w-44 rounded-lg border border-border bg-card px-2 text-xs"
        onChange={(event) => start(() => setContextAction("schoolYearId", event.target.value))}
      >
        {years.map((year) => (
          <option key={year.id} value={year.id}>
            {year.name}
          </option>
        ))}
      </select>
    </div>
  );
}
