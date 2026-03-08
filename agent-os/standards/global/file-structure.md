# File Structure & Naming

## Naming
- Files: `kebab-case.ts` / `kebab-case.tsx` (e.g., `generate-csv.ts`, `day-entry.tsx`)
- Types/interfaces: `PascalCase` (e.g., `TimesheetData`, `TimesheetDay`)
- Functions/variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE` (e.g., `DAY_NAMES`, `NAS_STATIONS`)

## Project Layout
```
lib/                    # Core logic (server-side)
  types.ts              # Zod schemas & TypeScript types
  validation.ts         # Validation with human-readable error paths
  date-utils.ts         # UTC date utilities
  stations.ts           # NAS station list
  template-layout.ts    # 33x16 template grid constants
  generate-csv.ts       # CSV generation
  generate-xlsx.ts      # XLSX generation with styling

components/             # React components (client-side)
  timesheet-form.tsx    # Main form orchestrator
  header-fields.tsx     # Employee details section
  monday-picker.tsx     # Monday-only calendar picker
  day-entry.tsx         # Day accordion with roster/actual
  time-range-input.tsx  # Hour-only time selects
  day-status-select.tsx # Working/Rest/Leave dropdown
  form-error-summary.tsx

app/                    # Next.js App Router
  layout.tsx
  page.tsx
  api/generate/         # POST: validate + generate CSV + XLSX

__tests__/              # Vitest tests (42 tests across 4 files)

public/                 # Static assets (HSE logo)
```

- Flat directory structure within each folder — no nesting
- One module per concern (generation, validation, date utils)
- Types co-located in `types.ts`
