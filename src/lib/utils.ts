import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fullName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}

export function formatCurrency(value: number | string | { toString(): string }) {
  const amount = typeof value === "number" ? value : Number(value.toString());
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function toNumber(value: number | string | { toString(): string } | null | undefined) {
  if (value == null) return 0;
  return Number(typeof value === "object" ? value.toString() : value);
}

export function initials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function parseSearchParams(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export function safeRedirect(path: string | null | undefined, fallback = "/app") {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return fallback;
  return path;
}
