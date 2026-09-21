import { describe, expect, it } from "vitest";
import {
  browserIsHttps,
  isEmbeddedPreview,
  readSessionToken,
  serializeSessionCookies,
  withSessionHandoff,
} from "@/lib/auth/cookie";

function requestFrom(headers: Record<string, string>, url = "http://127.0.0.1:3000/api/auth/login") {
  return new Request(url, { headers });
}

describe("session cookies", () => {
  it("emite cookie Lax y cookie CHIPS Partitioned", () => {
    const [lax, chips] = serializeSessionCookies("token.jwt", requestFrom({}));
    expect(lax).toContain("sm_session=token.jwt");
    expect(lax).toContain("SameSite=Lax");
    expect(lax).not.toContain("Secure");
    expect(chips).toContain("sm_session_ch=token.jwt");
    expect(chips).toContain("SameSite=None");
    expect(chips).toContain("Secure");
    expect(chips).toContain("Partitioned");
  });

  it("marca Lax como Secure detrás de un proxy HTTPS", () => {
    const [lax] = serializeSessionCookies(
      "abc",
      requestFrom({ "x-forwarded-proto": "https", "x-forwarded-host": "preview.example" }),
    );
    expect(lax).toContain("Secure");
  });

  it("detecta HTTPS por Origin aunque request.url sea http", () => {
    expect(browserIsHttps(requestFrom({ origin: "https://preview.example" }))).toBe(true);
    expect(isEmbeddedPreview(requestFrom({ "sec-fetch-dest": "iframe" }))).toBe(true);
  });

  it("añade el token de handoff a la ruta relativa", () => {
    expect(withSessionHandoff("/app", "jwt.value")).toBe("/app?sm=jwt.value");
    expect(withSessionHandoff("/portal/alumno?x=1", "jwt.value")).toBe("/portal/alumno?x=1&sm=jwt.value");
  });

  it("lee el token desde cookie CHIPS o query", () => {
    expect(
      readSessionToken({
        cookie: (name) => (name === "sm_session_ch" ? "from-chips" : undefined),
      }),
    ).toBe("from-chips");
    expect(
      readSessionToken({
        searchParam: (name) => (name === "sm" ? "from-query" : undefined),
      }),
    ).toBe("from-query");
  });
});
