# NAS Branding Restyle — Standards

## Color System
- Brand colors defined as CSS custom properties in `:root`
- Registered in `@theme inline` block for Tailwind class generation
- Use `bg-nas-green`, `text-nas-green`, etc. — never raw hex values

## Preserved Color Coding
- Roster sections: blue (`bg-blue-50`, `border-blue-200`)
- Actual sections: green (`bg-green-50`, `border-green-200`)
- Overtime sections: orange (`bg-orange-50`, `border-orange-200`)
- Error states: red (unchanged)
- Auto-fill highlight: blue (unchanged)

## Image Handling
- NAS logo served from `/public/nas-crest.png`
- Used via Next.js `<Image>` component with explicit dimensions
