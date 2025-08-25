## Enhanced Skins Filters (Feature Flag)

### Overview
Additive UX improvements for the CS2 Skins Browse page, controlled by feature flag `SKINS_FILTERS_ENHANCED`.

### Features
- **Debounced Search**: 300ms delay for search input (prevents excessive API calls)
- **Race Condition Protection**: Aborts stale requests, prevents mixed results
- **Filter Presets**: Quick access to common filter combinations
- **Copy Link**: Share current filter state via URL
- **Enhanced Empty State**: Helpful suggestions when no results found
- **Request Tracking**: Debug counters for development (hidden in production)

### Configuration
```bash
# Enable enhanced filters
NEXT_PUBLIC_SKINS_FILTERS_ENHANCED=true

# Disable (default)
NEXT_PUBLIC_SKINS_FILTERS_ENHANCED=false
```

### Backward Compatibility
- All existing URLs work identically
- No changes to API parameters or backend logic
- Feature flag OFF = original behavior
- Feature flag ON = enhanced UX

### Testing Matrix
- [ ] Search: `q=bayonet` → plausible results
- [ ] Price filters: `min=100&max=200` → correct filtering
- [ ] Boolean filters: `stattrak=true` → correct results
- [ ] Sort options: all sort types work unchanged
- [ ] Pagination: page 2/3 → filter change resets to page 1
- [ ] URL reload: parameters restore exact UI state
- [ ] No results: empty state + suggestion buttons
- [ ] Edge cases: `min > max` → graceful handling
- [ ] Performance: rapid input changes → no flickering

### Rollout
1. **Preview**: Flag ON for testing
2. **Production**: Flag OFF initially
3. **Canary**: Gradual rollout with flag
4. **Rollback**: Flag OFF → immediate fallback to original behavior
