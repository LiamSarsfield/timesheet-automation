# Error Handling & Validation

## Validation Strategy: Inline Errors
- Validate all fields using Zod schemas, collect all errors (don't stop at first error)
- Each error includes: human-readable field name and descriptive message
- Field paths are translated to human-readable labels in `lib/validation.ts`
- Errors are returned as JSON from the API and displayed in a `FormErrorSummary` component

## What to Validate
- Time values match HH:MM (24h), hours 00–23
- Week starting date must be a Monday
- Required fields: Name, Personnel Number, Week Starting date, Station
- Day status must be one of: "working", "rest", "annual-leave", "sick-leave"
- When overtime is detected: overtime start/end times and reason/incident number are required

## Rules
- Never silently drop or fix bad data
- Validation runs before any output is generated (API returns 400 with errors array)
- No try/catch around expected validation — only around I/O (network, file generation)
