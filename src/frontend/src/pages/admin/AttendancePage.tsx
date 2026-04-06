import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Clock, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { StatCard } from "../../components/StatCard";
import { db } from "../../lib/storage";
import type { TimeLog } from "../../types/models";

type AttendanceFilter = "today" | "week" | "month";

export default function AttendancePage() {
  const [feFilter, setFeFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<AttendanceFilter>("week");

  const allFEs = useMemo(() => db.getFEs(), []);
  const allTimeLogs = useMemo(() => db.getTimeLogs(), []);
  const allRegs = useMemo(() => db.getRegistrations(), []);

  const filteredLogs = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    return allTimeLogs.filter((log) => {
      if (feFilter !== "all" && String(log.feId) !== feFilter) return false;
      if (dateFilter === "today" && log.date !== todayStr) return false;
      if (dateFilter === "week" && new Date(log.date) < weekAgo) return false;
      if (dateFilter === "month" && new Date(log.date) < monthAgo) return false;
      return true;
    });
  }, [allTimeLogs, feFilter, dateFilter]);

  const todayStr = new Date().toISOString().split("T")[0];
  const todayLogs = allTimeLogs.filter((l) => l.date === todayStr);
  const clockedInToday = todayLogs.filter(
    (l) => l.loginTime && !l.logoutTime,
  ).length;
  const avgWorkHours =
    filteredLogs.length > 0
      ? Math.round(
          (filteredLogs.reduce((s, l) => s + l.workHours, 0) /
            filteredLogs.length) *
            10,
        ) / 10
      : 0;
  const lateCount = filteredLogs.filter((l) => l.isLate).length;

  function getProductivityScore(log: TimeLog): number {
    const fe = allFEs.find((f) => f.id === log.feId);
    const dailyTarget = fe?.dailyTarget ?? 5;
    const dayRegs = allRegs.filter(
      (r) =>
        r.feId === log.feId &&
        new Date(r.createdAt).toISOString().split("T")[0] === log.date,
    ).length;
    return Math.min(
      100,
      Math.round((log.workHours / 8) * 50 + (dayRegs / dailyTarget) * 50),
    );
  }

  function formatTime(iso: string | null): string {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Attendance Report
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          FE login times, work hours, and productivity scores
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Clocked In Today"
          value={clockedInToday}
          icon={Users}
          subtitle="Currently working"
          color="teal"
          data-ocid="admin.attendance.clocked_in.card"
        />
        <StatCard
          title="Avg Work Hours"
          value={`${avgWorkHours}h`}
          icon={Clock}
          subtitle="For selected period"
          color="blue"
          data-ocid="admin.attendance.avg_hours.card"
        />
        <StatCard
          title="Late Logins"
          value={lateCount}
          icon={Clock}
          subtitle="After 9:30 AM"
          color="orange"
          data-ocid="admin.attendance.late_logins.card"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-border shadow-card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-sm font-medium text-muted-foreground">
            Filter:
          </span>
          <div className="flex gap-2">
            {(["today", "week", "month"] as AttendanceFilter[]).map((f) => (
              <button
                type="button"
                key={f}
                onClick={() => setDateFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                  dateFilter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
                data-ocid={`admin.attendance.${f}.tab`}
              >
                {f === "week"
                  ? "Last 7 Days"
                  : f === "month"
                    ? "Last 30 Days"
                    : "Today"}
              </button>
            ))}
          </div>
          <Select value={feFilter} onValueChange={setFeFilter}>
            <SelectTrigger
              className="w-40 h-8 text-xs"
              data-ocid="admin.attendance.fe.select"
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
        </div>
      </div>

      {/* Table */}
      <div
        className="bg-white rounded-xl border border-border shadow-card overflow-hidden"
        data-ocid="admin.attendance.table"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>FE Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Login Time</TableHead>
                <TableHead>Logout Time</TableHead>
                <TableHead className="text-center">Work Hours</TableHead>
                <TableHead className="text-center">Break (min)</TableHead>
                <TableHead className="text-center">Late?</TableHead>
                <TableHead className="text-center">Productivity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                    data-ocid="admin.attendance.empty_state"
                  >
                    No attendance records found
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log, idx) => {
                  const score = getProductivityScore(log);
                  return (
                    <TableRow
                      key={log.id}
                      data-ocid={`admin.attendance.row.${idx + 1}`}
                    >
                      <TableCell className="font-medium">
                        {log.feName}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(log.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>{formatTime(log.loginTime)}</TableCell>
                      <TableCell>{formatTime(log.logoutTime)}</TableCell>
                      <TableCell className="text-center font-medium">
                        {log.workHours > 0 ? `${log.workHours}h` : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        {log.breakMinutes}
                      </TableCell>
                      <TableCell className="text-center">
                        {log.isLate ? (
                          <Badge
                            variant="outline"
                            className="bg-red-50 border-red-200 text-red-700 text-xs"
                          >
                            Late
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-green-50 border-green-200 text-green-700 text-xs"
                          >
                            On Time
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                score >= 80
                                  ? "bg-green-500"
                                  : score >= 50
                                    ? "bg-amber-500"
                                    : "bg-red-500"
                              }`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium w-8">
                            {score}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
