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
//   ZFLOW_DASHBOARD_BREAKPOINTS — zFlow engine (4/8/12/16 columns), derived
//                                 from ZFLOW_PAGE_SIZES together with the
//                                 card-size column spans per page size.
//                                 Overrides the CSS vars at runtime via the
//                                 engineProfile().sectionColumns tuple set on the host.
//
// Both tables are consumed by two systems that can't share a single source of
// truth at compile time:
//
//   1. dashboard.component.ts — passed to Gridstack as
//      `gridOptions.columnOpts.breakpoints`. Gridstack picks the active
//      breakpoint by `w` (max-width of the viewport, via
//      `breakpointForWindow`). At each breakpoint, every grid item is laid out
//      using `c` columns.
//
//   2. _breakpoints.scss — @media queries on .mfp-sections-container use
//      CSS vars (--dashboard-cols-*) with the SCSS $dashboard-cols-* values as
//      fallbacks. The active ENGINE_PROFILES[*].sectionColumns tuple is pushed into
//      those vars at runtime by dashboard.component.ts.
//
// If you change DASHBOARD_BREAKPOINTS column counts, update BOTH the TS values
// and the matching $dashboard-cols-* SCSS variables.
// ─────────────────────────────────────────────────────────────────────────────
import type { CardSize } from '../models';
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

export type ZFlowPageSize = 's' | 'm' | 'l' | 'xl';

export interface ZFlowPageSizeConfig {
  pageSize: ZFlowPageSize;
  maxWidth?: number;
  columns: number;
  cardSpans: Readonly<Record<CardSize, number>>;
}

export const ZFLOW_PAGE_SIZES: readonly ZFlowPageSizeConfig[] = [
  {
    pageSize: 's',
    maxWidth: 599,
    columns: 4,
    cardSpans: { s: 4, m: 4, xl: 4 },
  },
  {
    pageSize: 'm',
    maxWidth: 1023,
    columns: 8,
    cardSpans: { s: 2, m: 4, xl: 8 },
  },
  {
    pageSize: 'l',
    maxWidth: 1439,
    columns: 12,
    cardSpans: { s: 3, m: 6, xl: 12 },
  },
  { pageSize: 'xl', columns: 16, cardSpans: { s: 4, m: 8, xl: 12 } },
] as const;

export const ZFLOW_COLUMN_MAX = Math.max(
  ...ZFLOW_PAGE_SIZES.map((page) => page.columns),
);

export const ZFLOW_DASHBOARD_BREAKPOINTS: readonly DashboardBreakpoint[] =
  ZFLOW_PAGE_SIZES.filter(
    (page): page is ZFlowPageSizeConfig & { maxWidth: number } =>
      page.maxWidth !== undefined,
  )
    .map((page) => ({
      w: page.maxWidth,
      c: page.columns,
      layout: 'none' as const,
    }))
    .sort((a, b) => b.w - a.w);
