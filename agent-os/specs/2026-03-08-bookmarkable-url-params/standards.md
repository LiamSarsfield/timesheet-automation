# Standards: Bookmarkable URL Parameters

## Applicable Standards

### URL/Query String
- Use `URLSearchParams` API for encoding/decoding (handles spaces, special chars)
- Omit empty params from URL (clean `/` when all fields empty)
- Use `replaceState` to avoid history pollution

### React Patterns
- Custom hook (`useUrlSync`) encapsulates the side effect
- Pure utility functions (`parseUrlParams`, `buildUrlSearch`) are testable without React
- Debounce side effects to avoid excessive DOM calls

### Testing
- Unit test pure functions directly (no DOM mocking needed for `buildUrlSearch`)
- Mock `window.location.search` for `parseUrlParams` tests
- No need to test the hook in unit tests — covered by manual verification
