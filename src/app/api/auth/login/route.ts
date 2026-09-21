import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { signSession, toSessionUser } from "@/lib/auth/session";
import { sessionCookieOptions } from "@/lib/auth/cookie";
import { writeAudit } from "@/lib/audit";
import { loginLimit } from "@/lib/rate-limit";
import { defaultHome } from "@/lib/rbac/permissions";
import { SESSION_COOKIE } from "@/lib/constants";

function redirectTo(path: string) {
  return new NextResponse(null, {
    status: 303,
    headers: { Location: path },
  });
}

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const nextPath = String(form.get("next") ?? "");

  if (!email || !password) {
    return redirectTo(`/login?error=missing`);
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limited = loginLimit(ip, email);
  if (!limited.ok) {
    return redirectTo(`/login?error=rate`);
  }

  const user = await db.user.findUnique({ where: { email } });
  const valid = user ? await verifyPassword(password, user.passwordHash) : false;
  if (!user || !valid) {
    return redirectTo(`/login?error=credentials`);
  }
  if (user.status === "SUSPENDED" || user.status === "INACTIVE") {
    return redirectTo(`/login?error=inactive`);
  }

  await db.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  await writeAudit({
    actor: toSessionUser(user),
    action: "LOGIN",
    module: "auth",
    entity: "user",
    entityId: user.id,
    ip,
  });

  const destination =
    nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : defaultHome(user.role);
  // Relative Location keeps the public preview host (avoids 0.0.0.0 / internal URLs).
  const response = new NextResponse(null, {
    status: 303,
    headers: { Location: destination },
  });
  response.cookies.set(SESSION_COOKIE, await signSession(toSessionUser(user)), sessionCookieOptions(request));
  return response;
}
