import {
  PrismaClient,
  RoleCode,
  StudentStatus,
  AttendanceStatus,
  ProspectStage,
  ProspectSource,
  ChargeStatus,
  CollectionStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "Demo.2026!";

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  await db.auditLog.deleteMany();
  await db.examAnswer.deleteMany();
  await db.examAttempt.deleteMany();
  await db.questionOption.deleteMany();
  await db.question.deleteMany();
  await db.exam.deleteMany();
  await db.assignmentSubmission.deleteMany();
  await db.assignment.deleteMany();
  await db.lessonProgress.deleteMany();
  await db.lesson.deleteMany();
  await db.forumPost.deleteMany();
  await db.forumThread.deleteMany();
  await db.courseEnrollment.deleteMany();
  await db.courseModule.deleteMany();
  await db.course.deleteMany();
  await db.prospectFollowUp.deleteMany();
  await db.prospect.deleteMany();
  await db.marketingCampaign.deleteMany();
  await db.collectionReminder.deleteMany();
  await db.paymentAllocation.deleteMany();
  await db.invoice.deleteMany();
  await db.payment.deleteMany();
  await db.cashMovement.deleteMany();
  await db.cashSession.deleteMany();
  await db.cashRegister.deleteMany();
  await db.charge.deleteMany();
  await db.scholarshipAssignment.deleteMany();
  await db.discountAssignment.deleteMany();
  await db.scholarship.deleteMany();
  await db.discount.deleteMany();
  await db.chargeConcept.deleteMany();
  await db.paymentMethod.deleteMany();
  await db.attendance.deleteMany();
  await db.grade.deleteMany();
  await db.evaluationPeriod.deleteMany();
  await db.schedule.deleteMany();
  await db.document.deleteMany();
  await db.documentType.deleteMany();
  await db.groupHistory.deleteMany();
  await db.groupEnrollment.deleteMany();
  await db.studentGuardian.deleteMany();
  await db.student.deleteMany();
  await db.group.deleteMany();
  await db.studyPlanSubject.deleteMany();
  await db.competency.deleteMany();
  await db.studyPlan.deleteMany();
  await db.subject.deleteMany();
  await db.academicProgram.deleteMany();
  await db.educationLevel.deleteMany();
  await db.room.deleteMany();
  await db.teacher.deleteMany();
  await db.guardian.deleteMany();
  await db.staff.deleteMany();
  await db.messageRecipient.deleteMany();
  await db.message.deleteMany();
  await db.messageThread.deleteMany();
  await db.notification.deleteMany();
  await db.announcement.deleteMany();
  await db.calendarEvent.deleteMany();
  await db.passwordResetToken.deleteMany();
  await db.emailVerificationToken.deleteMany();
  await db.userPermission.deleteMany();
  await db.userCampusAccess.deleteMany();
  await db.user.deleteMany();
  await db.sequenceCounter.deleteMany();
  await db.schoolYear.deleteMany();
  await db.campus.deleteMany();
  await db.institution.deleteMany();

  const institution = await db.institution.create({
    data: {
      name: "SPACE MAKER EDUCACIÓN",
      legalName: "SPACE MAKER EDUCACIÓN, A.C. (DEMO)",
      address: "Av. Educación 100, Ciudad DEMO",
      phone: "55 0000 0000",
      email: "contacto.demo@spacemaker.local",
      website: "https://spacemaker.local",
      primaryColor: "#0B3D4A",
      secondaryColor: "#1A7A6D",
      accentColor: "#D4A017",
      taxId: "SME010101XXX",
      enrollmentPrefix: "SM",
      enrollmentFormat: "{prefix}-{year}-{seq}",
    },
  });

  const north = await db.campus.create({
    data: {
      institutionId: institution.id,
      name: "Plantel Norte DEMO",
      code: "NTE",
      address: "Calle Norte 10, Ciudad DEMO",
      phone: "55 1111 1111",
    },
  });
  const south = await db.campus.create({
    data: {
      institutionId: institution.id,
      name: "Plantel Sur DEMO",
      code: "SUR",
      address: "Calle Sur 20, Ciudad DEMO",
      phone: "55 2222 2222",
    },
  });

  const year = await db.schoolYear.create({
    data: {
      institutionId: institution.id,
      name: "Ciclo 2026-2027 DEMO",
      code: "2026-2027",
      startsOn: new Date("2026-08-17"),
      endsOn: new Date("2027-07-10"),
      isActive: true,
    },
  });

  await db.institution.update({
    where: { id: institution.id },
    data: { currentSchoolYearId: year.id },
  });

  const periods = await db.evaluationPeriod.createManyAndReturn({
    data: [
      {
        schoolYearId: year.id,
        name: "Parcial 1 DEMO",
        startsOn: new Date("2026-08-17"),
        endsOn: new Date("2026-10-16"),
        weight: 0.33,
        sortOrder: 1,
      },
      {
        schoolYearId: year.id,
        name: "Parcial 2 DEMO",
        startsOn: new Date("2026-10-17"),
        endsOn: new Date("2026-12-18"),
        weight: 0.33,
        sortOrder: 2,
      },
      {
        schoolYearId: year.id,
        name: "Ordinario DEMO",
        startsOn: new Date("2027-01-07"),
        endsOn: new Date("2027-07-10"),
        weight: 0.34,
        sortOrder: 3,
      },
    ],
  });

  async function user(params: {
    email: string;
    firstName: string;
    lastName: string;
    role: RoleCode;
    campusId?: string;
    phone?: string;
  }) {
    return db.user.create({
      data: {
        institutionId: institution.id,
        campusId: params.campusId ?? north.id,
        email: params.email,
        emailVerifiedAt: new Date(),
        passwordHash,
        firstName: params.firstName,
        lastName: params.lastName,
        phone: params.phone ?? "55 1000 0000",
        status: "ACTIVE",
        role: params.role,
      },
    });
  }

  const admin = await user({
    email: "admin.demo@spacemaker.local",
    firstName: "Alicia",
    lastName: "Admin DEMO",
    role: "SUPER_ADMIN",
    campusId: north.id,
  });
  await db.staff.create({
    data: { userId: admin.id, campusId: north.id, jobTitle: "Superadministradora DEMO", employeeNo: "EMP-DEMO-001" },
  });

  const teacherAna = await user({
    email: "docente.ana.demo@spacemaker.local",
    firstName: "Ana",
    lastName: "Docente DEMO",
    role: "TEACHER",
    campusId: north.id,
  });
  const teacherLuis = await user({
    email: "docente.luis.demo@spacemaker.local",
    firstName: "Luis",
    lastName: "Docente DEMO",
    role: "TEACHER",
    campusId: south.id,
  });
  const teacherAnaProfile = await db.teacher.create({
    data: { userId: teacherAna.id, campusId: north.id, employeeNo: "DOC-DEMO-001", specialty: "Matemáticas" },
  });
  const teacherLuisProfile = await db.teacher.create({
    data: { userId: teacherLuis.id, campusId: south.id, employeeNo: "DOC-DEMO-002", specialty: "Humanidades" },
  });

  const cashier = await user({
    email: "caja.demo@spacemaker.local",
    firstName: "Carla",
    lastName: "Caja DEMO",
    role: "CASHIER",
  });
  await db.staff.create({
    data: { userId: cashier.id, campusId: north.id, jobTitle: "Cajera DEMO", employeeNo: "EMP-DEMO-010" },
  });

  const levels = await db.educationLevel.createManyAndReturn({
    data: [
      { institutionId: institution.id, name: "Secundaria", sortOrder: 1 },
      { institutionId: institution.id, name: "Bachillerato", sortOrder: 2 },
      { institutionId: institution.id, name: "Licenciatura", sortOrder: 3 },
      { institutionId: institution.id, name: "Maestría", sortOrder: 4 },
    ],
  });

  const [secundaria, bachillerato, licenciatura] = levels;

  const programSec = await db.academicProgram.create({
    data: {
      institutionId: institution.id,
      educationLevelId: secundaria.id,
      name: "Secundaria General DEMO",
      modality: "Presencial",
      duration: "3 años",
      description: "Programa DEMO de secundaria.",
    },
  });
  const programBach = await db.academicProgram.create({
    data: {
      institutionId: institution.id,
      educationLevelId: bachillerato.id,
      name: "Bachillerato General DEMO",
      modality: "Presencial",
      duration: "3 años",
      description: "Programa DEMO de bachillerato.",
    },
  });
  const programLic = await db.academicProgram.create({
    data: {
      institutionId: institution.id,
      educationLevelId: licenciatura.id,
      name: "Licenciatura en Educación DEMO",
      modality: "Mixta",
      duration: "8 semestres",
      description: "Programa DEMO de licenciatura.",
    },
  });

  const subjects = await db.subject.createManyAndReturn({
    data: [
      { institutionId: institution.id, name: "Matemáticas DEMO", code: "MAT-01" },
      { institutionId: institution.id, name: "Español DEMO", code: "ESP-01" },
      { institutionId: institution.id, name: "Historia DEMO", code: "HIS-01" },
      { institutionId: institution.id, name: "Ciencias DEMO", code: "CIE-01" },
      { institutionId: institution.id, name: "Inglés DEMO", code: "ING-01" },
    ],
  });

  const plan = await db.studyPlan.create({
    data: {
      programId: programBach.id,
      name: "Plan 2026 DEMO",
      version: "2026.1",
      objectives: "Formación integral DEMO.",
      competencies: {
        create: [{ name: "Pensamiento crítico DEMO", description: "Competencia de demostración." }],
      },
    },
  });

  await db.studyPlanSubject.createMany({
    data: subjects.map((subject, index) => ({
      studyPlanId: plan.id,
      subjectId: subject.id,
      term: "1",
      credits: 6,
      hours: 64,
      units: `Unidad ${index + 1} DEMO`,
    })),
  });

  const roomA = await db.room.create({
    data: { institutionId: institution.id, campusId: north.id, name: "Aula A1 DEMO", capacity: 30 },
  });
  const roomB = await db.room.create({
    data: { institutionId: institution.id, campusId: south.id, name: "Aula B1 DEMO", capacity: 28 },
  });

  const groupA = await db.group.create({
    data: {
      institutionId: institution.id,
      campusId: north.id,
      programId: programBach.id,
      studyPlanId: plan.id,
      schoolYearId: year.id,
      name: "2A Bachillerato DEMO",
      shift: "MORNING",
      roomId: roomA.id,
      titularTeacherId: teacherAnaProfile.id,
      capacity: 30,
    },
  });
  const groupB = await db.group.create({
    data: {
      institutionId: institution.id,
      campusId: south.id,
      programId: programSec.id,
      schoolYearId: year.id,
      name: "3B Secundaria DEMO",
      shift: "AFTERNOON",
      roomId: roomB.id,
      titularTeacherId: teacherLuisProfile.id,
      capacity: 25,
    },
  });

  const firstNames = ["Elena", "Pablo", "Marina", "Diego", "Sofía", "Hugo", "Valeria", "Iván", "Camila", "Bruno"];
  const lastNames = ["López", "Ramírez", "Ortega", "Navarro", "Cisneros", "Peña", "Salazar", "Ibarra", "Mendoza", "Ríos"];

  const students = [];
  for (let i = 0; i < 10; i += 1) {
    const isSouth = i >= 7;
    const campus = isSouth ? south : north;
    const group = isSouth ? groupB : groupA;
    const program = isSouth ? programSec : programBach;
    const account = await user({
      email: `alumno${i + 1}.demo@spacemaker.local`,
      firstName: firstNames[i],
      lastName: `${lastNames[i]} DEMO`,
      role: "STUDENT",
      campusId: campus.id,
      phone: `55 2000 00${10 + i}`,
    });
    const student = await db.student.create({
      data: {
        institutionId: institution.id,
        userId: account.id,
        campusId: campus.id,
        enrollmentNumber: `SM-2026-${String(i + 1).padStart(5, "0")}`,
        firstName: firstNames[i],
        lastName: `${lastNames[i]} DEMO`,
        curp: `DEMO${String(i + 1).padStart(14, "0")}`.slice(0, 18),
        birthDate: new Date(2008 + (i % 4), i % 12, 10 + i),
        sex: i % 2 === 0 ? "FEMALE" : "MALE",
        nationality: "Mexicana",
        birthPlace: "Ciudad DEMO",
        phone: `55 2000 00${10 + i}`,
        email: account.email,
        address: `Calle DEMO ${i + 1}`,
        programId: program.id,
        educationLevelId: program.educationLevelId,
        groupId: group.id,
        shift: group.shift,
        schoolYearId: year.id,
        term: "2",
        admissionDate: new Date("2024-08-15"),
        status: StudentStatus.ACTIVE,
        collectionStatus: i === 8 ? CollectionStatus.OVERDUE : CollectionStatus.CURRENT,
      },
    });
    await db.groupEnrollment.create({
      data: { studentId: student.id, groupId: group.id, schoolYearId: year.id },
    });
    await db.groupHistory.create({
      data: { studentId: student.id, groupId: group.id, action: "ENROLL", notes: "Inscripción DEMO" },
    });
    students.push(student);
  }

  const guardianUsers = [];
  for (let i = 0; i < 5; i += 1) {
    const account = await user({
      email: `padre${i + 1}.demo@spacemaker.local`,
      firstName: `Tutor${i + 1}`,
      lastName: "Familia DEMO",
      role: "GUARDIAN",
    });
    const guardian = await db.guardian.create({
      data: {
        userId: account.id,
        firstName: `Tutor${i + 1}`,
        lastName: "Familia DEMO",
        phone: `55 3000 00${10 + i}`,
        email: account.email,
        occupation: "Ocupación DEMO",
      },
    });
    guardianUsers.push(guardian);
    await db.studentGuardian.create({
      data: {
        studentId: students[i].id,
        guardianId: guardian.id,
        relation: i % 2 === 0 ? "MOTHER" : "FATHER",
        isPrimary: true,
      },
    });
  }
  await db.studentGuardian.create({
    data: {
      studentId: students[5].id,
      guardianId: guardianUsers[0].id,
      relation: "TUTOR",
      isPrimary: true,
    },
  });

  for (const [index, subject] of subjects.entries()) {
    await db.schedule.create({
      data: {
        groupId: groupA.id,
        subjectId: subject.id,
        teacherId: teacherAnaProfile.id,
        roomId: roomA.id,
        dayOfWeek: (index % 5) + 1,
        startsAt: `${8 + index}:00`,
        endsAt: `${9 + index}:00`,
      },
    });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const student of students.slice(0, 7)) {
    await db.attendance.create({
      data: {
        studentId: student.id,
        groupId: groupA.id,
        subjectId: subjects[0].id,
        teacherId: teacherAnaProfile.id,
        date: today,
        status: student.firstName === "Diego" ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT,
        recordedById: teacherAna.id,
      },
    });
  }

  for (const student of students.slice(0, 7)) {
    for (const subject of subjects.slice(0, 3)) {
      await db.grade.create({
        data: {
          studentId: student.id,
          subjectId: subject.id,
          evaluationPeriodId: periods[0].id,
          score: 7 + ((student.firstName.length + subject.code.length) % 3),
          recordedById: teacherAna.id,
        },
      });
    }
  }

  const docTypes = await db.documentType.createManyAndReturn({
    data: [
      { institutionId: institution.id, name: "Acta de nacimiento", required: true },
      { institutionId: institution.id, name: "CURP", required: true },
      { institutionId: institution.id, name: "Comprobante de domicilio", required: true },
      { institutionId: institution.id, name: "Identificación", required: false },
    ],
  });

  await db.document.create({
    data: {
      studentId: students[0].id,
      typeId: docTypes[0].id,
      title: "Acta DEMO — no es un documento real",
      storageKey: "demo/acta-placeholder.txt",
      mimeType: "text/plain",
      sizeBytes: 32,
      status: "VALIDATED",
      notes: "Archivo DEMO de demostración.",
      uploadedById: admin.id,
      validatedById: admin.id,
      validatedAt: new Date(),
    },
  });

  const concepts = await db.chargeConcept.createManyAndReturn({
    data: [
      { institutionId: institution.id, name: "Colegiatura", code: "COL", defaultAmount: 4500 },
      { institutionId: institution.id, name: "Inscripción", code: "INS", defaultAmount: 3500 },
      { institutionId: institution.id, name: "Reinscripción", code: "REI", defaultAmount: 2500 },
      { institutionId: institution.id, name: "Seguro", code: "SEG", defaultAmount: 400 },
    ],
  });
  const methods = await db.paymentMethod.createManyAndReturn({
    data: [
      { institutionId: institution.id, name: "Efectivo", type: "CASH" },
      { institutionId: institution.id, name: "Transferencia", type: "TRANSFER" },
      { institutionId: institution.id, name: "Tarjeta", type: "CARD" },
    ],
  });

  const register = await db.cashRegister.create({
    data: { institutionId: institution.id, campusId: north.id, name: "Caja principal DEMO" },
  });
  const session = await db.cashSession.create({
    data: {
      registerId: register.id,
      openedById: cashier.id,
      status: "OPEN",
      openingAmount: 2000,
      movements: {
        create: { type: "OPENING", amount: 2000, concept: "Apertura DEMO" },
      },
    },
  });

  for (const [index, student] of students.entries()) {
    const due = new Date();
    due.setDate(due.getDate() + (index === 8 ? -10 : 12));
    await db.charge.create({
      data: {
        studentId: student.id,
        conceptId: concepts[0].id,
        schoolYearId: year.id,
        description: "Colegiatura septiembre DEMO",
        amount: 4500,
        dueDate: due,
        status: index === 8 ? ChargeStatus.OVERDUE : ChargeStatus.PENDING,
      },
    });
  }

  const firstCharge = await db.charge.findFirstOrThrow({
    where: { studentId: students[0].id },
  });
  const payment = await db.payment.create({
    data: {
      studentId: students[0].id,
      methodId: methods[0].id,
      cashierId: cashier.id,
      cashSessionId: session.id,
      folio: "REC-2026-00001",
      amount: 4500,
      notes: "Pago DEMO",
    },
  });
  await db.paymentAllocation.create({
    data: { paymentId: payment.id, chargeId: firstCharge.id, amount: 4500 },
  });
  await db.charge.update({ where: { id: firstCharge.id }, data: { status: "PAID" } });
  await db.invoice.create({
    data: { paymentId: payment.id, folio: "FAC-2026-00001", notes: "Recibo DEMO" },
  });
  await db.cashMovement.create({
    data: { sessionId: session.id, type: "INCOME", amount: 4500, concept: "Colegiatura DEMO" },
  });

  const scholarship = await db.scholarship.create({
    data: {
      institutionId: institution.id,
      conceptId: concepts[0].id,
      name: "Beca académica DEMO",
      type: "PERCENTAGE",
      value: 25,
    },
  });
  await db.scholarshipAssignment.create({
    data: {
      scholarshipId: scholarship.id,
      studentId: students[1].id,
      authorizedById: admin.id,
      notes: "Autorización DEMO",
    },
  });
  await db.discount.create({
    data: {
      institutionId: institution.id,
      name: "Pronto pago DEMO",
      type: "FIXED",
      value: 200,
      conceptId: concepts[0].id,
    },
  });

  const campaign = await db.marketingCampaign.create({
    data: {
      institutionId: institution.id,
      name: "Campaña redes 2026 DEMO",
      channel: ProspectSource.INSTAGRAM,
      budget: 15000,
      startsOn: new Date("2026-01-01"),
      notes: "Campaña DEMO",
    },
  });

  const stages: ProspectStage[] = [
    "NEW",
    "CONTACTED",
    "INFO_SENT",
    "FOLLOW_UP",
    "VISIT",
    "PRE_ENROLLMENT",
    "ENROLLED",
    "LOST",
  ];
  for (let i = 0; i < 8; i += 1) {
    const prospect = await db.prospect.create({
      data: {
        institutionId: institution.id,
        campusId: i % 2 === 0 ? north.id : south.id,
        campaignId: campaign.id,
        programId: i % 2 === 0 ? programBach.id : programLic.id,
        ownerId: admin.id,
        firstName: `Prospecto${i + 1}`,
        lastName: "Lead DEMO",
        email: `prospecto${i + 1}.demo@spacemaker.local`,
        phone: `55 4000 00${10 + i}`,
        source: i % 2 === 0 ? "INSTAGRAM" : "WEBSITE",
        stage: stages[i],
        notes: "Registro DEMO",
        studentId: stages[i] === "ENROLLED" ? students[0].id : null,
      },
    });
    await db.prospectFollowUp.create({
      data: {
        prospectId: prospect.id,
        userId: admin.id,
        notes: "Seguimiento inicial DEMO",
        nextDate: new Date(Date.now() + 86400000 * 3),
      },
    });
  }

  const course = await db.course.create({
    data: {
      institutionId: institution.id,
      teacherId: teacherAnaProfile.id,
      title: "Pensamiento matemático DEMO",
      description: "Curso DEMO de e-learning.",
      durationHours: 20,
    },
  });
  const module1 = await db.courseModule.create({
    data: { courseId: course.id, title: "Módulo 1 DEMO", sortOrder: 1 },
  });
  const lesson = await db.lesson.create({
    data: {
      moduleId: module1.id,
      title: "Introducción DEMO",
      contentType: "TEXT",
      content: "Contenido educativo DEMO. No es material oficial publicado.",
      durationMin: 15,
    },
  });
  await db.courseEnrollment.create({
    data: { courseId: course.id, studentId: students[0].id },
  });
  await db.lessonProgress.create({
    data: { lessonId: lesson.id, studentId: students[0].id, progressPct: 40 },
  });
  const assignment = await db.assignment.create({
    data: {
      courseId: course.id,
      title: "Tarea 1 DEMO",
      description: "Resuelva los ejercicios DEMO.",
      dueAt: new Date(Date.now() + 7 * 86400000),
    },
  });
  await db.assignmentSubmission.create({
    data: {
      assignmentId: assignment.id,
      studentId: students[0].id,
      content: "Entrega DEMO",
      score: 9,
      feedback: "Buen trabajo DEMO",
    },
  });

  const exam = await db.exam.create({
    data: {
      institutionId: institution.id,
      courseId: course.id,
      title: "Examen diagnóstico DEMO",
      timeLimitMin: 20,
      maxAttempts: 2,
      isPublished: true,
    },
  });
  const question = await db.question.create({
    data: {
      examId: exam.id,
      institutionId: institution.id,
      type: "MULTIPLE_CHOICE",
      prompt: "¿Cuánto es 2 + 2? (pregunta DEMO)",
      points: 1,
      explanation: "La respuesta correcta es 4.",
    },
  });
  await db.questionOption.createMany({
    data: [
      { questionId: question.id, label: "3", isCorrect: false },
      { questionId: question.id, label: "4", isCorrect: true },
      { questionId: question.id, label: "5", isCorrect: false },
    ],
  });

  await db.announcement.create({
    data: {
      institutionId: institution.id,
      authorId: admin.id,
      title: "Bienvenida al ciclo DEMO",
      body: "Aviso institucional DEMO. Esta plataforma es un entorno de demostración.",
      scope: "INSTITUTION",
    },
  });
  await db.notification.create({
    data: {
      userId: students[0].userId!,
      title: "Calificación publicada DEMO",
      body: "Se registró una calificación DEMO en Matemáticas.",
      href: "/portal/alumno/calificaciones",
    },
  });
  await db.calendarEvent.createMany({
    data: [
      {
        institutionId: institution.id,
        title: "Inicio de clases DEMO",
        startsAt: new Date("2026-08-17T08:00:00Z"),
        endsAt: new Date("2026-08-17T09:00:00Z"),
        scope: "INSTITUTION",
      },
      {
        institutionId: institution.id,
        title: "Periodo de exámenes DEMO",
        startsAt: new Date("2026-10-13T08:00:00Z"),
        endsAt: new Date("2026-10-16T18:00:00Z"),
        scope: "INSTITUTION",
      },
    ],
  });

  await db.sequenceCounter.createMany({
    data: [
      {
        institutionId: institution.id,
        campusId: "",
        key: "enrollment",
        year: 2026,
        prefix: "SM",
        currentValue: 10,
      },
      {
        institutionId: institution.id,
        campusId: "",
        key: "receipt",
        year: 2026,
        prefix: "REC",
        currentValue: 1,
      },
      {
        institutionId: institution.id,
        campusId: "",
        key: "invoice",
        year: 2026,
        prefix: "FAC",
        currentValue: 1,
      },
    ],
  });

  await db.auditLog.create({
    data: {
      institutionId: institution.id,
      userId: admin.id,
      action: "CREATE",
      module: "seed",
      entity: "institution",
      entityId: institution.id,
      metadata: { note: "Carga inicial DEMO" },
    },
  });

  console.log("Seed DEMO completado.");
  console.log("Usuarios DEMO (contraseña: Demo.2026!):");
  console.log("  admin.demo@spacemaker.local");
  console.log("  docente.ana.demo@spacemaker.local");
  console.log("  caja.demo@spacemaker.local");
  console.log("  alumno1.demo@spacemaker.local");
  console.log("  padre1.demo@spacemaker.local");
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
