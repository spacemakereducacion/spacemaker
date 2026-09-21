import { requirePermission } from "@/lib/auth/guards";
import { createCampusAction, updateInstitutionAction } from "@/modules/settings/actions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { ActionForm } from "@/components/forms/action-form";
import { Field, Input, Select } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  const actor = await requirePermission("settings.read");
  const [institution, campuses, years] = await Promise.all([
    db.institution.findUniqueOrThrow({ where: { id: actor.institutionId } }),
    db.campus.findMany({ where: { institutionId: actor.institutionId } }),
    db.schoolYear.findMany({ where: { institutionId: actor.institutionId } }),
  ]);
  return (
    <>
      <PageHeader title="Configuración institucional" breadcrumbs={[{ href: "/app", label: "Inicio" }, { label: "Configuración" }]} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Institución</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionForm action={updateInstitutionAction}>
              <Field label="Nombre" htmlFor="name">
                <Input id="name" name="name" defaultValue={institution.name} />
              </Field>
              <Field label="Razón social" htmlFor="legalName">
                <Input id="legalName" name="legalName" defaultValue={institution.legalName ?? ""} />
              </Field>
              <Field label="Teléfono" htmlFor="phone">
                <Input id="phone" name="phone" defaultValue={institution.phone ?? ""} />
              </Field>
              <Field label="Correo" htmlFor="email">
                <Input id="email" name="email" defaultValue={institution.email ?? ""} />
              </Field>
              <Field label="RFC" htmlFor="taxId">
                <Input id="taxId" name="taxId" defaultValue={institution.taxId ?? ""} />
              </Field>
              <Field label="Color primario" htmlFor="primaryColor">
                <Input id="primaryColor" name="primaryColor" defaultValue={institution.primaryColor} />
              </Field>
              <Field label="Prefijo de matrícula" htmlFor="enrollmentPrefix">
                <Input id="enrollmentPrefix" name="enrollmentPrefix" defaultValue={institution.enrollmentPrefix} />
              </Field>
              <Field label="Formato de matrícula" htmlFor="enrollmentFormat">
                <Input id="enrollmentFormat" name="enrollmentFormat" defaultValue={institution.enrollmentFormat} />
              </Field>
              <Field label="Ciclo actual" htmlFor="currentSchoolYearId">
                <Select id="currentSchoolYearId" name="currentSchoolYearId" defaultValue={institution.currentSchoolYearId ?? ""}>
                  <option value="">Sin definir</option>
                  {years.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </ActionForm>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Planteles</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="mb-4 space-y-2 text-sm">
              {campuses.map((item) => (
                <li key={item.id}>
                  {item.name} · {item.code}
                </li>
              ))}
            </ul>
            <ActionForm action={createCampusAction} submitLabel="Agregar plantel">
              <Field label="Nombre" htmlFor="campusName">
                <Input id="campusName" name="name" required />
              </Field>
              <Field label="Código" htmlFor="code">
                <Input id="code" name="code" required />
              </Field>
            </ActionForm>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
