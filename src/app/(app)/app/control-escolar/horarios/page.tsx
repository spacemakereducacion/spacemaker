import { requirePermission } from "@/lib/auth/guards";
import { academicOptions, listGroups } from "@/modules/academic/queries";
import { createScheduleAction } from "@/modules/operations/actions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { ActionForm } from "@/components/forms/action-form";
import { Field, Input, Select } from "@/components/ui/input";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { DAY_LABELS } from "@/lib/constants";

export default async function SchedulesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; id?: string }>;
}) {
  const actor = await requirePermission("schedules.read");
  const params = await searchParams;
  const [options, groups] = await Promise.all([academicOptions(actor), listGroups(actor)]);
  const schedules = await db.schedule.findMany({
    where: { group: { institutionId: actor.institutionId } },
    include: { group: true, subject: true, teacher: { include: { user: true } }, room: true },
    orderBy: [{ dayOfWeek: "asc" }, { startsAt: "asc" }],
  });
  const filtered = params.id
    ? schedules.filter((item) => {
        if (params.view === "docente") return item.teacherId === params.id;
        if (params.view === "aula") return item.roomId === params.id;
        return item.groupId === params.id;
      })
    : schedules;

  return (
    <>
      <PageHeader
        title="Horarios"
        description="El sistema valida conflictos de docente, aula y grupo antes de guardar."
        breadcrumbs={[{ href: "/app", label: "Inicio" }, { label: "Horarios" }]}
      />
      <div className="mb-6 max-w-3xl rounded-2xl border border-border bg-card p-5">
        <ActionForm action={createScheduleAction} submitLabel="Agregar bloque">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Grupo" htmlFor="groupId">
              <Select id="groupId" name="groupId" required>
                {groups.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Materia" htmlFor="subjectId">
              <Select id="subjectId" name="subjectId" required>
                {options.subjects.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Docente" htmlFor="teacherId">
              <Select id="teacherId" name="teacherId" required>
                {options.teachers.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.user.firstName} {item.user.lastName}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Aula" htmlFor="roomId">
              <Select id="roomId" name="roomId" required>
                {options.rooms.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Día" htmlFor="dayOfWeek">
              <Select id="dayOfWeek" name="dayOfWeek" required>
                {Object.entries(DAY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Inicio" htmlFor="startsAt">
              <Input id="startsAt" name="startsAt" type="time" required />
            </Field>
            <Field label="Fin" htmlFor="endsAt">
              <Input id="endsAt" name="endsAt" type="time" required />
            </Field>
          </div>
        </ActionForm>
      </div>
      <form className="mb-4 flex flex-wrap gap-2">
        <select name="view" defaultValue={params.view ?? "grupo"} className="h-10 rounded-lg border border-border px-3 text-sm">
          <option value="grupo">Por grupo</option>
          <option value="docente">Por docente</option>
          <option value="aula">Por aula</option>
        </select>
        <button className="h-10 rounded-lg border border-border px-3 text-sm" type="submit">
          Aplicar vista
        </button>
      </form>
      <div className="rounded-2xl border border-border bg-card">
        <Table>
          <THead>
            <TR>
              <TH>Día</TH>
              <TH>Horario</TH>
              <TH>Grupo</TH>
              <TH>Materia</TH>
              <TH>Docente</TH>
              <TH>Aula</TH>
            </TR>
          </THead>
          <TBody>
            {filtered.map((item) => (
              <TR key={item.id}>
                <TD>{DAY_LABELS[item.dayOfWeek]}</TD>
                <TD>
                  {item.startsAt}–{item.endsAt}
                </TD>
                <TD>{item.group.name}</TD>
                <TD>{item.subject.name}</TD>
                <TD>
                  {item.teacher.user.firstName} {item.teacher.user.lastName}
                </TD>
                <TD>{item.room.name}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </>
  );
}
