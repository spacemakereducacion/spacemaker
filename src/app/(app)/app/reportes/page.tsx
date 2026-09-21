import { requirePermission } from "@/lib/auth/guards";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const reports = [
  { kind: "alumnos", title: "Alumnos" },
  { kind: "calificaciones", title: "Calificaciones" },
  { kind: "asistencias", title: "Asistencias" },
  { kind: "pagos", title: "Pagos" },
  { kind: "prospectos", title: "Prospectos" },
];

export default async function ReportsPage() {
  await requirePermission("reports.read");
  return (
    <>
      <PageHeader
        title="Reportes"
        description="Las exportaciones se generan en el servidor a partir de la base de datos."
        breadcrumbs={[{ href: "/app", label: "Inicio" }, { label: "Reportes" }]}
      />
      <div className="grid gap-4 md:grid-cols-2">
        {reports.map((report) => (
          <Card key={report.kind}>
            <CardHeader>
              <CardTitle>{report.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-3">
              <a className="underline" href={`/api/export?kind=${report.kind}&format=csv`}>
                CSV
              </a>
              <a className="underline" href={`/api/export?kind=${report.kind}&format=xlsx`}>
                Excel
              </a>
              <a className="underline" href={`/api/export?kind=${report.kind}&format=pdf`}>
                PDF (impresión)
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
