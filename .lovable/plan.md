

## Plan: Fix Bikram Sambat Date Conversion

### Problem

Two bugs in the AD-to-BS converter:

1. **Day off by one**: The `adToBS()` function calculates day difference using `getTime()` which is timezone-sensitive. The reference date `new Date(1943, 3, 14)` is midnight *local time*, but input dates from the database may parse differently, causing fractional day errors that `Math.floor` rounds incorrectly.

2. **Time display incorrect**: The time formatting uses `format(date, "HH:mm")` which renders in the browser's local timezone rather than Nepal Time (UTC+5:45).

### Fix

**`src/lib/bikram-sambat.ts`** — Change day difference calculation to use pure date components (year/month/day) via UTC, eliminating timezone drift:

```typescript
// Replace getTime()-based diff with UTC date-only diff
const utcDate = Date.UTC(adDate.getFullYear(), adDate.getMonth(), adDate.getDate());
const utcRef = Date.UTC(1943, 3, 14);
let totalDays = Math.floor((utcDate - utcRef) / (1000 * 60 * 60 * 24));
```

**`src/hooks/use-formatted-date.ts`** — Convert time display to Nepal Time (UTC+5:45) before formatting:

```typescript
// Convert to Nepal time for display
const nepalOffset = 5 * 60 + 45; // minutes
const nepalDate = new Date(date.getTime() + (nepalOffset + date.getTimezoneOffset()) * 60000);
const time = `${String(nepalDate.getHours()).padStart(2,'0')}:${String(nepalDate.getMinutes()).padStart(2,'0')}`;
```

Also pass the Nepal-adjusted date to `formatBSDate()` so the BS date corresponds to Nepal's local date, not the browser's.

### Files to modify

| File | Change |
|------|--------|
| `src/lib/bikram-sambat.ts` | Fix day calculation to use UTC date components |
| `src/hooks/use-formatted-date.ts` | Convert to Nepal Time before BS conversion and time display |

