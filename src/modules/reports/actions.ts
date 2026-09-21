"use server";

import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { toCsv, toExcel } from "@/lib/export";
import { writeAudit } from "@/lib/audit";
import { toNumber } from "@/lib/utils";

export async function exportReport(kind: string, format: "csv" | "xlsx") {
  const actor = await requirePermission("reports.read");
  let rows: Record<string, string | number | null>[] = [];
  const sheet = kind;

  if (kind === "alumnos") {
    const data = await db.student.findMany({
      where: { institutionId: actor.institutionId },
      include: { campus: true, program: true, group: true },
    });
    rows = data.map((item) => ({
      matricula: item.enrollmentNumber,
      nombre: `${item.firstName} ${item.lastName}`,
      estatus: item.status,
      plantel: item.campus.name,
      programa: item.program?.name ?? "",
      grupo: item.group?.name ?? "",
    }));
  } else if (kind === "pagos") {
    const data = await db.payment.findMany({
      where: { student: { institutionId: actor.institutionId } },
      include: { student: true, method: true },
    });
    rows = data.map((item) => ({
      folio: item.folio,
      alumno: `${item.student.firstName} ${item.student.lastName}`,
      monto: toNumber(item.amount),
      metodo: item.method.name,
      fecha: item.paidAt.toISOString(),
    }));
  } else if (kind === "asistencias") {
    const data = await db.attendance.findMany({
      where: { student: { institutionId: actor.institutionId } },
      include: { student: true, group: true },
      take: 2000,
    });
    rows = data.map((item) => ({
      alumno: `${item.student.firstName} ${item.student.lastName}`,
      grupo: item.group.name,
      fecha: item.date.toISOString().slice(0, 10),
      estatus: item.status,
    }));
  } else if (kind === "prospectos") {
    const data = await db.prospect.findMany({ where: { institutionId: actor.institutionId } });
    rows = data.map((item) => ({
      nombre: `${item.firstName} ${item.lastName}`,
      etapa: item.stage,
      fuente: item.source,
      email: item.email,
    }));
  } else if (kind === "calificaciones") {
    const data = await db.grade.findMany({
      where: { student: { institutionId: actor.institutionId } },
      include: { student: true, subject: true },
    });
    rows = data.map((item) => ({
      alumno: `${item.student.firstName} ${item.student.lastName}`,
      materia: item.subject.name,
      calificacion: toNumber(item.score),
      tipo: item.type,
    }));
  }

  await writeAudit({
    actor,
    action: "DOCUMENT_DOWNLOAD",
    module: "reports",
    entity: "report",
    metadata: { kind, format },
  });

  if (format === "csv") {
    const csv = await toCsv(rows);
    return { filename: `${sheet}.csv`, mime: "text/csv", content: csv };
  }
  const xlsx = await toExcel({ sheet, rows });
  return {
    filename: `${sheet}.xlsx`,
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    content: xlsx.toString("base64"),
    encoding: "base64" as const,
  };
}
