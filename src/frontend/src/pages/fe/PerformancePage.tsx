import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Medal,
  Printer,
  Target,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useApp } from "../../context/AppContext";
import { db } from "../../lib/storage";

export default function PerformancePage() {
  const { session } = useApp();

  const feData = useMemo(() => {
    if (!session?.id) return null;
    return db.getFEs().find((fe) => fe.id === session.id) ?? null;
  }, [session]);

  const allRegs = useMemo(() => {
    if (!session?.id) return [];
    return db.getRegistrations().filter((r) => r.feId === session.id);
  }, [session]);

  const stats = useMemo(() => {
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    const total = allRegs.length;
    const paid = allRegs.filter((r) => r.paymentStatus === "Paid").length;
    const conversionRate = total > 0 ? Math.round((paid / total) * 100) : 0;
    const monthRegs = allRegs.filter((r) => new Date(r.createdAt) >= monthAgo);

    // Work hours this month from time logs
    const timeLogs = db
      .getTimeLogs()
      .filter((l) => l.feId === session?.id && new Date(l.date) >= monthAgo);
    const workHours =
      Math.round(timeLogs.reduce((s, l) => s + l.workHours, 0) * 10) / 10;

    return { total, paid, conversionRate, workHours, monthRegs };
  }, [allRegs, session]);

  // Weekly registrations for last 4 weeks
  const weeklyData = useMemo(() => {
    const result: { week: string; registrations: number }[] = [];
    for (let i = 3; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - (i + 1) * 7);
      const end = new Date();
      end.setDate(end.getDate() - i * 7);
      const count = allRegs.filter((r) => {
        const d = new Date(r.createdAt);
        return d >= start && d < end;
      }).length;
      result.push({ week: `Week ${4 - i}`, registrations: count });
    }
    return result;
  }, [allRegs]);

  // Target history last 7 days
  const targetHistory = useMemo(() => {
    const dailyTarget = feData?.dailyTarget ?? 5;
    const result: {
      date: string;
      target: number;
      achieved: number;
      met: boolean;
    }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toDateString();
      const label = d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });
      const achieved = allRegs.filter(
        (r) => new Date(r.createdAt).toDateString() === dayStr,
      ).length;
      result.push({
        date: label,
        target: dailyTarget,
        achieved,
        met: achieved >= dailyTarget,
      });
    }
    return result;
  }, [allRegs, feData]);

  function getRankBadge() {
    const rank = feData?.rank ?? "Unranked";
    if (rank === "Gold")
      return (
        <Badge className="bg-yellow-400 text-white hover:bg-yellow-400 gap-1 text-sm px-3 py-1">
          <Trophy className="h-4 w-4" /> Gold Tier
        </Badge>
      );
    if (rank === "Silver")
      return (
        <Badge className="bg-gray-400 text-white hover:bg-gray-400 gap-1 text-sm px-3 py-1">
          <Medal className="h-4 w-4" /> Silver Tier
        </Badge>
      );
    if (rank === "Bronze")
      return (
        <Badge className="bg-orange-500 text-white hover:bg-orange-500 gap-1 text-sm px-3 py-1">
          <Medal className="h-4 w-4" /> Bronze Tier
        </Badge>
      );
    return (
      <Badge variant="outline" className="text-sm px-3 py-1">
        Unranked
      </Badge>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Performance</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Personal analytics and achievement tracking
          </p>
        </div>
        <Button
          onClick={() => window.print()}
          variant="outline"
          className="gap-2 w-fit"
          data-ocid="fe.performance.upload_button"
        >
          <Printer className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Score + Rank */}
      <div className="bg-white rounded-xl border border-border shadow-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-5xl font-bold text-foreground">
                {feData?.performanceScore ?? 0}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Performance Score
              </p>
            </div>
            <div className="h-16 w-px bg-border" />
            <div>{getRankBadge()}</div>
          </div>
          <div className="flex-1 max-w-xs">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>0</span>
              <span>100</span>
            </div>
            <div className="h-4 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full teal-gradient rounded-full transition-all"
                style={{ width: `${feData?.performanceScore ?? 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-border shadow-card p-4 text-center">
          <Users className="h-5 w-5 text-teal-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Total Registrations</p>
        </div>
        <div className="bg-white rounded-xl border border-border shadow-card p-4 text-center">
          <TrendingUp className="h-5 w-5 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
          <p className="text-xs text-muted-foreground">Paid Students</p>
        </div>
        <div className="bg-white rounded-xl border border-border shadow-card p-4 text-center">
          <Target className="h-5 w-5 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold text-primary">
            {stats.conversionRate}%
          </p>
          <p className="text-xs text-muted-foreground">Conversion Rate</p>
        </div>
        <div className="bg-white rounded-xl border border-border shadow-card p-4 text-center">
          <Medal className="h-5 w-5 text-amber-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-foreground">
            {stats.workHours}h
          </p>
          <p className="text-xs text-muted-foreground">Work Hours (Month)</p>
        </div>
      </div>

      {/* Weekly Chart */}
      <div className="bg-white rounded-xl border border-border shadow-card p-5">
        <h3 className="font-semibold text-foreground mb-4">
          Weekly Registrations (Last 4 Weeks)
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="week" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip />
            <Bar
              dataKey="registrations"
              name="Registrations"
              fill="#0F7C86"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Target History */}
      <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">
            Daily Target History (Last 7 Days)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground">
                  Date
                </th>
                <th className="text-center p-4 text-xs font-semibold text-muted-foreground">
                  Daily Target
                </th>
                <th className="text-center p-4 text-xs font-semibold text-muted-foreground">
                  Achieved
                </th>
                <th className="text-center p-4 text-xs font-semibold text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {targetHistory.map((row, idx) => (
                <tr
                  key={row.date}
                  className="border-b border-border last:border-0 hover:bg-muted/10"
                  data-ocid={`fe.target_history.row.${idx + 1}`}
                >
                  <td className="p-4 font-medium">{row.date}</td>
                  <td className="p-4 text-center text-muted-foreground">
                    {row.target}
                  </td>
                  <td className="p-4 text-center font-semibold">
                    {row.achieved}
                  </td>
                  <td className="p-4 text-center">
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        row.met
                          ? "bg-green-50 border-green-200 text-green-700"
                          : "bg-red-50 border-red-200 text-red-700"
                      }`}
                    >
                      {row.met ? "Met" : "Missed"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
