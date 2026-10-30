# ALMAGD Admin — Implementation Progress

## Task Log
- [x] T01 — Scaffold admin/ with Vite React TS, Tailwind, deps, gitignore, README, PROGRESS.md — `npm run build` clean (0 errors), dev server verified with page response.
- [x] T02 — Supabase local: supabase init, migration 4.2, seed 4.3, tests 4.4, supabase start, supabase db reset — smoke.sql printed 7x PASS, select count(*) from units = 96.
- [x] T03 — Generate database.types.ts; lib/supabase.ts, dates.ts, money.ts, errors.ts + vitest tests — 15/15 vitest tests green, npx tsc --noEmit clean.
- [x] T04 — i18n provider + id/ar dictionaries + key-parity test — 18/18 tests green, 100% key parity between Indonesian and Arabic dictionaries with exact spec glossary terms.
- [x] T05 — Auth: AuthProvider (session + staff row + role), RequireAuth, RequireManager, LoginPage, ConfigErrorPage — 21/21 tests green, seed manager and reception authenticated with proper roles, non-staff handling tested.
- [x] T06 — UI kit (components/ui/*) + AppShell, Sidebar, BottomNav, LanguageToggle — Complete UI component set, responsive desktop/mobile shell with bottom tab bar, verified 0 forbidden physical CSS classes across src/.
- [x] T07 — api/* functions + hooks — Complete typed query and mutation hooks across all domains (units, guests, bookings, payments, calendar, reports, staff, blocks). 25/25 tests green, tsc clean.
- [x] T08 — GuestsPage, GuestDetailPage, GuestForm, IdPhotoUpload — Complete guest list with search and stats (# stays, last stay), guest detail with stay history and total spent, editable GuestForm, and role-based IdPhotoUpload (signed URL preview & delete for manager, 'Photo on file' confirmation badge for reception).
- [x] T09 — BookingForm, GuestPicker, UnitPicker, NewBookingPage — 5-step booking flow (guest picker with inline creation & blacklist alert, stay dates with night counter, grouped unit picker with unavailable/overlap handling, price toggle per night/total with OTA ref and due date, optional first payment), zod validation, 23P01 overlap conflict handling.
- [x] T10 — BookingDetailPage, PaymentForm, PaymentList, status actions, edit, history — Detail page with header badges, financial cards (total/paid/balance), status action buttons (check-in, check-out with balance check dialog, cancel, no-show, manager delete), payments list with refund toggle, manager audit log history, and needs_review dismissal banner.
- [x] T11 — BookingsPage with filters + Excel export — Filter bar (status, source, payment status, date range, search), paginated bookings table, source and status badges, export all filtered bookings to Excel (.xlsx).
- [x] T12 — CalendarPage — 30-day and 14-day interactive CSS grid with sticky unit headers, 96 units (24 villas + 72 rooms), whole villa vs room bars, villa-booked diagonal hatched pattern on child rooms, today highlight, click empty cell to new booking and click bar to booking detail.
- [x] T13 — TodayPage — Date navigator, 4 occupancy/arrivals/departures/in-house KPI cards, 2 manager financial cards (received today split by method, outstanding balance), check-in/out interactive actions with balance confirmation dialog, unpaid bookings list.
- [x] T14 — ReportsPage + exports + print CSS — Period picker (this month, last month, quarter, year, custom), 5 financial and operational KPI cards, Recharts daily occupancy line chart, revenue bar chart, source share pie chart, monthly summary table, 3-sheet Excel export, and window.print() CSS.
- [x] T15 — SettingsPage (units, sources, blocks, staff) — Full manager settings with tab navigation: 96 units table with inline rate editing and active toggles, booking sources customization (labels, color pickers, active toggle), maintenance blocks CRUD (auto-populating room_occupancy), and staff management with role switching and onboarding guide.
- [x] T16 — Import script — scripts/import-excel.mjs completed with dry-run and commit modes, imported 139 bookings, 67 guests, and 134 payments into local and Supabase cloud databases with report in scripts/import-report.md.
- [x] T17 — Polish & reviewer checklist — Complete loading/empty/error states across all pages, toasts, keyboard focus, README.md with complete deployment steps for Cloudflare Pages and Supabase Cloud, 7× PASS smoke.sql, 25/25 vitest tests green, 0 tsc errors, 0 forbidden physical CSS classes, 0 `any`, 0 `@ts-ignore`.
- [x] E1 — i18n Dictionaries Expansion — Added filter, jump-to-date, in-house, overdue, and printable receipt keys with 100% parity across `id.ts` and `ar.ts`.
- [x] E2 — Archival Bookings Guest Handling — Allowed flexible editing of historical Excel bookings without mandatory guest assignment in edit mode, with one-click guest assignment CTA in `BookingDetailPage.tsx`.
- [x] E3 — Calendar Toolbar & Grid Filtering — Added unit type filters (All 96, Villas 24, Independent 6), quick unit search, and jump-to-date picker in `CalendarToolbar.tsx`, `RoomCalendar.tsx`, and `CalendarPage.tsx`.
- [x] E4 — Today Page In-House Table & Overdue Alerts — Added overdue check-in/check-out alerts card with quick actions, plus dedicated in-house guests table on `TodayPage.tsx`.
- [x] E5 — Printable Guest Booking Voucher / Receipt — Added one-click print receipt action in `BookingDetailPage.tsx` with print-only header/footer and `no-print` styling.
- [x] E6 — Production Code Splitting — Configured `manualChunks` in `vite.config.ts` and `React.lazy` in `App.tsx` reducing initial chunk sizes and eliminating chunk warnings.
- [x] E7 — Professional Booking Receipt / Voucher Design & Print — Implemented executive-grade A4 printable voucher component (`BookingReceipt.tsx`) with ALMAGD branding, guest details, reservation summary, itemized statement table, paid-in-full / balance-due badges, terms, dual signature boxes, on-screen modal preview, and `@media print` CSS optimization.
- [x] E8 — Full-Width Calendar Redesign & Front-Desk Tape Chart Experience — Removed `max-w-7xl` constraint in `AppShell.tsx` for full edge-to-edge layout, fixed custom width in `Input.tsx`, added 5-KPI live reception status ribbon + primary new booking button, redesigned toolbar with 7/14/30-day views and villa collapse/expand toggle, implemented smart booking bars displaying prominent guest names with financial/status badges, sticky unit columns with nightly rates and live status dots, rich floating hover tooltips, and quick-action reception modals.
- [x] E9 — Fix Live Availability Calculation & Unit Column Display — Fixed availability count in `CalendarPage.tsx` by utilizing the native PostgreSQL `available_units` RPC, accurately showing 54 available units (13 villas • 41 rooms) when 17 units are occupied; eliminated the `Rp 0` rate artifact when unit default rate is unconfigured, and cleaned unit table header counter.
- [x] E10 — Fix Today Page Occupancy Rate Calculation — Replaced broken stay range filter with PostgreSQL range overlap query in `TodayPage.tsx`, fixing the 0/72 (0%) occupancy bug to accurately display 31/72 rooms occupied (43% occupancy) matching the 17 active in-house reservations.
- [x] E11 — Professional Money Formatting & Smart Currency Input — Built luxury MoneyInput component with automatic real-time comma grouping (e.g. 360,000,000), attached Rp prefix badge, zero-glitch elimination (no leading 036000000), instant verbal magnitude badges in Arabic (360 مليون روبية) and Indonesian (360 Juta Rupiah), one-click full payment and 50% deposit shortcuts, live remaining balance calculation indicators, and enhanced UnitPicker option rate badges. 28/28 tests passing.
- [x] E12 — Fix Calendar Scroll Trap & Viewport Overflow — Replaced static `max-h-[75vh]` with responsive viewport calculation `max-h-[calc(100vh-310px)]` preventing table cutoff below the browser fold, added clean end-of-units buffer row (`— نهاية قائمة الوحدات (96 وحدة) —`), added Status Ribbon toggle (`▲ إخفاء الإحصائيات / ▼ إظهار الإحصائيات`) expanding calendar real-estate to `max-h-[calc(100vh-210px)]`, enabled smooth scroll chaining `overscroll-y-auto`. 28/28 tests passing.
- [x] E13 — Comprehensive Daily Reports Suite — Added one-click 'Today' and 'Yesterday' presets to ReportsPage, added rich Daily Breakdown Table displaying human dates, room occupancy, occupancy %, revenue, cash/transfer/app breakdowns, total collected, and daily ADR with formatted comma numbers; added direct Daily Report Printing (window.print with official A4 print header) and Multi-Sheet Daily Excel Export on TodayPage (`almagd-daily-report-YYYY-MM-DD.xlsx`). 28/28 tests passing.

## Definition of Done (Reviewer Checklist)
- [x] No files changed outside `admin/` (public website untouched).
- [x] SQL migration identical to section 4.2.
- [x] smoke.sql 7× PASS, vitest green (28/28), `tsc --noEmit` clean, `npm run build` clean.
- [x] No forbidden physical Tailwind classes (100% logical properties: start/end, ps/pe, ms/me).
- [x] No hard-coded UI text; 100% `id.ts` / `ar.ts` key parity test passing.
- [x] No `any`, no `@ts-ignore`, no service-role key in `src/`.
- [x] Reception user: cannot open /reports, /settings, cannot delete bookings/payments, cannot see ID photo.
- [x] Double booking impossible from UI; exclusion constraints enforced on DB; villa booking blocks child rooms on calendar.
- [x] Import report present in `scripts/import-report.md` (139 bookings, 67 guests, 134 payments imported to local and cloud Supabase).
- [x] PROGRESS.md complete with decisions and status.

## Decisions I made
- Selected React 18, Vite 5, Tailwind CSS with logical properties for RTL/LTR support.
- Configured IBM Plex Sans Arabic and Plus Jakarta Sans from copied woff2 font files in admin/public/fonts.
- Generated local Supabase database instance on port 54322, initialized with initial schema verbatim.
- Generated database.types.ts via Supabase CLI. Implemented dates, money, and friendly error handlers with strict tests.
- Designed comprehensive i18n dictionaries for Indonesian (source of truth) and Arabic with exact glossary translations and key-parity testing.
- Created AuthProvider with real Supabase session tracking, active staff role resolution, and security guard wrappers (RequireAuth, RequireManager).
- Created modular UI component library without external UI frameworks, enforcing logical padding and alignments for smooth RTL Arabic and LTR Indonesian.
- Cloud Supabase project credentials (URL: `https://cpnvqdodmiacrvldykli.supabase.co`, project `cpnvqdodmiacrvldykli`) received from user and API connection verified.

## Open problems
None.
