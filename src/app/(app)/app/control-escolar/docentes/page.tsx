import { requirePermission } from "@/lib/auth/guards";
import { academicOptions, listTeachers } from "@/modules/academic/queries";
import { createTeacherAction } from "@/modules/academic/actions";
import { PageHeader } from "@/components/ui/page-header";
import { ActionForm } from "@/components/forms/action-form";
import { Field, Input, Select } from "@/components/ui/input";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TeachersPage() {
  const actor = await requirePermission("teachers.read");
  const [rows, options] = await Promise.all([listTeachers(actor), academicOptions(actor)]);
  return (
    <>
      <PageHeader title="Docentes" breadcrumbs={[{ href: "/app", label: "Inicio" }, { label: "Docentes" }]} />
      <div className="mb-6 max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle>Alta de docente</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionForm action={createTeacherAction}>
              <Field label="Nombre" htmlFor="firstName">
                <Input id="firstName" name="firstName" required />
              </Field>
              <Field label="Apellidos" htmlFor="lastName">
                <Input id="lastName" name="lastName" required />
              </Field>
              <Field label="Correo" htmlFor="email">
                <Input id="email" name="email" type="email" required />
              </Field>
              <Field label="Especialidad" htmlFor="specialty">
                <Input id="specialty" name="specialty" />
              </Field>
              <Field label="Plantel" htmlFor="campusId">
                <Select id="campusId" name="campusId" required>
                  {options.campuses.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
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
              <TH>Nombre</TH>
              <TH>Plantel</TH>
              <TH>Especialidad</TH>
              <TH>Grupos</TH>
            </TR>
          </THead>
          <TBody>
            {rows.map((row) => (
              <TR key={row.id}>
                <TD>
                  {row.user.firstName} {row.user.lastName}
                </TD>
                <TD>{row.campus.name}</TD>
                <TD>{row.specialty ?? "—"}</TD>
                <TD>{row.titularGroups.map((group) => group.name).join(", ") || "—"}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </>
  );
}
