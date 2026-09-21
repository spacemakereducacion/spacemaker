import { requirePermission } from "@/lib/auth/guards";
import { getLinkedStudents, getPortalStudent } from "@/modules/portal/queries";
import { ChildSwitcher } from "@/components/portal/child-switcher";
import { PageHeader } from "@/components/ui/page-header";

export default async function GuardianDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  const actor = await requirePermission("portal.guardian");
  const { studentId } = await searchParams;
  const [students, student] = await Promise.all([getLinkedStudents(actor), getPortalStudent(actor, studentId)]);
  return (
    <>
      <PageHeader title="Documentos" />
      <ChildSwitcher students={students} currentId={student?.id} basePath="/portal/padres/documentos" />
      <ul className="space-y-2">
        {student?.documents.map((item) => (
          <li key={item.id} className="rounded-xl border border-border bg-card px-4 py-3">
            {item.title} · {item.status}
          </li>
        ))}
      </ul>
    </>
  );
}
