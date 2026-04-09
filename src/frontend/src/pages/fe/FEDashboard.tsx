import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  IndianRupee,
  LogIn,
  LogOut,
  Medal,
  ShoppingBag,
  Target,
  TrendingUp,
  Trophy,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { StatCard } from "../../components/StatCard";
import { StatusBadge } from "../../components/StatusBadge";
import { useApp } from "../../context/AppContext";
import { computeTodayEarnings } from "../../lib/salaryCalc";
import { db, migrateUnicodeCleanup } from "../../lib/storage";
import type { FieldExecutive, Registration, TimeLog } from "../../types/models";
import FEBlockingScreen from "./FEBlockingScreen";

// Commission rules constants
const COMMISSION_RATE = 10; // ₹10 per paid registration
const MIN_ACTIVE_STUDENTS = 20;
const DEFAULT_DAILY_TARGET = 5;

// Assignment guard wrapper — checks before mounting dashboard hooks
function FEDashboardGuard() {
  const { session } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!session) {
      navigate({ to: "/login" });
    }
  }, [session, navigate]);

  if (!session) return null;

  const feRecord = db.getFEs().find((f) => f.id === Number(session.id)) ?? null;
  const isUnassigned =
    !feRecord ||
    feRecord.assignedTL_ID === null ||
    feRecord.status === "unassigned";

  if (isUnassigned) {
    return <FEBlockingScreen />;
  }

  return <FEDashboardContent />;
}

export default FEDashboardGuard;

function FEDashboardContent() {
  const { session } = useApp();
  const [regs, setRegs] = useState<Registration[]>([]);
  const [feData, setFeData] = useState<FieldExecutive | null>(null);
  const [todayLog, setTodayLog] = useState<TimeLog | null>(null);
  const [elapsedHours, setElapsedHours] = useState(0);
  const [dismissedTargetAlert, setDismissedTargetAlert] = useState(false);
  const [dismissedStudentsAlert, setDismissedStudentsAlert] = useState(false);
  const alertShownRef = useRef(false);
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    paid: 0,
    pending: 0,
    totalEarned: 0,
    totalSales: 0,
    weekCount: 0,
    monthCount: 0,
    todayIncentive: 0,
    todayPaidRegs: 0,
    basicPaid: 0,
    standardPaid: 0,
    premiumPaid: 0,
    basicEarned: 0,
    standardEarned: 0,
    premiumEarned: 0,
    basicTotal: 0,
    standardTotal: 0,
    premiumTotal: 0,
  });

  const loadData = useCallback(() => {
    if (!session?.id) return;
    const allRegs = db.getRegistrations().filter((r) => r.feId === session.id);
    const fe = db.getFEs().find((f) => f.id === session.id) ?? null;
    const today = new Date().toDateString();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    const todayRegs = allRegs.filter(
      (r) => new Date(r.createdAt).toDateString() === today,
    );
    const todayCount = todayRegs.length;
    const paid = allRegs.filter((r) => r.paymentStatus === "Paid").length;
    const pending = allRegs.filter((r) => r.status === "Pending").length;

    const paidRegs = allRegs.filter((r) => r.paymentStatus === "Paid");
    const totalEarned = paidRegs.length * COMMISSION_RATE;

    const weekCount = allRegs.filter(
      (r) => new Date(r.createdAt) >= weekAgo,
    ).length;
    const monthCount = allRegs.filter(
      (r) => new Date(r.createdAt) >= monthAgo,
    ).length;

    // Per-plan paid earnings
    const basicPaid = paidRegs.filter((r) => r.feePlan === "Basic").length;
    const standardPaid = paidRegs.filter(
      (r) => r.feePlan === "Standard",
    ).length;
    const premiumPaid = paidRegs.filter((r) => r.feePlan === "Premium").length;
    const basicEarned = basicPaid * 50;
    const standardEarned = standardPaid * 100;
    const premiumEarned = premiumPaid * 150;

    // Total Sales = sum of fee amounts for paid registrations
    const totalSales = basicEarned + standardEarned + premiumEarned;

    // Per-plan total registrations (all, not just paid)
    const basicTotal = allRegs.filter((r) => r.feePlan === "Basic").length;
    const standardTotal = allRegs.filter(
      (r) => r.feePlan === "Standard",
    ).length;
    const premiumTotal = allRegs.filter((r) => r.feePlan === "Premium").length;

    // Today's salary incentive
    const { todayIncentive, todayPaidRegistrations } = computeTodayEarnings(
      session.id,
    );

    // Today's time log
    const todayStr = new Date().toISOString().split("T")[0];
    const logs = db.getTimeLogs();
    const tLog =
      logs.find((l) => l.feId === session.id && l.date === todayStr) ?? null;
    setTodayLog(tLog);

    setRegs(allRegs.slice(0, 5));
    setFeData(fe);
    setStats({
      total: allRegs.length,
      today: todayCount,
      paid,
      pending,
      totalEarned,
      totalSales,
      weekCount,
      monthCount,
      todayIncentive,
      todayPaidRegs: todayPaidRegistrations,
      basicPaid,
      standardPaid,
      premiumPaid,
      basicEarned,
      standardEarned,
      premiumEarned,
      basicTotal,
      standardTotal,
      premiumTotal,
    });

    // Auto-alerts (toast)
    if (!alertShownRef.current && fe) {
      const currentHour = new Date().getHours();
      if (todayCount >= (fe.dailyTarget ?? DEFAULT_DAILY_TARGET)) {
        toast.success("🎉 Daily target achieved! Great work!");
        alertShownRef.current = true;
      } else if (
        currentHour >= 14 &&
        todayCount < (fe.dailyTarget ?? DEFAULT_DAILY_TARGET) * 0.5
      ) {
        toast.warning("⚠️ You've reached less than 50% of your daily target");
        alertShownRef.current = true;
      }
    }
  }, [session]);

  useEffect(() => {
    migrateUnicodeCleanup();
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!todayLog?.loginTime || todayLog.logoutTime) return;
    const updateElapsed = () => {
      const loginMs = new Date(todayLog.loginTime as string).getTime();
      const elapsed = (Date.now() - loginMs) / 3600000;
      setElapsedHours(Math.round(elapsed * 10) / 10);
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 60000);
    return () => clearInterval(interval);
  }, [todayLog]);

  function handleClockIn() {
    if (!session?.id) return;
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const loginTime = now.toISOString();
    const isLate =
      now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 30);

    const logs = db.getTimeLogs();
    const fe = db.getFEs().find((f) => f.id === session.id);
    const newLog: TimeLog = {
      id: db.nextId(logs),
      feId: session.id,
      feName: fe?.name ?? session.name,
      date: todayStr,
      loginTime,
      logoutTime: null,
      workHours: 0,
      breakMinutes: 0,
      isLate,
    };
    db.saveTimeLogs([...logs, newLog]);
    setTodayLog(newLog);
    const timeStr = now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    toast.success(`Clocked in at ${timeStr}${isLate ? " (late)" : ""}`);
  }

  function handleClockOut() {
    if (!session?.id || !todayLog) return;
    const now = new Date();
    const logoutTime = now.toISOString();
    const loginMs = new Date(todayLog.loginTime as string).getTime();
    const workHours =
      Math.round(((now.getTime() - loginMs) / 3600000) * 10) / 10;

    const logs = db.getTimeLogs();
    const updated = logs.map((l) =>
      l.id === todayLog.id ? { ...l, logoutTime, workHours } : l,
    );
    db.saveTimeLogs(updated);
    const updatedLog = { ...todayLog, logoutTime, workHours };
    setTodayLog(updatedLog);
    toast.success(`Clocked out. Worked ${workHours} hours today.`);
  }

  const dailyTarget = feData?.dailyTarget ?? DEFAULT_DAILY_TARGET;
  const weeklyTarget = feData?.weeklyTarget ?? 25;
  const monthlyTarget = feData?.monthlyTarget ?? 100;
  const minActiveStudents = feData?.minActiveStudents ?? MIN_ACTIVE_STUDENTS;

  const dailyProgress = Math.min((stats.today / dailyTarget) * 100, 100);
  const weeklyProgress = Math.min((stats.weekCount / weeklyTarget) * 100, 100);
  const monthlyProgress = Math.min(
    (stats.monthCount / monthlyTarget) * 100,
    100,
  );

  // Alert conditions
  const currentHour = new Date().getHours();
  const showTargetAlert =
    !dismissedTargetAlert && currentHour >= 17 && stats.today < dailyTarget;
  const showStudentsAlert =
    !dismissedStudentsAlert && stats.paid < minActiveStudents;

  // Progress bar color based on achievement
  function getProgressColor(current: number, target: number): string {
    if (target === 0) return "";
    const pct = current / target;
    if (pct >= 1) return "[&>div]:bg-green-500";
    if (pct >= 0.5) return "[&>div]:bg-amber-500";
    return "[&>div]:bg-red-500";
  }

  function getRankBadge() {
    const rank = feData?.rank ?? "Unranked";
    if (rank === "Gold")
      return (
        <Badge className="bg-yellow-400 text-white hover:bg-yellow-400 gap-1">
          <Trophy className="h-3 w-3" /> Gold
        </Badge>
      );
    if (rank === "Silver")
      return (
        <Badge className="bg-gray-400 text-white hover:bg-gray-400 gap-1">
          <Medal className="h-3 w-3" /> Silver
        </Badge>
      );
    if (rank === "Bronze")
      return (
        <Badge className="bg-orange-500 text-white hover:bg-orange-500 gap-1">
          <Medal className="h-3 w-3" /> Bronze
        </Badge>
      );
    return <Badge variant="outline">Unranked</Badge>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {session?.name}!
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {session?.feCode} • Field Executive Dashboard
        </p>
      </div>

      {/* Commission Rules Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-1.5 text-blue-700 font-medium">
          <IndianRupee className="h-3.5 w-3.5" />
          <span>{"Commission: ₹10/paid reg"}</span>
        </div>
        <div className="text-blue-400 hidden sm:block">|</div>
        <div className="flex items-center gap-1.5 text-blue-700 font-medium">
          <Target className="h-3.5 w-3.5" />
          <span>Daily Target: {DEFAULT_DAILY_TARGET} regs/day</span>
        </div>
        <div className="text-blue-400 hidden sm:block">|</div>
        <div className="flex items-center gap-1.5 text-blue-700 font-medium">
          <UserCheck className="h-3.5 w-3.5" />
          <span>Min Active Students: {MIN_ACTIVE_STUDENTS}</span>
        </div>
      </div>

      {/* Persistent Alert Banners */}
      {showTargetAlert && (
        <div
          className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start justify-between gap-3"
          data-ocid="fe.target_alert.error_state"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700">
                Daily Target Not Met
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                {stats.today} / {dailyTarget} registrations completed today.
                Target required: {dailyTarget}.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDismissedTargetAlert(true)}
            className="text-red-400 hover:text-red-600 flex-shrink-0"
            data-ocid="fe.target_alert.close_button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {showStudentsAlert && (
        <div
          className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start justify-between gap-3"
          data-ocid="fe.students_alert.error_state"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-700">
                Active Students Below Minimum
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                {stats.paid} / {minActiveStudents} active (paid) students. You
                need {minActiveStudents - stats.paid} more paid students to meet
                the minimum requirement.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDismissedStudentsAlert(true)}
            className="text-amber-400 hover:text-amber-600 flex-shrink-0"
            data-ocid="fe.students_alert.close_button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Stats — Row 1: 5 core cards including Total Sales */}
      <div
        className="grid grid-cols-2 lg:grid-cols-5 gap-4"
        data-ocid="fe.dashboard.section"
      >
        <StatCard
          title="My Students"
          value={stats.total}
          icon={Users}
          subtitle="Total registered"
          color="teal"
          data-ocid="fe.total_students.card"
        />
        <StatCard
          title="Today"
          value={stats.today}
          icon={UserPlus}
          subtitle="Registered today"
          color="blue"
          data-ocid="fe.today_registrations.card"
        />
        <StatCard
          title="Active Students"
          value={stats.paid}
          icon={UserCheck}
          subtitle={`Min ${minActiveStudents} required`}
          color={stats.paid >= minActiveStudents ? "green" : "orange"}
          data-ocid="fe.active_students.card"
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          icon={Clock}
          subtitle="Awaiting approval"
          color="orange"
          data-ocid="fe.pending_students.card"
        />
        <StatCard
          title="Total Sales"
          value={`₹${stats.totalSales.toLocaleString("en-IN")}`}
          icon={ShoppingBag}
          subtitle="From paid registrations"
          color="green"
          data-ocid="fe.total_sales.card"
        />
      </div>

      {/* Stats — Row 2: 3 plan registration cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          title="Basic Plan"
          value={stats.basicTotal}
          icon={Users}
          subtitle={"₹50/student"}
          color="blue"
          data-ocid="fe.basic_plan.card"
        />
        <StatCard
          title="Standard Plan"
          value={stats.standardTotal}
          icon={Users}
          subtitle={"₹100/student"}
          color="teal"
          data-ocid="fe.standard_plan.card"
        />
        <StatCard
          title="Premium Plan"
          value={stats.premiumTotal}
          icon={Users}
          subtitle={"₹150/student"}
          color="purple"
          data-ocid="fe.premium_plan.card"
        />
      </div>

      {/* Performance Score + Clock In/Out */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          className="bg-white rounded-xl border border-border shadow-card p-5"
          data-ocid="fe.performance.card"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-foreground">Performance</h3>
            </div>
            {getRankBadge()}
          </div>
          <div className="flex items-end gap-3">
            <div>
              <p className="text-4xl font-bold text-foreground">
                {feData?.performanceScore ?? 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Performance Score
              </p>
            </div>
            <div className="flex-1 pb-2">
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full teal-gradient rounded-full transition-all"
                  style={{ width: `${feData?.performanceScore ?? 0}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0</span>
                <span>100</span>
              </div>
            </div>
          </div>
        </div>

        <div
          className="bg-white rounded-xl border border-border shadow-card p-5"
          data-ocid="fe.clock.card"
        >
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground">Work Hours</h3>
          </div>
          {!todayLog?.loginTime ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Not clocked in today yet
              </p>
              <Button
                className="gap-2 bg-green-600 hover:bg-green-700 text-white border-0"
                onClick={handleClockIn}
                data-ocid="fe.clock_in.button"
              >
                <LogIn className="h-4 w-4" />
                Clock In
              </Button>
            </div>
          ) : todayLog.logoutTime ? (
            <div className="space-y-2">
              <p className="text-sm text-foreground">
                Worked <span className="font-bold">{todayLog.workHours}h</span>{" "}
                today
              </p>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>
                  In:{" "}
                  {new Date(todayLog.loginTime as string).toLocaleTimeString(
                    "en-IN",
                    { hour: "2-digit", minute: "2-digit" },
                  )}
                </span>
                <span>
                  Out:{" "}
                  {new Date(todayLog.logoutTime).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <Badge
                variant="outline"
                className="bg-green-50 border-green-200 text-green-700"
              >
                Day Complete
              </Badge>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-sm text-foreground">
                  Clocked in at{" "}
                  <span className="font-semibold">
                    {new Date(todayLog.loginTime as string).toLocaleTimeString(
                      "en-IN",
                      { hour: "2-digit", minute: "2-digit" },
                    )}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Elapsed: {elapsedHours}h
                </p>
              </div>
              <Button
                variant="outline"
                className="gap-2 border-red-200 text-red-600 hover:bg-red-50"
                onClick={handleClockOut}
                data-ocid="fe.clock_out.button"
              >
                <LogOut className="h-4 w-4" />
                Clock Out
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Earnings Card */}
      <div
        className="bg-white rounded-xl border border-border shadow-card p-5"
        data-ocid="fe.earnings.section"
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-green-600" />
          <h3 className="font-semibold text-foreground">Total Earnings</h3>
        </div>

        {/* Overall Commission Total + Total Sales */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5 pb-5 border-b border-border">
          <div>
            <p className="text-3xl font-bold text-green-600">
              {"₹"}
              {stats.totalEarned.toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Overall commission from {stats.paid} paid registration
              {stats.paid !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="flex flex-col items-center bg-gray-50 border border-gray-200 rounded-lg px-5 py-3">
              <span className="text-xs font-medium text-muted-foreground mb-1">
                Total Registrations
              </span>
              <span className="text-xl font-bold text-foreground">
                {stats.total}
              </span>
            </div>
            <div className="flex flex-col items-center bg-green-50 border border-green-200 rounded-lg px-5 py-3">
              <span className="text-xs font-medium text-muted-foreground mb-1">
                Paid Registrations
              </span>
              <span className="text-xl font-bold text-green-600">
                {stats.paid}
              </span>
            </div>
            <div className="flex flex-col items-center bg-emerald-50 border border-emerald-200 rounded-lg px-5 py-3">
              <span className="text-xs font-medium text-muted-foreground mb-1">
                Total Sales
              </span>
              <span className="text-xl font-bold text-emerald-600">
                {"₹"}
                {stats.totalSales.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* Fee Plans Reference */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Fee Plans
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col items-center justify-center">
              <span className="text-sm font-semibold text-blue-800 mb-1">
                Basic
              </span>
              <span className="text-2xl font-bold text-blue-700">{"₹50"}</span>
            </div>
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 flex flex-col items-center justify-center">
              <span className="text-sm font-semibold text-teal-800 mb-1">
                Standard
              </span>
              <span className="text-2xl font-bold text-teal-700">{"₹100"}</span>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex flex-col items-center justify-center">
              <span className="text-sm font-semibold text-purple-800 mb-1">
                Premium
              </span>
              <span className="text-2xl font-bold text-purple-700">
                {"₹150"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Target Progress */}
      <div
        className="bg-white rounded-xl border border-border shadow-card p-5 space-y-4"
        data-ocid="fe.targets.section"
      >
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-foreground">Target Progress</h3>
        </div>

        {/* Daily */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">Daily</span>
              {stats.today === 0 && (
                <Badge
                  variant="outline"
                  className="text-xs bg-red-50 border-red-200 text-red-600 px-1.5 py-0"
                >
                  No progress
                </Badge>
              )}
              {stats.today > 0 && stats.today < dailyTarget && (
                <Badge
                  variant="outline"
                  className="text-xs bg-amber-50 border-amber-200 text-amber-600 px-1.5 py-0"
                >
                  {Math.round((stats.today / dailyTarget) * 100)}%
                </Badge>
              )}
              {stats.today >= dailyTarget && (
                <Badge
                  variant="outline"
                  className="text-xs bg-green-50 border-green-200 text-green-600 px-1.5 py-0 gap-0.5"
                >
                  <CheckCircle2 className="h-2.5 w-2.5" /> Met
                </Badge>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              {stats.today} / {dailyTarget}
            </span>
          </div>
          <Progress
            value={dailyProgress}
            className={`h-2.5 ${getProgressColor(stats.today, dailyTarget)}`}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {stats.today >= dailyTarget
              ? "🎉 Target achieved!"
              : `${dailyTarget - stats.today} more to reach daily target`}
          </p>
        </div>

        {/* Weekly */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium text-foreground">Weekly</span>
            <span className="text-sm text-muted-foreground">
              {stats.weekCount} / {weeklyTarget}
            </span>
          </div>
          <Progress
            value={weeklyProgress}
            className={`h-2.5 ${getProgressColor(stats.weekCount, weeklyTarget)}`}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {stats.weekCount >= weeklyTarget
              ? "🎉 Weekly target achieved!"
              : `${weeklyTarget - stats.weekCount} more for weekly target`}
          </p>
        </div>

        {/* Monthly */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium text-foreground">Monthly</span>
            <span className="text-sm text-muted-foreground">
              {stats.monthCount} / {monthlyTarget}
            </span>
          </div>
          <Progress
            value={monthlyProgress}
            className={`h-2.5 ${getProgressColor(stats.monthCount, monthlyTarget)}`}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {stats.monthCount >= monthlyTarget
              ? "🎉 Monthly target achieved!"
              : `${monthlyTarget - stats.monthCount} more for monthly target`}
          </p>
        </div>
      </div>

      {/* Recent Students */}
      <div className="bg-white rounded-xl border border-border shadow-card">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Recent Students</h3>
        </div>
        <div className="overflow-x-auto">
          <table
            className="w-full text-sm"
            data-ocid="fe.recent_students.table"
          >
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-xs font-medium text-muted-foreground">
                  Name
                </th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground">
                  Course
                </th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground">
                  Payment
                </th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {regs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center p-6 text-muted-foreground"
                  >
                    No registrations yet. Start registering students!
                  </td>
                </tr>
              ) : (
                regs.map((r, idx) => (
                  <tr
                    key={r.id}
                    className="border-b border-border last:border-0 hover:bg-muted/20"
                    data-ocid={`fe.student.item.${idx + 1}`}
                  >
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-foreground">
                          {r.studentName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {r.studentPhone}
                        </p>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {r.courseName}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="p-4">
                      <StatusBadge status={r.paymentStatus} />
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
