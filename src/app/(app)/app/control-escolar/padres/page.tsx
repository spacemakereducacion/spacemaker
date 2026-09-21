import Link from "next/link";
import { requirePermission } from "@/lib/auth/guards";
import { listGuardians, listStudents } from "@/modules/academic/queries";
import { createGuardianAction, linkGuardianAction } from "@/modules/academic/actions";
import { PageHeader } from "@/components/ui/page-header";
import { ActionForm } from "@/components/forms/action-form";
import { Field, Input, Select } from "@/components/ui/input";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function GuardiansPage() {
  const actor = await requirePermission("guardians.read");
  const [rows, students] = await Promise.all([listGuardians(actor), listStudents(actor, {})]);
  return (
    <>
      <PageHeader title="Padres y tutores" breadcrumbs={[{ href: "/app", label: "Inicio" }, { label: "Padres" }]} />
      <div className="mb-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Registrar tutor</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionForm action={createGuardianAction}>
              <Field label="Nombre" htmlFor="firstName">
                <Input id="firstName" name="firstName" required />
              </Field>
              <Field label="Apellidos" htmlFor="lastName">
                <Input id="lastName" name="lastName" required />
              </Field>
              <Field label="Correo" htmlFor="email">
                <Input id="email" name="email" type="email" required />
              </Field>
              <Field label="Alumno" htmlFor="studentId">
                <Select id="studentId" name="studentId">
                  <option value="">Sin relacionar todavía</option>
                  {students.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.firstName} {item.lastName}
                    </option>
                  ))}
                </Select>
              </Field>
            </ActionForm>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Relacionar tutor existente</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionForm action={linkGuardianAction} submitLabel="Relacionar">
              <Field label="Tutor" htmlFor="guardianId">
                <Select id="guardianId" name="guardianId" required>
                  {rows.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.firstName} {item.lastName}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Alumno" htmlFor="studentId2">
                <Select id="studentId2" name="studentId" required>
                  {students.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.firstName} {item.lastName}
                    </option>
                  ))}
                </Select>
              </Field>
            </ActionForm>
          </CardContent>
        </Card>
      </div>
      <div className="rounded-2xl border border-border bg-card">
        <Table>
          <THead>
            <TR>
              <TH>Tutor</TH>
              <TH>Correo</TH>
              <TH>Alumnos</TH>
            </TR>
          </THead>
          <TBody>
            {rows.map((row) => (
              <TR key={row.id}>
                <TD>
                  <Link className="underline" href={`/app/control-escolar/padres/${row.id}`}>
                    {row.firstName} {row.lastName}
                  </Link>
                </TD>
                <TD>{row.email}</TD>
                <TD>{row.students.map((link) => `${link.student.firstName} ${link.student.lastName}`).join(", ") || "—"}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </>
  );
}
