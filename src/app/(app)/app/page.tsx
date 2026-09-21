import { requirePermission } from "@/lib/auth/guards";
import { getDashboardData } from "@/modules/dashboard/queries";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentsChart, FunnelChart } from "@/components/dashboard/charts";
import { formatCurrency } from "@/lib/utils";

export default async function DashboardPage() {
  const actor = await requirePermission("dashboard.read");
  const data = await getDashboardData(actor);

  return (
    <>
      <PageHeader
        title="Dashboard institucional"
        description="Indicadores académicos, financieros, de marketing y e-learning calculados desde la base de datos."
        breadcrumbs={[{ href: "/app", label: "Inicio" }, { label: "Dashboard" }]}
      />
      <section className="mb-8 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Académico</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <KpiCard
            label="Alumnos activos"
            value={data.academic.activeStudents}
            href="/app/control-escolar/alumnos"
            hint="Ciclo actual"
          />
          <KpiCard
            label="Nuevos alumnos"
            value={data.academic.newStudents}
            href="/app/control-escolar/alumnos"
            hint="Este mes"
            trend={{
              label: `${data.academic.newStudentsTrend >= 0 ? "+" : ""}${data.academic.newStudentsTrend} vs mes anterior`,
              positive: data.academic.newStudentsTrend >= 0,
            }}
          />
          <KpiCard label="Grupos" value={data.academic.groups} href="/app/control-escolar/grupos" />
          <KpiCard label="Docentes" value={data.academic.teachers} href="/app/control-escolar/docentes" />
          <KpiCard
            label="Asistencia de hoy"
            value={`${data.academic.attendanceRate}%`}
            href="/app/control-escolar/asistencias"
            hint="Presentes / registrados"
          />
          <KpiCard
            label="Promedio general"
            value={data.academic.average.toFixed(2)}
            href="/app/control-escolar/calificaciones"
          />
        </div>
      </section>
      <section className="mb-8 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Financiero</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Ingresos del día" value={formatCurrency(data.finance.incomeToday)} href="/app/finanzas/pagos" hint="Hoy" />
          <KpiCard
            label="Ingresos del mes"
            value={formatCurrency(data.finance.incomeMonth)}
            href="/app/finanzas/pagos"
            hint="Mes en curso"
            trend={{
              label: `${data.finance.incomeMonthTrend >= 0 ? "+" : ""}${formatCurrency(data.finance.incomeMonthTrend)}`,
              positive: data.finance.incomeMonthTrend >= 0,
            }}
          />
          <KpiCard label="Cartera vencida" value={formatCurrency(data.finance.overdue)} href="/app/finanzas/cobranza" />
          <KpiCard label="Pagos pendientes" value={formatCurrency(data.finance.pending)} href="/app/finanzas/estados-de-cuenta" />
        </div>
      </section>
      <section className="mb-8 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ingresos últimos 14 días</CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentsChart data={data.series} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Embudo de prospectos</CardTitle>
          </CardHeader>
          <CardContent>
            <FunnelChart data={data.funnel} />
          </CardContent>
        </Card>
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Marketing</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <KpiCard label="Prospectos del mes" value={data.marketing.prospects} href="/app/marketing/prospectos" />
            <KpiCard label="Seguimientos" value={data.marketing.followUps} href="/app/marketing/seguimientos" hint="7 días" />
            <KpiCard label="Inscripciones" value={data.marketing.enrolledProspects} href="/app/marketing/crm" />
            <KpiCard label="Conversión" value={`${data.marketing.conversion}%`} href="/app/marketing/campanas" />
          </div>
        </div>
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">E-learning</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <KpiCard label="Cursos activos" value={data.elearning.courses} href="/app/elearning/cursos" />
            <KpiCard label="Alumnos con avance" value={data.elearning.connected} href="/app/elearning/cursos" />
            <KpiCard label="Actividades vigentes" value={data.elearning.pendingAssignments} href="/app/elearning/actividades" />
            <KpiCard label="Avance promedio" value={`${data.elearning.elearningProgress}%`} href="/app/elearning/cursos" />
          </div>
        </div>
      </section>
    </>
  );
}
