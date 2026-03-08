# References: Download Modal + Vercel Deploy

## ExcelJS Image API
- `addImage({ base64, extension })` — accepts base64 string directly
- `addImage({ buffer, extension })` — accepts Buffer (has type compatibility issues with Node.js 22+)
- Source: ExcelJS index.d.ts `interface Image`

## Modal Patterns
- Bottom sheet: `fixed inset-x-0 bottom-0` with slide-up animation
- Centered dialog: `fixed` with `top-1/2 left-1/2 -translate` centering
- Backdrop: `fixed inset-0 bg-black/50` with fade-in
- Scroll lock: `document.body.style.overflow = 'hidden'`

## Vercel Deployment
- Serverless functions cannot access `public/` via `fs.readFileSync`
- Static assets in `public/` are served via CDN, not available to API routes via filesystem
- Solution: embed small assets as constants in source code
