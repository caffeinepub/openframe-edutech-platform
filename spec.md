# OpenFrame EduTech Platform

## Current State

- FieldExecutive has `dailyTarget` (seeded = 5), `weeklyTarget`, `monthlyTarget`, `incentivePerRegistration` (seeded as ₹100/₹80 per FE — inconsistent, no global rule)
- FEDashboard shows target progress bars (daily/weekly/monthly) with toast alerts at 2 PM if <50% daily target met
- Admin TargetsPage lets admin set daily/weekly/monthly targets per FE
- SalaryCalc computes incentive only on paid registrations (correct)
- No `minActiveStudents` concept exists anywhere
- Commission per registration has no fixed global default (each FE has its own `incentivePerRegistration`)
- No TeamLeader system yet (deferred from previous plan)
- Alert only fires at 2 PM when <50% of target — no end-of-day missed alert
- Admin has no dedicated "FE daily performance" view beyond TargetsPage

## Requested Changes (Diff)

### Add
- **Global commission rule: ₹10 per successful paid registration** — set as default `incentivePerRegistration` for all FEs. Admin can still override per FE in Payroll config.
- **Daily target default: 5 registrations/day** — already seeded but make it explicit in seed and enforce as the platform standard.
- **Minimum 20 active students per FE** — add `minActiveStudents: 20` rule. "Active" = FE has at least 20 registrations with `paymentStatus === 'Paid'`. Show a new stat/alert on FE dashboard if below 20 paid students.
- **FE Dashboard alert: daily target not met** — enhance existing alert logic:
  - Alert at end of day (after 5 PM) if daily target not fully met (not just 50%)
  - Show persistent banner/badge on dashboard if today's count < dailyTarget
  - Show persistent banner if total paid students < 20
- **Admin Daily FE Performance page** — new page `/admin/fe-performance` showing per-FE daily stats: FE name, today's registrations, daily target, gap, paid student count, active student status (green/red), last login time
- **Commission rule display in Admin** — show ₹10/paid reg rule prominently in Payroll page and TargetsPage

### Modify
- **seedSalaryData()** — update seeded `incentivePerRegistration` to ₹10 for all FEs (was ₹100/₹80)
- **seedIfNeeded()** — ensure `dailyTarget: 5` remains the default for all seeded FEs
- **FEDashboard** — add:
  - Persistent alert banner when today < dailyTarget (not just toast)
  - Active students count card (paid registrations)
  - Alert badge when paid student count < 20
  - Clarify commission rate shown as ₹10/paid reg
- **Admin TargetsPage** — add a column showing each FE's paid student count vs 20 minimum with color indicator
- **Admin FieldExecutivesPage** — add "Paid Students" count column and highlight FEs below 20
- **Admin Payroll page** — update default `incentivePerRegistration` seeding to ₹10 and show the global rule banner

### Remove
- Nothing removed

## Implementation Plan

1. Update `storage.ts`:
   - Change `incentivePerRegistration` seed values to ₹10 for all FEs
   - Add `minActiveStudents: 20` to FieldExecutive type and seed data
   - Add `SEEDED_V5` flag for migration: patch existing FEs with `incentivePerRegistration = 10` and `minActiveStudents = 20`

2. Update `types/models.ts`:
   - Add `minActiveStudents?: number` to `FieldExecutive` interface

3. Update `FEDashboard.tsx`:
   - Add `activePaidStudents` to stats (count of unique paid registrations for this FE)
   - Add persistent warning banner: "Daily target not met: X/5 today" when today < dailyTarget
   - Add persistent warning banner: "Active students below minimum: X/20" when paidCount < 20
   - Update commission display to show ₹10/paid reg
   - Enhance alert: fire toast at 5 PM (in addition to 2 PM 50% check) for fully missed target

4. Update `salaryCalc.ts`:
   - Change default `incentivePerRegistration` fallback from arbitrary value to 10

5. Update `TargetsPage.tsx`:
   - Add "Paid Students" column showing count vs 20 minimum with green/amber indicator
   - Add global rule banner: "Commission: ₹10/paid reg | Daily Target: 5 | Min Active Students: 20"

6. Update `FieldExecutivesPage.tsx`:
   - Add "Paid Students" column, highlight rows where paid count < 20

7. Add new page `src/frontend/src/pages/admin/FEPerformancePage.tsx`:
   - Daily performance table: FE Name, FE Code, Today's Regs, Daily Target, Gap (target - today), Paid Students, Min Students Status, Last Login
   - Color coding: green = on target, amber = at risk, red = missed
   - Auto-refresh every 60 seconds
   - Export/print button

8. Update `PayrollPage.tsx`:
   - Show global commission rule banner at top: "Default commission: ₹10 per paid registration"
   - When editing FE salary config, show ₹10 as the pre-filled default incentive rate

9. Update `routeTree.tsx`:
   - Add `/admin/fe-performance` route

10. Update `DashboardLayouts.tsx` (admin sidebar):
    - Add "FE Performance" nav link under analytics section
