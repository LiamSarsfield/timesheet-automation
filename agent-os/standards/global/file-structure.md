# File Structure & Naming

## Naming
- Files: `kebab-case.ts` (e.g., `parse-timesheet.ts`)
- Types/interfaces: `PascalCase` (e.g., `TimesheetRow`)
- Functions/variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`

## Project Layout
```
src/
  index.ts          # CLI entry point
  parse-timesheet.ts
  generate-csv.ts
  types.ts          # Shared types
template.csv
package.json
tsconfig.json
```

- Flat `src/` directory — no nested folders unless file count exceeds ~10
- One module per concern (parsing, generation, validation)
- Types co-located in `types.ts` until they warrant splitting
