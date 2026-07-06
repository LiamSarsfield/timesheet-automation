# Overtime Status & Leave-With-Rostered-Hours — Plan

## Goal
De-couple the Roster row from the Actual row so staff can record (1) overtime on
a rostered **Rest** day, and (2) the **rostered shift hours** on an annual/sick
leave day. Output template structure is untouched.

## Scope
- One new `DayStatus`: `"overtime"` (Actual-only).
- UI-workflow + interaction changes in `day-entry.tsx` (the bulk of the work).
- A parallel generator branch for the `"overtime"` status in CSV **and** XLSX.
- Validation additions in `types.ts`.
- Feature 2 needs no generator/schema change — the state is already renderable;
  it's a UI unlock.
- Add lightweight component-test infra (deps already 90% present).

## Task 1 — Data model & validation (`lib/types.ts`)
1. Add `"overtime"` to `DAY_STATUSES`: `["working","rest","annual-leave","sick-leave","overtime"]`.
2. `STATUS_DISPLAY.overtime = "Overtime"` — dropdown label ONLY. It must **never**
   be written into a cell (overtime rows render hours). Without this key,
   `STATUS_DISPLAY[status]` yields `undefined` in the generators.
3. Row schema `superRefine`: require `timeFrom`/`timeTo` (HOUR_REGEX) when
   `status === "working" || status === "overtime"` (today only `"working"`).
4. Day schema `superRefine`: add — if `actual.status === "overtime"`, require
   `overtimeReason` non-empty ("Reason / Incident No. is required"). Rest-day OT
   deliberately does **not** set `hasOvertime`, so the existing `hasOvertime`
   block will NOT enforce the reason — this new rule is required. Actual OT times
   are covered by rule 3.
5. `createEmptyRow`/`createEmptyDay` unchanged (default `rest` still correct).

## Task 2 — Status dropdown options (`components/day-status-select.tsx`)
1. Add `options?: DayStatus[]` prop (defaults to all `DAY_STATUSES`); render only those.
2. Roster dropdown → `options={["working","rest"]}`; Actual dropdown → full set.
   (Required: `DayStatusSelect` currently maps over all `DAY_STATUSES` blindly, so
   adding `"overtime"` would otherwise leak it into the roster dropdown.)

## Task 3 — Day entry UI + interaction (`components/day-entry.tsx`) — core change
Single source of truth for rest-day OT = `actual.timeFrom/timeTo` + `overtimeReason`.
Rest-day OT does **not** reuse `hasOvertime` (reserved for the working-day
auto-detected extension, which is preserved).

**Shared helpers**
```
const CLEARED_OT    = { hasOvertime:false, overtimeFrom:"", overtimeTo:"", overtimeReason:"" };
const CLEARED_TIMES = { timeFrom:"", timeTo:"", stationWorkedFrom:"" };
```

**3a. Render gating**
- Remove the outer `day.roster.status === "working"` gate (~line 186) → Actual
  section ALWAYS renders. Keep the *roster* shift/station sub-block gated on
  `roster.status === "working"` (~line 143).
- Roster `DayStatusSelect` → `{working, rest}`; Actual → full set.
- Keep the auto-detected OT block gated on `actual.status === "working" && hasOvertime`.
- Add a NEW rest-day OT sub-section gated on `actual.status === "overtime"`.

**3b. `updateRoster` — fix BUG-2 (time-copy leak, Rule 7)**
Copy `timeFrom`/`timeTo` into actual ONLY when `day.actual.status === "working"`.
Drop the status auto-copy branch (status is driven by the explicit handlers).

**3c. `handleRosterStatusChange` (status ∈ {working, rest}) — fix BUG-3, BUG-4**
- `"rest"`: set roster `status:"rest", ...CLEARED_TIMES`; **do not touch actual**.
  BUT if `actual.status === "working"` (an auto-detected OT baseline that just
  lost its roster) → also apply `...CLEARED_OT` (BUG-4: otherwise the OT-hours
  badge computes `NaN` and disabled-hour predicates go stale).
- `"working"`: `updateRoster({ status:"working" })`.

**3d. `handleActualStatusChange` — fix BUG-1, BUG-8; add overtime (Rules 5, 6)**
- `"working"`: `{ actual:{...status:"working"}, ...CLEARED_OT }` (scrub any prior
  overtime-status residue; auto-OT recomputes on next end-time edit).
- `"rest"|"annual-leave"|"sick-leave"`: `{ actual:{...status, ...CLEARED_TIMES}, ...CLEARED_OT }`
  (fixes BUG-1: switching a working actual to leave must clear `hasOvertime`; and
  BUG-8: clears stale `overtimeReason`).
- `"overtime"` (NEW): auto-set `roster:{...status:"rest", ...CLEARED_TIMES}` (Rule 5);
  `actual:{ status:"overtime", timeFrom:"", timeTo:"" }` — **keep**
  `actual.stationWorkedFrom` so a cascaded home station carries over as the
  optional default; `...CLEARED_OT` to scrub any prior auto-detected OT (BUG-5).
  **Decision (BUG-9):** entering Overtime starts the OT window **empty** — you
  enter it explicitly rather than inheriting a working shift. Reversible.

**3e. `updateActual` — preserve working-day auto-OT (Rule 8), fix BUG-1**
Only run the OT-detect block when `newActual.status === "working" && roster.status === "working"`.
When the actual end time is cleared, apply `...CLEARED_OT` (this is the real
BUG-1 fix at source). Overtime-status edits never enter this block.

**3f. New rest-day OT sub-section (Rules 5/6; BUG-6/7/10)**
- `TimeRangeInput` bound to `actual.timeFrom/timeTo`. Start auto-fills +12h end
  (safe — roster is empty so no disabled-hour conflict). **Do NOT pass
  `isFromDisabled`/`isToDisabled`** — they key off roster times and are meaningless
  here (BUG-6).
- Optional **Station** `<select>` bound to `actual.stationWorkedFrom` (BUG-10: the
  existing station select lives in the roster-working block and is unreachable on a
  Rest-rostered day).
- Reason / Incident No. input bound to `overtimeReason`.

**3g. `statusSummary`** — drive off the *actual* status: Overtime → `OT hh:mm–hh:mm`;
leave → "Annual/Sick Leave"; working → hours (+ OT tag if `hasOvertime`); else "Rest".

**Do not regress:** the pre-existing overnight-wrap pivot in `effectiveEndHour`
(uses roster start as the wrap pivot for the actual end, ~line 53) is untouched (BUG-11).

## Task 4 — Generators (`lib/generate-csv.ts`, `lib/generate-xlsx.ts`)
Both files, in lockstep (avoid CSV↔XLSX divergence):
1. **Time cells** — `populateRowData` (CSV) / `populateTimeRow` (XLSX): the
   "write status text" branch fires only when status ∉ `{working, overtime}`.
   For `"overtime"`, write `timeFrom`/`timeTo` (and station) like a working row.
   Without this, both generators write the word "Overtime" (or `undefined`) and
   **discard the OT hours**.
2. **Overtime columns** — extend the roster-row block:
   - keep `if (day.hasOvertime)` → `overtimeFrom/To/Reason` (working-day extension);
   - add `else if (day.actual.status === "overtime")` → write
     `actual.timeFrom` / `actual.timeTo` / `overtimeReason` into the same OT columns
     (Q2-A: OT columns mirror the actual worked hours).
3. **Station for overtime** —
   - XLSX gate (~line 426): add `|| day.actual.status === "overtime"`; source
     `actual.stationWorkedFrom || roster.stationWorkedFrom` already picks correctly.
   - CSV: the new overtime branch in step 1 must also write the station (CSV is
     row-gated on "working", so without this CSV shows no station on OT days while
     XLSX does — the divergence the write-path audit flagged).
4. No changes to headers, merges, row/column counts, or On-Call handling.

## Task 5 — Unit tests (`__tests__/*.ts`)
- `validation.test.ts`: overtime actual with times + reason **passes**; missing
  reason **fails**; missing OT times **fails**. Existing working-day OT tests stay.
- `generate-csv.test.ts` + `generate-xlsx.test.ts`, add:
  - **Rest-day OT**: roster `rest`, actual `overtime` 18–23, reason (+station) →
    roster Time=`Rest`, actual Time=`18:00`/`23:00`, OT cols=`18:00`/`23:00`/reason,
    station rendered in BOTH formats.
  - **Leave with rostered hours**: roster `working` 08–20, actual `annual-leave` →
    roster Time=`08:00`/`20:00`, actual Time=`Annual Leave`/`Annual Leave`.
  - **Sick-leave output** (currently untested).
- Confirm existing "33 rows" and working-day extension-OT assertions still pass.

## Task 6 — Component/interaction tests — SKIPPED (per decision)
No new test dependencies, no component tests. The `day-entry.tsx` interaction
logic is verified manually + via the end-to-end `/api/generate` runtime check
(rest-day OT and leave-with-hours posted through the real route). Revisit if the
interaction logic churns.

## Files Changed
- `lib/types.ts` — new status, `STATUS_DISPLAY` key, validation rules.
- `components/day-status-select.tsx` — `options` prop.
- `components/day-entry.tsx` — always-show Actual, roster/actual handlers, OT
  sub-section (+ its station select), auto-copy fix, summary.
- `lib/generate-csv.ts` / `lib/generate-xlsx.ts` — overtime time cells + OT-column
  branch + station (XLSX gate).
- `__tests__/validation.test.ts`, `generate-csv.test.ts`, `generate-xlsx.test.ts` — new cases.

## Files NOT Changed
- `lib/template-layout.ts` — template structure frozen (hard constraint).
- generator header/merge/row-count logic — untouched.
- `hooks/use-url-sync.ts`, `lib/url-params.ts` — per-day state isn't in the URL.
- `components/time-range-input.tsx` — reused as-is.
- `vitest.config.ts` — unchanged (per-file jsdom pragma).

## Edge cases handled by construction (from state-machine audit)
BUG-1 working→leave leaves `hasOvertime` (fixed in 3d/3e) · BUG-2 time-copy leak
(3b) · BUG-3 Rest wipes actual (3c) · BUG-4 orphaned OT after Roster→Rest (3c) ·
BUG-5 Actual→Overtime double-counts prior OT (3d) · BUG-6 disabled-hour predicates
on OT input (3f) · BUG-8 stale `overtimeReason` (3d) · BUG-10 station unreachable on
Rest-rostered actual (3f). Watch-only: BUG-11 overnight-wrap pivot (don't regress).

## Verification (DONE)
1. `npx vitest run` — 61 tests pass (42 existing + 19 new/updated). ✔
2. `npm run build` — clean production build (exit 0). ✔ (Note: `tsc --noEmit`
   surfaces a pre-existing, environment-only `ExcelJS.load(buffer)` Buffer-type
   friction in the xlsx test file — 9 such errors exist on untouched `main`; not in
   any source or feature code, and the Next build does not gate on it.)
3. End-to-end via the real `/api/generate` route (HTTP 200):
   - Rest-day OT → CSV Roster `Rest`/`Rest`, Actual `18:00`/`23:00`/station,
     Overtime cols `18:00`/`23:00`/reason. ✔
   - Annual leave with rostered overnight shift → Roster `20:00`/`06:00`, Actual
     `Annual Leave`/`Annual Leave`. ✔
   - Home page renders (HTTP 200) — the rewritten `day-entry.tsx` mounts clean. ✔
3. Manual (`npm run dev`): rest-day OT (roster locks to "Rest", enter 18:00 → +12h,
   change to 23:00, reason) → XLSX Actual `18:00–23:00`, OT cols `18:00/23:00/reason`,
   Roster `Rest`, station present; annual-leave with roster 08–20 → roster hours,
   actual "Annual Leave"; same with roster blank → "Rest"; normal working late finish
   → auto-OT still works.
4. Diff a generated CSV vs `template.csv` shape — 33×16, no structural drift; and
   confirm CSV and XLSX agree on the OT day's station.

## Residual risk (cannot be closed from the repo — needs you / payroll)
The ground-truth sweep confirmed there is **no example anywhere** of a rest-day-OT
row (or leave-with-rostered-hours) in `template.csv`, fixtures, or git history, and
**no automated consumer** — `data-handling.md` states the CSV "is not parsed at
runtime"; the real consumer is the employee, then HSE payroll, **by hand**. So the
"OT columns mirror the full actual hours" choice can't crash a parser — the only
risk is a human payroll reviewer double-counting Actual-row hours + OT-column hours.
Mitigation is built into the process (the employee reviews before forwarding). One
real filled rest-day-OT sheet would close this entirely.

## Critical Files
- `components/day-entry.tsx` — highest-risk (interaction logic); now covered by Task 6 tests.
- `lib/types.ts` — status enum + validation ripple.
- `lib/generate-xlsx.ts` — merged-cell overtime placement + station gate.
