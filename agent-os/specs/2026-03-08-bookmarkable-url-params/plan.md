# Bookmarkable URL Parameters

## Context

The timesheet form requires users to re-enter their name, personnel number, and station every time they visit. By syncing these fields to URL query parameters, users can bookmark a pre-filled URL (e.g. `/?name=John+Smith&personnelNumber=12345&station=Cork`) and skip repetitive data entry. The URL updates live as the user types, keeping it always bookmarkable.

## Task 1: Save spec documentation

Create `agent-os/specs/2026-03-08-bookmarkable-url-params/` with:
- `plan.md` — This plan
- `shape.md` — Shaping notes and decisions
- `standards.md` — Applicable standards
- `references.md` — Reference implementations

## Task 2: Create URL param utilities

Create `lib/url-params.ts`:

- `parseUrlParams()` — reads `window.location.search`, extracts `name`, `personnelNumber`, `station`. Validates station against `NAS_STATIONS`, returns empty string for invalid values. SSR-safe guard.
- `buildUrlSearch(params)` — builds query string from the three fields, omitting empty values. Returns `?name=...&...` or empty string.

## Task 3: Create URL sync hook

Create `hooks/use-url-sync.ts`:

- `useUrlSync(name, personnelNumber, station)` — `useEffect` that debounces (300ms) and calls `window.history.replaceState` with the built query string. Uses `replaceState` (not `pushState`) to avoid polluting browser history.

## Task 4: Wire into timesheet form

Modify `components/timesheet-form.tsx`:

1. Import `parseUrlParams` and `useUrlSync`
2. Add a `useEffect` on mount that calls `parseUrlParams()` and seeds `name`, `personnelNumber`, `station` (propagating station to each day's roster/actual `stationWorkedFrom`). This approach is SSR-safe since URL access only happens client-side after mount.
3. Add `useUrlSync(data.name, data.personnelNumber, data.station)` after state declarations

No changes needed to `header-fields.tsx` or `page.tsx`.

## Task 5: Add tests

Create `__tests__/url-params.test.ts`:

- `parseUrlParams` with valid/missing/invalid params
- `buildUrlSearch` with populated/empty/partial params
- URL encoding round-trips

## Verification

1. `npm test` — all existing + new tests pass
2. `npm run build` — clean build
3. Load `/?name=Test&personnelNumber=123&station=Cork` — form pre-fills correctly
4. Type in name field — URL updates after 300ms debounce
5. Select station — URL updates
6. Clear all fields — URL becomes clean `/`
7. Invalid station param (e.g. `/?station=Fake`) — ignored, dropdown shows "Select station"
8. Bookmark URL → reopen → form state matches

## Critical Files

- `lib/url-params.ts` — new: parse/build URL query strings
- `hooks/use-url-sync.ts` — new: debounced replaceState sync hook
- `components/timesheet-form.tsx` — modify: add URL param init + sync
- `lib/stations.ts` — dependency: station validation
