import { requirePermission } from "@/lib/auth/guards";
import { createEventAction } from "@/modules/communication/actions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { ActionForm } from "@/components/forms/action-form";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { formatDateTime } from "@/lib/utils";

export default async function CalendarPage() {
  const actor = await requirePermission("calendar.read");
  const events = await db.calendarEvent.findMany({
    where: { institutionId: actor.institutionId },
    orderBy: { startsAt: "asc" },
  });
  return (
    <>
      <PageHeader title="Calendario escolar" breadcrumbs={[{ href: "/app", label: "Inicio" }, { label: "Calendario" }]} />
      <div className="mb-6 max-w-xl rounded-2xl border border-border bg-card p-5">
        <ActionForm action={createEventAction} submitLabel="Crear evento">
          <Field label="Título" htmlFor="title">
            <Input id="title" name="title" required />
          </Field>
          <Field label="Descripción" htmlFor="description">
            <Textarea id="description" name="description" />
          </Field>
          <Field label="Inicio" htmlFor="startsAt">
            <Input id="startsAt" name="startsAt" type="datetime-local" required />
          </Field>
          <Field label="Fin" htmlFor="endsAt">
            <Input id="endsAt" name="endsAt" type="datetime-local" required />
          </Field>
          <Field label="Alcance" htmlFor="scope">
            <Select id="scope" name="scope">
              <option value="INSTITUTION">Institucional</option>
              <option value="CAMPUS">Plantel</option>
              <option value="GROUP">Grupo</option>
            </Select>
          </Field>
        </ActionForm>
      </div>
      <ul className="space-y-2">
        {events.map((item) => (
          <li key={item.id} className="rounded-xl border border-border bg-card px-4 py-3">
            <p className="font-medium">{item.title}</p>
            <p className="text-sm text-muted-foreground">
              {formatDateTime(item.startsAt)} — {formatDateTime(item.endsAt)}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}
