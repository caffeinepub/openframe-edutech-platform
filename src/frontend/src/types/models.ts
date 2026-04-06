// Data models for OpenFrame EduTech Platform

export interface FieldExecutive {
  id: number;
  feCode: string; // "FE001", "FE002"
  name: string;
  phone: string;
  principal: string; // mock II principal
  createdAt: string;
  isActive: boolean;
}

export interface Course {
  id: number;
  title: string; // auto-generated e.g. "5th Standard – English"
  standard: number; // 1–12
  medium: "English" | "Kannada";
  courseType: "Basic" | "Standard" | "Premium"; // legacy badge usage
  description: string;
  videoUrl: string;
  notes: string;
  price: number; // legacy field; fee plan drives registration price
  passingScore: number;
  isActive: boolean;
  createdAt: string;
}

export interface ExamQuestion {
  id: number;
  courseId: number;
  question: string;
  options: string[]; // 4 options
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
  medium: string; // "English" or "Kannada"
  feePlan: "Basic" | "Standard" | "Premium";
  price: number;
  status: "Pending" | "Approved" | "Rejected";
  paymentStatus: "Pending" | "Paid";
  classLink: string;
  schedule: string;
  createdAt: string;
  updatedAt: string;
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
  certNumber: string; // "CERT-2024-00001"
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
  id?: number; // FE or student id
  name: string;
  phone?: string;
  feCode?: string;
}
