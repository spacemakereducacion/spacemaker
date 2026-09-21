export type TimeBlock = {
  dayOfWeek: number;
  startsAt: string;
  endsAt: string;
};

function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function rangesOverlap(a: TimeBlock, b: TimeBlock) {
  if (a.dayOfWeek !== b.dayOfWeek) return false;
  return toMinutes(a.startsAt) < toMinutes(b.endsAt) && toMinutes(b.startsAt) < toMinutes(a.endsAt);
}

export function findScheduleConflicts<T extends TimeBlock & { id?: string }>(
  candidate: TimeBlock & { id?: string },
  existing: T[],
) {
  return existing.filter((block) => {
    if (candidate.id && block.id === candidate.id) return false;
    return rangesOverlap(candidate, block);
  });
}

export type ScheduleConflictKind = "teacher" | "room" | "group";

export function describeConflicts(kinds: ScheduleConflictKind[]) {
  const labels: Record<ScheduleConflictKind, string> = {
    teacher: "El docente ya tiene clase en ese horario",
    room: "El aula ya está ocupada en ese horario",
    group: "El grupo ya tiene clase en ese horario",
  };
  return kinds.map((kind) => labels[kind]);
}
