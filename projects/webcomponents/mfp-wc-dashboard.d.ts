/**
 * Standalone, framework-agnostic TypeScript declarations for the
 * `<mfp-wc-dashboard>` custom element.
 *
 * Import from the `@openmfp/webcomponents/dashboard` subpath:
 *
 * ```ts
 * import type { DashboardConfig, CardConfig } from '@openmfp/webcomponents/dashboard';
 * ```
 *
 * The `HTMLElementTagNameMap` augmentation below means that
 * `document.querySelector('mfp-wc-dashboard')` and
 * `document.createElement('mfp-wc-dashboard')` are automatically typed as
 * `MfpWcDashboardElement`.
 *
 * Zero runtime — declaration only. No imports from `@angular/core`,
 * `gridstack`, or internal library paths.
 */

// ---------------------------------------------------------------------------
// Card / grid types
// ---------------------------------------------------------------------------

/** The three supported card render strategies. */
export type CardsType = 'wc' | 'angular' | 'sap-ui';

/** Named size tokens used in z-flow layout mode. */
export type CardSize = 's' | 'm' | 'xl';

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
  size?: CardSize;
}

/** The minimal config subset needed to mount a card component. */
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
  /**
   * Row span forced on every card in this section (1 row = 10 px by default),
   * overriding each card's own `h`. Omit to let each card keep its own height.
   */
  cardsHeight?: number;
  /** Section heading displayed in the UI. */
  title?: string;
  /** When `false`, the section and its cards are excluded from edit mode. Defaults to `true` when omitted. */
  editable?: boolean;
}

// ---------------------------------------------------------------------------
// Button / modal types
// ---------------------------------------------------------------------------

/** Size and dimension overrides for the modal opened by a button with `action: 'openInModal'`. */
export interface ModalSettings {
  /** Modal title shown in the dialog header. */
  title?: string;
  /** Named size breakpoint. */
  size?: 'fullscreen' | 'l' | 'm' | 's';
  /** Explicit width override. */
  width?: string;
  /** Explicit height override. */
  height?: string;
}

/** Appearance and action configuration for a button rendered inside a table cell or toolbar. */
export interface ButtonSettings {
  /** Button label text. */
  text?: string;
  /** SAP UI5 icon name placed before the label. */
  icon?: string;
  /** SAP UI5 icon name placed after the label. */
  endIcon?: string;
  /** SAP UI5 button design variant. */
  design?:
    | 'Default'
    | 'Positive'
    | 'Negative'
    | 'Transparent'
    | 'Emphasized'
    | 'Attention';
  /** Tooltip shown on hover. */
  tooltip?: string;
  /** Action identifier. `'edit'` and `'delete'` are handled internally; all other values are forwarded to the host via `actionButtonClick`. */
  action: 'openInModal' | 'navigate' | 'edit' | 'delete' | (string & {});
  /** Settings for the modal opened when `action` is `'openInModal'`. */
  modalSettings?: ModalSettings;
}

// ---------------------------------------------------------------------------
// Dashboard config types
// ---------------------------------------------------------------------------

/** Overrides for the two built-in dashboard toolbar buttons. */
export interface DashboardButtonsSettings {
  /** Partial override merged on top of the Edit View button defaults. */
  editViewButton?: Partial<ButtonSettings>;
  /** Partial override merged on top of the Edit Cards button defaults. */
  editCardsButton?: Partial<ButtonSettings>;
}

/** Top-level configuration for the `<mfp-wc-dashboard>` element. */
export interface DashboardConfig {
  /** Dashboard title. Optional; overridden by `i18n.title` when that is not provided. */
  title?: string;
  /** Dashboard description. Optional; overridden by `i18n.description` when that is not provided. */
  description?: string;
  /** URL of the background image applied to the dashboard host element. */
  backgroundImageUrl?: string;
  /** Overrides for the built-in Edit View and Edit Cards toolbar buttons. */
  buttonsSettings?: DashboardButtonsSettings;
  /** When `true`, shows the Edit View button in the toolbar, allowing the user to enter edit mode. */
  editable?: boolean;
  /** When `true`, the Edit View button is rendered before the custom actions instead of after. Defaults to `false`. */
  editButtonFirst?: boolean;
  /** When provided, enable z-flow layout. */
  zFlow?: {
    /** Sets the height of each card in the z-flow layout. */
    cardHeight: number;
    defaultCardSize: CardSize;
  };
}

// ---------------------------------------------------------------------------
// i18n types
// ---------------------------------------------------------------------------

/**
 * Union of the 20 i18n key strings used by the dashboard chrome (toolbar
 * buttons, dialogs, accessibility labels). Derived from the values of
 * `DASHBOARD_I18N_KEYS` in the source library.
 */
export type DashboardI18nKey =
  | 'title'
  | 'description'
  | 'editHomeButton'
  | 'editCardsButton'
  | 'unsavedChanges'
  | 'editCards'
  | 'actions'
  | 'save'
  | 'cancel'
  | 'discard'
  | 'discardChanges'
  | 'discardConfirmBody'
  | 'unsavedNavBody'
  | 'noCardsAvailable'
  | 'emptyStateTitle'
  | 'emptyStateDescription'
  | 'emptyStateIllustration'
  | 'removeSection'
  | 'removeCard'
  | 'resizable';

/**
 * The full set of dashboard chrome strings (toolbar buttons, dialogs, a11y
 * labels). Client applications provide translated values through the `i18n`
 * input; any key they omit falls back to the built-in English defaults.
 */
export type DashboardTranslations = Record<DashboardI18nKey, string>;

// ---------------------------------------------------------------------------
// Event payload types
// ---------------------------------------------------------------------------

/** Payload of the `saved` custom event. */
export interface DashboardSavedDetail {
  sections: SectionConfig[];
  cards: CardConfig[];
}

/** Payload of the `actionButtonClick` custom event. */
export interface DashboardActionButtonClickDetail {
  event: MouseEvent;
  action: ButtonSettings;
}

/** Typed event map for `<mfp-wc-dashboard>`. */
export interface MfpWcDashboardEventMap {
  /** Emitted when the user saves edits in the dashboard edit mode. */
  saved: CustomEvent<DashboardSavedDetail>;
  /** Emitted when a custom action button from the `customActions` input is clicked. */
  actionButtonClick: CustomEvent<DashboardActionButtonClickDetail>;
  /** Emitted whenever the unsaved-changes state flips — `true` when the user first makes an unsaved edit, `false` after save/discard. */
  unsavedChangesChange: CustomEvent<boolean>;
}

// ---------------------------------------------------------------------------
// Element class declaration
// ---------------------------------------------------------------------------

/**
 * The `<mfp-wc-dashboard>` custom element.
 *
 * All inputs and outputs match the Angular `<mfp-dashboard>` component.
 * Public methods are explicitly forwarded onto the custom-element prototype
 * by the WC bundle (`mfp-wc-dashboard.js`).
 */
export declare class MfpWcDashboardElement extends HTMLElement {
  // Properties (Angular inputs)

  /** Top-level dashboard configuration (layout flags, background image, toolbar button overrides). */
  config: DashboardConfig;

  /** Named sections displayed above the loose-card grid. */
  sections: SectionConfig[];

  /** All cards currently placed in sections or the loose-card grid. */
  cards: CardConfig[];

  /** Card templates the user may add via the Edit Cards dialog. */
  availableCards: CardConfig[];

  /** Extra action buttons rendered in the toolbar alongside the built-in ones. */
  customActions: ButtonSettings[];

  /**
   * Full set of dashboard chrome strings. When `null` or `undefined`, the
   * built-in English defaults are used.
   */
  i18n: DashboardTranslations | null | undefined;

  /**
   * Busy flag for the dashboard body. While `true` the whole page is covered
   * by a busy indicator and the empty state is suppressed.
   */
  loading: boolean;

  /**
   * Milliseconds to wait after `loading` turns `true` before the spinner
   * paints. A load that finishes inside the window never shows one.
   */
  loadingDelay: number;

  // Methods

  /**
   * Framework-agnostic navigation guard.
   *
   * Call this from your navigation hook with a `proceed` callback. Returns
   * `true` and calls `proceed()` synchronously when there are no unsaved
   * changes; returns `false` and opens the `UnsavedChangesDialog` when there
   * are unsaved changes (the dialog will call `proceed()` on Save or Discard).
   *
   * Fallback: if the Angular component has not been created yet, `proceed()` is
   * called synchronously and `true` is returned — preserving the original,
   * pre-guard navigation behaviour.
   */
  requestNavigation(proceed: () => void): boolean;

  /** Persists changes (fires the `saved` event) and exits edit mode. */
  saveEdit(): void;

  /**
   * Requests to leave edit mode. Opens `DiscardChangesDialog` if there are
   * unsaved changes; otherwise discards immediately.
   */
  cancelEdit(): void;

  /** Confirms the discard, closes `DiscardChangesDialog`, and reverts to the snapshot taken on entering edit mode. */
  confirmDiscard(): void;

  /** Save handler for a custom in-app-navigation dialog — closes the popup, saves, then resumes the queued navigation. */
  onUnsavedNavSave(): void;

  /** Discard handler for a custom in-app-navigation dialog — closes the popup, reverts, then resumes the queued navigation. */
  onUnsavedNavDiscard(): void;

  /** Cancel handler for a custom in-app-navigation dialog — closes the popup and drops the queued navigation. */
  onUnsavedNavCancel(): void;

  // Typed event listener overloads

  addEventListener<K extends keyof MfpWcDashboardEventMap>(
    type: K,
    listener: (
      this: MfpWcDashboardElement,
      ev: MfpWcDashboardEventMap[K],
    ) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;

  removeEventListener<K extends keyof MfpWcDashboardEventMap>(
    type: K,
    listener: (
      this: MfpWcDashboardElement,
      ev: MfpWcDashboardEventMap[K],
    ) => void,
    options?: boolean | EventListenerOptions,
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void;
}

// ---------------------------------------------------------------------------
// Global augmentation — typed querySelector / createElement
// ---------------------------------------------------------------------------

declare global {
  interface HTMLElementTagNameMap {
    'mfp-wc-dashboard': MfpWcDashboardElement;
  }
}

export {};
