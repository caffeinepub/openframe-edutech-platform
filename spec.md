# OpenFrame EduTech Platform — Salary & Incentive Management

## Current State
- FE dashboard shows fee-based earnings (sum of student fee payments: Basic ₹50, Standard ₹100, Premium ₹150)
- No fixed salary, per-registration incentive, or bonus slab system
- Admin has no payroll view or salary approval workflow
- Models: FieldExecutive has dailyTarget/weeklyTarget/monthlyTarget/performanceScore/rank but no salary fields
- No SalaryRecord model exists
- Routes: Admin has 11 pages; FE has 5 pages

## Requested Changes (Diff)

### Add
- `SalaryConfig` model on FieldExecutive: fixedSalary, incentivePerRegistration, bonusSlabs[], top3BonusAmounts
- `SalaryRecord` model: feId, month (YYYY-MM), totalRegistrations, totalPaidRegistrations, incentiveAmount, bonusAmount, attendanceDeduction, penaltyAmount, finalSalary, paymentStatus (Pending/Paid/Approved)
- `BonusSlab` model: minRegistrations, maxRegistrations (null=unlimited), bonusPerRegistration
- `DeductionRules` model: absentDeductionPerDay, lowHoursThreshold, lowHoursDeductionFactor
- Admin Payroll page (`/admin/payroll`): table of all FEs with monthly salary breakdown, approve/mark paid, download PDF per FE, configure salary+incentive per FE, global bonus slab editor, global deduction rules editor
- FE Salary page (`/fe/salary`): today's earnings card, monthly earnings progress, salary slip view with PDF download
- Storage keys + db helpers for salary configs and salary records
- Seed data: salary configs for FE001/FE002 with default slabs
- Auto-calculation logic: on page load, compute current month salary for each FE based on registrations, attendance, targets

### Modify
- `FieldExecutive` model: add fixedSalary (number), incentivePerRegistration (number), bonusEarned (number), totalEarnings (number)
- `storage.ts`: add SALARY_CONFIGS and SALARY_RECORDS keys; add db helpers; update seed data with salary fields on FEs
- `DashboardLayouts.tsx`: add "Payroll" nav item to Admin sidebar; add "My Salary" nav item to FE sidebar
- `routeTree.tsx`: register new admin payroll route and FE salary route
- `FEDashboard.tsx`: add today's incentive earned card alongside existing stats
- `models.ts`: add SalaryRecord, BonusSlab, DeductionConfig types; extend FieldExecutive type

### Remove
- Nothing removed

## Implementation Plan
1. Extend `models.ts` with SalaryRecord, BonusSlab, DeductionConfig types; add salary fields to FieldExecutive
2. Update `storage.ts`: new KEYS, db helpers, seed salary configs for existing FEs, update FE seed data with fixedSalary/incentivePerRegistration
3. Create salary calculation utility: computeMonthlySalary(feId, month) → SalaryRecord draft
4. Create Admin Payroll page: FE list with salary breakdown, configure salary/incentive per FE, bonus slab editor, approve/mark paid, PDF print
5. Create FE Salary page: today's earnings, monthly salary breakdown, salary slip with PDF
6. Update FEDashboard: today's incentive earned stat card
7. Update DashboardLayouts: add Payroll and My Salary nav items
8. Update routeTree: register new routes
9. Validate and fix build errors
