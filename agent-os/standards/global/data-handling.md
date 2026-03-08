# Data Handling & CSV Format

## Template Format
- The CSV template layout is fixed at 33 rows x 16 columns — positions are hardcoded in `lib/template-layout.ts`
- Each day occupies 2 rows: Roster (scheduled) and Actual (worked)
- Week runs Monday–Sunday, 7 days = 14 data rows
- Header metadata: Name (row 2), Personnel Number (row 2), Date Week Ending (row 4), Station (row 4)
- `template.csv` in the project root serves as a reference artifact only — it is not parsed at runtime

## Output
- Generate both `.csv` and `.xlsx` from the same validated data
- CSV: match the template layout exactly (same rows, columns, spacing)
- XLSX: same layout, styled for printing (colors, fonts, borders, merges, HSE logo, A4 landscape fit-to-page)
- Output filename: `timesheet-{name}-{week-ending-date}.{ext}`

## Data Flow
```
form input → validate (Zod) → generate CSV + XLSX → base64 encode → JSON response → browser download
```

## Delivery
- MVP: direct download from the browser (base64-encoded files returned from API)
- Future phase: email integration via nodemailer/SMTP
