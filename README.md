# NAS Timesheet Automation

A web app for National Ambulance Service staff to fill out weekly timesheets and generate CSV/XLSX files matching the official NAS template.

## Features

- Form-based timesheet entry with day-by-day accordion layout
- Monday-only week picker with auto-calculated week dates
- Roster auto-copies to Actual — adjust only the differences
- Overtime auto-detected when actual shift end exceeds roster shift end
- Overnight shift support with "next day" indicator
- Per-day station override (defaults from header station)
- CSV and XLSX generation matching the official 33-row x 16-column NAS template
- XLSX styled to match the official format (colors, fonts, borders, cell merges, A4 landscape)
- Email delivery with both files attached via nodemailer
- Zod validation with human-readable error messages

## Tech Stack

- **Framework:** Next.js 16 (App Router, TypeScript)
- **Styling:** Tailwind CSS 4
- **File Generation:** ExcelJS (XLSX), csv-stringify (CSV)
- **Validation:** Zod
- **Email:** nodemailer
- **Testing:** Vitest (43 tests)

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Email Configuration (Optional)

Copy `.env.example` to `.env.local` and fill in your SMTP credentials:

```bash
cp .env.example .env.local
```

### Running Tests

```bash
npx vitest run
```

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
lib/                    # Core logic
  types.ts              # Zod schemas & TypeScript types
  validation.ts         # Validation with human-readable error paths
  date-utils.ts         # UTC date utilities
  stations.ts           # NAS station list
  template-layout.ts    # 33x16 template grid constants
  generate-csv.ts       # CSV generation
  generate-xlsx.ts      # XLSX generation with styling
  send-email.ts         # nodemailer wrapper

components/             # React components
  timesheet-form.tsx    # Main form orchestrator
  header-fields.tsx     # Employee details section
  monday-picker.tsx     # Monday-only calendar picker
  day-entry.tsx         # Day accordion with roster/actual
  time-range-input.tsx  # Hour-only time selects
  day-status-select.tsx # Working/Rest/Leave dropdown
  form-error-summary.tsx

app/
  page.tsx              # Home page
  api/generate/         # POST: generate CSV + XLSX
  api/send-email/       # POST: email files

__tests__/              # 43 tests across 4 files
```
