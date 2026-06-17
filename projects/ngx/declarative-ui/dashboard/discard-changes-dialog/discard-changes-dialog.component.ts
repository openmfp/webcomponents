import { Component, ViewEncapsulation, input, output } from '@angular/core';
import { Button } from '@fundamental-ngx/ui5-webcomponents/button';
import { Dialog } from '@fundamental-ngx/ui5-webcomponents/dialog';
import { Title } from '@fundamental-ngx/ui5-webcomponents/title';
import '@ui5/webcomponents-icons/dist/alert.js';

/**
 * Confirmation popup shown when the user tries to abandon edit mode while
 * there are unsaved dashboard changes. Emits `confirm` when the user accepts
 * the discard, `cancelled` when they back out.
 */
@Component({
  selector: 'mfp-discard-changes-dialog',
  imports: [Button, Dialog, Title],
  templateUrl: './discard-changes-dialog.component.html',
  styleUrl: './discard-changes-dialog.component.scss',
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class DiscardChangesDialog {
  open = input<boolean>(false);
  headerText = input<string>('Discard Changes');
  bodyText = input<string>(
    'Discard the changes? This action cannot be undone.',
  );
  confirmLabel = input<string>('Discard');
  cancelLabel = input<string>('Cancel');

  readonly confirm = output<void>();
  readonly cancelled = output<void>();
}
