import { requirePermission } from "@/lib/auth/guards";
import { createAnnouncementAction } from "@/modules/communication/actions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { ActionForm } from "@/components/forms/action-form";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { formatDateTime } from "@/lib/utils";

export default async function AnnouncementsPage() {
  const actor = await requirePermission("communication.read");
  const [items, groups] = await Promise.all([
    db.announcement.findMany({
      where: { institutionId: actor.institutionId },
      include: { author: true },
      orderBy: { publishedAt: "desc" },
    }),
    db.group.findMany({ where: { institutionId: actor.institutionId } }),
  ]);
  return (
    <>
      <PageHeader title="Avisos" breadcrumbs={[{ href: "/app", label: "Inicio" }, { label: "Avisos" }]} />
      <div className="mb-6 max-w-xl rounded-2xl border border-border bg-card p-5">
        <ActionForm action={createAnnouncementAction} submitLabel="Publicar">
          <Field label="Título" htmlFor="title">
            <Input id="title" name="title" required />
          </Field>
          <Field label="Mensaje" htmlFor="body">
            <Textarea id="body" name="body" required />
          </Field>
          <Field label="Alcance" htmlFor="scope">
            <Select id="scope" name="scope">
              <option value="INSTITUTION">Institucional</option>
              <option value="GROUP">Por grupo</option>
              <option value="INDIVIDUAL">Individual</option>
            </Select>
          </Field>
          <Field label="Grupo" htmlFor="groupId">
            <Select id="groupId" name="groupId">
              <option value="">Ninguno</option>
              {groups.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
        </ActionForm>
      </div>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-2xl border border-border bg-card p-4">
            <p className="font-medium">{item.title}</p>
            <p className="text-sm text-muted-foreground">
              {formatDateTime(item.publishedAt)} · {item.author.firstName}
            </p>
            <p className="mt-2 text-sm">{item.body}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
