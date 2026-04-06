import { Outlet, createRootRoute, createRoute } from "@tanstack/react-router";
import {
  AdminLayout,
  FELayout,
  StudentLayout,
} from "./layouts/DashboardLayouts";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminNotificationsPage from "./pages/admin/AdminNotificationsPage";
import AnalyticsPage from "./pages/admin/AnalyticsPage";
import AttendancePage from "./pages/admin/AttendancePage";
import CertificatesPage from "./pages/admin/CertificatesPage";
import CoursesPage from "./pages/admin/CoursesPage";
import FieldExecutivesPage from "./pages/admin/FieldExecutivesPage";
import LeaderboardPage from "./pages/admin/LeaderboardPage";
import MapPage from "./pages/admin/MapPage";
import PayrollPage from "./pages/admin/PayrollPage";
import RegistrationsPage from "./pages/admin/RegistrationsPage";
import TargetsPage from "./pages/admin/TargetsPage";
import FEDashboard from "./pages/fe/FEDashboard";
import FENotificationsPage from "./pages/fe/FENotificationsPage";
import MySalaryPage from "./pages/fe/MySalaryPage";
import MyStudentsPage from "./pages/fe/MyStudentsPage";
import PerformancePage from "./pages/fe/PerformancePage";
import RegisterStudentPage from "./pages/fe/RegisterStudentPage";
import ExamPage from "./pages/student/ExamPage";
import StudentCertificatePage from "./pages/student/StudentCertificatePage";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentNotificationsPage from "./pages/student/StudentNotificationsPage";

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const adminLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "admin-layout",
  component: () => (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  ),
});

const adminDashboardRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/admin/dashboard",
  component: AdminDashboard,
});

const adminFERoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/admin/field-executives",
  component: FieldExecutivesPage,
});

const adminRegistrationsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/admin/registrations",
  component: RegistrationsPage,
});

const adminCoursesRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/admin/courses",
  component: CoursesPage,
});

const adminCertificatesRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/admin/certificates",
  component: CertificatesPage,
});

const adminLeaderboardRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/admin/leaderboard",
  component: LeaderboardPage,
});

const adminNotificationsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/admin/notifications",
  component: AdminNotificationsPage,
});

const adminAnalyticsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/admin/analytics",
  component: AnalyticsPage,
});

const adminTargetsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/admin/targets",
  component: TargetsPage,
});

const adminAttendanceRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/admin/attendance",
  component: AttendancePage,
});

const adminMapRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/admin/map",
  component: MapPage,
});

const adminPayrollRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/admin/payroll",
  component: PayrollPage,
});

const feLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "fe-layout",
  component: () => (
    <FELayout>
      <Outlet />
    </FELayout>
  ),
});

const feDashboardRoute = createRoute({
  getParentRoute: () => feLayoutRoute,
  path: "/fe/dashboard",
  component: FEDashboard,
});

const feRegisterRoute = createRoute({
  getParentRoute: () => feLayoutRoute,
  path: "/fe/register-student",
  component: RegisterStudentPage,
});

const feStudentsRoute = createRoute({
  getParentRoute: () => feLayoutRoute,
  path: "/fe/my-students",
  component: MyStudentsPage,
});

const feNotificationsRoute = createRoute({
  getParentRoute: () => feLayoutRoute,
  path: "/fe/notifications",
  component: FENotificationsPage,
});

const fePerformanceRoute = createRoute({
  getParentRoute: () => feLayoutRoute,
  path: "/fe/performance",
  component: PerformancePage,
});

const feSalaryRoute = createRoute({
  getParentRoute: () => feLayoutRoute,
  path: "/fe/salary",
  component: MySalaryPage,
});

const studentLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "student-layout",
  component: () => (
    <StudentLayout>
      <Outlet />
    </StudentLayout>
  ),
});

const studentDashboardRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: "/student/dashboard",
  component: StudentDashboard,
});

const studentExamRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: "/student/exam",
  component: ExamPage,
});

const studentCertificateRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: "/student/certificate",
  component: StudentCertificatePage,
});

const studentNotificationsRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: "/student/notifications",
  component: StudentNotificationsPage,
});

export const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  adminLayoutRoute.addChildren([
    adminDashboardRoute,
    adminFERoute,
    adminRegistrationsRoute,
    adminCoursesRoute,
    adminCertificatesRoute,
    adminLeaderboardRoute,
    adminNotificationsRoute,
    adminAnalyticsRoute,
    adminTargetsRoute,
    adminAttendanceRoute,
    adminMapRoute,
    adminPayrollRoute,
  ]),
  feLayoutRoute.addChildren([
    feDashboardRoute,
    feRegisterRoute,
    feStudentsRoute,
    feNotificationsRoute,
    fePerformanceRoute,
    feSalaryRoute,
  ]),
  studentLayoutRoute.addChildren([
    studentDashboardRoute,
    studentExamRoute,
    studentCertificateRoute,
    studentNotificationsRoute,
  ]),
]);
