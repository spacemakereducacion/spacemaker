import { requirePermission } from "@/lib/auth/guards";
import { getPortalStudent } from "@/modules/portal/queries";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { academicSummary } from "@/lib/grades";
import { chargeBalance } from "@/lib/finance";
import { formatCurrency, toNumber } from "@/lib/utils";

export default async function StudentHomePage() {
  const actor = await requirePermission("portal.student");
  const student = await getPortalStudent(actor);
  if (!student) return <p>No hay expediente asociado a esta cuenta.</p>;
  const summary = academicSummary(
    student.grades.map((grade) => ({
      subjectId: grade.subjectId,
      score: toNumber(grade.score),
      maxScore: toNumber(grade.maxScore),
    })),
  );
  const balance = student.charges.reduce(
    (sum, charge) =>
      sum +
      chargeBalance({
        amount: charge.amount,
        surcharge: charge.surcharge,
        discountAmount: charge.discountAmount,
        paid: charge.allocations.reduce((paid, item) => paid + toNumber(item.amount), 0),
      }),
    0,
  );
  return (
    <>
      <PageHeader title={`Hola, ${student.firstName}`} description={`Matrícula ${student.enrollmentNumber}`} />
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard label="Promedio" value={summary.average} href="/portal/alumno/calificaciones" />
        <KpiCard label="Saldo" value={formatCurrency(balance)} href="/portal/alumno/pagos" />
        <KpiCard label="Cursos" value={student.courseEnrollments.length} href="/portal/alumno/cursos" />
      </div>
    </>
  );
}
