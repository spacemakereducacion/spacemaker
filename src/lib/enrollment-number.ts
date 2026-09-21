import { db } from "@/lib/db";

function pad(value: number, size = 5) {
  return String(value).padStart(size, "0");
}

export function formatEnrollmentNumber(params: {
  format: string;
  prefix: string;
  year: number;
  seq: number;
  campusCode?: string | null;
}) {
  return params.format
    .replaceAll("{prefix}", params.prefix)
    .replaceAll("{year}", String(params.year))
    .replaceAll("{seq}", pad(params.seq))
    .replaceAll("{campus}", params.campusCode ?? "");
}

export async function nextEnrollmentNumber(params: {
  institutionId: string;
  campusId?: string | null;
  campusCode?: string | null;
  year?: number;
}) {
  const institution = await db.institution.findUniqueOrThrow({
    where: { id: params.institutionId },
  });
  const year = params.year ?? new Date().getFullYear();
  const prefix = institution.enrollmentPrefix;
  const format = institution.enrollmentFormat;

  const counter = await db.sequenceCounter.upsert({
    where: {
      institutionId_campusId_key_year: {
        institutionId: params.institutionId,
        campusId: params.campusId ?? "",
        key: "enrollment",
        year,
      },
    },
    update: { currentValue: { increment: 1 } },
    create: {
      institutionId: params.institutionId,
      campusId: params.campusId ?? "",
      key: "enrollment",
      year,
      prefix,
      currentValue: 1,
    },
  });

  return formatEnrollmentNumber({
    format,
    prefix,
    year,
    seq: counter.currentValue,
    campusCode: params.campusCode,
  });
}

export async function nextFolio(params: { institutionId: string; key: "receipt" | "invoice" }) {
  const year = new Date().getFullYear();
  const prefix = params.key === "invoice" ? "FAC" : "REC";
  const counter = await db.sequenceCounter.upsert({
    where: {
      institutionId_campusId_key_year: {
        institutionId: params.institutionId,
        campusId: "",
        key: params.key,
        year,
      },
    },
    update: { currentValue: { increment: 1 } },
    create: {
      institutionId: params.institutionId,
      campusId: "",
      key: params.key,
      year,
      prefix,
      currentValue: 1,
    },
  });
  return `${prefix}-${year}-${pad(counter.currentValue)}`;
}
