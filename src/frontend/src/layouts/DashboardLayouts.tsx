import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Award,
  BarChart2,
  BarChart3,
  Bell,
  BookOpen,
  ChevronRight,
  ClipboardList,
  Clock,
  GraduationCap,
  IndianRupee,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Settings2,
  Target,
  TrendingUp,
  Trophy,
  UserCheck2,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { db } from "../lib/storage";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/field-executives", label: "Field Executives", icon: Users },
  { href: "/admin/team-leaders", label: "Team Leaders", icon: UserCheck2 },
  { href: "/admin/registrations", label: "Registrations", icon: ClipboardList },
  { href: "/admin/courses", label: "Courses", icon: BookOpen },
  { href: "/admin/certificates", label: "Certificates", icon: Award },
  { href: "/admin/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/admin/targets", label: "Targets", icon: Target },
  { href: "/admin/fe-performance", label: "FE Performance", icon: BarChart3 },
  { href: "/admin/attendance", label: "Attendance", icon: Clock },
  { href: "/admin/map", label: "Map View", icon: MapPin },
  { href: "/admin/payroll", label: "Payroll", icon: IndianRupee },
  {
    href: "/admin/incentive-settings",
    label: "Incentive Settings",
    icon: Settings2,
  },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { session, logout } = useApp();
  const router = useRouterState();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentPath = router.location.pathname;

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-sidebar-border">
        <div className="w-8 h-8 teal-gradient rounded-lg flex items-center justify-center flex-shrink-0">
          <GraduationCap className="h-4 w-4 text-white" />
        </div>
        <div>
          <span className="text-sm font-bold text-sidebar-foreground">
            OpenFrame
          </span>
          <div className="text-xs text-sidebar-accent-foreground mt-0.5">
            <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded text-[10px] font-semibold">
              ADMIN
            </span>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-0.5 px-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active =
              currentPath === href || currentPath.startsWith(`${href}/`);
            return (
              <li key={href}>
                <Link
                  to={href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent",
                  )}
                  data-ocid={`admin.${label.toLowerCase().replace(/ /g, "_")}.link`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span>{label}</span>
                  {active && <ChevronRight className="ml-auto h-3 w-3" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0">
            {session?.name?.[0]?.toUpperCase() ?? "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-sidebar-foreground truncate">
              {session?.name ?? "Admin"}
            </p>
            <p className="text-xs text-sidebar-accent-foreground">
              Administrator
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground gap-2"
          onClick={handleLogout}
          data-ocid="admin.logout.button"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside className="hidden md:flex flex-col w-56 sidebar-gradient flex-shrink-0">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 h-full w-56 sidebar-gradient z-50 flex flex-col md:hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
                <span className="text-sm font-bold text-sidebar-foreground">
                  Menu
                </span>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="text-sidebar-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-border">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-1 text-muted-foreground"
            data-ocid="admin.mobile_menu.toggle"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 teal-gradient rounded flex items-center justify-center">
              <GraduationCap className="h-3 w-3 text-white" />
            </div>
            <span className="font-bold text-sm">OpenFrame Admin</span>
          </div>
          <button type="button" className="ml-auto p-1" onClick={handleLogout}>
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <main className="flex-1 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

// FE Layout
const feNavItems = [
  { href: "/fe/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/fe/register-student", label: "Register Student", icon: Users },
  { href: "/fe/my-students", label: "My Students", icon: ClipboardList },
  { href: "/fe/performance", label: "Performance", icon: TrendingUp },
  { href: "/fe/salary", label: "My Salary", icon: IndianRupee },
  { href: "/fe/notifications", label: "Notifications", icon: Bell },
];

export function FELayout({ children }: { children: React.ReactNode }) {
  const { session, logout } = useApp();
  const { clear: clearII } = useInternetIdentity();
  const navigate = useNavigate();
  const router = useRouterState();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const currentPath = router.location.pathname;

  // Assignment guard — redirect unassigned FEs to blocked screen
  useEffect(() => {
    if (!session?.id) return;
    const fes = db.getFEs();
    const fe = fes.find((f) => f.id === session.id);
    if (fe && (fe.assignedTL_ID === null || fe.status === "unassigned")) {
      navigate({ to: "/fe/blocked" });
    }
  }, [session?.id, navigate]);

  const handleLogout = () => {
    clearII();
    logout();
    window.location.href = "/";
  };

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-sidebar-border">
        <div className="w-8 h-8 teal-gradient rounded-lg flex items-center justify-center flex-shrink-0">
          <GraduationCap className="h-4 w-4 text-white" />
        </div>
        <div>
          <span className="text-sm font-bold text-sidebar-foreground">
            OpenFrame
          </span>
          <div className="text-xs mt-0.5">
            <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded text-[10px] font-semibold">
              FIELD EXEC
            </span>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-0.5 px-2">
          {feNavItems.map(({ href, label, icon: Icon }) => {
            const active = currentPath === href;
            return (
              <li key={href}>
                <Link
                  to={href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent",
                  )}
                  data-ocid={`fe.${label.toLowerCase().replace(/ /g, "_")}.link`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span>{label}</span>
                  {active && <ChevronRight className="ml-auto h-3 w-3" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {session?.name?.[0]?.toUpperCase() ?? "F"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-sidebar-foreground truncate">
              {session?.name ?? "FE"}
            </p>
            <p className="text-xs text-sidebar-accent-foreground">
              {session?.feCode ?? "Field Executive"}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent gap-2"
          onClick={handleLogout}
          data-ocid="fe.logout.button"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside className="hidden md:flex flex-col w-56 sidebar-gradient flex-shrink-0">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 h-full w-56 sidebar-gradient z-50 flex flex-col md:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-border">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-1"
            data-ocid="fe.mobile_menu.toggle"
          >
            <Menu className="h-5 w-5 text-muted-foreground" />
          </button>
          <span className="font-bold text-sm">OpenFrame FE</span>
          <button type="button" className="ml-auto" onClick={handleLogout}>
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <main className="flex-1 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

// Student Layout
export function StudentLayout({ children }: { children: React.ReactNode }) {
  const { session, logout } = useApp();
  const router = useRouterState();
  const currentPath = router.location.pathname;

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  const studentNavItems = [
    { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/student/exam", label: "Exam", icon: BookOpen },
    { href: "/student/certificate", label: "Certificate", icon: Award },
    { href: "/student/notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-white border-b border-border shadow-xs">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center h-14 gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 teal-gradient rounded-lg flex items-center justify-center">
                <GraduationCap className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-bold text-sm">OpenFrame</span>
            </div>

            <nav className="flex items-center gap-1 flex-1 overflow-x-auto">
              {studentNavItems.map(({ href, label, icon: Icon }) => {
                const active = currentPath === href;
                return (
                  <Link
                    key={href}
                    to={href}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    data-ocid={`student.${label.toLowerCase()}.link`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:block">
                {session?.name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="gap-1.5"
                data-ocid="student.logout.button"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
