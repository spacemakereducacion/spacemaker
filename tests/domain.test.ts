import { describe, expect, it } from "vitest";
import { formatEnrollmentNumber } from "@/lib/enrollment-number";
import { academicSummary } from "@/lib/grades";
import { allocatePayments, applyDiscount, deriveChargeStatus } from "@/lib/finance";
import { findScheduleConflicts } from "@/lib/schedule";
import { passwordPolicy } from "@/lib/auth/password";

describe("matrícula", () => {
  it("formatea SM-2026-00001", () => {
    expect(
      formatEnrollmentNumber({
        format: "{prefix}-{year}-{seq}",
        prefix: "SM",
        year: 2026,
        seq: 1,
      }),
    ).toBe("SM-2026-00001");
  });
});

describe("calificaciones", () => {
  it("calcula promedio, aprobadas y pendientes", () => {
    const summary = academicSummary([
      { subjectId: "a", score: 8, maxScore: 10 },
      { subjectId: "a", score: 6, maxScore: 10 },
      { subjectId: "b", score: 5, maxScore: 10 },
    ]);
    expect(summary.approved).toBe(1);
    expect(summary.pending).toBe(1);
    expect(summary.average).toBe(6.33);
  });
});

describe("finanzas", () => {
  it("asigna pagos a cargos más antiguos", () => {
    const result = allocatePayments(
      [
        { chargeId: "1", remaining: 1000 },
        { chargeId: "2", remaining: 500 },
      ],
      1200,
    );
    expect(result.allocations).toEqual([
      { chargeId: "1", amount: 1000 },
      { chargeId: "2", amount: 200 },
    ]);
  });

  it("aplica descuento porcentual y deriva estatus", () => {
    expect(applyDiscount(4000, "PERCENTAGE", 25)).toBe(1000);
    expect(deriveChargeStatus({ dueDate: new Date("2000-01-01"), remaining: 10, original: "PENDING" })).toBe("OVERDUE");
    expect(deriveChargeStatus({ dueDate: new Date("2099-01-01"), remaining: 0, original: "PENDING" })).toBe("PAID");
  });
});

describe("horarios", () => {
  it("detecta traslape de docente/aula/grupo", () => {
    const hits = findScheduleConflicts(
      { dayOfWeek: 1, startsAt: "08:00", endsAt: "09:00" },
      [{ id: "a", dayOfWeek: 1, startsAt: "08:30", endsAt: "09:30" }],
    );
    expect(hits).toHaveLength(1);
  });
});

describe("contraseñas", () => {
  it("exige política mínima", () => {
    expect(passwordPolicy("123").length).toBeGreaterThan(0);
    expect(passwordPolicy("Demo.2026!").length).toBe(0);
  });
});
