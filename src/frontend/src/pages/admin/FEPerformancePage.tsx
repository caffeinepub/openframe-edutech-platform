import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  IndianRupee,
  Info,
  Printer,
  RefreshCw,
  Target,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { db } from "../../lib/storage";
import type { FieldExecutive } from "../../types/models";

const COMMISSION_RATE = 10;
const DEFAULT_DAILY_TARGET = 5;
const MIN_ACTIVE_STUDENTS = 20;

interface FEPerformanceRow {
  fe: FieldExecutive;
  todayRegistrations: number;
  todayPaidRegistrations: number;
  dailyTarget: number;
  gap: number;
  paidStudents: number;
  commissionToday: number;
  lastLogin: string | null;
  achievementPct: number;
  status: "on-target" | "at-risk" | "missed";
}

function formatTime(isoString: string | null): string {
  if (!isoString) return "\u2014";
  return new Date(isoString).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function FEPerformancePage() {
  const [selectedDate, setSelectedDate] = useState<string>(
    formatDateLocal(new Date()),
  );
  const [rows, setRows] = useState<FEPerformanceRow[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const buildRows = useCallback((dateStr: string): FEPerformanceRow[] => {
    const fes = db.getFEs();
    const allRegs = db.getRegistrations();
    const timeLogs = db.getTimeLogs();
    const currentHour = new Date().getHours();
    const isEndOfDay = currentHour >= 18;

    return fes.map((fe) => {
      const feRegs = allRegs.filter((r) => r.feId === fe.id);

      // Today's regs for selected date
      const todayRegs = feRegs.filter((r) => {
        const d = new Date(r.createdAt);
        return formatDateLocal(d) === dateStr;
      });
      const todayRegistrations = todayRegs.length;
      const todayPaidRegistrations = todayRegs.filter(
        (r) => r.paymentStatus === "Paid",
      ).length;

      // All-time paid students
      const paidStudents = feRegs.filter(
        (r) => r.paymentStatus === "Paid",
      ).length;

      const dailyTarget = fe.dailyTarget ?? DEFAULT_DAILY_TARGET;
      const gap = Math.max(0, dailyTarget - todayRegistrations);
      const commissionToday = todayPaidRegistrations * COMMISSION_RATE;
      const achievementPct =
        dailyTarget > 0
          ? Math.min(100, Math.round((todayRegistrations / dailyTarget) * 100))
          : 100;

      // Last login from time logs for selected date
      const dayLog = timeLogs.find(
        (l) => l.feId === fe.id && l.date === dateStr,
      );
      const lastLogin = dayLog?.loginTime ?? null;

      // Status
      let status: "on-target" | "at-risk" | "missed";
      if (todayRegistrations >= dailyTarget) {
        status = "on-target";
      } else if (
        isEndOfDay ||
        (todayRegistrations === 0 && currentHour >= 12)
      ) {
        status = "missed";
      } else {
        status = achievementPct < 50 ? "at-risk" : "at-risk";
      }

      return {
        fe,
        todayRegistrations,
        todayPaidRegistrations,
        dailyTarget,
        gap,
        paidStudents,
        commissionToday,
        lastLogin,
        achievementPct,
        status,
      };
    });
  }, []);

  const loadData = useCallback(() => {
    setRows(buildRows(selectedDate));
  }, [buildRows, selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        setRows(buildRows(selectedDate));
      }, 60000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, buildRows, selectedDate]);

  // Summary stats
  const totalFEs = rows.length;
  const fesOnTarget = rows.filter((r) => r.status === "on-target").length;
  const fesBelowTarget = rows.filter(
    (r) => r.status === "at-risk" || r.status === "missed",
  ).length;
  const totalRegsToday = rows.reduce((s, r) => s + r.todayRegistrations, 0);
  const totalCommissionToday = rows.reduce((s, r) => s + r.commissionToday, 0);

  function getStatusBadge(status: FEPerformanceRow["status"]) {
    if (status === "on-target")
      return (
        <Badge className="bg-green-100 text-green-700 border border-green-200 hover:bg-green-100 gap-1">
          <CheckCircle2 className="h-3 w-3" /> On Target
        </Badge>
      );
    if (status === "at-risk")
      return (
        <Badge className="bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-100 gap-1">
          <AlertTriangle className="h-3 w-3" /> At Risk
        </Badge>
      );
    return (
      <Badge className="bg-red-100 text-red-700 border border-red-200 hover:bg-red-100 gap-1">
        <XCircle className="h-3 w-3" /> Missed
      </Badge>
    );
  }

  function getRowClass(status: FEPerformanceRow["status"]): string {
    if (status === "on-target") return "bg-green-50/40 hover:bg-green-50/60";
    if (status === "at-risk") return "bg-amber-50/40 hover:bg-amber-50/60";
    return "bg-red-50/40 hover:bg-red-50/60";
  }

  const isToday = selectedDate === formatDateLocal(new Date());

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            FE Performance
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Track daily registrations, targets, and commission per field
            executive
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
              data-ocid="admin.fe_performance.auto_refresh.toggle"
            />
            <RefreshCw
              className={`h-3.5 w-3.5 ${autoRefresh ? "animate-spin text-primary" : ""}`}
            />
            Auto-refresh (60s)
          </label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5"
            data-ocid="admin.fe_performance.print.button"
          >
            <Printer className="h-3.5 w-3.5" />
            Export
          </Button>
          <Button
            size="sm"
            onClick={loadData}
            className="gap-1.5 teal-gradient text-white border-0"
            data-ocid="admin.fe_performance.refresh.button"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Rules Banner */}
      <div
        className="bg-indigo-50 border border-indigo-200 rounded-xl p-4"
        data-ocid="admin.fe_performance.rules.card"
      >
        <div className="flex items-center gap-2 mb-1.5">
          <Info className="h-4 w-4 text-indigo-600" />
          <span className="text-sm font-semibold text-indigo-700">
            Daily Commission Rules
          </span>
        </div>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-1.5 text-indigo-700 text-sm">
            <IndianRupee className="h-3.5 w-3.5" />
            <span>\u20b9{COMMISSION_RATE}/paid reg</span>
          </div>
          <div className="text-indigo-300 hidden sm:block">|</div>
          <div className="flex items-center gap-1.5 text-indigo-700 text-sm">
            <Target className="h-3.5 w-3.5" />
            <span>Daily Target: {DEFAULT_DAILY_TARGET}</span>
          </div>
          <div className="text-indigo-300 hidden sm:block">|</div>
          <div className="flex items-center gap-1.5 text-indigo-700 text-sm">
            <UserCheck className="h-3.5 w-3.5" />
            <span>Min Active Students: {MIN_ACTIVE_STUDENTS}</span>
          </div>
        </div>
      </div>

      {/* Date Selector */}
      <div className="flex items-center gap-3">
        <label
          htmlFor="perf-date"
          className="text-sm font-medium text-foreground"
        >
          Date:
        </label>
        <input
          id="perf-date"
          type="date"
          value={selectedDate}
          max={formatDateLocal(new Date())}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border border-border rounded-md px-3 py-1.5 text-sm bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          data-ocid="admin.fe_performance.date.input"
        />
        {!isToday && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedDate(formatDateLocal(new Date()))}
            className="text-xs"
            data-ocid="admin.fe_performance.today.button"
          >
            Back to Today
          </Button>
        )}
        {isToday && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            Showing live data for today
          </span>
        )}
      </div>

      {/* Summary Cards */}
      <div
        className="grid grid-cols-2 md:grid-cols-5 gap-4"
        data-ocid="admin.fe_performance.summary.section"
      >
        <div className="bg-white border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Total FEs</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalFEs}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-xs text-green-700">On Target</span>
          </div>
          <p className="text-2xl font-bold text-green-700">{fesOnTarget}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-xs text-red-700">Below Target</span>
          </div>
          <p className="text-2xl font-bold text-red-700">{fesBelowTarget}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Target className="h-4 w-4 text-blue-600" />
            <span className="text-xs text-blue-700">Regs Today</span>
          </div>
          <p className="text-2xl font-bold text-blue-700">{totalRegsToday}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <IndianRupee className="h-4 w-4 text-purple-600" />
            <span className="text-xs text-purple-700">Commission Today</span>
          </div>
          <p className="text-2xl font-bold text-purple-700">
            \u20b9{totalCommissionToday}
          </p>
        </div>
      </div>

      {/* Performance Table */}
      <div
        className="bg-white rounded-xl border border-border shadow-card overflow-hidden"
        data-ocid="admin.fe_performance.table"
      >
        <div className="flex items-center gap-2 p-4 border-b border-border bg-muted/20">
          <BarChart3 className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm text-foreground">
            Daily Performance \u2014{" "}
            {new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-IN", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>FE Name</TableHead>
                <TableHead className="text-center">Today&apos;s Regs</TableHead>
                <TableHead className="text-center">Daily Target</TableHead>
                <TableHead className="text-center">Gap</TableHead>
                <TableHead className="text-center">Paid Students</TableHead>
                <TableHead className="text-center">Min Students</TableHead>
                <TableHead className="text-center">Commission Today</TableHead>
                <TableHead className="text-center">Last Login</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-8 text-muted-foreground"
                    data-ocid="admin.fe_performance.empty_state"
                  >
                    No field executives found
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, idx) => (
                  <TableRow
                    key={row.fe.id}
                    className={getRowClass(row.status)}
                    data-ocid={`admin.fe_performance.row.${idx + 1}`}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">
                          {row.fe.name}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {row.fe.feCode}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`font-bold text-base ${
                          row.todayRegistrations >= row.dailyTarget
                            ? "text-green-600"
                            : row.todayRegistrations > 0
                              ? "text-amber-600"
                              : "text-red-600"
                        }`}
                      >
                        {row.todayRegistrations}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">
                        ({row.todayPaidRegistrations} paid)
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-foreground font-medium">
                      {row.dailyTarget}
                    </TableCell>
                    <TableCell className="text-center">
                      {row.gap === 0 ? (
                        <span className="text-green-600 font-medium">
                          0 \u2714
                        </span>
                      ) : (
                        <span className="text-red-600 font-medium">
                          -{row.gap}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`font-semibold ${
                          row.paidStudents >= MIN_ACTIVE_STUDENTS
                            ? "text-green-600"
                            : row.paidStudents >= 10
                              ? "text-amber-600"
                              : "text-red-600"
                        }`}
                      >
                        {row.paidStudents}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {row.paidStudents >= MIN_ACTIVE_STUDENTS ? (
                        <span className="text-green-600 text-sm">
                          \u2705 Met
                        </span>
                      ) : (
                        <span className="text-amber-600 text-sm">
                          \u26A0\uFE0F Below (
                          {MIN_ACTIVE_STUDENTS - row.paidStudents} more)
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold text-green-700">
                        \u20b9{row.commissionToday}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">
                        (\u20b9{COMMISSION_RATE} \u00d7{" "}
                        {row.todayPaidRegistrations})
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {formatTime(row.lastLogin)}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(row.status)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
