import { createHash, randomBytes } from "crypto";

export function generateRawToken() {
  return randomBytes(32).toString("hex");
}

export function hashToken(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

export function hoursFromNow(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}
