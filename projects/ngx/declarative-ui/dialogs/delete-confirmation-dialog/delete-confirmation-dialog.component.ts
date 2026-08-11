import { SanitizeHtmlPipe } from '../../pipes/sanitize-html.pipe';
import { DeleteResourceConfirmationConfig } from '../../table-card/models/configs';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  effect,
  input,
  output,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, ValidatorFn } from '@angular/forms';
import { Button } from '@fundamental-ngx/ui5-webcomponents/button';
import { Dialog } from '@fundamental-ngx/ui5-webcomponents/dialog';
import { Icon } from '@fundamental-ngx/ui5-webcomponents/icon';
import { Input } from '@fundamental-ngx/ui5-webcomponents/input';
import { Title } from '@fundamental-ngx/ui5-webcomponents/title';

@Component({
  selector: 'mfp-delete-confirmation-dialog',
  imports: [
    Dialog,
    Title,
    Button,
    Input,
    Icon,
    ReactiveFormsModule,
    SanitizeHtmlPipe,
  ],
  templateUrl: './delete-confirmation-dialog.component.html',
  styleUrl: './delete-confirmation-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.ShadowDom,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DeleteConfirmationDialog {
  readonly open = input(false);
  readonly config = input<DeleteResourceConfirmationConfig | undefined>(
    undefined,
  );

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  /** Input used to confirm deletion by typing `confirmationText`. */
  protected readonly confirmationControl = new FormControl('', {
    nonNullable: true,
  });

  /** True when the config requires typing a confirmation phrase before deleting. */
  protected readonly requiresConfirmation = computed(
    () => !!this.config()?.confirmationText,
  );

  /** Recomputes whenever the control's validity changes. */
  private readonly status = toSignal(this.confirmationControl.statusChanges, {
    initialValue: this.confirmationControl.status,
  });

  /** Disables the confirm button while the confirmation input is invalid. */
  protected readonly confirmDisabled = computed(() => {
    this.status();
    if (this.requiresConfirmation()) {
      return this.confirmationControl.invalid;
    }

    return false;
  });

  constructor() {
    effect(() => {
      if (!this.open()) {
        this.confirmationControl.reset();
      }
    });

    effect(() => {
      if (this.config()?.confirmationText) {
        this.confirmationControl.setValidators([this.matchValidator()]);
      } else {
        this.confirmationControl.setValidators([]);
      }

      this.confirmationControl.updateValueAndValidity();
    });
  }

  protected onConfirm(): void {
    if (this.confirmationControl.invalid) return;
    this.confirmed.emit();
  }

  /** Passes only when the trimmed, case-insensitive control value equals `expected`. */
  private matchValidator(): ValidatorFn {
    const normalized = this.config()?.confirmationText?.trim().toLowerCase();
    return (control) =>
      (control.value ?? '').trim().toLowerCase() === normalized
        ? null
        : { confirmationMismatch: true };
  }
}
