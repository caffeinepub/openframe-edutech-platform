import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  IndianRupee,
  LogIn,
  LogOut,
  Medal,
  Target,
  TrendingUp,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { StatCard } from "../../components/StatCard";
import { StatusBadge } from "../../components/StatusBadge";
import { useApp } from "../../context/AppContext";
import { db } from "../../lib/storage";
import type { FieldExecutive, Registration, TimeLog } from "../../types/models";

export default function FEDashboard() {
  const { session } = useApp();
  const [regs, setRegs] = useState<Registration[]>([]);
  const [feData, setFeData] = useState<FieldExecutive | null>(null);
  const [todayLog, setTodayLog] = useState<TimeLog | null>(null);
  const [elapsedHours, setElapsedHours] = useState(0);
  const alertShownRef = useRef(false);
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    paid: 0,
    pending: 0,
    totalEarned: 0,
    earnedBasic: 0,
    earnedStandard: 0,
    earnedPremium: 0,
    weekCount: 0,
    monthCount: 0,
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
    const totalEarned = paidRegs.reduce((sum, r) => sum + r.price, 0);
    const earnedBasic = paidRegs
      .filter((r) => r.feePlan === "Basic")
      .reduce((sum, r) => sum + r.price, 0);
    const earnedStandard = paidRegs
      .filter((r) => r.feePlan === "Standard")
      .reduce((sum, r) => sum + r.price, 0);
    const earnedPremium = paidRegs
      .filter((r) => r.feePlan === "Premium")
      .reduce((sum, r) => sum + r.price, 0);
    const weekCount = allRegs.filter(
      (r) => new Date(r.createdAt) >= weekAgo,
    ).length;
    const monthCount = allRegs.filter(
      (r) => new Date(r.createdAt) >= monthAgo,
    ).length;

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
      earnedBasic,
      earnedStandard,
      earnedPremium,
      weekCount,
      monthCount,
    });

    // Auto-alerts (only once per session)
    if (!alertShownRef.current && fe) {
      const currentHour = new Date().getHours();
      if (todayCount >= (fe.dailyTarget ?? 5)) {
        toast.success("\uD83C\uDF89 Daily target achieved! Great work!");
        alertShownRef.current = true;
      } else if (
        currentHour >= 14 &&
        todayCount < (fe.dailyTarget ?? 5) * 0.5
      ) {
        toast.warning(
          "\u26A0\uFE0F You've reached less than 50% of your daily target",
        );
        alertShownRef.current = true;
      }
    }
  }, [session]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Elapsed time ticker
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

  const dailyTarget = feData?.dailyTarget ?? 5;
  const weeklyTarget = feData?.weeklyTarget ?? 25;
  const monthlyTarget = feData?.monthlyTarget ?? 100;

  const dailyProgress = Math.min((stats.today / dailyTarget) * 100, 100);
  const weeklyProgress = Math.min((stats.weekCount / weeklyTarget) * 100, 100);
  const monthlyProgress = Math.min(
    (stats.monthCount / monthlyTarget) * 100,
    100,
  );

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
          {session?.feCode} \u2022 Field Executive Dashboard
        </p>
      </div>

      {/* Stats */}
      <div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
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
          title="Paid"
          value={stats.paid}
          icon={IndianRupee}
          subtitle="Paid students"
          color="green"
          data-ocid="fe.paid_students.card"
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          icon={Clock}
          subtitle="Awaiting approval"
          color="orange"
          data-ocid="fe.pending_students.card"
        />
      </div>

      {/* Performance Score + Clock In/Out */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Performance Score */}
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

        {/* Clock In/Out */}
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
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      },
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
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-3xl font-bold text-green-600">
              \u20b9{stats.totalEarned.toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              From {stats.paid} paid registration{stats.paid !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex gap-4 text-sm">
            {/* Basic box */}
            <div className="flex flex-col items-center bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
              <span className="text-xs font-medium text-foreground mb-0.5">
                Basic
              </span>
              <span className="text-xs text-muted-foreground mb-1">
                \u20b950/student
              </span>
              <span className="font-semibold text-foreground">
                \u20b9{stats.earnedBasic.toLocaleString("en-IN")}
              </span>
            </div>
            {/* Standard box */}
            <div className="flex flex-col items-center bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
              <span className="text-xs font-medium text-foreground mb-0.5">
                Standard
              </span>
              <span className="text-xs text-blue-500 mb-1">
                \u20b9100/student
              </span>
              <span className="font-semibold text-foreground">
                \u20b9{stats.earnedStandard.toLocaleString("en-IN")}
              </span>
            </div>
            {/* Premium box */}
            <div className="flex flex-col items-center bg-purple-50 border border-purple-200 rounded-lg px-4 py-2">
              <span className="text-xs font-medium text-foreground mb-0.5">
                Premium
              </span>
              <span className="text-xs text-purple-500 mb-1">
                \u20b9150/student
              </span>
              <span className="font-semibold text-foreground">
                \u20b9{stats.earnedPremium.toLocaleString("en-IN")}
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
            <span className="text-sm font-medium text-foreground">Daily</span>
            <span className="text-sm text-muted-foreground">
              {stats.today} / {dailyTarget}
            </span>
          </div>
          <Progress value={dailyProgress} className="h-2.5" />
          <p className="text-xs text-muted-foreground mt-1">
            {stats.today >= dailyTarget
              ? "\uD83C\uDF89 Target achieved!"
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
          <Progress value={weeklyProgress} className="h-2.5" />
          <p className="text-xs text-muted-foreground mt-1">
            {stats.weekCount >= weeklyTarget
              ? "\uD83C\uDF89 Weekly target achieved!"
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
          <Progress value={monthlyProgress} className="h-2.5" />
          <p className="text-xs text-muted-foreground mt-1">
            {stats.monthCount >= monthlyTarget
              ? "\uD83C\uDF89 Monthly target achieved!"
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
                  Fee Plan
                </th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground">
                  Payment
                </th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground">
                  Amount
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
                    colSpan={7}
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
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          r.feePlan === "Premium"
                            ? "bg-purple-100 text-purple-700"
                            : r.feePlan === "Standard"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {r.feePlan}
                      </span>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="p-4">
                      <StatusBadge status={r.paymentStatus} />
                    </td>
                    <td className="p-4 font-medium text-foreground">
                      \u20b9{r.price}
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
