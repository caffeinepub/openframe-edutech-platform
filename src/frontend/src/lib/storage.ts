import type {
  ActivityLog,
  Certificate,
  Course,
  ExamAttempt,
  ExamQuestion,
  FieldExecutive,
  Notification,
  Registration,
  Student,
  TimeLog,
} from "../types/models";

const KEYS = {
  FES: "openframe_fes",
  COURSES: "openframe_courses",
  QUESTIONS: "openframe_questions",
  REGISTRATIONS: "openframe_registrations",
  STUDENTS: "openframe_students",
  EXAM_ATTEMPTS: "openframe_exam_attempts",
  CERTIFICATES: "openframe_certificates",
  NOTIFICATIONS: "openframe_notifications",
  SEEDED: "openframe_seeded_v3",
  SESSION: "openframe_session",
  MIGRATED_V1: "openframe_migrated_v1",
  TIME_LOGS: "openframe_time_logs",
  ACTIVITY_LOGS: "openframe_activity_logs",
};

function getItem<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function setItem<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// ---- MIGRATION: reset fake placeholder principals ----
function migrateV1(): void {
  if (localStorage.getItem(KEYS.MIGRATED_V1)) return;
  const fes = getItem<FieldExecutive>(KEYS.FES);
  const migrated = fes.map((fe) =>
    fe.principal.startsWith("fe-principal-") ? { ...fe, principal: "" } : fe,
  );
  setItem(KEYS.FES, migrated);
  localStorage.setItem(KEYS.MIGRATED_V1, "true");
}

const ORDINALS = [
  "1st",
  "2nd",
  "3rd",
  "4th",
  "5th",
  "6th",
  "7th",
  "8th",
  "9th",
  "10th",
  "11th",
  "12th",
];

function makeCourseTitle(
  standard: number,
  medium: "English" | "Kannada",
): string {
  return `${ORDINALS[standard - 1]} Standard \u2013 ${medium}`;
}

// ---- SEED DATA ----
export function seedIfNeeded(): void {
  // Always run migration first, even if already seeded
  migrateV1();

  if (localStorage.getItem(KEYS.SEEDED)) return;

  // Build 24 courses: 12 English (IDs 1–12) + 12 Kannada (IDs 13–24)
  const courses: Course[] = [
    ...Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      title: makeCourseTitle(i + 1, "English"),
      standard: i + 1,
      medium: "English" as const,
      courseType: "Basic" as const,
      description: "",
      videoUrl: "",
      notes: "",
      price: 50,
      passingScore: 60,
      isActive: true,
      createdAt: "2024-01-15T10:00:00.000Z",
    })),
    ...Array.from({ length: 12 }, (_, i) => ({
      id: i + 13,
      title: makeCourseTitle(i + 1, "Kannada"),
      standard: i + 1,
      medium: "Kannada" as const,
      courseType: "Basic" as const,
      description: "",
      videoUrl: "",
      notes: "",
      price: 50,
      passingScore: 60,
      isActive: true,
      createdAt: "2024-01-15T10:00:00.000Z",
    })),
  ];

  const questions: ExamQuestion[] = [
    // Course 1 – 1st Standard English
    {
      id: 1,
      courseId: 1,
      question: "Which letter comes after 'D' in the alphabet?",
      options: ["C", "E", "F", "G"],
      correctIndex: 1,
    },
    {
      id: 2,
      courseId: 1,
      question: "How many vowels are in the English alphabet?",
      options: ["3", "4", "5", "6"],
      correctIndex: 2,
    },
    {
      id: 3,
      courseId: 1,
      question: "What is 2 + 3?",
      options: ["4", "5", "6", "7"],
      correctIndex: 1,
    },
    {
      id: 4,
      courseId: 1,
      question: "Which shape has 3 sides?",
      options: ["Square", "Circle", "Triangle", "Rectangle"],
      correctIndex: 2,
    },
    {
      id: 5,
      courseId: 1,
      question: "What color is the sky on a clear day?",
      options: ["Green", "Red", "Yellow", "Blue"],
      correctIndex: 3,
    },
    // Course 2 – 2nd Standard English
    {
      id: 6,
      courseId: 2,
      question: "What is 5 × 2?",
      options: ["8", "9", "10", "11"],
      correctIndex: 2,
    },
    {
      id: 7,
      courseId: 2,
      question: "Which animal says 'moo'?",
      options: ["Dog", "Cat", "Cow", "Horse"],
      correctIndex: 2,
    },
    {
      id: 8,
      courseId: 2,
      question: "How many days are in a week?",
      options: ["5", "6", "7", "8"],
      correctIndex: 2,
    },
    {
      id: 9,
      courseId: 2,
      question: "What is the opposite of 'hot'?",
      options: ["Warm", "Cool", "Cold", "Freeze"],
      correctIndex: 2,
    },
    {
      id: 10,
      courseId: 2,
      question: "Which planet do we live on?",
      options: ["Mars", "Venus", "Earth", "Jupiter"],
      correctIndex: 2,
    },
  ];

  const fes: FieldExecutive[] = [
    {
      id: 1,
      feCode: "FE001",
      name: "Rahul Sharma",
      phone: "9876543210",
      principal: "",
      createdAt: "2024-02-01T09:00:00.000Z",
      isActive: true,
      dailyTarget: 5,
      weeklyTarget: 25,
      monthlyTarget: 100,
      loginTime: null,
      logoutTime: null,
      totalWorkHours: 8,
      performanceScore: 72,
      rank: "Gold",
    },
    {
      id: 2,
      feCode: "FE002",
      name: "Priya Singh",
      phone: "9876543211",
      principal: "",
      createdAt: "2024-02-05T09:00:00.000Z",
      isActive: true,
      dailyTarget: 5,
      weeklyTarget: 25,
      monthlyTarget: 100,
      loginTime: null,
      logoutTime: null,
      totalWorkHours: 6,
      performanceScore: 55,
      rank: "Silver",
    },
  ];

  const students: Student[] = [
    {
      id: 1,
      name: "Amit Kumar",
      phone: "9812345678",
      principal: "student-principal-001",
      registrationId: 1,
      createdAt: "2024-03-01T10:00:00.000Z",
    },
    {
      id: 2,
      name: "Sneha Patel",
      phone: "9823456789",
      principal: "student-principal-002",
      registrationId: 2,
      createdAt: "2024-03-05T11:00:00.000Z",
    },
    {
      id: 3,
      name: "Vikram Reddy",
      phone: "9834567890",
      principal: "student-principal-003",
      registrationId: 3,
      createdAt: "2024-03-10T12:00:00.000Z",
    },
  ];

  const registrations: Registration[] = [
    {
      id: 1,
      studentName: "Amit Kumar",
      studentPhone: "9812345678",
      feId: 1,
      feName: "Rahul Sharma",
      feCode: "FE001",
      courseId: 2,
      courseName: "2nd Standard \u2013 English",
      courseType: "Basic",
      medium: "English",
      feePlan: "Standard",
      price: 100,
      status: "Approved",
      paymentStatus: "Paid",
      classLink: "https://meet.google.com/abc-defg-hij",
      schedule: "Mon, Wed, Fri \u2014 7:00 PM to 9:00 PM IST",
      createdAt: "2024-03-01T10:00:00.000Z",
      updatedAt: "2024-03-03T14:00:00.000Z",
      latitude: 12.9716,
      longitude: 77.5946,
      locationAddress: "Bangalore, Karnataka",
    },
    {
      id: 2,
      studentName: "Sneha Patel",
      studentPhone: "9823456789",
      feId: 2,
      feName: "Priya Singh",
      feCode: "FE002",
      courseId: 1,
      courseName: "1st Standard \u2013 English",
      courseType: "Basic",
      medium: "English",
      feePlan: "Basic",
      price: 50,
      status: "Approved",
      paymentStatus: "Pending",
      classLink: "",
      schedule: "",
      createdAt: "2024-03-05T11:00:00.000Z",
      updatedAt: "2024-03-06T10:00:00.000Z",
      latitude: 12.9352,
      longitude: 77.6244,
      locationAddress: "Koramangala, Bangalore",
    },
    {
      id: 3,
      studentName: "Vikram Reddy",
      studentPhone: "9834567890",
      feId: 1,
      feName: "Rahul Sharma",
      feCode: "FE001",
      courseId: 14,
      courseName: "2nd Standard \u2013 Kannada",
      courseType: "Basic",
      medium: "Kannada",
      feePlan: "Premium",
      price: 150,
      status: "Pending",
      paymentStatus: "Pending",
      classLink: "",
      schedule: "",
      createdAt: "2024-03-10T12:00:00.000Z",
      updatedAt: "2024-03-10T12:00:00.000Z",
      latitude: 13.0068,
      longitude: 77.5864,
      locationAddress: "Hebbal, Bangalore",
    },
  ];

  const examAttempts: ExamAttempt[] = [
    {
      id: 1,
      studentId: 1,
      registrationId: 1,
      courseId: 2,
      answers: [2, 2, 2, 2, 2],
      score: 80,
      passed: true,
      takenAt: "2024-04-01T15:00:00.000Z",
    },
  ];

  const certificates: Certificate[] = [
    {
      id: 1,
      studentId: 1,
      registrationId: 1,
      courseId: 2,
      studentName: "Amit Kumar",
      courseName: "2nd Standard \u2013 English",
      certNumber: "CERT-2024-00001",
      issuedAt: "2024-04-01T15:30:00.000Z",
    },
  ];

  const notifications: Notification[] = [
    {
      id: 1,
      recipientType: "all_fe",
      recipientId: null,
      message:
        "Welcome to OpenFrame! Please complete your onboarding and start registering students for the new batch starting April 2024.",
      isRead: false,
      createdAt: "2024-03-01T09:00:00.000Z",
    },
    {
      id: 2,
      recipientType: "fe",
      recipientId: 1,
      message:
        "Congratulations Rahul! You have been assigned as the top performer for March 2024. Keep up the great work!",
      isRead: true,
      createdAt: "2024-04-01T10:00:00.000Z",
    },
  ];

  // Sample time logs for both FEs (last 5 days)
  const today = new Date();
  const timeLogs: TimeLog[] = [];
  let tlId = 1;
  for (let d = 4; d >= 0; d--) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const dateStr = date.toISOString().split("T")[0];

    // FE 1 logs
    const fe1LoginHour = d % 3 === 0 ? 10 : 9; // late on some days
    const fe1LoginMin = d % 3 === 0 ? 5 : 15;
    const fe1Login = `${dateStr}T0${fe1LoginHour}:${fe1LoginMin}:00.000Z`;
    const fe1Logout = `${dateStr}T17:30:00.000Z`;
    const fe1Hours = 17.5 - fe1LoginHour - fe1LoginMin / 60;
    timeLogs.push({
      id: tlId++,
      feId: 1,
      feName: "Rahul Sharma",
      date: dateStr,
      loginTime: fe1Login,
      logoutTime: fe1Logout,
      workHours: Math.round(fe1Hours * 10) / 10,
      breakMinutes: 30,
      isLate: fe1LoginHour >= 10 || (fe1LoginHour === 9 && fe1LoginMin > 30),
    });

    // FE 2 logs
    const fe2LoginHour = d % 2 === 0 ? 10 : 9;
    const fe2LoginMin = d % 2 === 0 ? 45 : 20;
    const fe2Login = `${dateStr}T0${fe2LoginHour}:${fe2LoginMin}:00.000Z`;
    const fe2Logout = `${dateStr}T16:45:00.000Z`;
    const fe2Hours = 16.75 - fe2LoginHour - fe2LoginMin / 60;
    timeLogs.push({
      id: tlId++,
      feId: 2,
      feName: "Priya Singh",
      date: dateStr,
      loginTime: fe2Login,
      logoutTime: fe2Logout,
      workHours: Math.round(fe2Hours * 10) / 10,
      breakMinutes: 45,
      isLate: fe2LoginHour >= 10 || (fe2LoginHour === 9 && fe2LoginMin > 30),
    });
  }

  setItem(KEYS.COURSES, courses);
  setItem(KEYS.QUESTIONS, questions);
  setItem(KEYS.FES, fes);
  setItem(KEYS.STUDENTS, students);
  setItem(KEYS.REGISTRATIONS, registrations);
  setItem(KEYS.EXAM_ATTEMPTS, examAttempts);
  setItem(KEYS.CERTIFICATES, certificates);
  setItem(KEYS.NOTIFICATIONS, notifications);
  setItem(KEYS.TIME_LOGS, timeLogs);
  setItem(KEYS.ACTIVITY_LOGS, [] as ActivityLog[]);
  localStorage.setItem(KEYS.SEEDED, "true");
}

// ---- CRUD HELPERS ----
export const db = {
  // Field Executives
  getFEs: (): FieldExecutive[] => getItem<FieldExecutive>(KEYS.FES),
  saveFEs: (fes: FieldExecutive[]) => setItem(KEYS.FES, fes),

  // Courses
  getCourses: (): Course[] => getItem<Course>(KEYS.COURSES),
  saveCourses: (courses: Course[]) => setItem(KEYS.COURSES, courses),

  // Questions
  getQuestions: (): ExamQuestion[] => getItem<ExamQuestion>(KEYS.QUESTIONS),
  saveQuestions: (questions: ExamQuestion[]) =>
    setItem(KEYS.QUESTIONS, questions),

  // Registrations
  getRegistrations: (): Registration[] =>
    getItem<Registration>(KEYS.REGISTRATIONS),
  saveRegistrations: (regs: Registration[]) =>
    setItem(KEYS.REGISTRATIONS, regs),

  // Students
  getStudents: (): Student[] => getItem<Student>(KEYS.STUDENTS),
  saveStudents: (students: Student[]) => setItem(KEYS.STUDENTS, students),

  // Exam Attempts
  getExamAttempts: (): ExamAttempt[] =>
    getItem<ExamAttempt>(KEYS.EXAM_ATTEMPTS),
  saveExamAttempts: (attempts: ExamAttempt[]) =>
    setItem(KEYS.EXAM_ATTEMPTS, attempts),

  // Certificates
  getCertificates: (): Certificate[] => getItem<Certificate>(KEYS.CERTIFICATES),
  saveCertificates: (certs: Certificate[]) => setItem(KEYS.CERTIFICATES, certs),

  // Notifications
  getNotifications: (): Notification[] =>
    getItem<Notification>(KEYS.NOTIFICATIONS),
  saveNotifications: (notifs: Notification[]) =>
    setItem(KEYS.NOTIFICATIONS, notifs),

  // Time Logs
  getTimeLogs: (): TimeLog[] => getItem<TimeLog>(KEYS.TIME_LOGS),
  saveTimeLogs: (logs: TimeLog[]) => setItem(KEYS.TIME_LOGS, logs),

  // Activity Logs
  getActivityLogs: (): ActivityLog[] =>
    getItem<ActivityLog>(KEYS.ACTIVITY_LOGS),
  saveActivityLogs: (logs: ActivityLog[]) => setItem(KEYS.ACTIVITY_LOGS, logs),

  // Session
  getSession: () => {
    try {
      const raw = localStorage.getItem(KEYS.SESSION);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  saveSession: (session: unknown) =>
    localStorage.setItem(KEYS.SESSION, JSON.stringify(session)),
  clearSession: () => localStorage.removeItem(KEYS.SESSION),

  // Helpers: get next id
  nextId: (items: { id: number }[]): number =>
    items.length > 0 ? Math.max(...items.map((i) => i.id)) + 1 : 1,
};
