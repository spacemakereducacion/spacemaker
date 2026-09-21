import { requirePermission } from "@/lib/auth/guards";
import { academicOptions, listStudents } from "@/modules/academic/queries";
import { addLessonAction, addModuleAction, createCourseAction, enrollCourseAction } from "@/modules/elearning/actions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { ActionForm } from "@/components/forms/action-form";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CoursesPage() {
  const actor = await requirePermission("elearning.read");
  const [courses, options, students] = await Promise.all([
    db.course.findMany({
      where: { institutionId: actor.institutionId },
      include: { teacher: { include: { user: true } }, modules: { include: { lessons: true } }, enrollments: true },
    }),
    academicOptions(actor),
    listStudents(actor, { status: "ACTIVE" }),
  ]);
  return (
    <>
      <PageHeader title="Cursos" breadcrumbs={[{ href: "/app", label: "Inicio" }, { label: "Cursos" }]} />
      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Nuevo curso</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionForm action={createCourseAction}>
              <Field label="Título" htmlFor="title">
                <Input id="title" name="title" required />
              </Field>
              <Field label="Descripción" htmlFor="description">
                <Textarea id="description" name="description" />
              </Field>
              <Field label="Docente" htmlFor="teacherId">
                <Select id="teacherId" name="teacherId">
                  <option value="">Sin docente</option>
                  {options.teachers.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.user.firstName} {item.user.lastName}
                    </option>
                  ))}
                </Select>
              </Field>
            </ActionForm>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Módulo / lección</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <ActionForm action={addModuleAction} submitLabel="Agregar módulo">
              <Field label="Curso" htmlFor="courseId">
                <Select id="courseId" name="courseId" required>
                  {courses.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Título" htmlFor="moduleTitle">
                <Input id="moduleTitle" name="title" required />
              </Field>
            </ActionForm>
            <ActionForm action={addLessonAction} submitLabel="Agregar lección">
              <Field label="Módulo" htmlFor="moduleId">
                <Select id="moduleId" name="moduleId" required>
                  {courses.flatMap((course) =>
                    course.modules.map((module) => (
                      <option key={module.id} value={module.id}>
                        {course.title} · {module.title}
                      </option>
                    )),
                  )}
                </Select>
              </Field>
              <Field label="Título" htmlFor="lessonTitle">
                <Input id="lessonTitle" name="title" required />
              </Field>
              <Field label="Contenido" htmlFor="content">
                <Textarea id="content" name="content" />
              </Field>
            </ActionForm>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Inscribir alumno</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionForm action={enrollCourseAction} submitLabel="Inscribir">
              <Field label="Curso" htmlFor="enrollCourse">
                <Select id="enrollCourse" name="courseId" required>
                  {courses.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Alumno" htmlFor="studentId">
                <Select id="studentId" name="studentId" required>
                  {students.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.firstName} {item.lastName}
                    </option>
                  ))}
                </Select>
              </Field>
            </ActionForm>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-4">
        {courses.map((course) => (
          <Card key={course.id}>
            <CardHeader>
              <CardTitle>
                {course.title} · {course.enrollments.length} alumnos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {course.modules.map((module) => (
                <div key={module.id} className="mb-3">
                  <p className="font-medium">{module.title}</p>
                  <ul className="ml-4 list-disc text-sm text-muted-foreground">
                    {module.lessons.map((lesson) => (
                      <li key={lesson.id}>{lesson.title}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
