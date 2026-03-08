# Standards: Download Modal + Vercel Deploy

## Component Standards
- Modal uses "use client" directive for React hooks
- Cleanup effects (body overflow, event listeners) in useEffect return functions
- Props interface defined at top of component file

## CSS Standards
- Animations defined as @keyframes in globals.css
- Responsive breakpoint via Tailwind `md:` prefix
- Animation classes use `animate-` prefix convention

## Serverless Compatibility
- No `fs` or `path` imports in code that runs in serverless functions
- Static assets embedded as constants when small enough (<10KB)
- ExcelJS image embedding uses `base64` option for type safety
