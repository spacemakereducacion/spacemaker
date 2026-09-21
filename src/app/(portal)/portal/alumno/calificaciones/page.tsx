import { requirePermission } from "@/lib/auth/guards";
import { getPortalStudent } from "@/modules/portal/queries";
import { PageHeader } from "@/components/ui/page-header";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { toNumber } from "@/lib/utils";

export default async function StudentGradesPage() {
  const actor = await requirePermission("portal.student");
  const student = await getPortalStudent(actor);
  return (
    <>
      <PageHeader title="Mis calificaciones" />
      <div className="rounded-2xl border border-border bg-card">
        <Table>
          <THead>
            <TR>
              <TH>Materia</TH>
              <TH>Calificación</TH>
            </TR>
          </THead>
          <TBody>
            {student?.grades.map((item) => (
              <TR key={item.id}>
                <TD>{item.subject.name}</TD>
                <TD>{toNumber(item.score)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </>
  );
}
