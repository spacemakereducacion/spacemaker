import Link from "next/link";
import { requirePermission } from "@/lib/auth/guards";
import { getLinkedStudents } from "@/modules/portal/queries";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default async function GuardianHomePage() {
  const actor = await requirePermission("portal.guardian");
  const students = await getLinkedStudents(actor);
  return (
    <>
      <PageHeader title="Portal de padres" description="Solo se muestran los alumnos relacionados con su cuenta." />
      <div className="grid gap-4 md:grid-cols-2">
        {students.map((student) => (
          <Card key={student.id}>
            <CardContent className="space-y-2">
              <p className="text-lg font-semibold">
                {student.firstName} {student.lastName}
              </p>
              <p className="text-sm text-muted-foreground">
                {student.enrollmentNumber} · {student.group?.name ?? "Sin grupo"}
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                <Link className="underline" href={`/portal/padres/calificaciones?studentId=${student.id}`}>
                  Calificaciones
                </Link>
                <Link className="underline" href={`/portal/padres/asistencias?studentId=${student.id}`}>
                  Asistencias
                </Link>
                <Link className="underline" href={`/portal/padres/estado-de-cuenta?studentId=${student.id}`}>
                  Estado de cuenta
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
