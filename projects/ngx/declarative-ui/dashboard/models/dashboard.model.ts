import { ButtonSettings } from '../../models/ui-definition';

export const CARD_TYPES = {
  WC: 'wc',
  ANGULAR: 'angular',
  SAP_UI: 'sap-ui',
} as const;

export type CardsType = (typeof CARD_TYPES)[keyof typeof CARD_TYPES];

/** Configuration for a single card placed in the dashboard grid or a section. */
export interface CardConfig {
  /** Unique identifier for this card. Used as a stable key for position persistence. */
  id: string;
  /** Column span (1–12). Defaults to 12 when omitted. */
  w?: number;
  /** Row span — number of CSS grid rows occupied (1 row = 10 px by default). Defaults to 100 when omitted. */
  h?: number;
  /** Starting column index (0-based). Omit to let the grid auto-place the card. */
  x?: number;
  /** Starting row index (0-based). Omit to let the grid auto-place the card. */
  y?: number;
  /** Maximum row span in edit mode. */
  maxH?: number;
  /** Maximum column span in edit mode. */
  maxW?: number;
  /** Minimum row span in edit mode. */
  minH?: number;
  /** Minimum column span in edit mode. */
  minW?: number;
  /** ID of the parent section. Omit to place the card in the loose-card grid. */
  sectionId?: string;
  /**
   * Custom-element tag name (for `'wc'`/omitted), Angular component selector (for `'angular'`),
   * or SAP UI5 component name (for `'sap-ui'`).
   */
  component: string;
  /**
   * Render strategy for the card.
   * - `'wc'` (default) — creates a custom element and sets `componentInputs` as DOM properties.
   * - `'angular'` — looks up the Angular registry; warns and renders nothing if not found.
   * - `'sap-ui'` — mounts via `window.sap.ui.require` + `ComponentContainer`.
   */
  type?: CardsType;
  /** Key/value pairs passed to the rendered card. Behaviour depends on `type`. */
  componentInputs?: Record<string, unknown>;
  /** Human-readable label shown in the "Edit Cards" dialog. */
  label?: string;
}

export type MountCfg = Pick<
  CardConfig,
  'type' | 'component' | 'componentInputs'
>;

/** Configuration for a named horizontal section that groups cards. */
export interface SectionConfig {
  /** Unique identifier for this section. */
  id: string;
  /** Column span (1–12). Defaults to 12 when omitted. */
  w?: number;
  /** Section heading displayed in the UI. */
  title?: string;
  /** When `false`, the section and its cards are excluded from edit mode. Defaults to `true` when omitted. */
  editable?: boolean;
}

/** Overrides for the two built-in dashboard toolbar buttons. */
export interface DashboardButtonsSettings {
  /** Partial override merged on top of the Edit View button defaults. */
  editViewButton?: Partial<ButtonSettings>;
  /** Partial override merged on top of the Edit Cards button defaults. */
  editCardsButton?: Partial<ButtonSettings>;
}

/** Top-level configuration for the `<mfp-dashboard>` component. */
export interface DashboardConfig {
  /** Dashboard title rendered in the toolbar. */
  title: string;
  /** Optional subtitle shown below the title. */
  description?: string;
  /** URL of the background image applied to the dashboard host element. */
  backgroundImageUrl?: string;
  /** Overrides for the built-in Edit View and Edit Cards toolbar buttons. */
  buttonsSettings?: DashboardButtonsSettings;
  /** Extra action buttons rendered in the toolbar alongside the built-in ones. */
  customActions?: ButtonSettings[];
  /** When `true`, shows the Edit View button in the toolbar, allowing the user to enter edit mode. */
  editable?: boolean;
  /** When `true`, the Edit View button is rendered before the custom actions instead of after. Defaults to `false`. */
  editButtonFirst?: boolean;
  /** When provided, enable z-flow layout. */
  zFlow?: {
    /** Sets the height of each card in the z-flow layout. */
    cardHeight: number;
  };
}
