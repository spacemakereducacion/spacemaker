import { requirePermission } from "@/lib/auth/guards";
import { sendMessageAction } from "@/modules/communication/actions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { ActionForm } from "@/components/forms/action-form";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { formatDateTime } from "@/lib/utils";

export default async function MessagesPage() {
  const actor = await requirePermission("communication.read");
  const [users, messages] = await Promise.all([
    db.user.findMany({
      where: { institutionId: actor.institutionId, status: "ACTIVE" },
      orderBy: { lastName: "asc" },
    }),
    db.message.findMany({
      where: { sender: { institutionId: actor.institutionId } },
      include: { sender: true, thread: true, recipients: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);
  return (
    <>
      <PageHeader title="Mensajes" breadcrumbs={[{ href: "/app", label: "Inicio" }, { label: "Mensajes" }]} />
      <div className="mb-6 max-w-xl rounded-2xl border border-border bg-card p-5">
        <ActionForm action={sendMessageAction} submitLabel="Enviar">
          <Field label="Destinatario" htmlFor="recipientId">
            <Select id="recipientId" name="recipientId" required>
              {users.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.firstName} {item.lastName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Asunto" htmlFor="subject">
            <Input id="subject" name="subject" required />
          </Field>
          <Field label="Mensaje" htmlFor="body">
            <Textarea id="body" name="body" required />
          </Field>
        </ActionForm>
      </div>
      <ul className="space-y-2 text-sm">
        {messages.map((item) => (
          <li key={item.id} className="rounded-xl border border-border bg-card px-4 py-3">
            {formatDateTime(item.createdAt)} · {item.thread.subject} · de {item.sender.firstName} para{" "}
            {item.recipients.map((recipient) => recipient.user.firstName).join(", ")}
          </li>
        ))}
      </ul>
    </>
  );
}
