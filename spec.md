# OpenFrame EduTech Platform

## Current State
- FE Dashboard shows per-plan earnings (Basic ₹50, Standard ₹100, Premium ₹150 with counts and totals), but the overall commission total (₹10/paid reg) was removed per a previous request.
- Admin Dashboard has 4 stat cards (Total Students, Field Executives, Today's Registrations, Total Revenue) with no commission summary.
- FE Performance Page shows `Commission Today` column per FE, but no platform-wide commission total card.
- Payroll Page shows salary breakdowns but no commission total summary.

## Requested Changes (Diff)

### Add
- **FE Dashboard > Earnings Card**: Add overall commission total (₹10 × paid registrations) displayed as a standalone value alongside the existing per-plan breakdown (Basic/Standard/Premium). No formula label needed — just the ₹ amount prominently shown.
- **Admin Dashboard**: Add a new "Total Commission" stat card showing the sum of all FE commissions (total paid registrations across all FEs × ₹10).
- **Admin > FE Performance Page**: Add a total commission column per FE (all-time paid registrations × ₹10, not just today). Also add a platform-wide total commission summary card.
- **Admin > Payroll Page**: Add a commission total row/card in the salary breakdown per FE and a platform-wide commission summary card at the top.
- **Other Admin Pages**: Show commission totals where relevant (e.g., FieldExecutives list page — add a commission column).

### Modify
- FE Dashboard Earnings Card: Keep existing per-plan breakdown, add commission total section below or alongside it.
- Admin Dashboard Stats Grid: Expand from 4 to 5 cards (or 2×3 grid) to include Total Commission.
- Admin FE Performance summary cards: Add total all-time commission card.

### Remove
- Nothing removed.

## Implementation Plan
1. **FE Dashboard** (`FEDashboard.tsx`): In the Earnings Card section, add a commission total row showing `₹{stats.paid × 10}` from `{stats.paid}` paid registrations. Display it cleanly below or alongside the per-plan breakdown.
2. **Admin Dashboard** (`AdminDashboard.tsx`): Compute total commission = sum of all paid registrations × 10. Add a 5th stat card "Total Commission" to the stats grid.
3. **FE Performance Page** (`FEPerformancePage.tsx`): Add all-time total commission per FE (all paid regs × ₹10) as a new column in the table. Add a 6th summary card for platform total commission (all-time).
4. **Payroll Page** (`PayrollPage.tsx`): Add a commission total line item in each FE's salary breakdown and a summary card for total commission across all FEs for the selected month.
5. **Field Executives Page** (`FieldExecutivesPage.tsx`): Add a commission column showing total earned (all-time paid regs × ₹10) per FE.
