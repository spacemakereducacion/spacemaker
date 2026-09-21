import { describe, expect, it } from "vitest";
import { roleHasPermission } from "@/lib/rbac/permissions";

describe("RBAC", () => {
  it("impide que un docente vea finanzas o caja", () => {
    expect(roleHasPermission("TEACHER", "finance.read")).toBe(false);
    expect(roleHasPermission("TEACHER", "cash.read")).toBe(false);
    expect(roleHasPermission("TEACHER", "grades.write")).toBe(true);
  });

  it("limita al padre y al alumno a su portal", () => {
    expect(roleHasPermission("GUARDIAN", "students.read")).toBe(false);
    expect(roleHasPermission("GUARDIAN", "portal.guardian")).toBe(true);
    expect(roleHasPermission("STUDENT", "finance.read")).toBe(false);
    expect(roleHasPermission("STUDENT", "portal.student")).toBe(true);
  });

  it("permite al superadministrador todo el backoffice", () => {
    expect(roleHasPermission("SUPER_ADMIN", "audit.read")).toBe(true);
    expect(roleHasPermission("SUPER_ADMIN", "cash.write")).toBe(true);
  });
});
