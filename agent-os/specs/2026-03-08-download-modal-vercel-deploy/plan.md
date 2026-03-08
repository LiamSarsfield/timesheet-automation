# Phase 2: Download Modal + Vercel Deployment

## Context

MVP is complete and pushed. The core flow (form -> generate -> download) works, but the UX has a gap: after generating a timesheet, the download buttons appear at the bottom of the form below 7 day accordions — users must scroll down to find them. Additionally, the app runs locally only and needs to be deployed so users can access it.

This spec covers two features:
1. A responsive success modal (bottom sheet on mobile, centered dialog on desktop)
2. Vercel deployment (with a prerequisite fix for `fs.readFileSync` in the XLSX generator)

## Tasks

### Task 1: Create download modal component
- `components/download-modal.tsx` — responsive modal with green checkmark, download buttons, close behaviour
- CSS animations in `globals.css` — slide-up (mobile), scale-in (desktop), fade-in (backdrop)

### Task 2: Wire modal into timesheet form
- `components/timesheet-form.tsx` — replace inline success section with modal
- Add "Re-download files" button visible when modal is closed but files exist

### Task 3: Embed HSE logo as base64 constant
- `lib/hse-logo.ts` — exports `HSE_LOGO_BASE64` string constant
- `lib/generate-xlsx.ts` — remove `fs`/`path` imports, use base64 directly via ExcelJS's `base64` option

### Task 4: Deploy to Vercel
- Verify clean build with no `fs`/`path` dependencies in client/serverless code
- Deploy via Vercel MCP

### Task 5: Save spec documentation

## Verification
- `npm test` — 42 tests pass
- `npm run build` — clean build
- Modal appears on generate, closes on backdrop/Escape/button
- "Re-download files" button reopens modal
- Mobile: bottom sheet; Desktop: centered dialog
- Deployed URL: full flow works, XLSX contains HSE logo
