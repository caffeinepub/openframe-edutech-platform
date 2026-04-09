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
export interface RegistrationRecord {
    id: bigint;
    status: string;
    latitude?: number;
    paymentStatus: string;
    feCode: string;
    feName: string;
    studentName: string;
    feId: bigint;
    createdAt: string;
    feePlan: string;
    studentPhone: string;
    updatedAt: string;
    longitude?: number;
    schedule: string;
    price: bigint;
    courseName: string;
    courseType: string;
    classLink: string;
    courseId: bigint;
    locationAddress?: string;
    incentiveCalculated: boolean;
    medium: string;
}
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
export interface backendInterface {
    /**
     * / Add or update a full registration record (called by FE on any device)
     */
    addRegistrationRecord(rec: RegistrationRecord): Promise<void>;
    assignBatch(studentId: StudentId, batch: string): Promise<void>;
    createCourse(name: string, courseType: CourseType, price: bigint, lessons: Array<string>, passingScore: bigint): Promise<void>;
    getAllCourses(): Promise<Array<Course>>;
    /**
     * / Get all registration records (called by admin to see all FE registrations)
     */
    getAllRegistrationRecords(): Promise<Array<RegistrationRecord>>;
    getAllStudents(): Promise<Array<Student>>;
    getCourse(id: CourseId): Promise<Course | null>;
    getDashboard(): Promise<DashboardStats>;
    /**
     * / Get registration records for a specific FE (called by FE to see their own registrations)
     */
    getRegistrationRecordsByFE(feId: bigint): Promise<Array<RegistrationRecord>>;
    getStudent(id: StudentId): Promise<Student | null>;
    processPayment(studentId: StudentId, amount: bigint): Promise<void>;
    registerStudent(name: string, referredBy: bigint): Promise<StudentId>;
    registerStudentForCourse(studentId: StudentId, courseId: CourseId): Promise<void>;
    setAdmin(): Promise<void>;
    /**
     * / Update payment status and approval details for a registration (called by admin)
     */
    updateRegistrationRecord(id: bigint, status: string, paymentStatus: string, classLink: string, schedule: string, updatedAt: string): Promise<void>;
}
