

# Add Skeleton Loading States

Replace the simple spinner loading states on three pages with skeleton layouts that mirror the actual content structure, improving perceived performance.

## Changes

### 1. Admin Page (`src/pages/Admin.tsx`)
Replace the full-page spinner (lines 482-490) with a skeleton layout showing:
- 4 stat card skeletons (matching the stats grid)
- Tab bar skeleton
- Table with 5 skeleton rows

### 2. ScanHistory Page (`src/pages/ScanHistory.tsx`)
Replace the auth loading spinner (lines 150-154) and the data loading spinner (lines 248-251) with:
- Auth loading: full page skeleton with header + 3 card skeletons
- Data loading: 4 scan card skeletons matching the card layout (image placeholder + text lines)

### 3. SellerDashboard Page (`src/pages/SellerDashboard.tsx`)
Add skeleton state for the initial auth/data loading phase:
- Trust score card skeleton
- 3 action card skeletons
- Tab bar skeleton

All skeletons will use the existing `Skeleton` component from `src/components/ui/skeleton.tsx`. No new files needed -- just import `Skeleton` and replace the `Loader2` spinner blocks with structured skeleton layouts inline.

