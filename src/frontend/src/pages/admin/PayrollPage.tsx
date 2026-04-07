import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";
import {
  Award,
  CheckCircle,
  Download,
  IndianRupee,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  Settings,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  computeAllFEsSalary,
  computeMonthlySalary,
} from "../../lib/salaryCalc";
import { db } from "../../lib/storage";
import type {
  BonusSlab,
  DeductionConfig,
  SalaryConfig,
  SalaryRecord,
} from "../../types/models";

function currentMonthStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function statusColor(status: string) {
  if (status === "Paid") return "bg-green-100 text-green-700 border-green-300";
  if (status === "Approved") return "bg-blue-100 text-blue-700 border-blue-300";
  return "bg-amber-100 text-amber-700 border-amber-300";
}

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

const COMMISSION_RATE = 10;

function formatMonth(m: string) {
  const [year, mon] = m.split("-");
  return `${MONTH_LABELS[mon] ?? mon} ${year}`;
}

export default function PayrollPage() {
  const [month, setMonth] = useState(currentMonthStr());
  const [records, setRecords] = useState<SalaryRecord[]>([]);
  const [configs, setConfigs] = useState<SalaryConfig[]>([]);
  const [deductionConfig, setDeductionConfig] = useState<DeductionConfig>(
    db.getDeductionConfig(),
  );
  const [editingFe, setEditingFe] = useState<number | null>(null);
  const [slipRecord, setSlipRecord] = useState<SalaryRecord | null>(null);
  const [editConfig, setEditConfig] = useState<SalaryConfig | null>(null);
  const [slabs, setSlabs] = useState<BonusSlab[]>([]);
  const [top1, setTop1] = useState(500);
  const [top2, setTop2] = useState(300);
  const [top3, setTop3] = useState(200);
  const slipRef = useRef<HTMLDivElement>(null);

  const loadData = () => {
    const cfgs = db.getSalaryConfigs();
    setConfigs(cfgs);
    const computed = computeAllFEsSalary(month);
    // Merge with stored status
    const stored = db.getSalaryRecords();
    const merged = computed.map((r) => {
      const existing = stored.find(
        (s) => s.feId === r.feId && s.month === month,
      );
      return existing
        ? { ...r, paymentStatus: existing.paymentStatus, id: existing.id }
        : r;
    });
    setRecords(merged);
    if (cfgs.length > 0) {
      setSlabs(cfgs[0].bonusSlabs);
      setTop1(cfgs[0].top1Bonus);
      setTop2(cfgs[0].top2Bonus);
      setTop3(cfgs[0].top3Bonus);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: loadData reads month from state
  useEffect(() => {
    loadData();
  }, [month]); // eslint-disable-line

  const totalPayroll = records.reduce((s, r) => s + r.finalSalary, 0);
  const approvedAmt = records
    .filter((r) => r.paymentStatus === "Approved")
    .reduce((s, r) => s + r.finalSalary, 0);
  const pendingAmt = records
    .filter((r) => r.paymentStatus === "Pending")
    .reduce((s, r) => s + r.finalSalary, 0);
  const paidAmt = records
    .filter((r) => r.paymentStatus === "Paid")
    .reduce((s, r) => s + r.finalSalary, 0);

  // Total commission for selected month
  const [year, mon] = month.split("-");
  const allRegs = db.getRegistrations();
  const monthStart = new Date(`${year}-${mon}-01`);
  const monthEnd = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth() + 1,
    0,
  );
  const monthlyPaidRegs = allRegs.filter((r) => {
    const d = new Date(r.createdAt);
    return r.paymentStatus === "Paid" && d >= monthStart && d <= monthEnd;
  });
  const totalCommission = monthlyPaidRegs.length * COMMISSION_RATE;

  function updateStatus(feId: number, status: "Approved" | "Paid") {
    const stored = db.getSalaryRecords();
    const rec = records.find((r) => r.feId === feId);
    if (!rec) return;
    const updated = stored.filter(
      (r) => !(r.feId === feId && r.month === month),
    );
    updated.push({
      ...rec,
      paymentStatus: status,
      generatedAt: new Date().toISOString(),
    });
    db.saveSalaryRecords(updated);
    setRecords((prev) =>
      prev.map((r) => (r.feId === feId ? { ...r, paymentStatus: status } : r)),
    );
    toast.success(
      `Salary ${status === "Approved" ? "approved" : "marked as paid"} for ${rec.feName}`,
    );
  }

  function recalculate(feId: number) {
    const rec = computeMonthlySalary(feId, month);
    const stored = db.getSalaryRecords();
    const filtered = stored.filter(
      (r) => !(r.feId === feId && r.month === month),
    );
    filtered.push(rec);
    db.saveSalaryRecords(filtered);
    setRecords((prev) => prev.map((r) => (r.feId === feId ? rec : r)));
    toast.success("Salary recalculated");
  }

  function saveSalaryConfig() {
    if (!editConfig) return;
    const cfgs = db.getSalaryConfigs();
    const updated = cfgs.filter((c) => c.feId !== editConfig.feId);
    updated.push(editConfig);
    db.saveSalaryConfigs(updated);
    // Also update FE record
    const feList = db.getFEs();
    const updatedFEs = feList.map((fe) =>
      fe.id === editConfig.feId
        ? {
            ...fe,
            fixedSalary: editConfig.fixedSalary,
            incentivePerRegistration: editConfig.incentivePerRegistration,
          }
        : fe,
    );
    db.saveFEs(updatedFEs);
    setEditingFe(null);
    setEditConfig(null);
    loadData();
    toast.success("Salary config saved");
  }

  function saveSlabs() {
    const cfgs = db.getSalaryConfigs();
    const updatedCfgs = cfgs.map((c) => ({
      ...c,
      bonusSlabs: slabs,
      top1Bonus: top1,
      top2Bonus: top2,
      top3Bonus: top3,
    }));
    db.saveSalaryConfigs(updatedCfgs);
    loadData();
    toast.success("Bonus slabs saved for all FEs");
  }

  function saveDeductions() {
    db.saveDeductionConfig(deductionConfig);
    loadData();
    toast.success("Deduction rules saved");
  }

  function addSlab() {
    setSlabs([
      ...slabs,
      { minRegistrations: 0, maxRegistrations: 50, bonusPerRegistration: 0 },
    ]);
  }

  function removeSlab(idx: number) {
    setSlabs(slabs.filter((_, i) => i !== idx));
  }

  function printSlip() {
    window.print();
  }

  const SalarySlipContent = ({ record }: { record: SalaryRecord }) => (
    <div ref={slipRef} className="space-y-4 text-sm">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            OpenFrame EduTech
          </h2>
          <p className="text-xs text-muted-foreground">Salary Slip</p>
        </div>
        <Badge variant="outline" className={statusColor(record.paymentStatus)}>
          {record.paymentStatus}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">Name:</span>{" "}
          <span className="font-medium">{record.feName}</span>
        </div>
        <div>
          <span className="text-muted-foreground">FE Code:</span>{" "}
          <span className="font-mono font-semibold">{record.feCode}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Month:</span>{" "}
          <span className="font-medium">{formatMonth(record.month)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Generated:</span>{" "}
          <span>
            {new Date(record.generatedAt).toLocaleDateString("en-IN")}
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
                +{formatCurrency(record.fixedSalary)}
              </td>
            </tr>
            <tr className="border-t">
              <td className="p-3">
                Incentive ({record.totalPaidRegistrations} paid regs)
              </td>
              <td className="p-3 text-right text-green-700 font-medium">
                +{formatCurrency(record.incentiveAmount)}
              </td>
            </tr>
            <tr className="border-t">
              <td className="p-3">Slab Bonus</td>
              <td className="p-3 text-right text-green-700 font-medium">
                +{formatCurrency(record.bonusAmount)}
              </td>
            </tr>
            <tr className="border-t">
              <td className="p-3">Top-3 Performance Bonus</td>
              <td className="p-3 text-right text-green-700 font-medium">
                +{formatCurrency(record.top3BonusAmount)}
              </td>
            </tr>
            <tr className="border-t bg-red-50/40">
              <td className="p-3 text-red-700">Attendance Deduction</td>
              <td className="p-3 text-right text-red-700 font-medium">
                -{formatCurrency(record.attendanceDeduction)}
              </td>
            </tr>
            <tr className="border-t bg-red-50/40">
              <td className="p-3 text-red-700">Target Penalty</td>
              <td className="p-3 text-right text-red-700 font-medium">
                -{formatCurrency(record.penaltyAmount)}
              </td>
            </tr>
            <tr className="border-t bg-green-50 font-bold">
              <td className="p-3">Final Payout</td>
              <td className="p-3 text-right text-green-700 text-base">
                {formatCurrency(record.finalSalary)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="grid grid-cols-3 gap-3 pt-1">
        <div className="text-center bg-muted/20 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Total Regs</p>
          <p className="font-bold text-lg">{record.totalRegistrations}</p>
        </div>
        <div className="text-center bg-muted/20 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Paid Regs</p>
          <p className="font-bold text-lg text-green-700">
            {record.totalPaidRegistrations}
          </p>
        </div>
        <div className="text-center bg-muted/20 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Conversion</p>
          <p className="font-bold text-lg">
            {record.totalRegistrations > 0
              ? Math.round(
                  (record.totalPaidRegistrations / record.totalRegistrations) *
                    100,
                )
              : 0}
            %
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6 print:p-4">
      {/* Print: only show slip */}
      {slipRecord && (
        <div className="hidden print:block">
          <SalarySlipContent record={slipRecord} />
        </div>
      )}

      <div className="print:hidden space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Payroll Management
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Manage FE salaries, incentives, and payouts
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
              data-ocid="admin.payroll.month_picker"
            />

            {/* Deduction Config Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2"
                  data-ocid="admin.payroll.deductions_button"
                >
                  <Settings className="h-4 w-4" /> Deductions
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Deduction Rules</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <Label>Absent deduction per day (₹)</Label>
                    <Input
                      type="number"
                      value={deductionConfig.absentDeductionPerDay}
                      onChange={(e) =>
                        setDeductionConfig((p) => ({
                          ...p,
                          absentDeductionPerDay: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Low hours threshold (hours)</Label>
                    <Input
                      type="number"
                      value={deductionConfig.lowHoursThreshold}
                      onChange={(e) =>
                        setDeductionConfig((p) => ({
                          ...p,
                          lowHoursThreshold: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Low hours deduction per day (₹)</Label>
                    <Input
                      type="number"
                      value={deductionConfig.lowHoursDeductionPerDay}
                      onChange={(e) =>
                        setDeductionConfig((p) => ({
                          ...p,
                          lowHoursDeductionPerDay: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Penalty for unmet monthly target (₹)</Label>
                    <Input
                      type="number"
                      value={deductionConfig.penaltyPerUnmetTarget}
                      onChange={(e) =>
                        setDeductionConfig((p) => ({
                          ...p,
                          penaltyPerUnmetTarget: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <Button
                    className="w-full teal-gradient text-white border-0"
                    onClick={saveDeductions}
                  >
                    Save Rules
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                window.print();
              }}
              data-ocid="admin.payroll.download_button"
            >
              <Download className="h-4 w-4" /> Export
            </Button>
          </div>
        </div>

        {/* Commission Rules Banner */}
        <div
          className="bg-amber-50 border border-amber-200 rounded-xl p-4"
          data-ocid="admin.payroll.commission_rules.card"
        >
          <div className="flex items-start gap-2">
            <IndianRupee className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                Default Commission Rate: ₹10 per paid registration
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                All FE commission calculations use this rate unless individually
                overridden in the salary configuration below.
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div
          className="grid grid-cols-2 lg:grid-cols-5 gap-4"
          data-ocid="admin.payroll.summary"
        >
          {[
            {
              label: "Total Payroll",
              value: totalPayroll,
              color: "text-foreground",
              bg: "bg-white",
              icon: IndianRupee,
            },
            {
              label: "Approved",
              value: approvedAmt,
              color: "text-blue-700",
              bg: "bg-blue-50",
              icon: CheckCircle,
            },
            {
              label: "Pending",
              value: pendingAmt,
              color: "text-amber-700",
              bg: "bg-amber-50",
              icon: Users,
            },
            {
              label: "Paid Out",
              value: paidAmt,
              color: "text-green-700",
              bg: "bg-green-50",
              icon: Award,
            },
            {
              label: "Total Commission",
              value: totalCommission,
              color: "text-emerald-700",
              bg: "bg-emerald-50",
              icon: IndianRupee,
            },
          ].map(({ label, value, color, bg, icon: Icon }) => (
            <div
              key={label}
              className={`${bg} rounded-xl border border-border shadow-card p-4 flex items-center gap-3`}
            >
              <Icon className={`h-8 w-8 ${color} opacity-70`} />
              <div>
                <p className={`text-xl font-bold ${color}`}>
                  {formatCurrency(value)}
                </p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bonus Slabs Configuration */}
        <div className="bg-white rounded-xl border border-border shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">
              Bonus Slab Configuration
            </h3>
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={addSlab}
              data-ocid="admin.payroll.add_slab_button"
            >
              <Plus className="h-3.5 w-3.5" /> Add Slab
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-xs font-semibold text-muted-foreground">
                    Min Regs
                  </th>
                  <th className="text-left p-2 text-xs font-semibold text-muted-foreground">
                    Max Regs
                  </th>
                  <th className="text-left p-2 text-xs font-semibold text-muted-foreground">
                    Bonus/Reg (₹)
                  </th>
                  <th className="p-2" />
                </tr>
              </thead>
              <tbody>
                {slabs.map((slab, idx) => (
                  <tr
                    // biome-ignore lint/suspicious/noArrayIndexKey: slabs have no stable unique id
                    key={idx}
                    className="border-b border-border last:border-0"
                  >
                    <td className="p-2">
                      <Input
                        type="number"
                        value={slab.minRegistrations}
                        onChange={(e) =>
                          setSlabs((s) =>
                            s.map((x, i) =>
                              i === idx
                                ? {
                                    ...x,
                                    minRegistrations: Number(e.target.value),
                                  }
                                : x,
                            ),
                          )
                        }
                        className="w-24 h-8"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        placeholder="∞"
                        value={slab.maxRegistrations ?? ""}
                        onChange={(e) =>
                          setSlabs((s) =>
                            s.map((x, i) =>
                              i === idx
                                ? {
                                    ...x,
                                    maxRegistrations:
                                      e.target.value === ""
                                        ? null
                                        : Number(e.target.value),
                                  }
                                : x,
                            ),
                          )
                        }
                        className="w-24 h-8"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        value={slab.bonusPerRegistration}
                        onChange={(e) =>
                          setSlabs((s) =>
                            s.map((x, i) =>
                              i === idx
                                ? {
                                    ...x,
                                    bonusPerRegistration: Number(
                                      e.target.value,
                                    ),
                                  }
                                : x,
                            ),
                          )
                        }
                        className="w-24 h-8"
                      />
                    </td>
                    <td className="p-2">
                      <button
                        type="button"
                        onClick={() => removeSlab(idx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-4 items-end flex-wrap">
            <div className="space-y-1">
              <Label className="text-xs">1st Place Bonus (₹)</Label>
              <Input
                type="number"
                value={top1}
                onChange={(e) => setTop1(Number(e.target.value))}
                className="w-32"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">2nd Place Bonus (₹)</Label>
              <Input
                type="number"
                value={top2}
                onChange={(e) => setTop2(Number(e.target.value))}
                className="w-32"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">3rd Place Bonus (₹)</Label>
              <Input
                type="number"
                value={top3}
                onChange={(e) => setTop3(Number(e.target.value))}
                className="w-32"
              />
            </div>
            <Button
              className="teal-gradient text-white border-0"
              onClick={saveSlabs}
              data-ocid="admin.payroll.save_slabs_button"
            >
              Save Slabs
            </Button>
          </div>
        </div>

        {/* Payroll Table */}
        <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-foreground">
              Salary Breakdown — {formatMonth(month)}
            </h3>
            <span className="text-xs text-muted-foreground">
              {records.length} field executives
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-ocid="admin.payroll.table">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground">
                    FE
                  </th>
                  <th className="text-center p-3 text-xs font-semibold text-muted-foreground">
                    Regs
                  </th>
                  <th className="text-center p-3 text-xs font-semibold text-muted-foreground">
                    Paid
                  </th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground">
                    Fixed
                  </th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground">
                    Incentive
                  </th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground">
                    Bonus
                  </th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground">
                    Top-3
                  </th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground">
                    Deduct
                  </th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground">
                    Penalty
                  </th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground">
                    Final
                  </th>
                  <th className="text-center p-3 text-xs font-semibold text-muted-foreground">
                    Status
                  </th>
                  <th className="text-center p-3 text-xs font-semibold text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td
                      colSpan={12}
                      className="text-center p-6 text-muted-foreground"
                    >
                      No FEs found
                    </td>
                  </tr>
                ) : (
                  records.map((rec, idx) => (
                    <tr
                      key={rec.feId}
                      className="border-b border-border last:border-0 hover:bg-muted/10"
                      data-ocid={`admin.payroll.row.${idx + 1}`}
                    >
                      <td className="p-3">
                        <div>
                          <p className="font-medium text-foreground">
                            {rec.feName}
                          </p>
                          <p className="text-xs font-mono text-muted-foreground">
                            {rec.feCode}
                          </p>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        {rec.totalRegistrations}
                      </td>
                      <td className="p-3 text-center text-green-700 font-medium">
                        {rec.totalPaidRegistrations}
                      </td>
                      <td className="p-3 text-right">
                        {formatCurrency(rec.fixedSalary)}
                      </td>
                      <td className="p-3 text-right text-green-700">
                        {formatCurrency(rec.incentiveAmount)}
                      </td>
                      <td className="p-3 text-right text-green-700">
                        {formatCurrency(rec.bonusAmount)}
                      </td>
                      <td className="p-3 text-right text-blue-700">
                        {formatCurrency(rec.top3BonusAmount)}
                      </td>
                      <td className="p-3 text-right text-red-600">
                        -{formatCurrency(rec.attendanceDeduction)}
                      </td>
                      <td className="p-3 text-right text-red-600">
                        -{formatCurrency(rec.penaltyAmount)}
                      </td>
                      <td className="p-3 text-right font-bold text-foreground">
                        {formatCurrency(rec.finalSalary)}
                      </td>
                      <td className="p-3 text-center">
                        <Badge
                          variant="outline"
                          className={`text-xs ${statusColor(rec.paymentStatus)}`}
                        >
                          {rec.paymentStatus}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1 justify-center flex-wrap">
                          {/* Config edit */}
                          <Dialog
                            open={editingFe === rec.feId}
                            onOpenChange={(open) => {
                              if (open) {
                                const cfg = configs.find(
                                  (c) => c.feId === rec.feId,
                                ) ?? {
                                  feId: rec.feId,
                                  fixedSalary: rec.fixedSalary,
                                  incentivePerRegistration: 0,
                                  bonusSlabs: [],
                                  top1Bonus: 500,
                                  top2Bonus: 300,
                                  top3Bonus: 200,
                                };
                                setEditConfig({ ...cfg });
                                setEditingFe(rec.feId);
                              } else {
                                setEditingFe(null);
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <button
                                type="button"
                                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                                title="Edit config"
                                data-ocid={`admin.payroll.edit.${idx + 1}`}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-sm">
                              <DialogHeader>
                                <DialogTitle>
                                  Salary Config — {rec.feName}
                                </DialogTitle>
                              </DialogHeader>
                              {editConfig && (
                                <div className="space-y-4">
                                  <div className="space-y-1">
                                    <Label>Fixed Monthly Salary (₹)</Label>
                                    <Input
                                      type="number"
                                      value={editConfig.fixedSalary}
                                      onChange={(e) =>
                                        setEditConfig((p) =>
                                          p
                                            ? {
                                                ...p,
                                                fixedSalary: Number(
                                                  e.target.value,
                                                ),
                                              }
                                            : p,
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label>
                                      Incentive per Paid Registration (₹)
                                    </Label>
                                    <Input
                                      type="number"
                                      value={
                                        editConfig.incentivePerRegistration
                                      }
                                      onChange={(e) =>
                                        setEditConfig((p) =>
                                          p
                                            ? {
                                                ...p,
                                                incentivePerRegistration:
                                                  Number(e.target.value),
                                              }
                                            : p,
                                        )
                                      }
                                    />
                                  </div>
                                  <Button
                                    className="w-full teal-gradient text-white border-0"
                                    onClick={saveSalaryConfig}
                                    data-ocid="admin.payroll.save_config_button"
                                  >
                                    Save Config
                                  </Button>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          {rec.paymentStatus === "Pending" && (
                            <button
                              type="button"
                              onClick={() => updateStatus(rec.feId, "Approved")}
                              className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                              data-ocid={`admin.payroll.approve.${idx + 1}`}
                            >
                              Approve
                            </button>
                          )}
                          {rec.paymentStatus === "Approved" && (
                            <button
                              type="button"
                              onClick={() => updateStatus(rec.feId, "Paid")}
                              className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                              data-ocid={`admin.payroll.paid.${idx + 1}`}
                            >
                              Mark Paid
                            </button>
                          )}

                          {/* Salary Slip */}
                          <Dialog
                            onOpenChange={(open) => {
                              if (open) setSlipRecord(rec);
                            }}
                          >
                            <DialogTrigger asChild>
                              <button
                                type="button"
                                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                                title="Salary Slip"
                                data-ocid={`admin.payroll.slip.${idx + 1}`}
                              >
                                <Printer className="h-3.5 w-3.5" />
                              </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                              <DialogHeader>
                                <DialogTitle>Salary Slip</DialogTitle>
                              </DialogHeader>
                              <SalarySlipContent record={rec} />
                              <Button
                                className="w-full gap-2 teal-gradient text-white border-0 mt-2"
                                onClick={printSlip}
                              >
                                <Printer className="h-4 w-4" /> Print Salary
                                Slip
                              </Button>
                            </DialogContent>
                          </Dialog>

                          <button
                            type="button"
                            onClick={() => recalculate(rec.feId)}
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                            title="Recalculate"
                            data-ocid={`admin.payroll.recalc.${idx + 1}`}
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Progress overview */}
        {records.length > 0 && (
          <div className="bg-white rounded-xl border border-border shadow-card p-5">
            <h3 className="font-semibold text-foreground mb-4">
              Payout Progress
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Paid</span>
                  <span>
                    {formatCurrency(paidAmt)} / {formatCurrency(totalPayroll)}
                  </span>
                </div>
                <Progress
                  value={totalPayroll > 0 ? (paidAmt / totalPayroll) * 100 : 0}
                  className="h-2.5"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
