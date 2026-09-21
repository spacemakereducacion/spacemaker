"use client";

import { useSearchParams } from "next/navigation";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/ui/states";

const ERRORS: Record<string, string> = {
  credentials: "Correo o contraseña incorrectos.",
  inactive: "La cuenta no está activa.",
  missing: "Ingrese correo y contraseña.",
  rate: "Demasiados intentos. Espere un momento.",
};

const DEMO_ACCOUNTS = [
  { email: "admin.demo@spacemaker.local", label: "Administrador", password: "Demo.2026!" },
  { email: "alumno1.demo@spacemaker.local", label: "Alumno", password: "Demo.2026!" },
  { email: "padre1.demo@spacemaker.local", label: "Padre / tutor", password: "Demo.2026!" },
  { email: "docente.ana.demo@spacemaker.local", label: "Docente", password: "Demo.2026!" },
  { email: "caja.demo@spacemaker.local", label: "Caja", password: "Demo.2026!" },
];

export function LoginForm() {
  const params = useSearchParams();
  const error = ERRORS[params.get("error") ?? ""] ?? null;
  const next = params.get("next") ?? "";

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
        <div className="w-full max-w-md space-y-5">
          <div>
            <h2 className="text-2xl font-semibold">Iniciar sesión</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Use un acceso DEMO o escriba el correo. Contraseña: <strong>Demo.2026!</strong>
            </p>
          </div>
          {error ? <ErrorBanner message={error} /> : null}

          <div className="grid gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <form key={account.email} method="post" action="/api/auth/login">
                <input type="hidden" name="email" value={account.email} />
                <input type="hidden" name="password" value={account.password} />
                {next ? <input type="hidden" name="next" value={next} /> : null}
                <Button type="submit" variant="outline" className="w-full justify-start">
                  Entrar como {account.label}
                </Button>
              </form>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground">o con correo y contraseña</p>

          <form method="post" action="/api/auth/login" className="space-y-4">
            {next ? <input type="hidden" name="next" value={next} /> : null}
            <Field label="Correo" htmlFor="email">
              <Input
                id="email"
                name="email"
                type="text"
                inputMode="email"
                autoComplete="username"
                defaultValue="admin.demo@spacemaker.local"
                required
              />
            </Field>
            <Field label="Contraseña" htmlFor="password">
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                defaultValue="Demo.2026!"
                required
              />
            </Field>
            <Button type="submit" className="w-full">
              Entrar
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
