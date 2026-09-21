import { requirePermission } from "@/lib/auth/guards";
import { academicOptions } from "@/modules/academic/queries";
import { createStudentAction } from "@/modules/academic/actions";
import { PageHeader } from "@/components/ui/page-header";
import { ActionForm } from "@/components/forms/action-form";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { STUDENT_STATUS_LABELS, SHIFT_LABELS, SEX_LABELS } from "@/lib/constants";

export default async function NewStudentPage() {
  const actor = await requirePermission("students.write");
  const options = await academicOptions(actor);
  return (
    <>
      <PageHeader
        title="Nuevo alumno"
        breadcrumbs={[
          { href: "/app", label: "Inicio" },
          { href: "/app/control-escolar/alumnos", label: "Alumnos" },
          { label: "Nuevo" },
        ]}
      />
      <div className="max-w-3xl rounded-2xl border border-border bg-card p-6">
        <ActionForm action={createStudentAction} submitLabel="Registrar alumno">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nombre" htmlFor="firstName">
              <Input id="firstName" name="firstName" required />
            </Field>
            <Field label="Apellidos" htmlFor="lastName">
              <Input id="lastName" name="lastName" required />
            </Field>
            <Field label="Correo" htmlFor="email">
              <Input id="email" name="email" type="email" />
            </Field>
            <Field label="Teléfono" htmlFor="phone">
              <Input id="phone" name="phone" />
            </Field>
            <Field label="CURP" htmlFor="curp">
              <Input id="curp" name="curp" />
            </Field>
            <Field label="Fecha de nacimiento" htmlFor="birthDate">
              <Input id="birthDate" name="birthDate" type="date" />
            </Field>
            <Field label="Sexo" htmlFor="sex">
              <Select id="sex" name="sex" defaultValue="UNSPECIFIED">
                {Object.entries(SEX_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
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
              <Select id="programId" name="programId">
                <option value="">Sin programa</option>
                {options.programs.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Grupo" htmlFor="groupId">
              <Select id="groupId" name="groupId">
                <option value="">Sin grupo</option>
                {options.groups.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Ciclo" htmlFor="schoolYearId">
              <Select id="schoolYearId" name="schoolYearId">
                <option value="">Sin ciclo</option>
                {options.years.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Turno" htmlFor="shift">
              <Select id="shift" name="shift">
                {Object.entries(SHIFT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Estatus" htmlFor="status">
              <Select id="status" name="status" defaultValue="APPLICANT">
                {Object.entries(STUDENT_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Dirección" htmlFor="address">
            <Textarea id="address" name="address" />
          </Field>
        </ActionForm>
      </div>
    </>
  );
}
