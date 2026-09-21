import { requirePermission } from "@/lib/auth/guards";
import { academicOptions, listGroups } from "@/modules/academic/queries";
import { saveAttendanceAction } from "@/modules/operations/actions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { ATTENDANCE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ groupId?: string; date?: string }>;
}) {
  const actor = await requirePermission("attendance.read");
  const params = await searchParams;
  const [groups, options] = await Promise.all([listGroups(actor), academicOptions(actor)]);
  const groupId = params.groupId ?? groups[0]?.id;
  const date = params.date ?? new Date().toISOString().slice(0, 10);
  const students = groupId
    ? await db.student.findMany({ where: { groupId, status: "ACTIVE" }, orderBy: { lastName: "asc" } })
    : [];
  const report = await db.attendance.groupBy({
    by: ["status"],
    where: { student: { institutionId: actor.institutionId } },
    _count: true,
  });

  return (
    <>
      <PageHeader
        title="Asistencias"
        description="Registro desde computadora o celular. Las faltas y retardos notifican al tutor."
        breadcrumbs={[{ href: "/app", label: "Inicio" }, { label: "Asistencias" }]}
      />
      <div className="mb-4 flex flex-wrap gap-3 text-sm">
        {report.map((item) => (
          <span key={item.status} className="rounded-full bg-muted px-3 py-1">
            {ATTENDANCE_LABELS[item.status]}: {item._count}
          </span>
        ))}
      </div>
      <form className="mb-4 flex flex-col gap-2 sm:flex-row">
        <select name="groupId" defaultValue={groupId} className="h-10 rounded-lg border border-border px-3 text-sm">
          {groups.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <input type="date" name="date" defaultValue={date} className="h-10 rounded-lg border border-border px-3 text-sm" />
        <Button type="submit" variant="outline">
          Cargar grupo
        </Button>
      </form>
      {groupId ? (
        <form
          action={async (formData) => {
            "use server";
            await saveAttendanceAction(formData);
          }}
          className="rounded-2xl border border-border bg-card p-4"
        >
          <input type="hidden" name="groupId" value={groupId} />
          <input type="hidden" name="date" value={date} />
          <input type="hidden" name="subjectId" value={options.subjects[0]?.id ?? ""} />
          <Table>
            <THead>
              <TR>
                <TH>Alumno</TH>
                <TH>Estatus</TH>
              </TR>
            </THead>
            <TBody>
              {students.map((student) => (
                <TR key={student.id}>
                  <TD>
                    {student.firstName} {student.lastName}
                  </TD>
                  <TD>
                    <select name={`status_${student.id}`} className="h-9 rounded-lg border border-border px-2 text-sm" defaultValue="PRESENT">
                      {Object.entries(ATTENDANCE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <div className="mt-4">
            <Button type="submit">Guardar asistencia {formatDate(date)}</Button>
          </div>
        </form>
      ) : null}
    </>
  );
}
