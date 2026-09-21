"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { searchGlobal } from "@/modules/search/actions";

type Result = {
  category: string;
  id: string;
  title: string;
  subtitle?: string;
  href: string;
};

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handle = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }
      const data = await searchGlobal(query);
      if (data.ok) setResults(data.data ?? []);
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  const grouped = results.reduce<Record<string, Result[]>>((acc, item) => {
    acc[item.category] = acc[item.category] ?? [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="relative w-full max-w-xl">
      <label htmlFor="global-search" className="sr-only">
        Búsqueda global
      </label>
      <input
        id="global-search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Buscar alumno, matrícula, padre, docente, grupo..."
        className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
      />
      {open && query.trim().length >= 2 ? (
        <div className="absolute z-20 mt-1 max-h-80 w-full overflow-auto rounded-xl border border-border bg-card p-2 shadow-lg">
          {results.length === 0 ? (
            <p className="px-2 py-3 text-sm text-muted-foreground">Sin resultados</p>
          ) : (
            Object.entries(grouped).map(([category, items]) => (
              <div key={category} className="mb-2">
                <p className="px-2 py-1 text-[11px] font-semibold uppercase text-muted-foreground">{category}</p>
                {items.map((item) => (
                  <Link
                    key={`${item.category}-${item.id}`}
                    href={item.href}
                    className="block rounded-lg px-2 py-2 hover:bg-muted"
                    onClick={() => setOpen(false)}
                  >
                    <p className="text-sm font-medium">{item.title}</p>
                    {item.subtitle ? <p className="text-xs text-muted-foreground">{item.subtitle}</p> : null}
                  </Link>
                ))}
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
