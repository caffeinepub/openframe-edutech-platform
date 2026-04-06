import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Student {
    id: StudentId;
    name: string;
    referredBy: bigint;
}
export type CourseId = bigint;
export type StudentId = bigint;
export interface DashboardStats {
    totalStudents: bigint;
    totalRevenue: bigint;
    totalRegistrations: bigint;
}
export interface Course {
    id: CourseId;
    name: string;
    passingScore: bigint;
    lessons: Array<string>;
    price: bigint;
    courseType: CourseType;
}
export enum CourseType {
    premium = "premium",
    basic = "basic",
    standard = "standard"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignBatch(studentId: StudentId, batch: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createCourse(name: string, courseType: CourseType, price: bigint, lessons: Array<string>, passingScore: bigint): Promise<void>;
    getAllCourses(): Promise<Array<Course>>;
    getAllStudents(): Promise<Array<Student>>;
    getCallerUserRole(): Promise<UserRole>;
    getCourse(id: CourseId): Promise<Course | null>;
    getDashboard(): Promise<DashboardStats>;
    getStudent(id: StudentId): Promise<Student | null>;
    isCallerAdmin(): Promise<boolean>;
    processPayment(studentId: StudentId, amount: bigint): Promise<void>;
    registerStudent(name: string, referredBy: bigint): Promise<StudentId>;
    registerStudentForCourse(studentId: StudentId, courseId: CourseId): Promise<void>;
    setAdmin(): Promise<void>;
}
