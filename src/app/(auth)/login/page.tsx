import { Suspense } from "react";
import { LoginForm } from "@/app/(auth)/login/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";
  const password = typeof params.password === "string" ? params.password : "";
  const next = typeof params.next === "string" ? params.next : "";
  const shouldAutoLogin = process.env.DEMO_LOGIN === "true" && Boolean(email && password);

  return (
    <Suspense fallback={<div className="p-8">Cargando…</div>}>
      {shouldAutoLogin ? (
        <form method="post" action="/api/auth/login" className="flex min-h-screen items-center justify-center">
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="password" value={password} />
          {next ? <input type="hidden" name="next" value={next} /> : null}
          <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">
            Entrando…
          </button>
          <script dangerouslySetInnerHTML={{ __html: "document.currentScript.parentElement.submit()" }} />
        </form>
      ) : (
        <LoginForm />
      )}
    </Suspense>
  );
}
