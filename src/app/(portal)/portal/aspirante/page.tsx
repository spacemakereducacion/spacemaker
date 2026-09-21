import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { STUDENT_STATUS_LABELS } from "@/lib/constants";

export default async function ApplicantPortalPage() {
  const actor = await requirePermission("portal.applicant");
  const student = await db.student.findFirst({
    where: { userId: actor.id },
    include: { documents: { include: { type: true } }, program: true },
  });
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <PageHeader title="Portal del aspirante" description="Consulte su proceso de admisión." />
      {student ? (
        <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
          <p>
            {student.firstName} {student.lastName}
          </p>
          <p>Folio {student.enrollmentNumber}</p>
          <p>Estatus: {STUDENT_STATUS_LABELS[student.status]}</p>
          <p>Programa: {student.program?.name ?? "Por asignar"}</p>
          <ul className="text-sm">
            {student.documents.map((item) => (
              <li key={item.id}>
                {item.type.name}: {item.status}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p>No hay solicitud asociada.</p>
      )}
    </div>
  );
}
