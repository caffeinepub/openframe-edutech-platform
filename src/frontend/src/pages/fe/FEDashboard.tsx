import { Progress } from "@/components/ui/progress";
import {
  Clock,
  IndianRupee,
  Target,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
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
    totalEarned: 0,
    earnedBasic: 0,
    earnedStandard: 0,
    earnedPremium: 0,
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

    setRegs(allRegs.slice(0, 5));
    setStats({
      total: allRegs.length,
      today: todayRegs,
      paid,
      pending,
      totalEarned,
      earnedBasic,
      earnedStandard,
      earnedPremium,
    });
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
              ₹{stats.totalEarned.toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              From {stats.paid} paid registration{stats.paid !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="flex flex-col items-center bg-muted/30 rounded-lg px-4 py-2">
              <span className="text-xs text-muted-foreground mb-0.5">
                Basic
              </span>
              <span className="font-semibold text-foreground">
                ₹{stats.earnedBasic.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex flex-col items-center bg-muted/30 rounded-lg px-4 py-2">
              <span className="text-xs text-muted-foreground mb-0.5">
                Standard
              </span>
              <span className="font-semibold text-foreground">
                ₹{stats.earnedStandard.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex flex-col items-center bg-muted/30 rounded-lg px-4 py-2">
              <span className="text-xs text-muted-foreground mb-0.5">
                Premium
              </span>
              <span className="font-semibold text-foreground">
                ₹{stats.earnedPremium.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>
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
                      ₹{r.price}
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
