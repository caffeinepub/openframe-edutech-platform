import type { SalaryConfig, SalaryRecord } from "../types/models";
import { db } from "./storage";

function getMonthRange(month: string): { start: Date; end: Date } {
  const [year, mon] = month.split("-").map(Number);
  const start = new Date(year, mon - 1, 1);
  const end = new Date(year, mon, 1);
  return { start, end };
}

function computeSlabBonus(
  paidCount: number,
  slabs: SalaryConfig["bonusSlabs"],
): number {
  // Find the highest slab the FE qualifies for
  let applicableSlab = slabs.find(
    (s) =>
      s.minRegistrations === 0 &&
      (s.maxRegistrations === null || paidCount <= s.maxRegistrations),
  );
  for (const slab of slabs) {
    if (
      paidCount >= slab.minRegistrations &&
      (slab.maxRegistrations === null || paidCount <= slab.maxRegistrations)
    ) {
      applicableSlab = slab;
    }
  }
  if (!applicableSlab || applicableSlab.bonusPerRegistration === 0) return 0;
  return paidCount * applicableSlab.bonusPerRegistration;
}

export function computeMonthlySalary(
  feId: number,
  month: string,
): SalaryRecord {
  const { start, end } = getMonthRange(month);
  const fes = db.getFEs();
  const fe = fes.find((f) => f.id === feId);
  if (!fe) throw new Error(`FE ${feId} not found`);

  const configs = db.getSalaryConfigs();
  const config = configs.find((c) => c.feId === feId) ?? {
    feId,
    fixedSalary: fe.fixedSalary ?? 0,
    incentivePerRegistration: fe.incentivePerRegistration ?? 0,
    bonusSlabs: [],
    top1Bonus: 500,
    top2Bonus: 300,
    top3Bonus: 200,
  };

  const deductionConfig = db.getDeductionConfig();

  const allRegs = db.getRegistrations().filter((r) => r.feId === feId);
  const monthRegs = allRegs.filter((r) => {
    const d = new Date(r.createdAt);
    return d >= start && d < end;
  });
  const totalRegistrations = monthRegs.length;
  const totalPaidRegistrations = monthRegs.filter(
    (r) => r.paymentStatus === "Paid",
  ).length;

  const incentiveAmount =
    totalPaidRegistrations * config.incentivePerRegistration;
  const bonusAmount = computeSlabBonus(
    totalPaidRegistrations,
    config.bonusSlabs,
  );

  // Attendance deduction
  const timeLogs = db.getTimeLogs().filter((l) => l.feId === feId);
  const monthLogs = timeLogs.filter((l) => {
    const d = new Date(l.date);
    return d >= start && d < end;
  });
  const workingDaysInMonth = getWorkingDaysInMonth(month);
  const daysWithLogs = new Set(monthLogs.map((l) => l.date)).size;
  const absentDays = Math.max(0, workingDaysInMonth - daysWithLogs);
  const partialDays = monthLogs.filter(
    (l) => l.workHours < deductionConfig.lowHoursThreshold && l.workHours > 0,
  ).length;
  const attendanceDeduction =
    absentDays * deductionConfig.absentDeductionPerDay +
    partialDays * deductionConfig.lowHoursDeductionPerDay;

  // Penalty
  const penaltyAmount =
    totalRegistrations < fe.monthlyTarget
      ? deductionConfig.penaltyPerUnmetTarget
      : 0;

  // Top-3 bonus
  const top3BonusAmount = computeTop3Bonus(feId, month, config);

  const rawFinal =
    config.fixedSalary +
    incentiveAmount +
    bonusAmount +
    top3BonusAmount -
    attendanceDeduction -
    penaltyAmount;
  const finalSalary = Math.max(0, rawFinal);

  // Check if existing record exists to preserve paymentStatus
  const existingRecords = db.getSalaryRecords();
  const existing = existingRecords.find(
    (r) => r.feId === feId && r.month === month,
  );

  const records = db.getSalaryRecords();
  const nextId =
    records.length > 0 ? Math.max(...records.map((r) => r.id)) + 1 : 1;

  return {
    id: existing?.id ?? nextId,
    feId,
    feName: fe.name,
    feCode: fe.feCode,
    month,
    totalRegistrations,
    totalPaidRegistrations,
    fixedSalary: config.fixedSalary,
    incentiveAmount,
    bonusAmount,
    top3BonusAmount,
    attendanceDeduction,
    penaltyAmount,
    finalSalary,
    paymentStatus: existing?.paymentStatus ?? "Pending",
    generatedAt: new Date().toISOString(),
  };
}

function computeTop3Bonus(
  feId: number,
  month: string,
  config: SalaryConfig,
): number {
  const { start, end } = getMonthRange(month);
  const allFEs = db.getFEs();
  const allRegs = db.getRegistrations();

  const fePaidCounts = allFEs.map((fe) => ({
    feId: fe.id,
    count: allRegs.filter(
      (r) =>
        r.feId === fe.id &&
        r.paymentStatus === "Paid" &&
        new Date(r.createdAt) >= start &&
        new Date(r.createdAt) < end,
    ).length,
  }));
  fePaidCounts.sort((a, b) => b.count - a.count);

  const rank = fePaidCounts.findIndex((x) => x.feId === feId);
  if (rank === 0) return config.top1Bonus;
  if (rank === 1) return config.top2Bonus;
  if (rank === 2) return config.top3Bonus;
  return 0;
}

function getWorkingDaysInMonth(month: string): number {
  const [year, mon] = month.split("-").map(Number);
  const daysInMonth = new Date(year, mon, 0).getDate();
  let count = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const day = new Date(year, mon - 1, d).getDay();
    if (day !== 0 && day !== 6) count++;
  }
  return count;
}

export function computeTodayEarnings(feId: number): {
  todayRegistrations: number;
  todayPaidRegistrations: number;
  todayIncentive: number;
} {
  const configs = db.getSalaryConfigs();
  const fe = db.getFEs().find((f) => f.id === feId);
  const config = configs.find((c) => c.feId === feId);
  const incentiveRate =
    config?.incentivePerRegistration ?? fe?.incentivePerRegistration ?? 0;

  const today = new Date().toDateString();
  const allRegs = db.getRegistrations().filter((r) => r.feId === feId);
  const todayRegs = allRegs.filter(
    (r) => new Date(r.createdAt).toDateString() === today,
  );
  const todayPaidRegs = todayRegs.filter((r) => r.paymentStatus === "Paid");

  return {
    todayRegistrations: todayRegs.length,
    todayPaidRegistrations: todayPaidRegs.length,
    todayIncentive: todayPaidRegs.length * incentiveRate,
  };
}

export function computeAllFEsSalary(month: string): SalaryRecord[] {
  const fes = db.getFEs();
  return fes.map((fe) => computeMonthlySalary(fe.id, month));
}

export function getAppliedSlab(
  paidCount: number,
  slabs: SalaryConfig["bonusSlabs"],
): string {
  let label = "No slab (0–50 registrations)";
  for (const slab of slabs) {
    if (
      paidCount >= slab.minRegistrations &&
      (slab.maxRegistrations === null || paidCount <= slab.maxRegistrations)
    ) {
      if (slab.bonusPerRegistration === 0) {
        label = `No bonus (${slab.minRegistrations}–${slab.maxRegistrations ?? "∞"} regs)`;
      } else {
        label = `₹${slab.bonusPerRegistration}/reg (${slab.minRegistrations}–${slab.maxRegistrations ?? "∞"} regs)`;
      }
    }
  }
  return label;
}
