# Error Handling & Validation

## Validation Strategy: Inline Errors
- Validate all fields, collect errors inline (don't stop at first error)
- Each error includes: field name, row/day, what was expected, what was received
- After validation, if errors exist, print them all and exit with non-zero code

## Error Format
```
Error: Tuesday Actual From — expected HH:MM, got "25:00"
Error: Friday — missing Actual row
```

## What to Validate
- Time values match HH:MM (24h), hours 00–23, minutes 00–59
- Dates match DD/MM/YY and fall within the declared week
- Required fields: Name, Personnel Number, Week Ending date
- Day status must be one of: a time value, "Rest", "Annual Leave", "Sick Leave"

## Rules
- Never silently drop or fix bad data
- Validation runs before any output is generated
- Use `process.exit(1)` on validation failure
- No try/catch around expected validation — only around I/O (file read/write)
