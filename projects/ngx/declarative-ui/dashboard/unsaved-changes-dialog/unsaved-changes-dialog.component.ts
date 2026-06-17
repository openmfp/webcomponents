import { Component, ViewEncapsulation, input, output } from '@angular/core';
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
  open = input<boolean>(false);
  headerText = input<string>('Unsaved Changes');
  bodyText = input<string>(
    'You are leaving this page. Save or discard the changes to proceed. This action cannot be undone.',
  );
  saveLabel = input<string>('Save');
  discardLabel = input<string>('Discard');
  cancelLabel = input<string>('Cancel');

  readonly save = output<void>();
  readonly discard = output<void>();
  readonly cancelled = output<void>();
}
