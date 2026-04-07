import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import {
  Brain,
  Clock,
  MapPin,
  Printer,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { db } from "../../lib/storage";
import type { FieldExecutive, Registration } from "../../types/models";

type DateRange = "today" | "week" | "month";
type RevenuePeriod = "weekly" | "monthly";

function getDateFrom(range: DateRange): Date {
  const d = new Date();
  if (range === "today") {
    d.setHours(0, 0, 0, 0);
  } else if (range === "week") {
    d.setDate(d.getDate() - 7);
  } else {
    d.setDate(d.getDate() - 30);
  }
  return d;
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>("month");
  const [revenuePeriod, setRevenuePeriod] = useState<RevenuePeriod>("weekly");
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [feFilter, setFeFilter] = useState<string>("all");

  const allRegs = useMemo(() => db.getRegistrations(), []);
  const allFEs = useMemo(() => db.getFEs(), []);
  const filteredRegs = useMemo(() => {
    const from = getDateFrom(dateRange);
    return allRegs.filter((r) => {
      const date = new Date(r.createdAt);
      if (date < from) return false;
      if (courseFilter !== "all" && String(r.courseId) !== courseFilter)
        return false;
      if (feFilter !== "all" && String(r.feId) !== feFilter) return false;
      return true;
    });
  }, [allRegs, dateRange, courseFilter, feFilter]);

  // Daily Registrations (last 30 days)
  const dailyRegData = useMemo(() => {
    const days = dateRange === "today" ? 1 : dateRange === "week" ? 7 : 30;
    const result: { date: string; count: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toDateString();
      const label = d.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      });
      const count = filteredRegs.filter(
        (r) => new Date(r.createdAt).toDateString() === dayStr,
      ).length;
      result.push({ date: label, count });
    }
    return result;
  }, [filteredRegs, dateRange]);

  // Revenue grouped by week or month
  const revenueData = useMemo(() => {
    const paidRegs = filteredRegs.filter((r) => r.paymentStatus === "Paid");
    if (revenuePeriod === "weekly") {
      const weeks: Record<string, number> = {};
      for (const r of paidRegs) {
        const d = new Date(r.createdAt);
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        const key = weekStart.toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
        });
        weeks[key] = (weeks[key] ?? 0) + r.price;
      }
      return Object.entries(weeks).map(([week, revenue]) => ({
        period: `Wk ${week}`,
        revenue,
      }));
    }
    // monthly
    const months: Record<string, number> = {};
    for (const r of paidRegs) {
      const key = new Date(r.createdAt).toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      });
      months[key] = (months[key] ?? 0) + r.price;
    }
    return Object.entries(months).map(([period, revenue]) => ({
      period,
      revenue,
    }));
  }, [filteredRegs, revenuePeriod]);

  // FE Performance comparison
  const fePerformanceData = useMemo(() => {
    return allFEs.map((fe) => {
      const feRegs = filteredRegs.filter((r) => r.feId === fe.id);
      const paid = feRegs.filter((r) => r.paymentStatus === "Paid").length;
      return {
        name: fe.name.split(" ")[0],
        total: feRegs.length,
        paid,
      };
    });
  }, [allFEs, filteredRegs]);

  // Conversion rate per week (last 4 weeks)
  const conversionData = useMemo(() => {
    const result: { week: string; rate: number }[] = [];
    for (let i = 3; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - (i + 1) * 7);
      const end = new Date();
      end.setDate(end.getDate() - i * 7);
      const weekRegs = allRegs.filter((r) => {
        const d = new Date(r.createdAt);
        return d >= start && d < end;
      });
      const paid = weekRegs.filter((r) => r.paymentStatus === "Paid").length;
      const rate =
        weekRegs.length > 0 ? Math.round((paid / weekRegs.length) * 100) : 0;
      result.push({
        week: `Wk ${4 - i}`,
        rate,
      });
    }
    return result;
  }, [allRegs]);

  // Active vs Inactive FEs
  const activePieData = useMemo(() => {
    const active = allFEs.filter((fe) => fe.isActive).length;
    const inactive = allFEs.length - active;
    return [
      { name: "Active", value: active },
      { name: "Inactive", value: inactive },
    ].filter((d) => d.value > 0);
  }, [allFEs]);

  // AI Insights (rule-based)
  const insights = useMemo(() => {
    const results: { type: "success" | "warning" | "info"; text: string }[] =
      [];

    // Best performing area
    const locationCounts: Record<string, number> = {};
    for (const r of filteredRegs) {
      if (r.locationAddress) {
        locationCounts[r.locationAddress] =
          (locationCounts[r.locationAddress] ?? 0) + 1;
      }
    }
    const bestArea = Object.entries(locationCounts).sort(
      ([, a], [, b]) => b - a,
    )[0];
    if (bestArea) {
      results.push({
        type: "success",
        text: `Best performing area: ${bestArea[0]} (${bestArea[1]} registrations)`,
      });
    }

    // Best registration time
    const hourCounts: Record<number, number> = {};
    for (const r of filteredRegs) {
      const hour = new Date(r.createdAt).getHours();
      hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
    }
    const bestHourEntry = Object.entries(hourCounts).sort(
      ([, a], [, b]) => b - a,
    )[0];
    if (bestHourEntry) {
      const h = Number(bestHourEntry[0]);
      const label = `${h % 12 || 12}:00 ${h >= 12 ? "PM" : "AM"}`;
      results.push({
        type: "info",
        text: `Best registration time: ${label} (${bestHourEntry[1]} registrations)`,
      });
    }

    // FEs needing improvement
    const lowFEs = allFEs.filter((fe) => {
      const feRegs = filteredRegs.filter((r) => r.feId === fe.id);
      const paid = feRegs.filter((r) => r.paymentStatus === "Paid").length;
      const rate = feRegs.length > 0 ? (paid / feRegs.length) * 100 : 0;
      return feRegs.length > 0 && rate < 30;
    });
    if (lowFEs.length > 0) {
      results.push({
        type: "warning",
        text: `FEs needing improvement: ${lowFEs.map((fe) => fe.name).join(", ")} (conversion rate < 30%)`,
      });
    } else if (allFEs.length > 0) {
      results.push({
        type: "success",
        text: "All active FEs have healthy conversion rates (>= 30%). Keep up the great work!",
      });
    }

    return results;
  }, [filteredRegs, allFEs]);

  const insightColors = {
    success: "bg-green-50 border-green-200 text-green-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };

  const uniqueCourses = useMemo(() => {
    const seen = new Set<number>();
    const result: { id: number; name: string }[] = [];
    for (const r of allRegs) {
      if (!seen.has(r.courseId)) {
        seen.add(r.courseId);
        result.push({ id: r.courseId, name: r.courseName });
      }
    }
    return result;
  }, [allRegs]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Advanced insights and performance metrics
          </p>
        </div>
        <Button
          onClick={() => window.print()}
          variant="outline"
          className="gap-2 w-fit"
          data-ocid="admin.analytics.upload_button"
        >
          <Printer className="h-4 w-4" />
          Export PDF
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-border shadow-card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-sm font-medium text-muted-foreground">
            Filters:
          </span>
          <div className="flex gap-2">
            {(["today", "week", "month"] as DateRange[]).map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setDateRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                  dateRange === r
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
                data-ocid={`admin.analytics.${r}.tab`}
              >
                {r === "week"
                  ? "Last 7 Days"
                  : r === "month"
                    ? "Last 30 Days"
                    : "Today"}
              </button>
            ))}
          </div>

          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger
              className="w-40 h-8 text-xs"
              data-ocid="admin.analytics.course.select"
            >
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {uniqueCourses.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={feFilter} onValueChange={setFeFilter}>
            <SelectTrigger
              className="w-40 h-8 text-xs"
              data-ocid="admin.analytics.fe.select"
            >
              <SelectValue placeholder="All FEs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All FEs</SelectItem>
              {allFEs.map((fe) => (
                <SelectItem key={fe.id} value={String(fe.id)}>
                  {fe.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-xs text-muted-foreground ml-auto">
            {filteredRegs.length} registrations
          </span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Registrations Line Chart */}
        <div className="bg-white rounded-xl border border-border shadow-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground">
              Daily Registrations
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dailyRegData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                interval={Math.floor(dailyRegData.length / 5)}
              />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                name="Registrations"
                stroke="#0F7C86"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Bar Chart */}
        <div className="bg-white rounded-xl border border-border shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-foreground">Revenue</h3>
            </div>
            <div className="flex gap-1">
              {(["weekly", "monthly"] as RevenuePeriod[]).map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setRevenuePeriod(p)}
                  className={`px-2.5 py-1 rounded text-xs font-medium capitalize transition-colors ${
                    revenuePeriod === p
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                  data-ocid={`admin.revenue.${p}.tab`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="period" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(val) => [formatCurrency(Number(val)), "Revenue"]}
              />
              <Bar dataKey="revenue" fill="#1697A0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* FE Performance Comparison */}
        <div className="bg-white rounded-xl border border-border shadow-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-blue-600" />
            <h3 className="font-semibold text-foreground">
              FE Performance Comparison
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={fePerformanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="total"
                name="Total"
                fill="#0F7C86"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="paid"
                name="Paid"
                fill="#22C55E"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Conversion Rate Line Chart */}
        <div className="bg-white rounded-xl border border-border shadow-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="h-4 w-4 text-purple-600" />
            <h3 className="font-semibold text-foreground">
              Conversion Rate (Weekly)
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={conversionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} unit="%" />
              <Tooltip formatter={(val) => [`${val}%`, "Conversion Rate"]} />
              <Line
                type="monotone"
                dataKey="rate"
                name="Rate"
                stroke="#9333EA"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Active vs Inactive FEs Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-border shadow-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-teal-600" />
            <h3 className="font-semibold text-foreground">
              Active vs Inactive FEs
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={activePieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={false}
              >
                <Cell fill="#0F7C86" />
                <Cell fill="#E5E7EB" />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* AI Insights */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-border shadow-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="h-4 w-4 text-amber-600" />
            <h3 className="font-semibold text-foreground">Smart Insights</h3>
            <Badge
              variant="outline"
              className="text-xs bg-amber-50 border-amber-200 text-amber-700"
            >
              AI-powered
            </Badge>
          </div>
          <div className="space-y-3">
            {insights.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Not enough data to generate insights yet.
              </p>
            ) : (
              insights.map((ins, idx) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: static list
                  key={idx}
                  className={`flex items-start gap-3 p-3 rounded-lg border text-sm ${insightColors[ins.type]}`}
                >
                  {ins.type === "success" ? (
                    <TrendingUp className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  ) : ins.type === "warning" ? (
                    <TrendingDown className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  ) : (
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  )}
                  <span>{ins.text}</span>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                Summary
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-xl font-bold text-foreground">
                  {filteredRegs.length}
                </p>
                <p className="text-xs text-muted-foreground">Registrations</p>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(
                    filteredRegs
                      .filter((r) => r.paymentStatus === "Paid")
                      .reduce((s, r) => s + r.price, 0),
                  )}
                </p>
                <p className="text-xs text-muted-foreground">Revenue</p>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-xl font-bold text-primary">
                  {filteredRegs.length > 0
                    ? Math.round(
                        (filteredRegs.filter((r) => r.paymentStatus === "Paid")
                          .length /
                          filteredRegs.length) *
                          100,
                      )
                    : 0}
                  %
                </p>
                <p className="text-xs text-muted-foreground">Conversion</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
