import { startOfDay, startOfMonth, subDays, subMonths } from "date-fns";
import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/auth/session";
import { staffCampusFilter } from "@/lib/auth/guards";
import { averageScores } from "@/lib/grades";
import { toNumber } from "@/lib/utils";

export async function getDashboardData(actor: SessionUser) {
  const campusId = staffCampusFilter(actor);
  const institutionId = actor.institutionId;
  const today = startOfDay(new Date());
  const monthStart = startOfMonth(new Date());
  const prevMonthStart = startOfMonth(subMonths(new Date(), 1));
  const weekAgo = subDays(today, 7);

  const studentWhere = { institutionId, campusId, status: "ACTIVE" as const };

  const [
    activeStudents,
    newStudents,
    previousNewStudents,
    groups,
    teachers,
    attendanceToday,
    attendancePresent,
    grades,
    incomeToday,
    incomeMonth,
    previousIncomeMonth,
    overdueCharges,
    pendingCharges,
    prospects,
    followUps,
    enrolledProspects,
    totalProspects,
    courses,
    pendingAssignments,
    lessonProgress,
  ] = await Promise.all([
    db.student.count({ where: studentWhere }),
    db.student.count({ where: { ...studentWhere, createdAt: { gte: monthStart } } }),
    db.student.count({
      where: { institutionId, campusId, createdAt: { gte: prevMonthStart, lt: monthStart } },
    }),
    db.group.count({ where: { institutionId, campusId, isActive: true } }),
    db.teacher.count({ where: { campusId, user: { institutionId } } }),
    db.attendance.count({ where: { date: today, student: { institutionId, campusId } } }),
    db.attendance.count({
      where: { date: today, status: "PRESENT", student: { institutionId, campusId } },
    }),
    db.grade.findMany({
      where: { student: { institutionId, campusId } },
      select: { score: true, maxScore: true },
    }),
    db.payment.aggregate({
      _sum: { amount: true },
      where: { paidAt: { gte: today }, student: { institutionId, campusId } },
    }),
    db.payment.aggregate({
      _sum: { amount: true },
      where: { paidAt: { gte: monthStart }, student: { institutionId, campusId } },
    }),
    db.payment.aggregate({
      _sum: { amount: true },
      where: { paidAt: { gte: prevMonthStart, lt: monthStart }, student: { institutionId, campusId } },
    }),
    db.charge.aggregate({
      _sum: { amount: true },
      where: { status: "OVERDUE", student: { institutionId, campusId } },
    }),
    db.charge.aggregate({
      _sum: { amount: true },
      where: { status: { in: ["PENDING", "PARTIAL", "OVERDUE"] }, student: { institutionId, campusId } },
    }),
    db.prospect.count({ where: { institutionId, createdAt: { gte: monthStart } } }),
    db.prospectFollowUp.count({
      where: { createdAt: { gte: weekAgo }, prospect: { institutionId } },
    }),
    db.prospect.count({ where: { institutionId, stage: "ENROLLED" } }),
    db.prospect.count({ where: { institutionId } }),
    db.course.count({ where: { institutionId, isActive: true } }),
    db.assignment.count({
      where: { dueAt: { gte: today }, course: { institutionId } },
    }),
    db.lessonProgress.findMany({
      where: { student: { institutionId } },
      select: { progressPct: true },
    }),
  ]);

  const attendanceRate = attendanceToday === 0 ? 0 : Math.round((attendancePresent / attendanceToday) * 100);
  const average = averageScores(grades.map((grade) => ({ score: toNumber(grade.score), maxScore: toNumber(grade.maxScore) })));
  const conversion = totalProspects === 0 ? 0 : Number(((enrolledProspects / totalProspects) * 100).toFixed(1));
  const elearningProgress =
    lessonProgress.length === 0
      ? 0
      : Math.round(lessonProgress.reduce((sum, item) => sum + item.progressPct, 0) / lessonProgress.length);

  const paymentsByDay = await db.payment.findMany({
    where: { paidAt: { gte: subDays(today, 13) }, student: { institutionId, campusId } },
    select: { paidAt: true, amount: true },
  });

  const series = Array.from({ length: 14 }).map((_, index) => {
    const day = subDays(today, 13 - index);
    const key = day.toISOString().slice(0, 10);
    const total = paymentsByDay
      .filter((payment) => payment.paidAt.toISOString().slice(0, 10) === key)
      .reduce((sum, payment) => sum + toNumber(payment.amount), 0);
    return { date: key.slice(5), total };
  });

  const funnel = await db.prospect.groupBy({
    by: ["stage"],
    where: { institutionId },
    _count: true,
  });

  return {
    academic: {
      activeStudents,
      newStudents,
      newStudentsTrend: newStudents - previousNewStudents,
      groups,
      teachers,
      attendanceRate,
      average,
    },
    finance: {
      incomeToday: toNumber(incomeToday._sum.amount),
      incomeMonth: toNumber(incomeMonth._sum.amount),
      incomeMonthTrend: toNumber(incomeMonth._sum.amount) - toNumber(previousIncomeMonth._sum.amount),
      overdue: toNumber(overdueCharges._sum.amount),
      pending: toNumber(pendingCharges._sum.amount),
    },
    marketing: {
      prospects,
      followUps,
      enrolledProspects,
      conversion,
    },
    elearning: {
      courses,
      connected: lessonProgress.length,
      pendingAssignments,
      elearningProgress,
    },
    series,
    funnel,
  };
}
