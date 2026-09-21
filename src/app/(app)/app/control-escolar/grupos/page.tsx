import Link from "next/link";
import { requirePermission } from "@/lib/auth/guards";
import { academicOptions, listGroups } from "@/modules/academic/queries";
import { createGroupAction } from "@/modules/academic/actions";
import { PageHeader } from "@/components/ui/page-header";
import { ActionForm } from "@/components/forms/action-form";
import { Field, Input, Select } from "@/components/ui/input";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { SHIFT_LABELS } from "@/lib/constants";

export default async function GroupsPage() {
  const actor = await requirePermission("groups.read");
  const [rows, options] = await Promise.all([listGroups(actor), academicOptions(actor)]);
  return (
    <>
      <PageHeader title="Grupos" breadcrumbs={[{ href: "/app", label: "Inicio" }, { label: "Grupos" }]} />
      <div className="mb-6 max-w-2xl rounded-2xl border border-border bg-card p-5">
        <ActionForm action={createGroupAction} submitLabel="Crear grupo">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Nombre" htmlFor="name">
              <Input id="name" name="name" required />
            </Field>
            <Field label="Capacidad" htmlFor="capacity">
              <Input id="capacity" name="capacity" type="number" defaultValue={30} />
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
            <Field label="Programa" htmlFor="programId">
              <Select id="programId" name="programId" required>
                {options.programs.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Ciclo" htmlFor="schoolYearId">
              <Select id="schoolYearId" name="schoolYearId" required>
                {options.years.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Docente titular" htmlFor="titularTeacherId">
              <Select id="titularTeacherId" name="titularTeacherId">
                <option value="">Sin titular</option>
                {options.teachers.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.user.firstName} {item.user.lastName}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </ActionForm>
      </div>
      <div className="rounded-2xl border border-border bg-card">
        <Table>
          <THead>
            <TR>
              <TH>Grupo</TH>
              <TH>Programa</TH>
              <TH>Turno</TH>
              <TH>Inscritos</TH>
            </TR>
          </THead>
          <TBody>
            {rows.map((row) => (
              <TR key={row.id}>
                <TD>
                  <Link className="underline" href={`/app/control-escolar/grupos/${row.id}`}>
                    {row.name}
                  </Link>
                </TD>
                <TD>{row.program.name}</TD>
                <TD>{SHIFT_LABELS[row.shift]}</TD>
                <TD>
                  {row._count.currentStudents}/{row.capacity}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </>
  );
}
