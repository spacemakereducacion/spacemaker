import Link from "next/link";
import type { Student } from "@prisma/client";

export function ChildSwitcher({
  students,
  currentId,
  basePath,
}: {
  students: Pick<Student, "id" | "firstName" | "lastName">[];
  currentId?: string;
  basePath: string;
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {students.map((student) => (
        <Link
          key={student.id}
          href={`${basePath}?studentId=${student.id}`}
          className={`rounded-full border px-3 py-1 text-sm ${student.id === currentId ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}
        >
          {student.firstName} {student.lastName}
        </Link>
      ))}
    </div>
  );
}
