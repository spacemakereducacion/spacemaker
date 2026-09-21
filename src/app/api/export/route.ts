import { NextResponse } from "next/server";
import { exportReport } from "@/modules/reports/actions";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind") ?? "alumnos";
  const format = (url.searchParams.get("format") ?? "csv") as "csv" | "xlsx" | "pdf";
  if (format === "pdf") {
    return new NextResponse(
      `<html><body><h1>Reporte ${kind}</h1><p>Use imprimir del navegador para guardar PDF.</p><script>window.print()</script></body></html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }
  const result = await exportReport(kind, format === "xlsx" ? "xlsx" : "csv");
  if (format === "xlsx" && "encoding" in result) {
    return new NextResponse(Buffer.from(result.content, "base64"), {
      headers: {
        "Content-Type": result.mime,
        "Content-Disposition": `attachment; filename="${result.filename}"`,
      },
    });
  }
  return new NextResponse(result.content, {
    headers: {
      "Content-Type": result.mime,
      "Content-Disposition": `attachment; filename="${result.filename}"`,
    },
  });
}
