"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loginAction } from "@/modules/auth/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { ErrorBanner } from "@/components/ui/states";
import { defaultHome } from "@/lib/rbac/permissions";
import type { RoleCode } from "@prisma/client";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(
    params.get("error") === "inactive" ? "La cuenta no está activa." : null,
  );
  const [pending, setPending] = useState(false);

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <section className="brand-gradient flex flex-1 flex-col justify-between p-8 text-white lg:max-w-xl">
        <p className="text-xs uppercase tracking-[0.25em] text-amber-200">ERP / SIS educativo</p>
        <div>
          <h1 className="text-4xl font-semibold leading-tight">Space Maker Educación</h1>
          <p className="mt-4 max-w-sm text-sm text-white/80">
            Plataforma institucional para control escolar, finanzas, marketing y e-learning.
          </p>
        </div>
        <p className="text-xs text-white/70">Entorno de demostración. Use únicamente cuentas DEMO.</p>
      </section>
      <section className="flex flex-1 items-center justify-center px-6 py-12">
        <form
          className="w-full max-w-md space-y-5"
          onSubmit={async (event) => {
            event.preventDefault();
            setPending(true);
            setError(null);
            const result = await loginAction(new FormData(event.currentTarget));
            setPending(false);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            const role = (result.data as { role: RoleCode } | undefined)?.role;
            router.push(params.get("next") || defaultHome(role ?? "SUPER_ADMIN"));
            router.refresh();
          }}
        >
          <div>
            <h2 className="text-2xl font-semibold">Iniciar sesión</h2>
            <p className="mt-1 text-sm text-muted-foreground">Ingrese con su correo institucional.</p>
          </div>
          {error ? <ErrorBanner message={error} /> : null}
          <Field label="Correo" htmlFor="email">
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </Field>
          <Field label="Contraseña" htmlFor="password">
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </Field>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Ingresando..." : "Entrar"}
          </Button>
          <p className="text-sm">
            <Link className="underline" href="/recuperar">
              ¿Olvidó su contraseña?
            </Link>
          </p>
          <div className="rounded-xl bg-muted p-3 text-xs text-muted-foreground">
            Cuentas DEMO: admin.demo@spacemaker.local · alumno1.demo@spacemaker.local · padre1.demo@spacemaker.local ·
            Contraseña: Demo.2026!
          </div>
        </form>
      </section>
    </div>
  );
}
