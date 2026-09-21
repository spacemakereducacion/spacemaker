import { Suspense } from "react";
import { ResetForm } from "@/app/(auth)/restablecer/reset-form";

export default function ResetPage() {
  return (
    <Suspense fallback={<div className="p-8">Cargando…</div>}>
      <ResetForm />
    </Suspense>
  );
}
