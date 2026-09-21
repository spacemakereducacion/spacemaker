import { PASSING_SCORE } from "@/lib/constants";

export type GradeLike = {
  score: number;
  maxScore: number;
  type?: string;
  subjectId?: string;
};

export function gradePercentage(score: number, maxScore: number) {
  if (maxScore <= 0) return 0;
  return Number(((score / maxScore) * 100).toFixed(2));
}

export function averageScores(grades: GradeLike[]) {
  if (grades.length === 0) return 0;
  const total = grades.reduce((sum, grade) => sum + Number(grade.score), 0);
  return Number((total / grades.length).toFixed(2));
}

export function subjectAverages(grades: Array<GradeLike & { subjectId: string }>) {
  const grouped = new Map<string, GradeLike[]>();
  for (const grade of grades) {
    const list = grouped.get(grade.subjectId) ?? [];
    list.push(grade);
    grouped.set(grade.subjectId, list);
  }
  return [...grouped.entries()].map(([subjectId, list]) => ({
    subjectId,
    average: averageScores(list),
    passed: averageScores(list) >= PASSING_SCORE,
  }));
}

export function academicSummary(grades: Array<GradeLike & { subjectId: string }>) {
  const subjects = subjectAverages(grades);
  const approved = subjects.filter((item) => item.passed).length;
  const pending = subjects.filter((item) => !item.passed).length;
  return {
    average: averageScores(grades),
    percentage: gradePercentage(averageScores(grades), 10),
    approved,
    pending,
    subjects,
  };
}
