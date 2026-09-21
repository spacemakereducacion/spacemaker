import { verifyEmailAction } from "@/modules/auth/actions";
import Link from "next/link";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const result = token ? await verifyEmailAction(token) : null;
  const success = result?.ok === true;
  const text = success ? (result.message ?? "Correo verificado.") : (result?.error ?? "Falta el token.");
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold">{success ? "Correo verificado" : "No se pudo verificar"}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
      <Link href="/login" className="mt-6 underline">
        Ir a iniciar sesión
      </Link>
    </div>
  );
}
