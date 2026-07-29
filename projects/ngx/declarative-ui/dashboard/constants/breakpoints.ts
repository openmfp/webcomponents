// ─────────────────────────────────────────────────────────────────────────────
// MUST MATCH: ./_breakpoints.scss (default values only)
//
// Two breakpoint tables exist — one per engine profile:
//
//   DASHBOARD_BREAKPOINTS      — default engine (14/12/8/1 columns).
//                                The SCSS file's $dashboard-cols-* variables
//                                MUST match these values (they are the fallbacks
//                                when no --dashboard-cols-* CSS var is set).
//
//   ZFLOW_DASHBOARD_BREAKPOINTS — zFlow engine (4/4/4/1 columns).
//                                 Overrides the CSS vars at runtime via the
//                                 engineProfile().sectionColumns tuple set on the host.
//
// Both tables are consumed by two systems that can't share a single source of
// truth at compile time:
//
//   1. dashboard.component.ts — passed to Gridstack as
//      `gridOptions.columnOpts.breakpoints`. Gridstack picks the active
//      breakpoint by `w` (max-width). At each breakpoint, every grid item is
//      laid out using `c` columns.
//
//   2. _breakpoints.scss — @container queries on .mfp-sections-container use
//      CSS vars (--dashboard-cols-*) with the SCSS $dashboard-cols-* values as
//      fallbacks. The active ENGINE_PROFILES[*].sectionColumns tuple is pushed into
//      those vars at runtime by dashboard.component.ts.
//
// If you change DASHBOARD_BREAKPOINTS column counts, update BOTH the TS values
// and the matching $dashboard-cols-* SCSS variables.
// ─────────────────────────────────────────────────────────────────────────────
import type { Breakpoint } from 'gridstack';

/**
 * Layout strategy applied at each breakpoint when Gridstack changes column
 * count. See ColumnOptions in gridstack/dist/types.d.ts:27 for the full set.
 */
type LayoutStrategy = 'compact' | 'list' | 'none';

export type DashboardBreakpoint = Readonly<
  Required<Pick<Breakpoint, 'w' | 'c'>> & { layout: LayoutStrategy }
>;

/** Default engine breakpoints: 14/12/8/1 columns (matches main). */
export const DASHBOARD_BREAKPOINTS: readonly DashboardBreakpoint[] = [
  { w: 4000, c: 14, layout: 'compact' },
  { w: 1439, c: 12, layout: 'compact' },
  { w: 1023, c: 8, layout: 'compact' },
  { w: 599, c: 1, layout: 'list' },
] as const;

/** zFlow engine breakpoints: 4/4/4/1 columns. */
export const ZFLOW_DASHBOARD_BREAKPOINTS: readonly DashboardBreakpoint[] = [
  { w: 4000, c: 4, layout: 'compact' },
  { w: 1439, c: 4, layout: 'compact' },
  { w: 1023, c: 4, layout: 'compact' },
  { w: 599, c: 1, layout: 'list' },
] as const;

export const XL_PAGE = 1440;
