import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getStorage } from "@/lib/storage";
import { writeAudit } from "@/lib/audit";
import { db } from "@/lib/db";
import { roleHasPermission } from "@/lib/rbac/permissions";

export async function GET(_request: Request, context: { params: Promise<{ key: string[] }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { key } = await context.params;
  const storageKey = key.join("/");
  const document = await db.document.findFirst({ where: { storageKey } });
  if (document) {
    if (!roleHasPermission(session.role, "documents.read")) {
      if (session.role === "STUDENT") {
        const student = await db.student.findFirst({ where: { userId: session.id, id: document.studentId ?? "" } });
        if (!student) return NextResponse.json({ error: "Prohibido" }, { status: 403 });
      } else if (session.role === "GUARDIAN") {
        const link = await db.studentGuardian.findFirst({
          where: { studentId: document.studentId ?? "", guardian: { userId: session.id } },
        });
        if (!link) return NextResponse.json({ error: "Prohibido" }, { status: 403 });
      } else {
        return NextResponse.json({ error: "Prohibido" }, { status: 403 });
      }
    }
    await writeAudit({
      actor: session,
      action: "DOCUMENT_DOWNLOAD",
      module: "documents",
      entity: "document",
      entityId: document.id,
    });
  }
  try {
    const file = await getStorage().get(storageKey);
    return new NextResponse(new Uint8Array(file), {
      headers: { "Content-Type": document?.mimeType ?? "application/octet-stream" },
    });
  } catch {
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  }
}
