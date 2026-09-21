"use client";

import { useSearchParams } from "next/navigation";
import { ActionForm } from "@/components/forms/action-form";
import { Field, Input } from "@/components/ui/input";
import { resetPasswordAction } from "@/modules/auth/actions";

export function ResetForm() {
  const token = useSearchParams().get("token") ?? "";
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="mb-6 text-2xl font-semibold">Nueva contraseña</h1>
      <ActionForm action={resetPasswordAction} submitLabel="Actualizar contraseña">
        <input type="hidden" name="token" value={token} />
        <Field label="Nueva contraseña" htmlFor="password">
          <Input id="password" name="password" type="password" required minLength={10} />
        </Field>
      </ActionForm>
    </div>
  );
}
