# Shaping Notes & Decisions

## Problem
NAS staff manually fill out CSV/Excel timesheets weekly. This is repetitive, error-prone, and wastes time.

## Solution Shape
A Next.js web app where employees fill a form, get a generated CSV + XLSX matching the official NAS template, and download them directly.

## Key Shaping Decisions

### Roster → Actual Auto-Copy
Employee enters the Roster row for each day; it auto-copies to the Actual row. They then only adjust differences. This dramatically reduces data entry.

### Three Upfront Toggles
Before entering day data, the user answers three yes/no questions:
1. "Did you work overtime?"
2. "Were you on-call?"
3. "Do you need to claim subsistence?"

Only relevant field groups are shown, keeping the form clean for the common case.

### Overtime Is Explicit
The employee explicitly marks which days had overtime and fills in the details. No threshold-based auto-detection.

### Download-Only for MVP
Users download files directly from the browser. Email integration (sending files to the employee for review before forwarding to payroll) is deferred to a future phase.

### No Runtime Template Parsing
The CSV template has a fixed 33-row × 16-column layout. We hardcode positions in constants rather than parsing the template at runtime. The `template.csv` stays as a reference artifact.

### Base64 File Transfer
Generated files are small (< 50KB), so the API returns them as base64-encoded JSON. No need for temporary file storage or signed URLs.

### Accordion Form Layout
Day-by-day collapsible sections keep the form manageable. Each day expands to show its fields.

## Appetite
Small batch — MVP focused on core flow: form → generate → download.

## Rabbit Holes to Avoid
- No user accounts or authentication for MVP
- No payroll system integration
- No template parsing — hardcode the layout
- No multi-week support — one week at a time
