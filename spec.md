# OpenFrame EduTech Platform — Advanced Analytics Upgrade

## Current State

The platform is a fully functional frontend-only EduTech app (all data in localStorage) with:
- Admin panel: Dashboard (bar+pie charts, stat cards), FE management (read-only), Registrations, Courses, Certificates, Leaderboard, Notifications
- FE panel: Dashboard (earnings + daily target progress bar hardcoded to 5), Register Student (medium → standard → fee plan flow), My Students, Notifications
- Student panel: Dashboard, Exam, Certificate, Notifications
- Data models: FieldExecutive, Course, Registration, Student, ExamAttempt, Certificate, Notification, AuthSession
- FE daily target is hardcoded to 5 in FEDashboard.tsx
- No time tracking, no GPS, no per-FE target setting, no advanced charts, no analytics pages

## Requested Changes (Diff)

### Add
- **Types/Models:**
  - `FieldExecutive`: add `dailyTarget`, `weeklyTarget`, `monthlyTarget`, `loginTime`, `logoutTime`, `totalWorkHours`, `location` (lat/lng/address), `performanceScore`, `rank` fields
  - `Registration`: add `latitude`, `longitude`, `timestamp`, `locationAddress` fields
  - `TimeLog` model: `id, feId, date, loginTime, logoutTime, workHours, breakMinutes`
  - `ActivityLog` model: `id, feId, action, timestamp, details`
  - `Targets` model already folded into FieldExecutive

- **Storage (lib/storage.ts):**
  - Add KEYS for TIME_LOGS, ACTIVITY_LOGS
  - Add db helpers: getTimeLogs, saveTimeLogs, getActivityLogs, saveActivityLogs
  - Seed extended FE data with targets (dailyTarget:5, weeklyTarget:25, monthlyTarget:100)
  - Seed sample time logs for demo
  - Bump SEEDED key to v3 to force re-seed

- **Admin: Advanced Analytics Page** (`/admin/analytics`)
  - Date range filter: Today / Week / Month / Custom
  - Course filter, FE filter
  - Line chart: Daily Registrations (last 30 days)
  - Bar chart: Revenue (daily/weekly/monthly toggle)
  - Bar chart: FE Performance Comparison (registrations per FE)
  - Line chart: Conversion Rate (leads vs paid trend)
  - Pie chart: Active vs Inactive FEs
  - AI Insights panel (rule-based): best area, best time, FE needing improvement

- **Admin: Target Management** (new tab/section in FieldExecutivesPage or separate page `/admin/targets`)
  - Table listing all FEs with editable daily/weekly/monthly targets
  - Save targets per FE

- **Admin: Attendance Report Page** (`/admin/attendance`)
  - Table: FE name, date, login time, logout time, work hours, break time
  - Late login detection (after 9:30 AM = late)
  - Productivity score column
  - Filter by FE and date

- **Admin: Map View Page** (`/admin/map`)
  - Leaflet map showing registration pins with FE color coding
  - FE current location markers
  - Heatmap-style visual (cluster markers)
  - Sidebar list of geo-tagged registrations

- **FE Dashboard Enhancements:**
  - Clock In / Clock Out button (replaces hardcoded target)
  - Shows current session: clocked-in time, hours worked today
  - Target progress: shows daily/weekly/monthly targets from FE's stored targets (not hardcoded)
  - Warning alert if <50% of daily target reached by 4 PM
  - Success notification when daily target achieved
  - Performance score display

- **FE Register Student:**
  - Auto-capture GPS location on form open (browser navigator.geolocation)
  - Show captured location or "Location unavailable" fallback
  - Save latitude/longitude/address in registration record
  - Duplicate phone number detection: warn if phone already registered

- **FE: Performance Page** (`/fe/performance`)
  - Personal stats: score, rank (Gold/Silver/Bronze), trend
  - Bar chart: weekly registrations
  - Target history for current week/month

- **Leaderboard Enhancement (existing page):**
  - Add Gold/Silver/Bronze badge icons
  - Add performance score column
  - Add weekly/monthly toggle filter

- **Notification Enhancements:**
  - Auto-generate in-app alerts:
    - FE target warning (<50% of daily target by end of day)
    - FE target achieved (celebration)
    - Admin: flag low-performing FEs (conversion <30%)
    - Admin: flag inactive FEs (no registrations today)

- **Export / Print:**
  - Admin analytics page: browser Print button for PDF export
  - FE performance page: print daily report

- **New Admin Nav Items:** Analytics, Attendance, Map View, Targets
- **New FE Nav Item:** Performance

### Modify
- `FieldExecutive` type in models.ts: add new fields
- `Registration` type in models.ts: add GPS fields + timestamp
- `FEDashboard.tsx`: replace hardcoded DAILY_TARGET=5 with dynamic target from FE record; add clock in/out; add weekly/monthly target progress
- `LeaderboardPage.tsx`: add performance score, Gold/Silver/Bronze tier icons, filter
- `DashboardLayouts.tsx`: add new nav items (Analytics, Attendance, Map, Targets for Admin; Performance for FE)
- `routeTree.tsx`: register new routes
- `lib/storage.ts`: extend seed data, add new KEYS and helpers

### Remove
- Hardcoded `DAILY_TARGET = 5` constant in FEDashboard

## Implementation Plan

1. Update `types/models.ts` with new fields (FieldExecutive, Registration, TimeLog, ActivityLog)
2. Update `lib/storage.ts`: new KEYS, seed v3 with extended data, new db helpers
3. Create `pages/admin/AnalyticsPage.tsx` with 5 charts + date/course filters + AI insights
4. Create `pages/admin/TargetsPage.tsx` for per-FE target management
5. Create `pages/admin/AttendancePage.tsx` for time tracking report
6. Create `pages/admin/MapPage.tsx` with Leaflet map + registration pins
7. Update `pages/admin/LeaderboardPage.tsx` with score, tiers, filter
8. Update `pages/fe/FEDashboard.tsx`: dynamic targets, clock in/out, alerts
9. Update `pages/fe/RegisterStudentPage.tsx`: GPS capture, duplicate phone check
10. Create `pages/fe/PerformancePage.tsx`: personal score, rank, charts
11. Update `layouts/DashboardLayouts.tsx`: add new nav items
12. Update `routeTree.tsx`: register new routes
13. Install leaflet + react-leaflet packages (already have recharts)
