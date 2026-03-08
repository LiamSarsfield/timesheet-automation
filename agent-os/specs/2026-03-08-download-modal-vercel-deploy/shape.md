# Shape: Download Modal + Vercel Deploy

## Download Modal

### Problem
After generating a timesheet, download buttons appear at the bottom of the form below 7 day accordions. Users must scroll to find them.

### Solution
A responsive modal that appears immediately after generation:
- **Mobile**: Bottom sheet sliding up from bottom edge
- **Desktop**: Centered dialog with scale-in animation

### Decisions
- Modal uses fixed overlay with z-50, not a portal — simpler and sufficient
- Close on backdrop click, Escape key, or Close button
- Body scroll locked while modal is open
- "Re-download files" button appears inline after modal is closed, so users can re-access files without regenerating

## HSE Logo Embedding

### Problem
`fs.readFileSync` reads `public/hse-logo.png` at runtime. Vercel serverless functions don't have access to `public/` via filesystem.

### Solution
Embed the logo as a base64 string constant in `lib/hse-logo.ts`. The logo is only ~3KB base64, so the overhead is negligible. ExcelJS's `addImage` accepts `base64` directly, avoiding Buffer type compatibility issues.

### Decisions
- Use ExcelJS's `base64` option instead of `buffer` to avoid Node.js Buffer type mismatches with ExcelJS's type definitions
- Removed `fs` and `path` imports entirely from `generate-xlsx.ts`
- Removed the `fs.existsSync` guard — the embedded constant is always available
