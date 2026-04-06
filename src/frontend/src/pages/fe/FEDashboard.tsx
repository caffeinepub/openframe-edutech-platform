import { Progress } from "@/components/ui/progress";
import { Clock, IndianRupee, Target, UserPlus, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { StatCard } from "../../components/StatCard";
import { StatusBadge } from "../../components/StatusBadge";
import { useApp } from "../../context/AppContext";
import { db } from "../../lib/storage";
import type { Registration } from "../../types/models";

const DAILY_TARGET = 5;

export default function FEDashboard() {
  const { session } = useApp();
  const [regs, setRegs] = useState<Registration[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    paid: 0,
    pending: 0,
  });

  useEffect(() => {
    if (!session?.id) return;
    const allRegs = db.getRegistrations().filter((r) => r.feId === session.id);
    const today = new Date().toDateString();
    const todayRegs = allRegs.filter(
      (r) => new Date(r.createdAt).toDateString() === today,
    ).length;
    const paid = allRegs.filter((r) => r.paymentStatus === "Paid").length;
    const pending = allRegs.filter((r) => r.status === "Pending").length;

    setRegs(allRegs.slice(0, 5));
    setStats({ total: allRegs.length, today: todayRegs, paid, pending });
  }, [session]);

  const dailyProgress = Math.min((stats.today / DAILY_TARGET) * 100, 100);

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

      {/* Daily Target Progress */}
      <div className="bg-white rounded-xl border border-border shadow-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground">
              Daily Target Progress
            </h3>
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {stats.today} / {DAILY_TARGET} registrations
          </span>
        </div>
        <Progress value={dailyProgress} className="h-3" />
        <p className="text-xs text-muted-foreground mt-2">
          {stats.today >= DAILY_TARGET
            ? "🎉 Daily target achieved!"
            : `${DAILY_TARGET - stats.today} more registrations to reach today's target`}
        </p>
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
