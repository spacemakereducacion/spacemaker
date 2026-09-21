import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePermission } from "@/lib/auth/guards";
import { getGuardian } from "@/modules/academic/queries";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default async function GuardianDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requirePermission("guardians.read");
  const { id } = await params;
  const guardian = await getGuardian(id, actor);
  if (!guardian) notFound();
  return (
    <>
      <PageHeader
        title={`${guardian.firstName} ${guardian.lastName}`}
        breadcrumbs={[
          { href: "/app", label: "Inicio" },
          { href: "/app/control-escolar/padres", label: "Padres" },
          { label: guardian.lastName },
        ]}
      />
      <Card>
        <CardContent className="space-y-2">
          <p>Correo: {guardian.email}</p>
          <p>Teléfono: {guardian.phone ?? "—"}</p>
          <ul className="list-disc pl-5">
            {guardian.students.map((link) => (
              <li key={link.id}>
                <Link className="underline" href={`/app/control-escolar/alumnos/${link.student.id}`}>
                  {link.student.firstName} {link.student.lastName}
                </Link>{" "}
                · {link.relation}
                {link.isPrimary ? " · principal" : ""}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </>
  );
}
