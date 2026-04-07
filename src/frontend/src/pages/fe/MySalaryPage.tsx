import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";
import {
  Calendar,
  CheckCircle2,
  IndianRupee,
  Printer,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  computeMonthlySalary,
  computeTodayEarnings,
  getAppliedSlab,
} from "../../lib/salaryCalc";
import { db } from "../../lib/storage";
import type { SalaryRecord } from "../../types/models";

const MONTH_LABELS: Record<string, string> = {
  "01": "January",
  "02": "February",
  "03": "March",
  "04": "April",
  "05": "May",
  "06": "June",
  "07": "July",
  "08": "August",
  "09": "September",
  "10": "October",
  "11": "November",
  "12": "December",
};

function currentMonthStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonth(m: string) {
  const [year, mon] = m.split("-");
  return `${MONTH_LABELS[mon] ?? mon} ${year}`;
}

function getPast3Months(): string[] {
  const months: string[] = [];
  const d = new Date();
  for (let i = 1; i <= 3; i++) {
    const past = new Date(d.getFullYear(), d.getMonth() - i, 1);
    months.push(
      `${past.getFullYear()}-${String(past.getMonth() + 1).padStart(2, "0")}`,
    );
  }
  return months;
}

function statusColor(status: string) {
  if (status === "Paid") return "bg-green-100 text-green-700 border-green-300";
  if (status === "Approved") return "bg-blue-100 text-blue-700 border-blue-300";
  return "bg-amber-100 text-amber-700 border-amber-300";
}

export default function MySalaryPage() {
  const { session } = useApp();
  const feId = session?.id ?? 0;

  const [currentRecord, setCurrentRecord] = useState<SalaryRecord | null>(null);
  const [pastRecords, setPastRecords] = useState<
    { month: string; record: SalaryRecord }[]
  >([]);
  const [todayStats, setTodayStats] = useState({
    todayRegistrations: 0,
    todayPaidRegistrations: 0,
    todayIncentive: 0,
  });
  const [slipOpen, setSlipOpen] = useState(false);

  const salaryConfig = useMemo(
    () => db.getSalaryConfigs().find((c) => c.feId === feId) ?? null,
    [feId],
  );

  useEffect(() => {
    if (!feId) return;
    const month = currentMonthStr();
    const rec = computeMonthlySalary(feId, month);
    // Merge with stored status
    const stored = db.getSalaryRecords();
    const existing = stored.find((r) => r.feId === feId && r.month === month);
    setCurrentRecord(
      existing ? { ...rec, paymentStatus: existing.paymentStatus } : rec,
    );

    const past = getPast3Months().map((m) => {
      const r = computeMonthlySalary(feId, m);
      const ex = stored.find((s) => s.feId === feId && s.month === m);
      return {
        month: m,
        record: ex ? { ...r, paymentStatus: ex.paymentStatus } : r,
      };
    });
    setPastRecords(past);

    setTodayStats(computeTodayEarnings(feId));
  }, [feId]);

  const monthlyProgress =
    currentRecord && currentRecord.finalSalary > 0
      ? Math.min(
          100,
          (currentRecord.incentiveAmount /
            Math.max(currentRecord.fixedSalary, 1)) *
            100,
        )
      : 0;

  const slabLabel = useMemo(() => {
    if (!currentRecord || !salaryConfig) return "No slab data";
    return getAppliedSlab(
      currentRecord.totalPaidRegistrations,
      salaryConfig.bonusSlabs,
    );
  }, [currentRecord, salaryConfig]);

  function printSlip() {
    window.print();
  }

  const SlipContent = () =>
    currentRecord ? (
      <div className="space-y-4 text-sm">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h2 className="text-lg font-bold">OpenFrame EduTech</h2>
            <p className="text-xs text-muted-foreground">
              Salary Slip — {formatMonth(currentRecord.month)}
            </p>
          </div>
          <Badge
            variant="outline"
            className={statusColor(currentRecord.paymentStatus)}
          >
            {currentRecord.paymentStatus}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-muted-foreground">Name:</span>{" "}
            <span className="font-medium">{currentRecord.feName}</span>
          </div>
          <div>
            <span className="text-muted-foreground">FE Code:</span>{" "}
            <span className="font-mono font-semibold">
              {currentRecord.feCode}
            </span>
          </div>
        </div>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr>
                <th className="text-left p-3 font-semibold">Description</th>
                <th className="text-right p-3 font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="p-3">Fixed Salary</td>
                <td className="p-3 text-right text-green-700 font-medium">
                  +{formatCurrency(currentRecord.fixedSalary)}
                </td>
              </tr>
              <tr className="border-t">
                <td className="p-3">
                  Incentive ({currentRecord.totalPaidRegistrations} paid regs)
                </td>
                <td className="p-3 text-right text-green-700 font-medium">
                  +{formatCurrency(currentRecord.incentiveAmount)}
                </td>
              </tr>
              <tr className="border-t">
                <td className="p-3">Slab Bonus</td>
                <td className="p-3 text-right text-green-700 font-medium">
                  +{formatCurrency(currentRecord.bonusAmount)}
                </td>
              </tr>
              <tr className="border-t">
                <td className="p-3">Top-3 Bonus</td>
                <td className="p-3 text-right text-green-700 font-medium">
                  +{formatCurrency(currentRecord.top3BonusAmount)}
                </td>
              </tr>
              <tr className="border-t bg-red-50/40">
                <td className="p-3 text-red-700">Attendance Deduction</td>
                <td className="p-3 text-right text-red-700">
                  -{formatCurrency(currentRecord.attendanceDeduction)}
                </td>
              </tr>
              <tr className="border-t bg-red-50/40">
                <td className="p-3 text-red-700">Target Penalty</td>
                <td className="p-3 text-right text-red-700">
                  -{formatCurrency(currentRecord.penaltyAmount)}
                </td>
              </tr>
              <tr className="border-t bg-green-50 font-bold">
                <td className="p-3">Final Payout</td>
                <td className="p-3 text-right text-green-700 text-base">
                  {formatCurrency(currentRecord.finalSalary)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    ) : null;

  return (
    <div className="p-6 space-y-6">
      {/* Print slip */}
      {slipOpen && currentRecord && (
        <div className="hidden print:block">
          <SlipContent />
        </div>
      )}

      <div className="print:hidden space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Salary</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {session?.feCode} • Earnings and salary overview
          </p>
        </div>

        {/* Today's Stats */}
        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          data-ocid="fe.salary.today_section"
        >
          <div className="bg-white rounded-xl border border-border shadow-card p-4 flex items-center gap-3">
            <IndianRupee className="h-8 w-8 text-green-600 opacity-80" />
            <div>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(todayStats.todayIncentive)}
              </p>
              <p className="text-xs text-muted-foreground">Today's Incentive</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-border shadow-card p-4 flex items-center gap-3">
            <UserPlus className="h-8 w-8 text-blue-500 opacity-80" />
            <div>
              <p className="text-2xl font-bold text-foreground">
                {todayStats.todayRegistrations}
              </p>
              <p className="text-xs text-muted-foreground">
                Registrations Today
              </p>
              <p className="text-xs text-green-600">
                {todayStats.todayPaidRegistrations} paid
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-border shadow-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <p className="text-xs font-medium text-foreground">
                Monthly Progress
              </p>
            </div>
            <Progress value={monthlyProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(currentRecord?.incentiveAmount ?? 0)} incentive
              earned
            </p>
          </div>
        </div>

        {/* Current Month Breakdown */}
        {currentRecord && (
          <div className="bg-white rounded-xl border border-border shadow-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-foreground">
                  {formatMonth(currentRecord.month)} — Salary Breakdown
                </h3>
              </div>
              <Badge
                variant="outline"
                className={statusColor(currentRecord.paymentStatus)}
              >
                {currentRecord.paymentStatus}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fixed Salary</span>
                  <span className="font-medium text-green-700">
                    +{formatCurrency(currentRecord.fixedSalary)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Registrations (Paid)
                  </span>
                  <span className="text-foreground">
                    {currentRecord.totalRegistrations} (
                    {currentRecord.totalPaidRegistrations} paid)
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Incentive Earned
                  </span>
                  <span className="font-medium text-green-700">
                    +{formatCurrency(currentRecord.incentiveAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Slab Bonus</span>
                  <span className="font-medium text-green-700">
                    +{formatCurrency(currentRecord.bonusAmount)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground pl-1">
                  Applied slab: {slabLabel}
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Top-3 Performance Bonus
                  </span>
                  <span className="font-medium text-blue-700">
                    +{formatCurrency(currentRecord.top3BonusAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Attendance Deduction
                  </span>
                  <span className="font-medium text-red-600">
                    -{formatCurrency(currentRecord.attendanceDeduction)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Target Penalty</span>
                  <span className="font-medium text-red-600">
                    {currentRecord.penaltyAmount > 0 ? (
                      `-${formatCurrency(currentRecord.penaltyAmount)}`
                    ) : (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Target Met
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">
                  Estimated Final Salary
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrency(currentRecord.finalSalary)}
                </p>
              </div>
              <Dialog open={slipOpen} onOpenChange={setSlipOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="gap-2 teal-gradient text-white border-0"
                    data-ocid="fe.salary.slip_button"
                  >
                    <Printer className="h-4 w-4" /> Download Salary Slip
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>
                      Salary Slip — {formatMonth(currentRecord.month)}
                    </DialogTitle>
                  </DialogHeader>
                  <SlipContent />
                  <Button
                    className="w-full gap-2 teal-gradient text-white border-0 mt-2"
                    onClick={printSlip}
                  >
                    <Printer className="h-4 w-4" /> Print
                  </Button>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}

        {/* Past Months */}
        <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Previous Months</h3>
          </div>
          <div className="overflow-x-auto">
            <table
              className="w-full text-sm"
              data-ocid="fe.salary.history_table"
            >
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground">
                    Month
                  </th>
                  <th className="text-center p-4 text-xs font-semibold text-muted-foreground">
                    Regs
                  </th>
                  <th className="text-center p-4 text-xs font-semibold text-muted-foreground">
                    Paid
                  </th>
                  <th className="text-right p-4 text-xs font-semibold text-muted-foreground">
                    Incentive
                  </th>
                  <th className="text-right p-4 text-xs font-semibold text-muted-foreground">
                    Final Salary
                  </th>
                  <th className="text-center p-4 text-xs font-semibold text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {pastRecords.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center p-6 text-muted-foreground"
                    >
                      No past salary records
                    </td>
                  </tr>
                ) : (
                  pastRecords.map(({ month: m, record: r }, idx) => (
                    <tr
                      key={m}
                      className="border-b border-border last:border-0 hover:bg-muted/10"
                      data-ocid={`fe.salary.history.${idx + 1}`}
                    >
                      <td className="p-4 font-medium">{formatMonth(m)}</td>
                      <td className="p-4 text-center">
                        {r.totalRegistrations}
                      </td>
                      <td className="p-4 text-center text-green-700">
                        {r.totalPaidRegistrations}
                      </td>
                      <td className="p-4 text-right">
                        {formatCurrency(r.incentiveAmount)}
                      </td>
                      <td className="p-4 text-right font-semibold">
                        {formatCurrency(r.finalSalary)}
                      </td>
                      <td className="p-4 text-center">
                        <Badge
                          variant="outline"
                          className={`text-xs ${statusColor(r.paymentStatus)}`}
                        >
                          {r.paymentStatus}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Salary Config info */}
        {salaryConfig && (
          <div className="bg-muted/20 rounded-xl border border-border p-4">
            <h4 className="text-sm font-semibold text-foreground mb-2">
              Your Salary Structure
            </h4>
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Fixed Salary:</span>{" "}
                <span className="font-medium">
                  {formatCurrency(salaryConfig.fixedSalary)}/month
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Incentive:</span>{" "}
                <span className="font-medium">
                  {formatCurrency(salaryConfig.incentivePerRegistration)}/paid
                  reg
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Top-1 Bonus:</span>{" "}
                <span className="font-medium text-yellow-700">
                  {formatCurrency(salaryConfig.top1Bonus)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Top-2 Bonus:</span>{" "}
                <span className="font-medium text-gray-600">
                  {formatCurrency(salaryConfig.top2Bonus)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Top-3 Bonus:</span>{" "}
                <span className="font-medium text-orange-600">
                  {formatCurrency(salaryConfig.top3Bonus)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
