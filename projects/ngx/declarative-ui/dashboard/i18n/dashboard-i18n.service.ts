import {
  DashboardI18nKey,
  DashboardTranslations,
  EN_DEFAULTS,
} from './dashboard-i18n';
import { Injectable, signal } from '@angular/core';

/**
 * Resolves translation keys for the dashboard chrome (toolbar buttons,
 * dialogs, a11y labels). Provided at the `Dashboard` component level so every
 * nested dashboard component shares the same instance — child components
 * inject it and react to translation changes automatically because
 * `getTranslation` reads the `overrides` signal on every call.
 *
 * The library ships English only (`EN_DEFAULTS`). Client applications supply
 * translated strings through `DashboardConfig.i18n`, which the `Dashboard`
 * component pushes into `overrides`; switching language is just the client
 * swapping that object. Any key not present in the overrides falls back to the
 * English default, and finally to the key itself.
 */
@Injectable()
export class DashboardI18nService {
  readonly overrides = signal<Partial<DashboardTranslations>>({});

  getTranslation(key: DashboardI18nKey): string {
    return this.overrides()[key] ?? EN_DEFAULTS[key] ?? key;
  }
}
