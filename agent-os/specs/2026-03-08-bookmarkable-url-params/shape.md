# Shape: Bookmarkable URL Parameters

## Problem

Users must re-enter name, personnel number, and station every visit. These fields are stable per-user and rarely change.

## Solution

Sync these three header fields to URL query parameters bidirectionally:
- On load: read URL params → seed form state
- On change: update URL via `replaceState` (debounced)

## Decisions

### Which fields to sync?
Only `name`, `personnelNumber`, and `station`. These are user-identity fields that stay constant week to week. `dateWeekStarting` is excluded — it auto-prefills to current Monday and changes every week.

### Why `replaceState` not `pushState`?
Every keystroke would create a history entry with `pushState`, making the back button unusable. `replaceState` silently updates the URL.

### Why debounce?
Typing "John Smith" fires 10 change events. Debouncing at 300ms batches these into one URL update, reducing `replaceState` calls.

### Station validation
URL param `?station=FakeStation` must not break the form. We validate against `NAS_STATIONS` and fall back to empty string for unknown values.

### SSR safety
`parseUrlParams()` guards against `typeof window === "undefined"` since Next.js renders on the server where `window.location` doesn't exist.

## Rabbit holes avoided

- **localStorage persistence** — URL params are simpler, shareable, and don't require storage permissions
- **Next.js `useSearchParams`** — would require wrapping in `Suspense` and converting to a client component boundary higher up; raw `URLSearchParams` is simpler for this use case
- **Encoding edge cases** — `URLSearchParams` handles encoding/decoding natively
