import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IndianRupee, Info, Save, Target, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { db } from "../../lib/storage";
import type { FieldExecutive } from "../../types/models";

const COMMISSION_RATE = 10;
const DEFAULT_DAILY_TARGET = 5;
const MIN_ACTIVE_STUDENTS = 20;

interface FETargetRow {
  fe: FieldExecutive;
  dailyTarget: number;
  weeklyTarget: number;
  monthlyTarget: number;
  todayCount: number;
  weekCount: number;
  monthCount: number;
  paidStudents: number;
}

export default function TargetsPage() {
  const [rows, setRows] = useState<FETargetRow[]>([]);

  useEffect(() => {
    const fes = db.getFEs();
    const regs = db.getRegistrations();
    const today = new Date();
    const todayStr = today.toDateString();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    const data: FETargetRow[] = fes.map((fe) => {
      const feRegs = regs.filter((r) => r.feId === fe.id);
      const todayCount = feRegs.filter(
        (r) => new Date(r.createdAt).toDateString() === todayStr,
      ).length;
      const weekCount = feRegs.filter(
        (r) => new Date(r.createdAt) >= weekAgo,
      ).length;
      const monthCount = feRegs.filter(
        (r) => new Date(r.createdAt) >= monthAgo,
      ).length;
      const paidStudents = feRegs.filter(
        (r) => r.paymentStatus === "Paid",
      ).length;
      return {
        fe,
        dailyTarget: fe.dailyTarget ?? DEFAULT_DAILY_TARGET,
        weeklyTarget: fe.weeklyTarget ?? 25,
        monthlyTarget: fe.monthlyTarget ?? 100,
        todayCount,
        weekCount,
        monthCount,
        paidStudents,
      };
    });
    setRows(data);
  }, []);

  const updateTarget = (
    feId: number,
    field: "dailyTarget" | "weeklyTarget" | "monthlyTarget",
    value: number,
  ) => {
    setRows((prev) =>
      prev.map((r) => (r.fe.id === feId ? { ...r, [field]: value } : r)),
    );
  };

  const saveTargets = (row: FETargetRow) => {
    const fes = db.getFEs();
    const updated = fes.map((fe) =>
      fe.id === row.fe.id
        ? {
            ...fe,
            dailyTarget: row.dailyTarget,
            weeklyTarget: row.weeklyTarget,
            monthlyTarget: row.monthlyTarget,
          }
        : fe,
    );
    db.saveFEs(updated);
    toast.success(`Targets updated for ${row.fe.name}`);
  };

  function getPaidStudentsColor(count: number): string {
    if (count >= MIN_ACTIVE_STUDENTS) return "text-green-600 font-semibold";
    if (count >= 10) return "text-amber-600 font-semibold";
    return "text-red-600 font-semibold";
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Target Management
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Set daily, weekly, and monthly registration targets for each FE
        </p>
      </div>

      {/* Global Commission Rules Banner */}
      <div
        className="bg-indigo-50 border border-indigo-200 rounded-xl p-4"
        data-ocid="admin.targets.rules.card"
      >
        <div className="flex items-center gap-2 mb-2">
          <Info className="h-4 w-4 text-indigo-600" />
          <span className="text-sm font-semibold text-indigo-700">
            Commission & Performance Rules
          </span>
        </div>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-1.5 text-indigo-700 text-sm">
            <IndianRupee className="h-3.5 w-3.5" />
            <span>
              <strong>Commission:</strong> \u20b9{COMMISSION_RATE}/paid reg
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-indigo-700 text-sm">
            <Target className="h-3.5 w-3.5" />
            <span>
              <strong>Daily Target:</strong> {DEFAULT_DAILY_TARGET} regs/day
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-indigo-700 text-sm">
            <UserCheck className="h-3.5 w-3.5" />
            <span>
              <strong>Min Active Students:</strong> {MIN_ACTIVE_STUDENTS}
            </span>
          </div>
        </div>
      </div>

      <div
        className="bg-white rounded-xl border border-border shadow-card overflow-hidden"
        data-ocid="admin.targets.table"
      >
        <div className="flex items-center gap-2 p-4 border-b border-border bg-muted/20">
          <Target className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm text-foreground">
            FE Targets
          </span>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>FE Name</TableHead>
                <TableHead>FE Code</TableHead>
                <TableHead className="text-center">Daily Target</TableHead>
                <TableHead className="text-center">
                  Today&apos;s Progress
                </TableHead>
                <TableHead className="text-center">Weekly Target</TableHead>
                <TableHead className="text-center">Week Progress</TableHead>
                <TableHead className="text-center">Monthly Target</TableHead>
                <TableHead className="text-center">Month Progress</TableHead>
                <TableHead className="text-center">Paid Students</TableHead>
                <TableHead className="text-center">Min 20 Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={11}
                    className="text-center py-8 text-muted-foreground"
                    data-ocid="admin.targets.empty_state"
                  >
                    No field executives found
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, idx) => (
                  <TableRow
                    key={row.fe.id}
                    data-ocid={`admin.targets.row.${idx + 1}`}
                  >
                    <TableCell className="font-medium">{row.fe.name}</TableCell>
                    <TableCell>
                      <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                        {row.fe.feCode}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={row.dailyTarget}
                        onChange={(e) =>
                          updateTarget(
                            row.fe.id,
                            "dailyTarget",
                            Number(e.target.value),
                          )
                        }
                        className="w-20 text-center h-8"
                        data-ocid="admin.targets.daily.input"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`text-sm font-medium ${
                          row.todayCount >= row.dailyTarget
                            ? "text-green-600"
                            : "text-amber-600"
                        }`}
                      >
                        {row.todayCount} / {row.dailyTarget}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={1}
                        max={500}
                        value={row.weeklyTarget}
                        onChange={(e) =>
                          updateTarget(
                            row.fe.id,
                            "weeklyTarget",
                            Number(e.target.value),
                          )
                        }
                        className="w-20 text-center h-8"
                        data-ocid="admin.targets.weekly.input"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`text-sm font-medium ${
                          row.weekCount >= row.weeklyTarget
                            ? "text-green-600"
                            : "text-amber-600"
                        }`}
                      >
                        {row.weekCount} / {row.weeklyTarget}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={1}
                        max={2000}
                        value={row.monthlyTarget}
                        onChange={(e) =>
                          updateTarget(
                            row.fe.id,
                            "monthlyTarget",
                            Number(e.target.value),
                          )
                        }
                        className="w-24 text-center h-8"
                        data-ocid="admin.targets.monthly.input"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`text-sm font-medium ${
                          row.monthCount >= row.monthlyTarget
                            ? "text-green-600"
                            : "text-amber-600"
                        }`}
                      >
                        {row.monthCount} / {row.monthlyTarget}
                      </span>
                    </TableCell>
                    {/* Paid Students */}
                    <TableCell className="text-center">
                      <span className={getPaidStudentsColor(row.paidStudents)}>
                        {row.paidStudents}
                      </span>
                    </TableCell>
                    {/* Min 20 Status */}
                    <TableCell className="text-center">
                      {row.paidStudents >= MIN_ACTIVE_STUDENTS ? (
                        <span className="text-green-600 font-medium text-sm">
                          \u2705 Met
                        </span>
                      ) : (
                        <span className="text-amber-600 font-medium text-sm">
                          \u26A0\uFE0F Below
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        className="gap-1.5 teal-gradient text-white border-0 h-8"
                        onClick={() => saveTargets(row)}
                        data-ocid="admin.targets.save_button"
                      >
                        <Save className="h-3.5 w-3.5" />
                        Save
                      </Button>
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
