import {
  SESSION_COOKIE,
  SESSION_COOKIE_CHIPS,
  SESSION_COOKIE_JS,
  SESSION_HANDOFF_PARAM,
} from "@/lib/constants";

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

export function browserIsHttps(request?: Request) {
  if (!request) {
    return process.env.APP_URL?.startsWith("https://") ?? false;
  }
  const forwarded = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const forwardedHeader = request.headers.get("forwarded")?.toLowerCase() ?? "";
  const origin = request.headers.get("origin") ?? "";
  const referer = request.headers.get("referer") ?? "";
  let urlHttps = false;
  try {
    urlHttps = new URL(request.url).protocol === "https:";
  } catch {
    urlHttps = false;
  }
  return (
    forwarded === "https" ||
    urlHttps ||
    origin.startsWith("https://") ||
    referer.startsWith("https://") ||
    forwardedHeader.includes("proto=https")
  );
}

export function isEmbeddedPreview(request?: Request) {
  if (!request) return false;
  const dest = request.headers.get("sec-fetch-dest");
  const site = request.headers.get("sec-fetch-site");
  const forwardedHost = request.headers.get("x-forwarded-host");
  return dest === "iframe" || dest === "embed" || site === "cross-site" || Boolean(forwardedHost);
}

export function withSessionHandoff(path: string, token: string) {
  const url = new URL(path, "http://local.invalid");
  url.searchParams.set(SESSION_HANDOFF_PARAM, token);
  return `${url.pathname}${url.search}`;
}

export function serializeSessionCookies(token: string, request?: Request) {
  const maxAge = sessionMaxAgeSeconds();
  const https = browserIsHttps(request);
  const encoded = encodeURIComponent(token);

  const lax = [
    `${SESSION_COOKIE}=${encoded}`,
    "Path=/",
    "HttpOnly",
    `Max-Age=${maxAge}`,
    "SameSite=Lax",
    ...(https ? ["Secure"] : []),
  ].join("; ");

  // Always emit a CHIPS cookie. Behind a TLS-terminating preview proxy the Node
  // process often sees http://127.0.0.1, but the browser is on HTTPS and will
  // persist Secure+Partitioned cookies — SameSite=Lax is dropped in iframes.
  const chips = [
    `${SESSION_COOKIE_CHIPS}=${encoded}`,
    "Path=/",
    "HttpOnly",
    `Max-Age=${maxAge}`,
    "SameSite=None",
    "Secure",
    "Partitioned",
  ].join("; ");

  return [lax, chips];
}

export function serializeExpiredSessionCookies() {
  return [
    `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
    `${SESSION_COOKIE_CHIPS}=; Path=/; Max-Age=0; HttpOnly; SameSite=None; Secure; Partitioned`,
    `${SESSION_COOKIE_JS}=; Path=/; Max-Age=0; SameSite=Lax`,
  ];
}

export function attachSessionCookies(headers: Headers, token: string, request?: Request) {
  for (const cookie of serializeSessionCookies(token, request)) {
    headers.append("Set-Cookie", cookie);
  }
}

export function attachExpiredSessionCookies(headers: Headers) {
  for (const cookie of serializeExpiredSessionCookies()) {
    headers.append("Set-Cookie", cookie);
  }
}

export function readSessionToken(input: {
  cookie?: (name: string) => string | undefined;
  header?: (name: string) => string | undefined;
  searchParam?: (name: string) => string | undefined;
}) {
  const fromCookie =
    input.cookie?.(SESSION_COOKIE) ||
    input.cookie?.(SESSION_COOKIE_CHIPS) ||
    input.cookie?.(SESSION_COOKIE_JS);
  if (fromCookie) {
    try {
      return decodeURIComponent(fromCookie);
    } catch {
      return fromCookie;
    }
  }
  const fromQuery = input.searchParam?.(SESSION_HANDOFF_PARAM);
  if (fromQuery) return fromQuery;
  return input.header?.("x-sm-session") ?? null;
}
