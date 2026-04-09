// Data models for OpenFrame EduTech Platform

export interface FieldExecutive {
  id: number;
  feCode: string; // "FE001", "FE002"
  name: string;
  phone: string;
  principal: string; // mock II principal
  createdAt: string;
  isActive: boolean;
  // v3 additions
  dailyTarget: number;
  weeklyTarget: number;
  monthlyTarget: number;
  loginTime: string | null;
  logoutTime: string | null;
  totalWorkHours: number;
  performanceScore: number;
  rank: "Gold" | "Silver" | "Bronze" | "Unranked";
  // v4 salary fields
  fixedSalary: number;
  incentivePerRegistration: number;
  bonusEarned: number;
  totalEarnings: number;
  // v5 commission/team fields
  minActiveStudents?: number;
  // v6 assignment fields
  assignedTL_ID: string | null;
  status: "unassigned" | "active";
  lastLoginDate: number;
}

export interface Course {
  id: number;
  title: string;
  standard: number;
  medium: "English" | "Kannada";
  courseType: "Basic" | "Standard" | "Premium";
  description: string;
  videoUrl: string;
  notes: string;
  price: number;
  passingScore: number;
  isActive: boolean;
  createdAt: string;
}

export interface ExamQuestion {
  id: number;
  courseId: number;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface Registration {
  id: number;
  studentName: string;
  studentPhone: string;
  feId: number;
  feName: string;
  feCode: string;
  courseId: number;
  courseName: string;
  courseType: string;
  medium: string;
  feePlan: "Basic" | "Standard" | "Premium";
  price: number;
  status: "Pending" | "Approved" | "Rejected";
  paymentStatus: "Pending" | "Paid";
  classLink: string;
  schedule: string;
  createdAt: string;
  updatedAt: string;
  latitude: number | null;
  longitude: number | null;
  locationAddress: string | null;
}

export interface Student {
  id: number;
  name: string;
  phone: string;
  principal: string;
  registrationId: number | null;
  createdAt: string;
}

export interface ExamAttempt {
  id: number;
  studentId: number;
  registrationId: number;
  courseId: number;
  answers: number[];
  score: number;
  passed: boolean;
  takenAt: string;
}

export interface Certificate {
  id: number;
  studentId: number;
  registrationId: number;
  courseId: number;
  studentName: string;
  courseName: string;
  certNumber: string;
  issuedAt: string;
}

export interface Notification {
  id: number;
  recipientType: "all" | "fe" | "student" | "all_fe" | "all_student";
  recipientId: number | null;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuthSession {
  role: "admin" | "fe" | "student";
  id?: number;
  name: string;
  phone?: string;
  feCode?: string;
}

export interface TimeLog {
  id: number;
  feId: number;
  feName: string;
  date: string;
  loginTime: string | null;
  logoutTime: string | null;
  workHours: number;
  breakMinutes: number;
  isLate: boolean;
}

export interface ActivityLog {
  id: number;
  feId: number;
  action: string;
  timestamp: string;
  details: string;
}

// ---- Salary & Incentive System ----

export interface BonusSlab {
  minRegistrations: number;
  maxRegistrations: number | null; // null = unlimited
  bonusPerRegistration: number;
}

export interface DeductionConfig {
  absentDeductionPerDay: number;
  lowHoursThreshold: number;
  lowHoursDeductionPerDay: number;
  penaltyPerUnmetTarget: number;
}

export interface SalaryConfig {
  feId: number;
  fixedSalary: number;
  incentivePerRegistration: number;
  bonusSlabs: BonusSlab[];
  top1Bonus: number;
  top2Bonus: number;
  top3Bonus: number;
}

export interface SalaryRecord {
  id: number;
  feId: number;
  feName: string;
  feCode: string;
  month: string; // "2026-04"
  totalRegistrations: number;
  totalPaidRegistrations: number;
  fixedSalary: number;
  incentiveAmount: number;
  bonusAmount: number;
  top3BonusAmount: number;
  attendanceDeduction: number;
  penaltyAmount: number;
  finalSalary: number;
  paymentStatus: "Pending" | "Approved" | "Paid";
  generatedAt: string;
}

// ---- Team Leader System ----

export interface TeamLeader {
  id: string;
  name: string;
  phone: string;
  referralCode: string;
  assignedFEIds: number[];
  monthlyTarget: number;
  totalCommission: number;
  walletBalance: number;
  createdAt: string;
}

export interface Commission {
  id: string;
  tlId: string;
  feId: number;
  feName: string;
  registrationId: number;
  amount: number;
  status: "pending" | "approved" | "paid";
  createdAt: string;
}

export interface TLSession {
  tlId: string;
  name: string;
  phone: string;
  referralCode: string;
}
