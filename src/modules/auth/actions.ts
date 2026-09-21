"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hashPassword, passwordPolicy, verifyPassword } from "@/lib/auth/password";
import { clearSessionCookie, setSessionCookie, toSessionUser } from "@/lib/auth/session";
import { generateRawToken, hashToken, hoursFromNow } from "@/lib/auth/tokens";
import { writeAudit } from "@/lib/audit";
import { sendSystemEmail } from "@/lib/email";
import { loginLimit } from "@/lib/rate-limit";
import { fail, ok, zodError, type ActionResult } from "@/lib/action-result";
import { forgotSchema, loginSchema, resetSchema } from "@/modules/auth/schemas";

async function clientIp() {
  const list = await headers();
  return list.get("x-forwarded-for")?.split(",")[0]?.trim() ?? list.get("x-real-ip") ?? "unknown";
}

export async function loginAction(formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) return zodError(parsed.error);

  const ip = await clientIp();
  const limited = loginLimit(ip, parsed.data.email);
  if (!limited.ok) {
    return fail("Demasiados intentos. Espere unos minutos e intente de nuevo.");
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  const valid = user ? await verifyPassword(parsed.data.password, user.passwordHash) : false;
  if (!user || !valid) {
    return fail("Correo o contraseña incorrectos.");
  }
  if (user.status === "SUSPENDED" || user.status === "INACTIVE") {
    return fail("La cuenta no está activa. Contacte a control escolar.");
  }

  await db.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  await setSessionCookie(toSessionUser(user));
  await writeAudit({
    actor: toSessionUser(user),
    action: "LOGIN",
    module: "auth",
    entity: "user",
    entityId: user.id,
    ip,
  });
  return ok({ role: user.role });
}

export async function logoutAction() {
  const { getSession } = await import("@/lib/auth/session");
  const session = await getSession();
  if (session) {
    await writeAudit({
      actor: session,
      action: "LOGOUT",
      module: "auth",
      entity: "user",
      entityId: session.id,
    });
  }
  await clearSessionCookie();
  redirect("/login");
}

export async function forgotPasswordAction(formData: FormData): Promise<ActionResult> {
  const parsed = forgotSchema.safeParse({ email: String(formData.get("email") ?? "") });
  if (!parsed.success) return zodError(parsed.error);

  const user = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (user) {
    const raw = generateRawToken();
    await db.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(raw),
        expiresAt: hoursFromNow(2),
      },
    });
    const url = `${process.env.APP_URL ?? "http://localhost:3000"}/restablecer?token=${raw}`;
    await sendSystemEmail({
      to: user.email,
      subject: "Restablecer contraseña — Space Maker Educación",
      html: `<p>Use este enlace para restablecer su contraseña (válido 2 horas):</p><p><a href="${url}">${url}</a></p>`,
      text: url,
    });
  }
  return ok(undefined, "Si el correo existe, enviaremos instrucciones de recuperación.");
}

export async function resetPasswordAction(formData: FormData): Promise<ActionResult> {
  const parsed = resetSchema.safeParse({
    token: String(formData.get("token") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) return zodError(parsed.error);
  const policy = passwordPolicy(parsed.data.password);
  if (policy.length) return fail(policy[0]);

  const token = await db.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(parsed.data.token) },
  });
  if (!token || token.usedAt || token.expiresAt < new Date()) {
    return fail("El enlace de restablecimiento no es válido o expiró.");
  }

  await db.$transaction([
    db.user.update({
      where: { id: token.userId },
      data: { passwordHash: await hashPassword(parsed.data.password) },
    }),
    db.passwordResetToken.update({
      where: { id: token.id },
      data: { usedAt: new Date() },
    }),
  ]);
  return ok(undefined, "Contraseña actualizada. Ya puede iniciar sesión.");
}

export async function verifyEmailAction(token: string): Promise<ActionResult> {
  const record = await db.emailVerificationToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return fail("El enlace de verificación no es válido o expiró.");
  }
  await db.$transaction([
    db.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: new Date(), status: "ACTIVE" },
    }),
    db.emailVerificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);
  return ok(undefined, "Correo verificado.");
}
