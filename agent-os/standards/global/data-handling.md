# Data Handling & CSV Format

## Template Format
- The CSV template layout is fixed — hardcode row/column positions
- Each day occupies 2 rows: Roster (scheduled) and Actual (worked)
- Week runs Monday–Sunday, 7 days = 14 data rows
- Header metadata: Name (row 2), Personnel Number (row 2), Date Week Ending (row 4), Station (row 4)

## Parsing
- Parse the template once at startup to extract column positions
- Map each day to a typed `TimesheetDay` object
- Treat "Rest", "Annual Leave", "Sick Leave" as special string literals, not time values
- Time values (From/To) are strings in HH:MM format

## Output
- Generate both `.csv` and `.xlsx` from the same data
- CSV: match the template layout exactly (same rows, columns, spacing)
- Excel: same layout, formatted for printing (borders, column widths)
- Output filename: `timesheet-{name}-{week-ending-date}.{ext}`

## Data Flow
```
input data → validate → merge with template → write CSV + XLSX
```
