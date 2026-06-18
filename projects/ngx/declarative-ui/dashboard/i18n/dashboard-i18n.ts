import de from './de.json';
import en from './en.json';

export type DashboardLanguage = 'en' | 'de';

export const DASHBOARD_I18N_KEYS = {
  UNSAVED_CHANGES: 'unsavedChanges',
  EDIT_CARDS: 'editCards',
  EDIT_VIEW: 'editView',
  ACTIONS: 'actions',
  SAVE: 'save',
  CANCEL: 'cancel',
  DISCARD: 'discard',
  DISCARD_CHANGES: 'discardChanges',
  DISCARD_CONFIRM_BODY: 'discardConfirmBody',
  UNSAVED_NAV_BODY: 'unsavedNavBody',
  NO_CARDS_AVAILABLE: 'noCardsAvailable',
  REMOVE_SECTION: 'removeSection',
  REMOVE_CARD: 'removeCard',
  RESIZABLE: 'resizable',
} as const;

export type DashboardI18nKey =
  (typeof DASHBOARD_I18N_KEYS)[keyof typeof DASHBOARD_I18N_KEYS];

export const DASHBOARD_TRANSLATIONS: Record<
  DashboardLanguage,
  Record<DashboardI18nKey, string>
> = {
  en,
  de,
};
