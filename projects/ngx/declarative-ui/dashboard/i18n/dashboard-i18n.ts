import en from './en.json';

export const DASHBOARD_I18N_KEYS = {
  TITLE: 'title',
  DESCRIPTION: 'description',
  EDIT_HOME_BUTTON: 'editHomeButton',
  EDIT_CARDS_BUTTON: 'editCardsButton',
  UNSAVED_CHANGES: 'unsavedChanges',
  EDIT_CARDS: 'editCards',
  ACTIONS: 'actions',
  SAVE: 'save',
  CANCEL: 'cancel',
  DISCARD: 'discard',
  DISCARD_CHANGES: 'discardChanges',
  DISCARD_CONFIRM_BODY: 'discardConfirmBody',
  UNSAVED_NAV_BODY: 'unsavedNavBody',
  NO_CARDS_AVAILABLE: 'noCardsAvailable',
  EMPTY_STATE_TITLE: 'emptyStateTitle',
  EMPTY_STATE_DESCRIPTION: 'emptyStateDescription',
  EMPTY_STATE_ILLUSTRATION: 'emptyStateIllustration',
  REMOVE_SECTION: 'removeSection',
  REMOVE_CARD: 'removeCard',
  RESIZABLE: 'resizable',
} as const;

export type DashboardI18nKey =
  (typeof DASHBOARD_I18N_KEYS)[keyof typeof DASHBOARD_I18N_KEYS];

/**
 * The full set of dashboard chrome strings (toolbar buttons, dialogs, a11y
 * labels). Client applications provide translated values through
 * `DashboardConfig.i18n`; any key they omit falls back to `EN_DEFAULTS`.
 */
export type DashboardTranslations = Record<DashboardI18nKey, string>;

/**
 * Built-in English strings. This is the only translation the library ships and
 * the fallback used whenever a key is not supplied by the client through
 * `DashboardConfig.i18n`.
 */
export const EN_DEFAULTS: DashboardTranslations = en;
