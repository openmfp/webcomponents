import { Component, ViewEncapsulation, inject, input, output } from '@angular/core';
import { DASHBOARD_I18N_KEYS, DashboardI18nService } from '../i18n';
import { Button } from '@fundamental-ngx/ui5-webcomponents/button';
import { Dialog } from '@fundamental-ngx/ui5-webcomponents/dialog';
import { Title } from '@fundamental-ngx/ui5-webcomponents/title';
import '@ui5/webcomponents-icons/dist/alert.js';

/**
 * Confirmation popup shown when the user attempts to navigate away from the
 * dashboard while there are unsaved edit-mode changes. The host (the
 * dashboard, an Angular CanDeactivate guard, a Luigi navigation listener,
 * etc.) is responsible for routing its intercepted navigation through this
 * dialog and acting on the emitted decision:
 *  - `save`      → persist changes, then proceed with navigation
 *  - `discard`   → revert changes, then proceed with navigation
 *  - `cancelled` → abort navigation, stay on the page
 */
@Component({
  selector: 'mfp-unsaved-changes-dialog',
  imports: [Button, Dialog, Title],
  templateUrl: './unsaved-changes-dialog.component.html',
  styleUrl: './unsaved-changes-dialog.component.scss',
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class UnsavedChangesDialog {
  protected readonly i18n = inject(DashboardI18nService);
  protected readonly i18nKeys = DASHBOARD_I18N_KEYS;

  open = input<boolean>(false);

  readonly save = output<void>();
  readonly discard = output<void>();
  readonly cancelled = output<void>();
}
