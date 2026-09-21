import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/guards";
import { academicOptions, getGroup } from "@/modules/academic/queries";
import { transferGroupAction } from "@/modules/academic/actions";
import { PageHeader } from "@/components/ui/page-header";
import { ActionForm } from "@/components/forms/action-form";
import { Field, Select } from "@/components/ui/input";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { DAY_LABELS, SHIFT_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export default async function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requirePermission("groups.read");
  const { id } = await params;
  const group = await getGroup(id, actor);
  if (!group) notFound();
  const options = await academicOptions(actor);
  return (
    <>
      <PageHeader
        title={group.name}
        description={`${group.program.name} · ${SHIFT_LABELS[group.shift]} · ${group.campus.name}`}
        breadcrumbs={[
          { href: "/app", label: "Inicio" },
          { href: "/app/control-escolar/grupos", label: "Grupos" },
          { label: group.name },
        ]}
      />
      <div className="mb-6 max-w-xl rounded-2xl border border-border bg-card p-5">
        <ActionForm action={transferGroupAction} submitLabel="Cambiar de grupo">
          <Field label="Alumno" htmlFor="studentId">
            <Select id="studentId" name="studentId" required>
              {group.currentStudents.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.firstName} {item.lastName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Nuevo grupo" htmlFor="groupId">
            <Select id="groupId" name="groupId" required>
              {options.groups.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
          <input type="hidden" name="action" value="TRANSFER" />
        </ActionForm>
      </div>
      <h2 className="mb-2 font-semibold">Alumnos inscritos</h2>
      <div className="mb-6 rounded-2xl border border-border bg-card">
        <Table>
          <THead>
            <TR>
              <TH>Matrícula</TH>
              <TH>Nombre</TH>
            </TR>
          </THead>
          <TBody>
            {group.currentStudents.map((item) => (
              <TR key={item.id}>
                <TD>{item.enrollmentNumber}</TD>
                <TD>
                  {item.firstName} {item.lastName}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
      <h2 className="mb-2 font-semibold">Horario</h2>
      <ul className="mb-6 space-y-1 text-sm">
        {group.schedules.map((item) => (
          <li key={item.id}>
            {DAY_LABELS[item.dayOfWeek]} {item.startsAt}-{item.endsAt} · {item.subject.name} · {item.room.name}
          </li>
        ))}
      </ul>
      <h2 className="mb-2 font-semibold">Historial</h2>
      <ul className="space-y-1 text-sm">
        {group.history.map((item) => (
          <li key={item.id}>
            {formatDate(item.createdAt)} · {item.action} · {item.student.firstName} {item.student.lastName}
          </li>
        ))}
      </ul>
    </>
  );
}
