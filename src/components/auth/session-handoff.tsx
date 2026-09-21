"use client";

import { useEffect } from "react";
import { SESSION_COOKIE_JS, SESSION_HANDOFF_PARAM } from "@/lib/constants";

const MAX_AGE = 7 * 24 * 60 * 60;

/**
 * Persists a session token that arrived via ?sm= (preview iframes often drop
 * Set-Cookie on 303 redirects) and then strips the token from the URL.
 */
export function SessionHandoff() {
  useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get(SESSION_HANDOFF_PARAM);
    if (!token) return;

    const secure = window.location.protocol === "https:";
    const parts = [`${SESSION_COOKIE_JS}=${encodeURIComponent(token)}`, "Path=/", `Max-Age=${MAX_AGE}`];
    if (secure) {
      parts.push("Secure", "SameSite=None", "Partitioned");
    } else {
      parts.push("SameSite=Lax");
    }
    document.cookie = parts.join("; ");

    url.searchParams.delete(SESSION_HANDOFF_PARAM);
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState({}, "", next);
  }, []);

  return null;
}
