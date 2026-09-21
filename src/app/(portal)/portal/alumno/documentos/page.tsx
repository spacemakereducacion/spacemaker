import { requirePermission } from "@/lib/auth/guards";
import { getPortalStudent } from "@/modules/portal/queries";
import { PageHeader } from "@/components/ui/page-header";
import { DOCUMENT_STATUS_LABELS } from "@/lib/constants";

export default async function StudentDocumentsPage() {
  const actor = await requirePermission("portal.student");
  const student = await getPortalStudent(actor);
  return (
    <>
      <PageHeader title="Mis documentos" />
      <ul className="space-y-2">
        {student?.documents.map((item) => (
          <li key={item.id} className="rounded-xl border border-border bg-card px-4 py-3">
            {item.title} · {item.type.name} · {DOCUMENT_STATUS_LABELS[item.status]}
          </li>
        ))}
      </ul>
    </>
  );
}
