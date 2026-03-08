# NAS Timesheet Automation — Full MVP Plan

## Context

NAS (National Ambulance Service) staff manually fill out CSV/Excel timesheets weekly. This is repetitive and error-prone. We're building a Next.js web app where employees fill a form, get a generated CSV + XLSX matching the official NAS template, and download them directly.

## Key Decisions

- **Roster auto-copies to Actual** — Employee enters Roster row, it auto-copies to Actual. They adjust only the differences.
- **Overtime auto-detected per-day** — When actual shift end exceeds roster shift end, overtime is flagged and hours calculated automatically
- **On-Call and Subsistence removed from form** — Employee doesn't fill these; they remain in the CSV/XLSX template columns but aren't exposed in the UI
- **Incident details required only when overtime is detected**
- **Download-only for MVP** — Email integration deferred to a future phase
- **No runtime template parsing** — The CSV has a fixed 33-row × 16-column layout. Hardcode positions in constants. The `template.csv` stays as a reference.
- **Base64 file transfer** — Generated files are small (< 50KB), so return as base64 JSON from API
- **Accordion form layout** — Day-by-day with collapsible sections

## Template Column Map (0-indexed)

| Col | Field |
|-----|-------|
| 0 | Day name |
| 1 | Date (DD/MM/YY) |
| 2 | Row type: "Roster" / "Actual" |
| 3 | Time From (or status: "Rest" / "Annual Leave" / "Sick Leave") |
| 4 | Time To (or status, duplicated) |
| 5 | Station Worked From |
| 6 | Subsistence From |
| 7 | Subsistence To |
| 8 | Subsistence 5/10 hr |
| 9 | Subsistence Location & Incident No |
| 10 | Overtime From |
| 11 | Overtime To |
| 12 | Reason for O/T Incident No. |
| 13 | On-Call From |
| 14 | On-Call To |
| 15 | On-Call Incident No. |

When day status is "Rest"/"Annual Leave"/"Sick Leave", the status string goes in both col 3 and col 4. Cols 5–15 are empty.

## Project Structure

```
app/
  layout.tsx
  page.tsx
  api/
    generate/route.ts
components/
  timesheet-form.tsx
  header-fields.tsx
  monday-picker.tsx
  day-entry.tsx
  day-status-select.tsx
  time-range-input.tsx
  form-error-summary.tsx
lib/
  types.ts
  validation.ts
  template-layout.ts
  generate-csv.ts
  generate-xlsx.ts
  date-utils.ts
  stations.ts
__tests__/
  validation.test.ts
  generate-csv.test.ts
  generate-xlsx.test.ts
  date-utils.test.ts
```

## Implementation Order

Task 1 (spec docs) → Task 2 (scaffolding) → Task 3 (types + schemas + date utils) → Tasks 4 + 5 in parallel (CSV, XLSX) → Task 9 (tests) → Task 7 (API routes) → Task 8 (form UI)

**Future phase:** Email integration (nodemailer, SMTP, send-email API route)
