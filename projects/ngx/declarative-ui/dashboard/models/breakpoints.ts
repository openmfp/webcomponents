// ─────────────────────────────────────────────────────────────────────────────
// MUST MATCH: ./_breakpoints.scss
//
// These breakpoints are consumed by two systems that can't share a single
// source of truth at compile time:
//
//   1. dashboard.component.ts — passed to Gridstack as
//      `gridOptions.columnOpts.breakpoints`. Gridstack picks the active
//      breakpoint by `w` (max-width). At each breakpoint, every grid item is
//      laid out using `c` columns.
//
//   2. dashboard.component.scss — used in a `@container` query so the
//      `.mfp-sections-container` CSS grid mirrors the same column count as
//      Gridstack at the same width.
//
// If you change either set of values, change BOTH files in the same commit.
// The two are kept in sync by hand (no codegen). A SCSS-from-TS generator
// would remove this hazard but is out of scope here.
// ─────────────────────────────────────────────────────────────────────────────

import type { Breakpoint } from 'gridstack';

/**
 * Layout strategy applied at each breakpoint when Gridstack changes column
 * count. See ColumnOptions in gridstack/dist/types.d.ts:27 for the full set.
 */
type LayoutStrategy = 'compact' | 'list' | 'none';

/** Single source of truth for grid + section breakpoints (TypeScript half). */
export const DASHBOARD_BREAKPOINTS: ReadonlyArray<
  Readonly<Required<Pick<Breakpoint, 'w' | 'c'>> & { layout: LayoutStrategy }>
> = [
  { w: 4000, c: 14, layout: 'compact' },
  { w: 1439, c: 12, layout: 'compact' },
  { w: 1023, c: 8, layout: 'compact' },
  { w: 599, c: 4, layout: 'list' },
] as const;
