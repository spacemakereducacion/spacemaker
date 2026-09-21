import { requirePermission } from "@/lib/auth/guards";
import { academicOptions, listPrograms } from "@/modules/academic/queries";
import { addPlanSubjectAction, createEducationLevelAction, createProgramAction, toggleStudyPlanAction } from "@/modules/academic/actions";
import { PageHeader } from "@/components/ui/page-header";
import { ActionForm } from "@/components/forms/action-form";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function ProgramsPage() {
  const actor = await requirePermission("programs.read");
  const [programs, options] = await Promise.all([listPrograms(actor), academicOptions(actor)]);
  return (
    <>
      <PageHeader
        title="Programas académicos"
        description="Niveles, programas y planes de estudio administrables. No están codificados de forma rígida."
        breadcrumbs={[{ href: "/app", label: "Inicio" }, { label: "Programas" }]}
      />
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Nuevo nivel</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionForm action={createEducationLevelAction} submitLabel="Crear nivel">
              <Field label="Nombre" htmlFor="levelName">
                <Input id="levelName" name="name" required />
              </Field>
            </ActionForm>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Nuevo programa</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionForm action={createProgramAction}>
              <Field label="Nombre" htmlFor="name">
                <Input id="name" name="name" required />
              </Field>
              <Field label="Nivel" htmlFor="educationLevelId">
                <Select id="educationLevelId" name="educationLevelId" required>
                  {options.levels.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Modalidad" htmlFor="modality">
                <Input id="modality" name="modality" />
              </Field>
              <Field label="Duración" htmlFor="duration">
                <Input id="duration" name="duration" />
              </Field>
              <Field label="Requisitos" htmlFor="requirements">
                <Textarea id="requirements" name="requirements" />
              </Field>
            </ActionForm>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-4">
        {programs.map((program) => (
          <Card key={program.id}>
            <CardHeader>
              <CardTitle>
                {program.name} · {program.educationLevel.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {program.modality ?? "—"} · {program.duration ?? "—"}
              </p>
              {program.studyPlans.map((plan) => (
                <div key={plan.id} className="rounded-xl border border-border p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="font-medium">
                      {plan.name} {plan.version ? `· ${plan.version}` : ""}
                    </p>
                    <form
                      action={async () => {
                        "use server";
                        await toggleStudyPlanAction(plan.id, !plan.isActive);
                      }}
                    >
                      <Button variant="outline" size="sm" type="submit">
                        {plan.isActive ? "Desactivar" : "Activar"}
                      </Button>
                    </form>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {plan.subjects.map((item) => (
                      <Badge key={item.id}>
                        {item.subject.name} · {item.credits.toString()} créditos
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-3">
                    <ActionForm action={addPlanSubjectAction} submitLabel="Agregar materia">
                      <input type="hidden" name="studyPlanId" value={plan.id} />
                      <Field label="Materia" htmlFor={`subject-${plan.id}`}>
                        <Select id={`subject-${plan.id}`} name="subjectId" required>
                          {options.subjects.map((subject) => (
                            <option key={subject.id} value={subject.id}>
                              {subject.name}
                            </option>
                          ))}
                        </Select>
                      </Field>
                    </ActionForm>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
