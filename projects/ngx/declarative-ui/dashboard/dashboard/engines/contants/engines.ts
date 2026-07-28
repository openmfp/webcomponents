import {
  DASHBOARD_BREAKPOINTS,
  DashboardBreakpoint,
  ZFLOW_DASHBOARD_BREAKPOINTS,
} from '../../../constants/breakpoints';
import { ZflowGridStackEngine } from '../zflow/z-flow-engine';
import { GridStackEngine } from 'gridstack/dist/gridstack-engine';

export interface EngineProfile {
  /** GridStack engine class, or undefined to use GridStack's native engine. */
  engineClass: typeof GridStackEngine | undefined;
  /** Column breakpoint table fed to GridStack columnOpts. */
  breakpoints: readonly DashboardBreakpoint[];
  /** Column counts [sm, md, lg, xl] pushed to CSS vars so the section grids match. */
  columns: readonly [number, number, number, number];
  /** When true, all loose cards get a fixed h/maxH from the engine's config. */
  fixedCardHeight: boolean;
  /** When true, the XL-page width swap (3↔4) runs. */
  xlWidthSwap: boolean;
  /** When true, the origin position is rendered. */
  renderOriginPosition: boolean;
}

const getColumns = (breakpoints: readonly DashboardBreakpoint[]) =>
  breakpoints.map((bp) => bp.c).reverse() as [number, number, number, number];

export const ENGINE_PROFILES = {
  zFlow: {
    engineClass: ZflowGridStackEngine,
    breakpoints: ZFLOW_DASHBOARD_BREAKPOINTS,
    columns: [1, 2, 3, 3],
    fixedCardHeight: true,
    xlWidthSwap: true,
    renderOriginPosition: true,
  },
  default: {
    engineClass: undefined,
    breakpoints: DASHBOARD_BREAKPOINTS,
    columns: getColumns(DASHBOARD_BREAKPOINTS),
    fixedCardHeight: false,
    xlWidthSwap: false,
    renderOriginPosition: false,
  },
} as const satisfies Record<string, EngineProfile>;

/** @deprecated Use ENGINE_PROFILES and EngineProfile instead. */
export type EngineClass = typeof GridStackEngine | undefined;
