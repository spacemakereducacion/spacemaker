"use client";

import { useState } from "react";
import type { ActionResult } from "@/lib/action-result";
import { ErrorBanner } from "@/components/ui/states";
import { Button } from "@/components/ui/button";

export function ActionForm({
  action,
  children,
  submitLabel = "Guardar",
  onSuccess,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
  submitLabel?: string;
  onSuccess?: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError(null);
        setMessage(null);
        const result = await action(new FormData(event.currentTarget));
        setPending(false);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setMessage(result.message ?? "Cambios guardados.");
        onSuccess?.();
        event.currentTarget.reset();
      }}
    >
      {error ? <ErrorBanner message={error} /> : null}
      {message ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p> : null}
      {children}
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando..." : submitLabel}
      </Button>
    </form>
  );
}
