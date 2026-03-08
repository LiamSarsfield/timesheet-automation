# NAS Branding Restyle — Plan

## Goal
Restyle the app from generic Tailwind look to official NAS (National Ambulance Service) branding with green header, crest logo, and branded accent colors.

## Scope
- Header + branding + key accent touches only
- Functional Roster(blue)/Actual(green)/Overtime(orange) color coding untouched

## Tasks
1. Define NAS brand colors as CSS custom properties + Tailwind theme tokens
2. Restyle header with NAS green bar, crest logo, white text
3. Update metadata title and favicon to NAS branding
4. Update primary buttons (submit, re-download) to NAS green
5. Brand Employee Details card with green top stripe and heading
6. Update download modal colors (checkmark, buttons)
7. Update monday-picker selection/hover colors

## Files Changed
- `app/globals.css` — color tokens
- `app/page.tsx` — header restyle
- `app/layout.tsx` — metadata + favicon
- `components/timesheet-form.tsx` — buttons + heading
- `components/header-fields.tsx` — card styling
- `components/download-modal.tsx` — modal colors
- `components/monday-picker.tsx` — calendar colors

## Files NOT Changed
- `components/day-entry.tsx` — Roster/Actual/Overtime preserved
- `components/form-error-summary.tsx` — Error red preserved
- `components/time-range-input.tsx` — Auto-fill blue preserved
- `lib/generate-xlsx.ts` — XLSX has its own color system
