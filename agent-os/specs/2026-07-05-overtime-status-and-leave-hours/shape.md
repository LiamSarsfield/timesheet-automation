# Overtime Status & Leave-With-Rostered-Hours — Shape

## Problem

The app conflates the **Roster** row and the **Actual** row whenever the day
isn't a plain working shift:

1. **Rest-day overtime** can't be recorded. If you were rostered *off* (Rest)
   and got called in, there's no way to say "Roster = Rest, Actual = the hours
   I worked." Overtime today only exists as an auto-detected *extension* of a
   working shift.
2. **Leave days lose the rostered shift.** Picking Annual/Sick Leave writes the
   leave text into **both** rows. You can't record the shift you were *scheduled*
   to work (which is what the leave is measured against).

Both are the same underlying issue: the UI forces `roster.status === actual.status`
for anything non-working, and hides the Actual section unless the roster is Working.
The Zod schema already validates the two rows **independently** — so this is
almost entirely a UI-workflow change, plus one new status for the generator.

## Hard constraint: the output template does not change

Consumers depend on the exact 33×16 grid — same columns, rows, headers, merges,
On-Call columns left empty. We only change **which values land in existing cells**.
No structural change to `template-layout.ts`, no new columns.

## Decisions (from interview)

### Status model — minimal, two dropdowns kept
- Keep the two per-day dropdowns (Roster status + Actual status). No unified redesign.
- **Roster dropdown** narrows to `{ Working, Rest }` — you are only ever *scheduled*
  as on a shift or off.
- **Actual dropdown** carries the full set `{ Working, Rest, Overtime, Annual Leave,
  Sick Leave }` — what actually happened.
- The Actual section is **always visible** (today it's hidden unless roster = Working).
- Setting Roster = Rest no longer wipes the Actual row or overtime.

### Feature 1 — Rest-day Overtime (new `"overtime"` actual status)
- New `DayStatus` value `"overtime"`, offered only in the **Actual** dropdown.
- Picking **Actual = Overtime** auto-sets **Roster = Rest** (clears roster hours),
  guaranteeing the roster shows "Rest".
- One OT time range (planned-vs-actual **dropped**). An overrun is simply a later
  end time you type. Start auto-fills a +12h end, like a working shift.
- **Required to generate:** actual OT hours **and** a Reason / Incident No.
  (Station is optional; it renders on the Actual row via a dedicated select, and a
  cascaded "home" station carries over as the default.)
- Entering the Overtime status starts the OT window **empty** — you type it
  explicitly rather than inheriting any working-shift hours (reversible decision).
- Existing **auto-detected shift-extension OT on Working days is unchanged.** If a
  day had auto-detected OT and its Roster is later switched to Rest, that OT is
  cleared (its baseline is gone).

**Output mapping** (rest day, worked 18:00–23:00):

| Cell (existing) | Value |
|---|---|
| Roster row — Time From/To | `Rest` |
| Actual row — Time From/To | `18:00` / `23:00` |
| Overtime cols — From/To/Reason (day-level, merged) | `18:00` / `23:00` / reason |
| On-Call cols | empty (unchanged) |

The Overtime columns **mirror the actual worked hours** (they're what payroll pays).
The "overrun" is just the real end time — not tracked as a separate cell.

### Feature 2 — Leave with rostered hours
- No generator or schema change needed: "Roster shows hours, Actual shows leave
  text" is *already* how the generator renders `roster.status = working` +
  `actual.status = annual/sick-leave`. This is a UI-workflow unlock only.
- Workflow: set **Actual = Annual/Sick Leave**, then optionally set
  **Roster = Working** and enter the scheduled shift hours.
- Rostered hours are **optional** — leave them blank and the Roster row shows
  `Rest` (matching the sample `template.csv` Wednesday). Station optional.

**Output mapping** (rostered 08:00–20:00, on annual leave):

| Cell | Value |
|---|---|
| Roster row — Time From/To | `08:00` / `20:00` (or `Rest` if blank) |
| Actual row — Time From/To | `Annual Leave` / `Annual Leave` |

## Coverage matrix (every day-type after the change)

| Scenario | Roster status | Actual status | Roster Time | Actual Time | OT cols |
|---|---|---|---|---|---|
| Normal working | Working | Working | hours | hours | — (or auto-detected extension) |
| Rostered off | Rest | Rest | Rest | Rest | — |
| **Rest-day OT** | Rest | **Overtime** | Rest | OT hours | OT hours + reason |
| **Annual leave (rostered)** | Working | Annual Leave | hours | Annual Leave | — |
| **Annual leave (not rostered)** | Rest | Annual Leave | Rest | Annual Leave | — |
| **Sick on a rostered day** | Working | Sick Leave | hours | Sick Leave | — |

## Ground truth & downstream consumer (from repo sweep)
- **No example of either scenario exists** in `template.csv`, test fixtures, or git
  history. Every leave row in `template.csv` (Wed/Thu/Fri) is leave with Roster =
  **Rest** (no rostered hours); the only overtime in fixtures is a working-day
  extension. We are building the first instances of both.
- **No automated consumer exists.** `agent-os/standards/global/data-handling.md`
  states `template.csv` "is not parsed at runtime." The output path is: employee
  downloads → reviews → forwards to HSE payroll (`ambulance.payroll@hse.ie`) **by
  hand**. So a format choice cannot break a parser; the only residual risk is a
  human payroll reviewer mis-reading the OT-column/Actual-row mirroring. Because the
  employee reviews before forwarding, that risk is contained. One real filled
  rest-day-OT sheet would remove the last uncertainty.

## Out of scope
- On-Call columns (stay empty), public-holiday day type, other leave types.
- Planned-vs-actual OT tracking (dropped as it never reached the output).
- No template/structure changes of any kind.
- Sick-leave GP cert: emailed separately alongside the timesheet, not handled on
  the form. Sick and annual leave are the same flow; only the label differs.
