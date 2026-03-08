# Product Roadmap

## Phase 1: MVP (Complete)

- **Web UI** — Form-based interface for entering and reviewing weekly timesheet data
- **Roster auto-copy** — Roster auto-copies to Actual; employee adjusts only the differences
- **Overtime detection** — Auto-detected per-day when actual shift end exceeds roster shift end
- **Overnight shift support** — Handles shifts crossing midnight with "next day" indicator
- **Per-day station** — Station dropdown per day, defaulting from header station
- **Dual output** — Generate both `.csv` and `.xlsx` files matching the NAS 33x16 template
- **XLSX styling** — Colors, fonts, borders, merges, HSE logo, A4 landscape fit-to-page
- **Direct download** — CSV and XLSX download directly from the browser
- **Validation** — Zod-based validation with human-readable error messages

## Phase 2: Future

- **Email integration** — Send completed timesheet to the employee via nodemailer/SMTP for review before submission
- **Roster import** — Import roster/schedule data from external sources (e.g., PDF, system export)
- **Batch generation** — Generate timesheets for multiple weeks or multiple staff at once
- **Payroll submission** — Forward approved timesheets directly to ambulance.payroll@hse.ie
- **User accounts** — Save staff details and preferences across sessions
- **Deployment** — Host on Vercel or similar platform
