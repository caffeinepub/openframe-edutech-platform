import {
  AlertTriangle,
  Award,
  BarChart2,
  ChevronDown,
  ChevronUp,
  Flag,
  IndianRupee,
  LogOut,
  RefreshCw,
  Star,
  Target,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { StatCard } from "../../components/StatCard";
import { useTL } from "../../context/TLContext";
import { db } from "../../lib/storage";
import type { FieldExecutive } from "../../types/models";

const DAILY_TARGET_PER_FE = 5;
const MONTHLY_BONUS_TARGET = 500;
const MONTHLY_BONUS_AMOUNT = 5000;

function isSameDay(dateStr: string, ref: Date) {
  const d = new Date(dateStr);
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
}

function isSameMonth(dateStr: string, ref: Date) {
  const d = new Date(dateStr);
  return (
    d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth()
  );
}

type SortKey = "name" | "todayRegs" | "conversion";
type SortDir = "asc" | "desc";

export function TLDashboard() {
  const {
    tlSession,
    teamLeader: _tl,
    fes,
    registrations,
    commissions,
    lastUpdated,
    logout,
    loadData,
  } = useTL();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("todayRegs");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showCommDetails, setShowCommDetails] = useState(false);
  const now = useMemo(() => new Date(), []);

  useEffect(() => {
    if (!tlSession) {
      window.location.href = "/tl/login";
    }
  }, [tlSession]);

  const handleLogout = () => {
    logout();
    window.location.href = "/tl/login";
  };

  const dismiss = (key: string) =>
    setDismissed((prev) => new Set([...prev, key]));

  // ---- computed stats ----
  const todayRegs = useMemo(
    () => registrations.filter((r) => isSameDay(r.createdAt, now)),
    [registrations, now],
  );

  const monthRegs = useMemo(
    () => registrations.filter((r) => isSameMonth(r.createdAt, now)),
    [registrations, now],
  );

  const todayPaid = useMemo(
    () => todayRegs.filter((r) => r.paymentStatus === "Paid"),
    [todayRegs],
  );

  const monthPaid = useMemo(
    () => monthRegs.filter((r) => r.paymentStatus === "Paid"),
    [monthRegs],
  );

  const totalTarget = fes.length * DAILY_TARGET_PER_FE;
  const todayCount = todayRegs.length;
  const progressPct =
    totalTarget > 0
      ? Math.min(100, Math.round((todayCount / totalTarget) * 100))
      : 0;
  const remaining = Math.max(0, totalTarget - todayCount);

  const tlCommissionRate = db.getAdminConfig().tlCommissionRate;
  const todayEarnings = todayPaid.length * tlCommissionRate;
  const monthEarnings = monthPaid.length * tlCommissionRate;

  // ---- per-FE stats ----
  const feStats = useMemo(() => {
    return fes.map((fe: FieldExecutive) => {
      const feRegs = registrations.filter((r) => r.feId === fe.id);
      const feTodayRegs = feRegs.filter((r) => isSameDay(r.createdAt, now));
      const feMonthRegs = feRegs.filter((r) => isSameMonth(r.createdAt, now));
      const fePaid = feRegs.filter((r) => r.paymentStatus === "Paid");
      const convRate =
        feRegs.length > 0 ? (fePaid.length / feRegs.length) * 100 : 0;
      return {
        fe,
        todayCount: feTodayRegs.length,
        monthCount: feMonthRegs.length,
        totalRegs: feRegs.length,
        paidRegs: fePaid.length,
        convRate,
        met: feTodayRegs.length >= DAILY_TARGET_PER_FE,
      };
    });
  }, [fes, registrations, now]);

  const sortedFEStats = useMemo(() => {
    return [...feStats].sort((a, b) => {
      if (sortKey === "name")
        return sortDir === "asc"
          ? a.fe.name.localeCompare(b.fe.name)
          : b.fe.name.localeCompare(a.fe.name);
      const av = sortKey === "todayRegs" ? a.todayCount : a.convRate;
      const bv = sortKey === "todayRegs" ? b.todayCount : b.convRate;
      return sortDir === "asc" ? av - bv : bv - av;
    });
  }, [feStats, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (
      sortDir === "asc" ? (
        <ChevronUp className="h-3 w-3 inline" />
      ) : (
        <ChevronDown className="h-3 w-3 inline" />
      )
    ) : null;

  // ---- alerts ----
  const inactiveFEs = feStats.filter((s) => s.todayCount === 0);
  const belowTargetFEs = feStats.filter(
    (s) => s.todayCount > 0 && s.todayCount < DAILY_TARGET_PER_FE,
  );
  const teamLow = progressPct < 50;

  // ---- commission wallet ----
  const pendingComm = commissions
    .filter((c) => c.status === "pending")
    .reduce((s, c) => s + c.amount, 0);
  const approvedComm = commissions
    .filter((c) => c.status === "approved")
    .reduce((s, c) => s + c.amount, 0);
  const paidComm = commissions
    .filter((c) => c.status === "paid")
    .reduce((s, c) => s + c.amount, 0);

  // ---- charts ----
  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      const label = d.toLocaleDateString("en-IN", { weekday: "short" });
      const count = registrations.filter((r) =>
        isSameDay(r.createdAt, d),
      ).length;
      return { day: label, regs: count };
    });
  }, [registrations, now]);

  const last6Months = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now);
      d.setMonth(d.getMonth() - (5 - i));
      const label = d.toLocaleDateString("en-IN", { month: "short" });
      const count = registrations.filter((r) =>
        isSameMonth(r.createdAt, d),
      ).length;
      return { month: label, regs: count };
    });
  }, [registrations, now]);

  // ---- leaderboard ----
  const ranked = useMemo(
    () => [...feStats].sort((a, b) => b.monthCount - a.monthCount),
    [feStats],
  );
  const topFE = ranked[0] ?? null;
  const bottomFE = ranked[ranked.length - 1] ?? null;

  // ---- bonus tracker ----
  const monthPaidTotal = monthPaid.length;
  const bonusUnlocked = monthPaidTotal >= MONTHLY_BONUS_TARGET;
  const bonusRemaining = MONTHLY_BONUS_TARGET - monthPaidTotal;
  const bonusPct = Math.min(
    100,
    Math.round((monthPaidTotal / MONTHLY_BONUS_TARGET) * 100),
  );

  const progressColor =
    progressPct >= 100
      ? "bg-green-500"
      : progressPct >= 50
        ? "bg-amber-500"
        : "bg-red-500";

  const bonusProgressColor =
    bonusPct >= 100
      ? "bg-green-500"
      : bonusPct >= 50
        ? "bg-amber-500"
        : "bg-red-500";

  if (!tlSession) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 teal-gradient rounded-lg flex items-center justify-center">
              <BarChart2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm text-gray-900">
                OpenFrame TL
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500">{tlSession.name}</span>
                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-semibold">
                  {tlSession.referralCode}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh data"
              data-ocid="tl.refresh.button"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              data-ocid="tl.logout.button"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Team Leader Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Managing {fes.length} Field Executive{fes.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* SECTION 1 — Stat Cards */}
        <div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4"
          data-ocid="tl.stats.row"
        >
          <StatCard
            title="Total FEs"
            value={fes.length}
            icon={Users}
            subtitle="Max 20 FEs"
            color="blue"
            data-ocid="tl.stat.total_fes"
          />
          <StatCard
            title="Today's Registrations"
            value={todayCount}
            icon={TrendingUp}
            subtitle={`Target: ${totalTarget}`}
            color="green"
            data-ocid="tl.stat.today_regs"
          />
          <StatCard
            title="Target Progress"
            value={`${progressPct}%`}
            icon={Target}
            subtitle={`${todayCount} / ${totalTarget} done`}
            color={
              progressPct >= 100
                ? "green"
                : progressPct >= 50
                  ? "orange"
                  : "teal"
            }
            data-ocid="tl.stat.target_progress"
          />
          <StatCard
            title="Today's Earnings"
            value={`₹${todayEarnings.toLocaleString("en-IN")}`}
            icon={IndianRupee}
            subtitle={`${todayPaid.length} paid regs × ₹${tlCommissionRate}`}
            color="orange"
            data-ocid="tl.stat.today_earnings"
          />
          <StatCard
            title="Monthly Earnings"
            value={`₹${monthEarnings.toLocaleString("en-IN")}`}
            icon={Award}
            subtitle={`${monthPaid.length} paid × ₹${tlCommissionRate}/reg`}
            color="purple"
            data-ocid="tl.stat.monthly_earnings"
          />
        </div>

        {/* SECTION 3 — Alerts */}
        <div className="space-y-2" data-ocid="tl.alerts.container">
          {inactiveFEs.length > 0 && !dismissed.has("inactive") && (
            <div
              className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
              data-ocid="tl.alert.inactive_fes"
            >
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">
                <strong>
                  {inactiveFEs.length} FE{inactiveFEs.length !== 1 ? "s" : ""}
                </strong>{" "}
                have no registrations today:{" "}
                {inactiveFEs.map((s) => s.fe.name).join(", ")}
              </span>
              <button
                type="button"
                onClick={() => dismiss("inactive")}
                className="flex-shrink-0 text-red-400 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          {belowTargetFEs.length > 0 && !dismissed.has("below") && (
            <div
              className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm"
              data-ocid="tl.alert.below_target"
            >
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">
                <strong>
                  {belowTargetFEs.length} FE
                  {belowTargetFEs.length !== 1 ? "s" : ""}
                </strong>{" "}
                below daily target:{" "}
                {belowTargetFEs
                  .map((s) => `${s.fe.name} (${s.todayCount}/5)`)
                  .join(", ")}
              </span>
              <button
                type="button"
                onClick={() => dismiss("below")}
                className="flex-shrink-0 text-amber-400 hover:text-amber-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          {teamLow && !dismissed.has("team_low") && (
            <div
              className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm"
              data-ocid="tl.alert.team_low"
            >
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">
                Team is at <strong>{progressPct}%</strong> of daily target —
                take action!
              </span>
              <button
                type="button"
                onClick={() => dismiss("team_low")}
                className="flex-shrink-0 text-amber-400 hover:text-amber-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* SECTION 2 — Daily Target */}
        <div
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6"
          data-ocid="tl.daily_target.card"
        >
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Daily Target Progress
          </h2>
          <div className="flex items-end justify-between mb-2">
            <div>
              <span className="text-2xl font-bold text-gray-900">
                {todayCount}
              </span>
              <span className="text-gray-400 font-medium">
                {" "}
                / {totalTarget}
              </span>
              <span className="ml-2 text-sm text-gray-500">Registrations</span>
            </div>
            <span
              className={`text-lg font-bold ${progressPct >= 100 ? "text-green-600" : progressPct >= 50 ? "text-amber-600" : "text-red-600"}`}
            >
              {progressPct}%
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>{todayCount} completed</span>
            <span>{remaining} remaining</span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3 text-center">
            <div className="bg-green-50 rounded-lg p-2">
              <div className="text-lg font-bold text-green-700">
                {todayCount}
              </div>
              <div className="text-xs text-green-600">Completed</div>
            </div>
            <div className="bg-red-50 rounded-lg p-2">
              <div className="text-lg font-bold text-red-700">{remaining}</div>
              <div className="text-xs text-red-600">Remaining</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-2">
              <div className="text-lg font-bold text-blue-700">
                {totalTarget}
              </div>
              <div className="text-xs text-blue-600">Total Target</div>
            </div>
          </div>
        </div>

        {/* SECTION 4 — FE Performance Table */}
        <div
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6"
          data-ocid="tl.fe_table.card"
        >
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            FE Performance
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {[
                    { key: "name" as SortKey, label: "FE Name" },
                    { key: "todayRegs" as SortKey, label: "Today's Regs" },
                    { key: null, label: "Target" },
                    { key: null, label: "Status" },
                    { key: "conversion" as SortKey, label: "Conversion" },
                  ].map(({ key, label }) => (
                    <th
                      key={label}
                      className={`text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide ${key ? "cursor-pointer hover:text-gray-700 select-none" : ""}`}
                      onClick={key ? () => handleSort(key) : undefined}
                      onKeyDown={
                        key
                          ? (e) => {
                              if (e.key === "Enter") handleSort(key);
                            }
                          : undefined
                      }
                      role={key ? "button" : undefined}
                      tabIndex={key ? 0 : undefined}
                    >
                      {label} {key && <SortIcon k={key} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedFEStats.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-8 text-center text-gray-400 text-sm"
                    >
                      No FEs assigned to your team yet.
                    </td>
                  </tr>
                ) : (
                  sortedFEStats.map(({ fe, todayCount: tc, convRate, met }) => (
                    <tr
                      key={fe.id}
                      className={`border-b border-gray-50 ${tc < 2 && tc < DAILY_TARGET_PER_FE ? "bg-amber-50" : "hover:bg-gray-50"}`}
                      data-ocid={`tl.fe_row.${fe.feCode.toLowerCase()}`}
                    >
                      <td className="py-3 px-3 font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
                            {fe.name[0]}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate">{fe.name}</div>
                            <div className="text-[10px] text-gray-400">
                              {fe.feCode}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`font-semibold ${tc >= 5 ? "text-green-600" : tc > 0 ? "text-amber-600" : "text-red-600"}`}
                        >
                          {tc}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-500">5</td>
                      <td className="py-3 px-3">
                        {met ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-gray-600">
                        {convRate.toFixed(1)}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 5 — Commission Wallet */}
        <div
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6"
          data-ocid="tl.commission_wallet.card"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">
              Commission Wallet
            </h2>
            <button
              type="button"
              onClick={() => setShowCommDetails((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
              data-ocid="tl.commission.view_details"
            >
              View Details
              {showCommDetails ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
              <p className="text-xs text-amber-600 font-medium mb-1">Pending</p>
              <p className="text-xl font-bold text-amber-700">
                ₹{pendingComm.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
              <p className="text-xs text-blue-600 font-medium mb-1">Approved</p>
              <p className="text-xl font-bold text-blue-700">
                ₹{approvedComm.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
              <p className="text-xs text-green-600 font-medium mb-1">Paid</p>
              <p className="text-xl font-bold text-green-700">
                ₹{paidComm.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          {showCommDetails && (
            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">
                Recent Transactions
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {commissions.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">
                    No transactions yet.
                  </p>
                ) : (
                  [...commissions]
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime(),
                    )
                    .map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg text-sm"
                        data-ocid={`tl.comm_row.${c.id}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="text-xs text-gray-400 flex-shrink-0">
                            {new Date(c.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </div>
                          <span className="text-gray-700 truncate">
                            {c.feName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <span className="font-semibold text-gray-900">
                            ₹{c.amount}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              c.status === "paid"
                                ? "bg-green-100 text-green-800"
                                : c.status === "approved"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {c.status.charAt(0).toUpperCase() +
                              c.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* SECTION 6 — Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <div
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6"
            data-ocid="tl.chart.daily"
          >
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Daily Registrations (Last 7 Days)
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart
                data={last7Days}
                margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                  }}
                  formatter={(v: number) => [v, "Registrations"]}
                />
                <Line
                  type="monotone"
                  dataKey="regs"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#3b82f6" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6"
            data-ocid="tl.chart.monthly"
          >
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Monthly Performance (Last 6 Months)
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={last6Months}
                margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                  }}
                  formatter={(v: number) => [v, "Registrations"]}
                />
                <ReferenceLine
                  y={83}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  label={{ value: "Target", fontSize: 10, fill: "#f59e0b" }}
                />
                <Bar dataKey="regs" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SECTION 7 — Team Leaderboard */}
        <div
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6"
          data-ocid="tl.leaderboard.card"
        >
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Team Leaderboard
          </h2>

          {ranked.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              No FEs assigned yet.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {topFE && (
                  <div
                    className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl"
                    data-ocid="tl.leaderboard.top"
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-400 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {topFE.fe.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                        <span className="text-xs font-semibold text-amber-700">
                          Top Performer
                        </span>
                      </div>
                      <p className="font-semibold text-gray-900 truncate">
                        {topFE.fe.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {topFE.monthCount} regs this month ·{" "}
                        {topFE.convRate.toFixed(1)}% conv
                      </p>
                    </div>
                  </div>
                )}
                {bottomFE && bottomFE.fe.id !== topFE?.fe.id && (
                  <div
                    className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl"
                    data-ocid="tl.leaderboard.bottom"
                  >
                    <div className="w-10 h-10 rounded-full bg-red-400 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {bottomFE.fe.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Flag className="h-3.5 w-3.5 text-red-500" />
                        <span className="text-xs font-semibold text-red-700">
                          Needs Support
                        </span>
                      </div>
                      <p className="font-semibold text-gray-900 truncate">
                        {bottomFE.fe.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {bottomFE.monthCount} regs this month ·{" "}
                        {bottomFE.convRate.toFixed(1)}% conv
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">
                        #
                      </th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">
                        FE Name
                      </th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">
                        Today
                      </th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">
                        Month Total
                      </th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranked.map(
                      ({ fe, todayCount: tc, monthCount, met }, i) => (
                        <tr
                          key={fe.id}
                          className="border-b border-gray-50 hover:bg-gray-50"
                          data-ocid={`tl.lb_row.${fe.feCode.toLowerCase()}`}
                        >
                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
                                i === 0
                                  ? "bg-amber-100 text-amber-700"
                                  : i === 1
                                    ? "bg-gray-100 text-gray-600"
                                    : "bg-orange-50 text-orange-600"
                              }`}
                            >
                              {i + 1}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-medium text-gray-900">
                            {fe.name}
                          </td>
                          <td className="py-3 px-3 text-gray-600">{tc}</td>
                          <td className="py-3 px-3 font-semibold text-gray-900">
                            {monthCount}
                          </td>
                          <td className="py-3 px-3">
                            {met ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                On Track
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Needs Attention
                              </span>
                            )}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* SECTION 8 — Bonus Tracker */}
        <div
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6"
          data-ocid="tl.bonus_tracker.card"
        >
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Monthly Bonus Tracker
          </h2>
          <div className="flex items-end justify-between mb-2">
            <div>
              <span className="text-2xl font-bold text-gray-900">
                {monthPaidTotal}
              </span>
              <span className="text-gray-400 font-medium">
                {" "}
                / {MONTHLY_BONUS_TARGET}
              </span>
              <span className="ml-2 text-sm text-gray-500">
                paid registrations
              </span>
            </div>
            <span
              className={`text-base font-bold ${bonusPct >= 100 ? "text-green-600" : "text-gray-700"}`}
            >
              {bonusPct}%
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
            <div
              className={`h-full rounded-full transition-all duration-500 ${bonusProgressColor}`}
              style={{ width: `${bonusPct}%` }}
            />
          </div>

          {bonusUnlocked ? (
            <div
              className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg"
              data-ocid="tl.bonus.unlocked"
            >
              <Award className="h-5 w-5 text-green-600 flex-shrink-0" />
              <span className="text-green-700 font-semibold text-sm">
                Bonus Unlocked! ₹{MONTHLY_BONUS_AMOUNT.toLocaleString("en-IN")}
              </span>
            </div>
          ) : (
            <div
              className="p-3 bg-amber-50 border border-amber-200 rounded-lg"
              data-ocid="tl.bonus.progress"
            >
              <p className="text-amber-700 text-sm">
                <strong>{bonusRemaining}</strong> more paid registrations to
                unlock{" "}
                <strong>₹{MONTHLY_BONUS_AMOUNT.toLocaleString("en-IN")}</strong>{" "}
                bonus!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pb-6">
          <p className="text-xs text-gray-400">
            Last updated:{" "}
            {lastUpdated.toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </p>
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-600 transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}

export default TLDashboard;
