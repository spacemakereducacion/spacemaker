import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { signSession, toSessionUser } from "@/lib/auth/session";
import { attachSessionCookies, withSessionHandoff } from "@/lib/auth/cookie";
import { writeAudit } from "@/lib/audit";
import { loginLimit } from "@/lib/rate-limit";
import { defaultHome } from "@/lib/rbac/permissions";

function wantsJson(request: Request) {
  const accept = request.headers.get("accept") ?? "";
  const requested = request.headers.get("x-requested-with");
  return accept.includes("application/json") || requested === "fetch";
}

function failRedirect(code: string) {
  return `/login?error=${code}`;
}

function credentialsFrom(url: URL, form?: FormData) {
  const email = String(form?.get("email") ?? url.searchParams.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(form?.get("password") ?? url.searchParams.get("password") ?? "");
  const nextPath = String(form?.get("next") ?? url.searchParams.get("next") ?? "");
  return { email, password, nextPath };
}

async function loginResponse(request: Request, form?: FormData) {
  const json = wantsJson(request);
  const url = new URL(request.url);
  const { email, password, nextPath } = credentialsFrom(url, form);

  const respond = (path: string, init?: { token?: string }) => {
    if (json) {
      const body =
        init?.token != null
          ? { ok: true as const, redirect: path }
          : { ok: false as const, redirect: path, error: path.split("error=")[1] ?? "credentials" };
      const response = NextResponse.json(body, { status: init?.token ? 200 : 401 });
      if (init?.token) attachSessionCookies(response.headers, init.token, request);
      return response;
    }
    const response = new NextResponse(null, {
      status: 303,
      headers: { Location: path },
    });
    if (init?.token) attachSessionCookies(response.headers, init.token, request);
    return response;
  };

  if (!email || !password) {
    return respond(failRedirect("missing"));
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limited = loginLimit(ip, email);
  if (!limited.ok) {
    return respond(failRedirect("rate"));
  }

  const user = await db.user.findUnique({ where: { email } });
  const valid = user ? await verifyPassword(password, user.passwordHash) : false;
  if (!user || !valid) {
    return respond(failRedirect("credentials"));
  }
  if (user.status === "SUSPENDED" || user.status === "INACTIVE") {
    return respond(failRedirect("inactive"));
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

  const home = nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : defaultHome(user.role);
  const token = await signSession(toSessionUser(user));
  return respond(withSessionHandoff(home, token), { token });
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    return await loginResponse(request, form);
  } catch (error) {
    console.error("login failed", error);
    if (wantsJson(request)) {
      return NextResponse.json({ ok: false, redirect: "/login?error=server", error: "server" }, { status: 500 });
    }
    return new NextResponse(null, {
      status: 303,
      headers: { Location: "/login?error=server" },
    });
  }
}

/** Demo / preview fallback when a client submits the form as GET. */
export async function GET(request: Request) {
  if (process.env.DEMO_LOGIN !== "true") {
    return new NextResponse(null, { status: 303, headers: { Location: "/login" } });
  }
  try {
    return await loginResponse(request);
  } catch (error) {
    console.error("login failed", error);
    return new NextResponse(null, {
      status: 303,
      headers: { Location: "/login?error=server" },
    });
  }
}
