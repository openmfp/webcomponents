import {
  DASHBOARD_TRANSLATIONS,
  DashboardI18nKey,
  DashboardLanguage,
} from './dashboard-i18n';
import { Injectable, signal } from '@angular/core';

/**
 * Holds the dashboard's current language and resolves translation keys for
 * the dashboard chrome (toolbar buttons, dialogs, a11y labels). Provided at
 * the `Dashboard` component level so every nested dashboard component shares
 * the same language signal — child components inject the same instance and
 * react to language changes automatically because `getTranslation` reads the
 * signal on every call.
 */
@Injectable()
export class DashboardI18nService {
  readonly language = signal<DashboardLanguage>('en');

  getTranslation(key: DashboardI18nKey): string {
    return DASHBOARD_TRANSLATIONS[this.language()][key] ?? key;
  }
}
