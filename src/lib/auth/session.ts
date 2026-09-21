import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import type { RoleCode, UserStatus } from "@prisma/client";
import { SESSION_COOKIE, SESSION_COOKIE_CHIPS, SESSION_COOKIE_JS } from "@/lib/constants";
import {
  authSecretBytes,
  browserIsHttps,
  sessionMaxAgeSeconds,
} from "@/lib/auth/cookie";

export type SessionUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: RoleCode;
  institutionId: string;
  campusId: string | null;
  photoUrl: string | null;
  status: UserStatus;
};

function secret() {
  return authSecretBytes();
}

export async function signSession(user: SessionUser) {
  return new SignJWT({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    institutionId: user.institutionId,
    campusId: user.campusId,
    photoUrl: user.photoUrl,
    status: user.status,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${Math.max(1, Math.round(sessionMaxAgeSeconds() / 86400))}d`)
    .setSubject(user.id)
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub || !payload.email || !payload.role) return null;
    return {
      id: String(payload.sub),
      email: String(payload.email),
      firstName: String(payload.firstName ?? ""),
      lastName: String(payload.lastName ?? ""),
      role: payload.role as RoleCode,
      institutionId: String(payload.institutionId),
      campusId: payload.campusId ? String(payload.campusId) : null,
      photoUrl: payload.photoUrl ? String(payload.photoUrl) : null,
      status: (payload.status as UserStatus) ?? "ACTIVE",
    };
  } catch {
    return null;
  }
}

async function tokenFromRequestStore() {
  const store = await cookies();
  const raw =
    store.get(SESSION_COOKIE)?.value ||
    store.get(SESSION_COOKIE_CHIPS)?.value ||
    store.get(SESSION_COOKIE_JS)?.value;
  if (raw) {
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  const list = await headers();
  return list.get("x-sm-session");
}

export async function getSession(): Promise<SessionUser | null> {
  const token = await tokenFromRequestStore();
  if (!token) return null;
  return verifySessionToken(token);
}

async function cookieRequestHint(): Promise<Request | undefined> {
  try {
    const list = await headers();
    const proto = list.get("x-forwarded-proto")?.split(",")[0]?.trim() || "http";
    const host = list.get("x-forwarded-host") || list.get("host") || "localhost";
    return new Request(`${proto}://${host}/`, { headers: list });
  } catch {
    return undefined;
  }
}

export async function setSessionCookie(user: SessionUser) {
  const token = await signSession(user);
  const store = await cookies();
  const maxAge = sessionMaxAgeSeconds();
  const request = await cookieRequestHint();
  const https = browserIsHttps(request);
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    path: "/",
    maxAge,
    secure: https,
    sameSite: "lax",
  });
  store.set(SESSION_COOKIE_CHIPS, token, {
    httpOnly: true,
    path: "/",
    maxAge,
    secure: true,
    sameSite: "none",
    partitioned: true,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", { path: "/", maxAge: 0, httpOnly: true, sameSite: "lax" });
  store.set(SESSION_COOKIE_CHIPS, "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    sameSite: "none",
    secure: true,
    partitioned: true,
  });
  store.set(SESSION_COOKIE_JS, "", { path: "/", maxAge: 0 });
}

export function toSessionUser(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: RoleCode;
  institutionId: string;
  campusId: string | null;
  photoUrl: string | null;
  status: UserStatus;
}): SessionUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    institutionId: user.institutionId,
    campusId: user.campusId,
    photoUrl: user.photoUrl,
    status: user.status,
  };
}
