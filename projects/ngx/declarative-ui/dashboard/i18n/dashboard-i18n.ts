import de from './de.json';
import en from './en.json';

export type DashboardLanguage = 'en' | 'de';

export type DashboardI18nKey =
  | 'unsavedChanges'
  | 'editCards'
  | 'editView'
  | 'actions'
  | 'save'
  | 'cancel'
  | 'discard'
  | 'discardChanges'
  | 'discardConfirmBody'
  | 'unsavedNavBody'
  | 'noCardsAvailable'
  | 'removeSection'
  | 'removeCard'
  | 'resizable';

export const DASHBOARD_TRANSLATIONS: Record<
  DashboardLanguage,
  Record<DashboardI18nKey, string>
> = {
  en,
  de,
};
