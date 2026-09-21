const DEV_FALLBACK_SECRET = "dev-only-change-me-space-maker-educacion-32b";

export function authSecretBytes() {
  const value = process.env.AUTH_SECRET || (process.env.NODE_ENV === "production" ? "" : DEV_FALLBACK_SECRET);
  if (!value) {
    throw new Error("AUTH_SECRET no está configurado.");
  }
  return new TextEncoder().encode(value);
}

export function sessionMaxAgeSeconds() {
  return Number(process.env.AUTH_SESSION_DAYS ?? 7) * 24 * 60 * 60;
}

export function sessionCookieOptions(request?: Request) {
  const protoHeader = request?.headers.get("x-forwarded-proto");
  const urlHttps = request ? new URL(request.url).protocol === "https:" : false;
  const appHttps = process.env.APP_URL?.startsWith("https://") ?? false;
  const secure = protoHeader === "https" || urlHttps || appHttps;

  const options: {
    httpOnly: true;
    path: string;
    maxAge: number;
    secure: boolean;
    sameSite: "none" | "lax";
    partitioned?: boolean;
  } = {
    httpOnly: true,
    path: "/",
    maxAge: sessionMaxAgeSeconds(),
    secure,
    sameSite: secure ? "none" : "lax",
  };
  if (secure) options.partitioned = true;
  return options;
}
