import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle,
  ClipboardList,
  Clock,
  IndianRupee,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { StatCard } from "../../components/StatCard";
import { StatusBadge } from "../../components/StatusBadge";
import { db } from "../../lib/storage";
import type { Registration } from "../../types/models";

const COLORS = ["#0F7C86", "#1697A0", "#1F8FB5"];

const weeklyData = [
  { day: "Mon", registrations: 3 },
  { day: "Tue", registrations: 5 },
  { day: "Wed", registrations: 2 },
  { day: "Thu", registrations: 7 },
  { day: "Fri", registrations: 4 },
  { day: "Sat", registrations: 6 },
  { day: "Sun", registrations: 1 },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [regs, setRegs] = useState<Registration[]>([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalFEs: 0,
    dailyReg: 0,
    revenue: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [courseDistribution, setCourseDistribution] = useState<
    { name: string; value: number }[]
  >([]);

  useEffect(() => {
    const registrations = db.getRegistrations();
    const fes = db.getFEs();
    const students = db.getStudents();

    const today = new Date().toDateString();
    const dailyReg = registrations.filter(
      (r) => new Date(r.createdAt).toDateString() === today,
    ).length;

    const revenue = registrations
      .filter((r) => r.paymentStatus === "Paid")
      .reduce((sum, r) => sum + r.price, 0);

    const pending = registrations.filter((r) => r.status === "Pending").length;
    const approved = registrations.filter(
      (r) => r.status === "Approved",
    ).length;
    const rejected = registrations.filter(
      (r) => r.status === "Rejected",
    ).length;

    // Course distribution
    const courseCounts: Record<string, number> = {};
    for (const r of registrations) {
      courseCounts[r.courseType] = (courseCounts[r.courseType] ?? 0) + 1;
    }
    const dist = Object.entries(courseCounts).map(([name, value]) => ({
      name,
      value,
    }));

    setRegs(registrations.slice(0, 5));
    setStats({
      totalStudents: students.length,
      totalFEs: fes.length,
      dailyReg,
      revenue,
      pending,
      approved,
      rejected,
    });
    setCourseDistribution(dist);
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Overview of OpenFrame platform performance
        </p>
      </div>

      {/* Stats Grid */}
      <div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        data-ocid="admin.dashboard.section"
      >
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          icon={Users}
          subtitle="Registered students"
          color="teal"
          data-ocid="admin.total_students.card"
        />
        <StatCard
          title="Field Executives"
          value={stats.totalFEs}
          icon={UserCheck}
          subtitle="Active FEs"
          color="blue"
          data-ocid="admin.total_fes.card"
        />
        <StatCard
          title="Today's Registrations"
          value={stats.dailyReg}
          icon={TrendingUp}
          subtitle="New today"
          color="green"
          data-ocid="admin.daily_registrations.card"
        />
        <StatCard
          title="Total Revenue"
          value={`₹${stats.revenue.toLocaleString("en-IN")}`}
          icon={IndianRupee}
          subtitle="Paid payments"
          color="purple"
          data-ocid="admin.revenue.card"
        />
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <Clock className="h-8 w-8 text-amber-600" />
          <div>
            <p className="text-2xl font-bold text-amber-800">{stats.pending}</p>
            <p className="text-xs text-amber-700">Pending Approvals</p>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="h-8 w-8 text-green-600" />
          <div>
            <p className="text-2xl font-bold text-green-800">
              {stats.approved}
            </p>
            <p className="text-xs text-green-700">Approved</p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="h-8 w-8 text-red-600" />
          <div>
            <p className="text-2xl font-bold text-red-800">{stats.rejected}</p>
            <p className="text-xs text-red-700">Rejected</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-border shadow-card">
          <h3 className="font-semibold text-foreground mb-4">
            Weekly Registrations
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar
                dataKey="registrations"
                fill="#0F7C86"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-5 border border-border shadow-card">
          <h3 className="font-semibold text-foreground mb-4">
            Course Distribution
          </h3>
          {courseDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={courseDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name }) => name}
                  labelLine={false}
                >
                  {courseDistribution.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">
              No data yet
            </div>
          )}
        </div>
      </div>

      {/* Recent Registrations */}
      <div className="bg-white rounded-xl border border-border shadow-card">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">
              Recent Registrations
            </h3>
          </div>
          <button
            type="button"
            onClick={() => navigate({ to: "/admin/registrations" })}
            className="text-xs text-primary font-medium hover:underline"
          >
            View all
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-xs font-medium text-muted-foreground">
                  Student
                </th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground">
                  Course
                </th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground">
                  FE
                </th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground">
                  Payment
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
                    No registrations yet
                  </td>
                </tr>
              ) : (
                regs.map((r, idx) => (
                  <tr
                    key={r.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30"
                    data-ocid={`admin.registration.item.${idx + 1}`}
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
                      <div>
                        <p className="text-foreground">{r.feName}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.feCode}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="p-4">
                      <StatusBadge status={r.paymentStatus} />
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
