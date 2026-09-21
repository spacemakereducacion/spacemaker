"use client";

import { ErrorBanner } from "@/components/ui/states";
import { Button } from "@/components/ui/button";

export default function AppError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="space-y-4">
      <ErrorBanner message={error.message || "Ocurrió un error inesperado."} />
      <Button onClick={reset}>Reintentar</Button>
    </div>
  );
}
