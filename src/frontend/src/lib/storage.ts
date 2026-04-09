import type {
  ActivityLog,
  AdminConfig,
  BonusSlab,
  Certificate,
  Commission,
  Course,
  DeductionConfig,
  ExamAttempt,
  ExamQuestion,
  FieldExecutive,
  Notification,
  Registration,
  SalaryConfig,
  SalaryRecord,
  Student,
  TLSession,
  TeamLeader,
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
  SALARY_CONFIGS: "openframe_salary_configs",
  SALARY_RECORDS: "openframe_salary_records",
  DEDUCTION_CONFIG: "openframe_deduction_config",
  SEEDED_V4: "openframe_seeded_v4",
  SEEDED_V5: "openframe_seeded_v5",
  UNICODE_CLEANED: "openframe_unicode_cleaned_v4",
  SEEDED_V6: "openframe_seeded_v6",
  MIGRATED_V7: "openframe_migrated_v7",
  TLS: "openframe_tls",
  COMMISSIONS: "openframe_commissions",
  TL_SESSION: "openframe_tl_session",
  TL_SEEDED: "openframe_tl_seeded_v1",
  ADMIN_CONFIG: "openframe_admin_config",
  // This key is NEVER wiped by any migration — it guards all migrations from re-running.
  MIGRATION_VERSION: "openframe_migration_version",
};

// Current migration version. Bump this when adding a new destructive migration.
// Migrations ≤ this version will only run if the stored version is lower.
const CURRENT_MIGRATION_VERSION = 8;

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

// ---- MIGRATION VERSION GUARD ----
function getStoredMigrationVersion(): number {
  try {
    const raw = localStorage.getItem(KEYS.MIGRATION_VERSION);
    if (!raw) return 0;
    const v = Number.parseInt(raw, 10);
    return Number.isNaN(v) ? 0 : v;
  } catch {
    return 0;
  }
}

function setMigrationVersion(v: number): void {
  localStorage.setItem(KEYS.MIGRATION_VERSION, String(v));
}

// ---- MIGRATION ----

/**
 * migrateUnicodeCleanup — version 8.
 * Clears stale schema/seed data BUT never touches REGISTRATIONS (real user data).
 * Runs only once: guarded by MIGRATION_VERSION key (which is never wiped).
 */
export function migrateUnicodeCleanup(): void {
  const stored = getStoredMigrationVersion();
  if (stored >= 8) return;

  // Clear old individual migration flags that may be stale
  localStorage.removeItem("openframe_unicode_cleaned_v1");
  localStorage.removeItem("openframe_unicode_cleaned_v2");
  localStorage.removeItem("openframe_unicode_cleaned_v3");

  // Keys that must never be wiped: session data, real user data, and the migration version guard.
  const PRESERVE = new Set([
    KEYS.SESSION,
    KEYS.TL_SESSION,
    KEYS.MIGRATION_VERSION,
    KEYS.REGISTRATIONS, // Real user data — never wipe
    KEYS.STUDENTS, // Real user data — never wipe
    KEYS.COMMISSIONS, // Real user data — never wipe
    KEYS.CERTIFICATES, // Real user data — never wipe
    KEYS.EXAM_ATTEMPTS, // Real user data — never wipe
    KEYS.NOTIFICATIONS, // Real user data — never wipe
    KEYS.ACTIVITY_LOGS, // Real user data — never wipe
    KEYS.TIME_LOGS, // Real user data — never wipe
  ]);

  const allKeys = Object.keys(localStorage);
  for (const key of allKeys) {
    if (key.startsWith("openframe_") && !PRESERVE.has(key)) {
      localStorage.removeItem(key);
    }
  }

  // Write the new version LAST so if anything fails mid-migration, it retries next load.
  setMigrationVersion(8);
}

function migrateV1(): void {
  // Guard: only run if not already handled by the version system
  const stored = getStoredMigrationVersion();
  if (stored >= 8) return; // v8 migration handles this phase
  if (localStorage.getItem(KEYS.MIGRATED_V1)) return;
  const fes = getItem<FieldExecutive>(KEYS.FES);
  const migrated = fes.map((fe) =>
    fe.principal.startsWith("fe-principal-") ? { ...fe, principal: "" } : fe,
  );
  setItem(KEYS.FES, migrated);
  localStorage.setItem(KEYS.MIGRATED_V1, "true");
}

// ---- MIGRATION V5: commission=₹10, minActiveStudents=20 ----
function migrateV5(): void {
  if (localStorage.getItem(KEYS.SEEDED_V5)) return;
  const fes = getItem<FieldExecutive>(KEYS.FES);
  if (fes.length === 0) return; // not seeded yet, skip
  const updated = fes.map((fe) => ({
    ...fe,
    incentivePerRegistration: 10,
    minActiveStudents: fe.minActiveStudents ?? 20,
    dailyTarget: fe.dailyTarget ?? 5,
  }));
  setItem(KEYS.FES, updated);

  // Also update salary configs to use ₹10 incentive
  const configs = getItem<SalaryConfig>(KEYS.SALARY_CONFIGS);
  if (configs.length > 0) {
    const updatedConfigs = configs.map((c) => ({
      ...c,
      incentivePerRegistration: 10,
    }));
    setItem(KEYS.SALARY_CONFIGS, updatedConfigs);
  }

  localStorage.setItem(KEYS.SEEDED_V5, "true");
}

// ---- MIGRATION V6: assignedTL_ID, status, lastLoginDate ----
function migrateV6(): void {
  if (localStorage.getItem(KEYS.SEEDED_V6)) return;
  const fes = getItem<FieldExecutive>(KEYS.FES);
  if (fes.length === 0) return; // not seeded yet, skip
  const updated = fes.map((fe) => {
    const raw = fe as unknown as Record<string, unknown>;
    const existingTL =
      raw.assignedTL_ID !== undefined
        ? (raw.assignedTL_ID as string | null)
        : null;
    const existingStatus =
      raw.status !== undefined
        ? (raw.status as FieldExecutive["status"])
        : existingTL
          ? "active"
          : "unassigned";
    const existingLogin =
      typeof raw.lastLoginDate === "number" ? raw.lastLoginDate : Date.now();
    return {
      ...fe,
      assignedTL_ID: existingTL,
      status: existingStatus,
      lastLoginDate: existingLogin,
    };
  });
  setItem(KEYS.FES, updated);
  localStorage.setItem(KEYS.SEEDED_V6, "true");
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
  return `${ORDINALS[standard - 1]} Standard – ${medium}`;
}

// ---- SEED DATA ----
export function seedIfNeeded(): void {
  // Run the unicode/schema cleanup migration exactly once.
  // migrateUnicodeCleanup is guarded by MIGRATION_VERSION, which is never wiped.
  migrateUnicodeCleanup();
  migrateV1();

  if (localStorage.getItem(KEYS.SEEDED)) {
    // Still run V5 and V6 migrations even if already seeded
    migrateV5();
    migrateV6();
    // Repair any orphaned registrations (safe no-op when nothing needs fixing)
    repairOrphanedRegistrations();
    return;
  }

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
      fixedSalary: 8000,
      incentivePerRegistration: 10,
      bonusEarned: 0,
      totalEarnings: 0,
      minActiveStudents: 20,
      assignedTL_ID: "TL001",
      status: "active" as const,
      lastLoginDate: Date.now(),
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
      fixedSalary: 7000,
      incentivePerRegistration: 10,
      bonusEarned: 0,
      totalEarnings: 0,
      minActiveStudents: 20,
      assignedTL_ID: null,
      status: "unassigned" as const,
      lastLoginDate: Date.now(),
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
      courseName: "2nd Standard – English",
      courseType: "Basic",
      medium: "English",
      feePlan: "Standard",
      price: 100,
      status: "Approved",
      paymentStatus: "Paid",
      classLink: "https://meet.google.com/abc-defg-hij",
      schedule: "Mon, Wed, Fri — 7:00 PM to 9:00 PM IST",
      createdAt: "2024-03-01T10:00:00.000Z",
      updatedAt: "2024-03-03T14:00:00.000Z",
      latitude: 12.9716,
      longitude: 77.5946,
      locationAddress: "Bangalore, Karnataka",
      incentiveCalculated: false,
    },
    {
      id: 2,
      studentName: "Sneha Patel",
      studentPhone: "9823456789",
      feId: 2,
      feName: "Priya Singh",
      feCode: "FE002",
      courseId: 1,
      courseName: "1st Standard – English",
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
      incentiveCalculated: false,
    },
    {
      id: 3,
      studentName: "Vikram Reddy",
      studentPhone: "9834567890",
      feId: 1,
      feName: "Rahul Sharma",
      feCode: "FE001",
      courseId: 14,
      courseName: "2nd Standard – Kannada",
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
      incentiveCalculated: false,
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
      courseName: "2nd Standard – English",
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

  const today = new Date();
  const timeLogs: TimeLog[] = [];
  let tlId = 1;
  for (let d = 4; d >= 0; d--) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const dateStr = date.toISOString().split("T")[0];
    const fe1LoginHour = d % 3 === 0 ? 10 : 9;
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
  // Only seed registrations if none exist yet — preserve any live registrations
  if (getItem<Registration>(KEYS.REGISTRATIONS).length === 0) {
    setItem(KEYS.REGISTRATIONS, registrations);
  }
  setItem(KEYS.EXAM_ATTEMPTS, examAttempts);
  setItem(KEYS.CERTIFICATES, certificates);
  setItem(KEYS.NOTIFICATIONS, notifications);
  setItem(KEYS.TIME_LOGS, timeLogs);
  setItem(KEYS.ACTIVITY_LOGS, [] as ActivityLog[]);

  // Seed AdminConfig defaults
  const defaultAdminConfig: AdminConfig = {
    feIncentiveRate: 10,
    tlCommissionRate: 5,
    lastUpdated: new Date().toISOString(),
  };
  localStorage.setItem(KEYS.ADMIN_CONFIG, JSON.stringify(defaultAdminConfig));

  localStorage.setItem(KEYS.SEEDED, "true");
  // Mark V5 and V6 as done since we seeded with correct values
  localStorage.setItem(KEYS.SEEDED_V5, "true");
  localStorage.setItem(KEYS.SEEDED_V6, "true");
  // Mark the current migration version so migrations don't run again
  setMigrationVersion(CURRENT_MIGRATION_VERSION);
}

// ---- SALARY SEED ----
const DEFAULT_BONUS_SLABS: BonusSlab[] = [
  { minRegistrations: 0, maxRegistrations: 50, bonusPerRegistration: 0 },
  { minRegistrations: 51, maxRegistrations: 100, bonusPerRegistration: 10 },
  { minRegistrations: 101, maxRegistrations: 200, bonusPerRegistration: 20 },
  { minRegistrations: 201, maxRegistrations: null, bonusPerRegistration: 30 },
];

export function seedSalaryData(): void {
  if (localStorage.getItem(KEYS.SEEDED_V4)) {
    // Still migrate salary fields onto FEs if missing
    const fes = getItem<FieldExecutive>(KEYS.FES);
    let changed = false;
    const updated = fes.map((fe) => {
      if (fe.fixedSalary === undefined || fe.fixedSalary === null) {
        changed = true;
        return {
          ...fe,
          fixedSalary: fe.id === 1 ? 8000 : 7000,
          incentivePerRegistration: 10,
          bonusEarned: 0,
          totalEarnings: 0,
          minActiveStudents: fe.minActiveStudents ?? 20,
        };
      }
      return fe;
    });
    if (changed) setItem(KEYS.FES, updated);
    return;
  }

  // Merge salary fields onto existing FEs
  const fes = getItem<FieldExecutive>(KEYS.FES);
  const updatedFEs = fes.map((fe) => ({
    ...fe,
    fixedSalary: fe.fixedSalary ?? (fe.id === 1 ? 8000 : 7000),
    incentivePerRegistration: 10,
    bonusEarned: fe.bonusEarned ?? 0,
    totalEarnings: fe.totalEarnings ?? 0,
    minActiveStudents: fe.minActiveStudents ?? 20,
  }));
  setItem(KEYS.FES, updatedFEs);

  const configs: SalaryConfig[] = [
    {
      feId: 1,
      fixedSalary: 8000,
      incentivePerRegistration: 10,
      bonusSlabs: DEFAULT_BONUS_SLABS,
      top1Bonus: 500,
      top2Bonus: 300,
      top3Bonus: 200,
    },
    {
      feId: 2,
      fixedSalary: 7000,
      incentivePerRegistration: 10,
      bonusSlabs: DEFAULT_BONUS_SLABS,
      top1Bonus: 500,
      top2Bonus: 300,
      top3Bonus: 200,
    },
  ];

  const deductionConfig: DeductionConfig = {
    absentDeductionPerDay: 300,
    lowHoursThreshold: 4,
    lowHoursDeductionPerDay: 150,
    penaltyPerUnmetTarget: 500,
  };

  setItem(KEYS.SALARY_CONFIGS, configs);
  localStorage.setItem(KEYS.DEDUCTION_CONFIG, JSON.stringify(deductionConfig));
  setItem(KEYS.SALARY_RECORDS, []);
  localStorage.setItem(KEYS.SEEDED_V4, "true");
}

// ---- ORPHANED REGISTRATION REPAIR ----
/**
 * repairOrphanedRegistrations — fixes any Registration with feId=null or feId=0
 * by looking up an FE whose name matches the feName stored in the registration.
 * This is safe to run on every app load (it only writes when it finds repairs to make).
 */
export function repairOrphanedRegistrations(): void {
  const regs = getItem<Registration>(KEYS.REGISTRATIONS);
  const fes = getItem<FieldExecutive>(KEYS.FES);
  if (regs.length === 0 || fes.length === 0) return;

  let repaired = false;
  const updated = regs.map((r) => {
    // Only repair entries with a missing/zero feId
    const feIdNum = Number(r.feId);
    if (feIdNum && feIdNum > 0) return r;

    // Try to find an FE whose name matches feName
    const matchByName = fes.find(
      (fe) => fe.name.toLowerCase() === (r.feName ?? "").toLowerCase(),
    );
    if (matchByName) {
      console.info(
        `[repairOrphanedRegistrations] Repaired registration id=${r.id} — set feId to ${matchByName.id} (${matchByName.name})`,
      );
      repaired = true;
      return { ...r, feId: matchByName.id, feCode: matchByName.feCode };
    }
    return r;
  });

  if (repaired) {
    setItem(KEYS.REGISTRATIONS, updated);
  }
}

export const db = {
  getFEs: (): FieldExecutive[] => getItem<FieldExecutive>(KEYS.FES),
  saveFEs: (fes: FieldExecutive[]) => setItem(KEYS.FES, fes),

  getCourses: (): Course[] => getItem<Course>(KEYS.COURSES),
  saveCourses: (courses: Course[]) => setItem(KEYS.COURSES, courses),

  getQuestions: (): ExamQuestion[] => getItem<ExamQuestion>(KEYS.QUESTIONS),
  saveQuestions: (questions: ExamQuestion[]) =>
    setItem(KEYS.QUESTIONS, questions),

  getRegistrations: (): Registration[] =>
    getItem<Registration>(KEYS.REGISTRATIONS),
  saveRegistrations: (regs: Registration[]) =>
    setItem(KEYS.REGISTRATIONS, regs),

  getStudents: (): Student[] => getItem<Student>(KEYS.STUDENTS),
  saveStudents: (students: Student[]) => setItem(KEYS.STUDENTS, students),

  getExamAttempts: (): ExamAttempt[] =>
    getItem<ExamAttempt>(KEYS.EXAM_ATTEMPTS),
  saveExamAttempts: (attempts: ExamAttempt[]) =>
    setItem(KEYS.EXAM_ATTEMPTS, attempts),

  getCertificates: (): Certificate[] => getItem<Certificate>(KEYS.CERTIFICATES),
  saveCertificates: (certs: Certificate[]) => setItem(KEYS.CERTIFICATES, certs),

  getNotifications: (): Notification[] =>
    getItem<Notification>(KEYS.NOTIFICATIONS),
  saveNotifications: (notifs: Notification[]) =>
    setItem(KEYS.NOTIFICATIONS, notifs),

  getTimeLogs: (): TimeLog[] => getItem<TimeLog>(KEYS.TIME_LOGS),
  saveTimeLogs: (logs: TimeLog[]) => setItem(KEYS.TIME_LOGS, logs),

  getActivityLogs: (): ActivityLog[] =>
    getItem<ActivityLog>(KEYS.ACTIVITY_LOGS),
  saveActivityLogs: (logs: ActivityLog[]) => setItem(KEYS.ACTIVITY_LOGS, logs),

  getSalaryConfigs: (): SalaryConfig[] =>
    getItem<SalaryConfig>(KEYS.SALARY_CONFIGS),
  saveSalaryConfigs: (configs: SalaryConfig[]) =>
    setItem(KEYS.SALARY_CONFIGS, configs),

  getSalaryRecords: (): SalaryRecord[] =>
    getItem<SalaryRecord>(KEYS.SALARY_RECORDS),
  saveSalaryRecords: (records: SalaryRecord[]) =>
    setItem(KEYS.SALARY_RECORDS, records),

  getDeductionConfig: (): DeductionConfig => {
    try {
      const raw = localStorage.getItem(KEYS.DEDUCTION_CONFIG);
      if (raw) return JSON.parse(raw) as DeductionConfig;
    } catch {
      /* ignore */
    }
    return {
      absentDeductionPerDay: 300,
      lowHoursThreshold: 4,
      lowHoursDeductionPerDay: 150,
      penaltyPerUnmetTarget: 500,
    };
  },
  saveDeductionConfig: (config: DeductionConfig) =>
    localStorage.setItem(KEYS.DEDUCTION_CONFIG, JSON.stringify(config)),

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

  // ---- Team Leader ----
  getTeamLeaders: (): TeamLeader[] => getItem<TeamLeader>(KEYS.TLS),
  saveTeamLeaders: (tls: TeamLeader[]) => setItem(KEYS.TLS, tls),

  getTeamLeaderById: (id: string): TeamLeader | undefined =>
    getItem<TeamLeader>(KEYS.TLS).find((tl) => tl.id === id),

  getTLCommissions: (tlId: string): Commission[] =>
    getItem<Commission>(KEYS.COMMISSIONS).filter((c) => c.tlId === tlId),

  saveCommission: (c: Commission): void => {
    const all = getItem<Commission>(KEYS.COMMISSIONS);
    const idx = all.findIndex((x) => x.id === c.id);
    if (idx >= 0) all[idx] = c;
    else all.push(c);
    setItem(KEYS.COMMISSIONS, all);
  },

  getTLSession: (): TLSession | null => {
    try {
      const raw = localStorage.getItem(KEYS.TL_SESSION);
      return raw ? (JSON.parse(raw) as TLSession) : null;
    } catch {
      return null;
    }
  },
  saveTLSession: (s: TLSession) =>
    localStorage.setItem(KEYS.TL_SESSION, JSON.stringify(s)),
  clearTLSession: () => localStorage.removeItem(KEYS.TL_SESSION),

  nextId: (items: { id: number }[]): number =>
    items.length > 0 ? Math.max(...items.map((i) => i.id)) + 1 : 1,

  // ---- AdminConfig ----
  getAdminConfig: (): AdminConfig => {
    try {
      const raw = localStorage.getItem(KEYS.ADMIN_CONFIG);
      if (raw) return JSON.parse(raw) as AdminConfig;
    } catch {
      /* ignore */
    }
    return {
      feIncentiveRate: 10,
      tlCommissionRate: 5,
      lastUpdated: new Date().toISOString(),
    };
  },
  saveAdminConfig: (config: AdminConfig) =>
    localStorage.setItem(KEYS.ADMIN_CONFIG, JSON.stringify(config)),
};

// ---- FE ASSIGNMENT HELPERS ----

/** Returns all FEs that have no assigned TL (status === 'unassigned' or assignedTL_ID is null/undefined). */
export function getUnassignedFEs(): FieldExecutive[] {
  return getItem<FieldExecutive>(KEYS.FES).filter(
    (fe) =>
      fe.status === "unassigned" ||
      fe.assignedTL_ID === null ||
      fe.assignedTL_ID === undefined,
  );
}

/** Assigns an FE to a TL: sets assignedTL_ID, status='active', and adds feId to TL's assignedFEIds. */
export function assignFEToTL(feId: string, tlId: string): void {
  const fes = getItem<FieldExecutive>(KEYS.FES);
  const updatedFEs = fes.map((fe) =>
    String(fe.id) === feId
      ? { ...fe, assignedTL_ID: tlId, status: "active" as const }
      : fe,
  );
  setItem(KEYS.FES, updatedFEs);

  const tls = getItem<TeamLeader>(KEYS.TLS);
  const updatedTLs = tls.map((tl) => {
    if (tl.id !== tlId) return tl;
    const feIdNum = Number(feId);
    if (tl.assignedFEIds.includes(feIdNum)) return tl;
    return { ...tl, assignedFEIds: [...tl.assignedFEIds, feIdNum] };
  });
  setItem(KEYS.TLS, updatedTLs);
}

/** Updates the lastLoginDate for a given FE to now. */
export function updateFELastLogin(feId: string): void {
  const fes = getItem<FieldExecutive>(KEYS.FES);
  const updated = fes.map((fe) =>
    String(fe.id) === feId ? { ...fe, lastLoginDate: Date.now() } : fe,
  );
  setItem(KEYS.FES, updated);
}

// ---- TL CREATION HELPERS ----

/** Generate next TL ID in TL001, TL002... format */
function generateTLID(existingTLs: TeamLeader[]): string {
  const nums = existingTLs
    .map((tl) => Number.parseInt(tl.id.replace(/^TL0*/, ""), 10))
    .filter((n) => !Number.isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `TL${String(next).padStart(3, "0")}`;
}

/** Generate a referral code like TL2026ABCD */
function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  const year = new Date().getFullYear();
  return `TL${year}${suffix}`;
}

/** Create a new Team Leader with auto-generated ID and referral code.
 *  Returns null if phone is already taken. */
export function createTeamLeader(input: {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  commissionRate: number;
  monthlyTarget: number;
  joiningDate: string;
  status: "active" | "inactive";
}): TeamLeader | null {
  const existing = getItem<TeamLeader>(KEYS.TLS);
  // Phone uniqueness check
  if (existing.some((tl) => tl.phone === input.phone.trim())) return null;

  const newId = generateTLID(existing);
  const newTL: TeamLeader = {
    id: newId,
    tlID: newId,
    name: input.name.trim(),
    phone: input.phone.trim(),
    email: input.email?.trim() || "",
    address: input.address?.trim() || "",
    referralCode: generateReferralCode(),
    assignedFEIds: [],
    monthlyTarget: input.monthlyTarget,
    commissionRate: input.commissionRate,
    totalCommission: 0,
    walletBalance: 0,
    joiningDate: input.joiningDate,
    status: input.status,
    createdBy: "admin",
    createdAt: new Date().toISOString(),
  };

  setItem(KEYS.TLS, [...existing, newTL]);
  return newTL;
}

// ---- TL SEED DATA ----
export function seedTLData(): void {
  if (localStorage.getItem(KEYS.TL_SEEDED)) return;

  const now = new Date();
  const daysAgo = (d: number) => {
    const dt = new Date(now);
    dt.setDate(dt.getDate() - d);
    return dt.toISOString();
  };

  const tls: TeamLeader[] = [
    {
      id: "TL001",
      tlID: "TL001",
      name: "Amit Kumar",
      phone: "9900112233",
      email: "amit.kumar@openframe.edu",
      address: "Bangalore, Karnataka",
      referralCode: "TL2026AMTK",
      assignedFEIds: [1, 2],
      monthlyTarget: 500,
      commissionRate: 10,
      totalCommission: 240,
      walletBalance: 180,
      joiningDate: daysAgo(90).split("T")[0],
      status: "active",
      createdBy: "admin",
      createdAt: daysAgo(90),
    },
    {
      id: "TL002",
      tlID: "TL002",
      name: "Priya Singh",
      phone: "9900223344",
      email: "priya.singh@openframe.edu",
      address: "Mysore, Karnataka",
      referralCode: "TL2026PRSG",
      assignedFEIds: [1],
      monthlyTarget: 500,
      commissionRate: 10,
      totalCommission: 120,
      walletBalance: 80,
      joiningDate: daysAgo(60).split("T")[0],
      status: "active",
      createdBy: "admin",
      createdAt: daysAgo(60),
    },
  ];
  setItem(KEYS.TLS, tls);

  const commissions: Commission[] = [
    {
      id: "C001",
      tlId: "TL001",
      feId: 1,
      feName: "Rahul Sharma",
      registrationId: 1,
      amount: 5,
      status: "paid",
      createdAt: daysAgo(30),
    },
    {
      id: "C002",
      tlId: "TL001",
      feId: 1,
      feName: "Rahul Sharma",
      registrationId: 3,
      amount: 5,
      status: "paid",
      createdAt: daysAgo(28),
    },
    {
      id: "C003",
      tlId: "TL001",
      feId: 2,
      feName: "Priya Singh",
      registrationId: 2,
      amount: 5,
      status: "approved",
      createdAt: daysAgo(20),
    },
    {
      id: "C004",
      tlId: "TL001",
      feId: 1,
      feName: "Rahul Sharma",
      registrationId: 1,
      amount: 5,
      status: "approved",
      createdAt: daysAgo(15),
    },
    {
      id: "C005",
      tlId: "TL001",
      feId: 1,
      feName: "Rahul Sharma",
      registrationId: 3,
      amount: 5,
      status: "pending",
      createdAt: daysAgo(7),
    },
    {
      id: "C006",
      tlId: "TL001",
      feId: 2,
      feName: "Priya Singh",
      registrationId: 2,
      amount: 5,
      status: "pending",
      createdAt: daysAgo(5),
    },
    {
      id: "C007",
      tlId: "TL001",
      feId: 1,
      feName: "Rahul Sharma",
      registrationId: 1,
      amount: 5,
      status: "pending",
      createdAt: daysAgo(3),
    },
    {
      id: "C008",
      tlId: "TL001",
      feId: 2,
      feName: "Priya Singh",
      registrationId: 3,
      amount: 5,
      status: "pending",
      createdAt: daysAgo(2),
    },
    {
      id: "C009",
      tlId: "TL002",
      feId: 1,
      feName: "Rahul Sharma",
      registrationId: 1,
      amount: 5,
      status: "paid",
      createdAt: daysAgo(25),
    },
    {
      id: "C010",
      tlId: "TL002",
      feId: 1,
      feName: "Rahul Sharma",
      registrationId: 3,
      amount: 5,
      status: "approved",
      createdAt: daysAgo(10),
    },
    {
      id: "C011",
      tlId: "TL002",
      feId: 1,
      feName: "Rahul Sharma",
      registrationId: 2,
      amount: 5,
      status: "pending",
      createdAt: daysAgo(4),
    },
    {
      id: "C012",
      tlId: "TL001",
      feId: 1,
      feName: "Rahul Sharma",
      registrationId: 2,
      amount: 5,
      status: "paid",
      createdAt: daysAgo(45),
    },
    {
      id: "C013",
      tlId: "TL001",
      feId: 2,
      feName: "Priya Singh",
      registrationId: 1,
      amount: 5,
      status: "paid",
      createdAt: daysAgo(40),
    },
    {
      id: "C014",
      tlId: "TL001",
      feId: 1,
      feName: "Rahul Sharma",
      registrationId: 3,
      amount: 5,
      status: "approved",
      createdAt: daysAgo(12),
    },
    {
      id: "C015",
      tlId: "TL001",
      feId: 2,
      feName: "Priya Singh",
      registrationId: 2,
      amount: 5,
      status: "paid",
      createdAt: daysAgo(35),
    },
  ];
  setItem(KEYS.COMMISSIONS, commissions);

  localStorage.setItem(KEYS.TL_SEEDED, "true");
}
