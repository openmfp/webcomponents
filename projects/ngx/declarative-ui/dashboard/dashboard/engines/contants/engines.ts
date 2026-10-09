import {
  DASHBOARD_BREAKPOINTS,
  DashboardBreakpoint,
  ZFLOW_COLUMN_MAX,
  ZFLOW_DASHBOARD_BREAKPOINTS,
} from '../../../constants/breakpoints';
import { ZflowGridStackEngine } from '../zflow/z-flow-engine';
import { GridStackMode } from 'gridstack';
import { GridStackEngine } from 'gridstack/dist/gridstack-engine';

export interface EngineProfile {
  /** GridStack engine class, or undefined to use GridStack's native engine. */
  engineClass: typeof GridStackEngine | undefined;
  /** Column breakpoint table fed to GridStack columnOpts. */
  breakpoints: readonly DashboardBreakpoint[];
  columnMax?: number;
  /** Column counts for [sm, md, lg, xl] page size. Pushed to CSS vars so the section grids match. */
  sectionColumns: readonly [number, number, number, number];
  /** When true, all loose cards get a fixed h/maxH from the engine's config. */
  fixedCardHeight: boolean;
  /** When true, the origin position is rendered. */
  renderOriginPosition: boolean;
  /** Optional GridStack layout mode. 'list' delegates drag reorder to GridStack's native row-major list packing. */
  mode?: GridStackMode;
}

const getColumns = (breakpoints: readonly DashboardBreakpoint[]) =>
  breakpoints.map((bp) => bp.c).reverse() as [number, number, number, number];

export const ENGINE_PROFILES = {
  zFlow: {
    engineClass: ZflowGridStackEngine,
    breakpoints: ZFLOW_DASHBOARD_BREAKPOINTS,
    columnMax: ZFLOW_COLUMN_MAX,
    sectionColumns: [1, 2, 3, 3],
    fixedCardHeight: true,
    renderOriginPosition: true,
    mode: 'list',
  },
  default: {
    engineClass: undefined,
    breakpoints: DASHBOARD_BREAKPOINTS,
    sectionColumns: getColumns(DASHBOARD_BREAKPOINTS),
    fixedCardHeight: false,
    renderOriginPosition: false,
  },
} as const satisfies Record<string, EngineProfile>;

/** @deprecated Use ENGINE_PROFILES and EngineProfile instead. */
export type EngineClass = typeof GridStackEngine | undefined;
