import Link from "next/link";
import { requirePermission } from "@/lib/auth/guards";
import { listStudents } from "@/modules/academic/queries";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { STUDENT_STATUS_LABELS } from "@/lib/constants";
import type { StudentStatus } from "@prisma/client";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const actor = await requirePermission("students.read");
  const params = await searchParams;
  const rows = await listStudents(actor, {
    q: params.q,
    status: (params.status as StudentStatus) || "ALL",
  });

  return (
    <>
      <PageHeader
        title="Alumnos"
        description="Expedientes digitales, matrícula y estatus académico."
        breadcrumbs={[{ href: "/app", label: "Inicio" }, { label: "Alumnos" }]}
        actions={
          <Link href="/app/control-escolar/alumnos/nuevo">
            <Button>Nuevo alumno</Button>
          </Link>
        }
      />
      <form className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input
          name="q"
          defaultValue={params.q}
          placeholder="Buscar por nombre o matrícula"
          className="h-10 flex-1 rounded-lg border border-border bg-card px-3 text-sm"
        />
        <select name="status" defaultValue={params.status ?? "ALL"} className="h-10 rounded-lg border border-border bg-card px-3 text-sm">
          <option value="ALL">Todos los estatus</option>
          {Object.entries(STUDENT_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline">
          Filtrar
        </Button>
      </form>
      {rows.length === 0 ? (
        <EmptyState title="No hay alumnos" description="Registre un alumno o ajuste los filtros." />
      ) : (
        <div className="rounded-2xl border border-border bg-card">
          <Table>
            <THead>
              <TR>
                <TH>Matrícula</TH>
                <TH>Nombre</TH>
                <TH>Plantel</TH>
                <TH>Programa</TH>
                <TH>Grupo</TH>
                <TH>Estatus</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((row) => (
                <TR key={row.id}>
                  <TD>
                    <Link className="font-medium underline" href={`/app/control-escolar/alumnos/${row.id}`}>
                      {row.enrollmentNumber}
                    </Link>
                  </TD>
                  <TD>
                    {row.firstName} {row.lastName}
                  </TD>
                  <TD>{row.campus.name}</TD>
                  <TD>{row.program?.name ?? "—"}</TD>
                  <TD>{row.group?.name ?? "—"}</TD>
                  <TD>
                    <Badge tone={row.status === "ACTIVE" ? "success" : "warning"}>
                      {STUDENT_STATUS_LABELS[row.status]}
                    </Badge>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      )}
    </>
  );
}
