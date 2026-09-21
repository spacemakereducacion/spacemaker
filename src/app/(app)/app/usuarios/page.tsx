import { requirePermission } from "@/lib/auth/guards";
import { createUserAction, updateUserStatusAction } from "@/modules/settings/actions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { ActionForm } from "@/components/forms/action-form";
import { Field, Input, Select } from "@/components/ui/input";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";

export default async function UsersPage() {
  const actor = await requirePermission("users.read");
  const [users, campuses] = await Promise.all([
    db.user.findMany({
      where: { institutionId: actor.institutionId },
      include: { campus: true },
      orderBy: { lastName: "asc" },
    }),
    db.campus.findMany({ where: { institutionId: actor.institutionId } }),
  ]);
  return (
    <>
      <PageHeader title="Usuarios" breadcrumbs={[{ href: "/app", label: "Inicio" }, { label: "Usuarios" }]} />
      <div className="mb-6 max-w-xl rounded-2xl border border-border bg-card p-5">
        <ActionForm action={createUserAction}>
          <Field label="Nombre" htmlFor="firstName">
            <Input id="firstName" name="firstName" required />
          </Field>
          <Field label="Apellidos" htmlFor="lastName">
            <Input id="lastName" name="lastName" required />
          </Field>
          <Field label="Correo" htmlFor="email">
            <Input id="email" name="email" type="email" required />
          </Field>
          <Field label="Rol" htmlFor="role">
            <Select id="role" name="role" required>
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Plantel" htmlFor="campusId">
            <Select id="campusId" name="campusId">
              {campuses.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
        </ActionForm>
      </div>
      <div className="rounded-2xl border border-border bg-card">
        <Table>
          <THead>
            <TR>
              <TH>Usuario</TH>
              <TH>Rol</TH>
              <TH>Estatus</TH>
              <TH>Último acceso</TH>
              <TH></TH>
            </TR>
          </THead>
          <TBody>
            {users.map((item) => (
              <TR key={item.id}>
                <TD>
                  {item.firstName} {item.lastName}
                  <div className="text-xs text-muted-foreground">{item.email}</div>
                </TD>
                <TD>{ROLE_LABELS[item.role]}</TD>
                <TD>{item.status}</TD>
                <TD>{formatDateTime(item.lastLoginAt)}</TD>
                <TD>
                  <form
                    action={async () => {
                      "use server";
                      await updateUserStatusAction(item.id, item.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE");
                    }}
                  >
                    <Button size="sm" variant="outline" type="submit">
                      {item.status === "ACTIVE" ? "Suspender" : "Activar"}
                    </Button>
                  </form>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </>
  );
}
