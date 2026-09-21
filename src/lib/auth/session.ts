import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { RoleCode, UserStatus } from "@prisma/client";
import { SESSION_COOKIE } from "@/lib/constants";
import { authSecretBytes, sessionCookieOptions, sessionMaxAgeSeconds } from "@/lib/auth/cookie";

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
  return new SignJWT(user)
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

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function setSessionCookie(user: SessionUser) {
  const token = await signSession(user);
  const store = await cookies();
  const options = sessionCookieOptions();
  store.set(SESSION_COOKIE, token, {
    httpOnly: options.httpOnly,
    path: options.path,
    maxAge: options.maxAge,
    secure: options.secure,
    sameSite: options.sameSite,
    ...(options.partitioned ? { partitioned: true } : {}),
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
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
