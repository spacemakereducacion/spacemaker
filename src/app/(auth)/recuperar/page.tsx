"use client";

import Link from "next/link";
import { ActionForm } from "@/components/forms/action-form";
import { Field, Input } from "@/components/ui/input";
import { forgotPasswordAction } from "@/modules/auth/actions";

export default function ForgotPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="mb-2 text-2xl font-semibold">Recuperar contraseña</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Si el correo existe, se enviará un enlace. En desarrollo el enlace se imprime en la consola del servidor.
      </p>
      <ActionForm action={forgotPasswordAction} submitLabel="Enviar instrucciones">
        <Field label="Correo" htmlFor="email">
          <Input id="email" name="email" type="email" required />
        </Field>
      </ActionForm>
      <Link href="/login" className="mt-4 text-sm underline">
        Volver al inicio de sesión
      </Link>
    </div>
  );
}
