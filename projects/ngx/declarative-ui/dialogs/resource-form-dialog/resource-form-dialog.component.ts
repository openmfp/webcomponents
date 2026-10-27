import { DeclarativeForm } from '../../form';
import {
  FormFieldChangeEvent,
  FormFieldDefinition,
  FormFieldErrors,
} from '../../form/models';
import { GenericResource } from '../../models';
import { SanitizeHtmlPipe } from '../../pipes/sanitize-html.pipe';
import { ResourceFormConfig } from '../../table-card';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  Injector,
  ViewEncapsulation,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { Button } from '@fundamental-ngx/ui5-webcomponents/button';
import { Dialog } from '@fundamental-ngx/ui5-webcomponents/dialog';
import { Title } from '@fundamental-ngx/ui5-webcomponents/title';

@Component({
  selector: 'mfp-resource-form-dialog',
  imports: [Dialog, Title, Button, DeclarativeForm, SanitizeHtmlPipe],
  templateUrl: './resource-form-dialog.component.html',
  styleUrl: './resource-form-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.ShadowDom,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ResourceFormDialog {
  readonly open = input(false);
  readonly config = input<ResourceFormConfig | undefined>(undefined);
  readonly fields = input<FormFieldDefinition[]>([]);
  readonly fieldErrors = input<FormFieldErrors>({});
  readonly pending = input(false);
  readonly initialValues = input<Record<string, unknown>>({});
  readonly defaultTitle = input('Create');
  readonly defaultConfirmLabel = input('Save');
  readonly defaultCancelLabel = input('Cancel');
  readonly dataTestidPrefix = input('generic-table-card-create');

  readonly fieldChange = output<FormFieldChangeEvent>();
  readonly submitted = output<Record<string, unknown>>();
  readonly cancelled = output<void>();

  private readonly injector = inject(Injector);

  private readonly form = viewChild<DeclarativeForm<GenericResource>>('form');

  protected hasErrors = computed(() => {
    const errors = this.fieldErrors();
    return !!errors && Object.values(errors).some((val) => !!val);
  });

  protected submit(): void {
    this.form()?.submit();
  }

  /**
   * Applies a partial patch immediately when the inner form exists. Before
   * its first render, defers the patch until controls have been created.
   */
  patchForm(
    values: Partial<Record<string, unknown>>,
    options?: { emitEvent?: boolean; markAsDirty?: boolean },
  ): void {
    const form = this.form();
    if (form) {
      form.patchForm(values as Record<string, unknown>, options);
      return;
    }
    afterNextRender(
      () => {
        this.form()?.patchForm(values as Record<string, unknown>, options);
      },
      { injector: this.injector },
    );
  }
}
