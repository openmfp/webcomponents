import { DeclarativeForm } from '../../form';
import {
  FormFieldChangeEvent,
  FormFieldDefinition,
  FormFieldErrors,
} from '../../form/models';
import { SanitizeHtmlPipe } from '../../pipes/sanitize-html.pipe';
import { ResourceFormConfig } from '../../table-card';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
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
  readonly initialValues = input<Record<string, unknown>>({});
  readonly defaultTitle = input('Create');
  readonly defaultConfirmLabel = input('Save');
  readonly defaultCancelLabel = input('Cancel');
  readonly dataTestidPrefix = input('generic-table-card-create');

  readonly fieldChange = output<FormFieldChangeEvent>();
  readonly submitted = output<Record<string, unknown>>();
  readonly cancelled = output<void>();

  protected hasErrors = computed(() => {
    const errors = this.fieldErrors();
    return !!errors && Object.values(errors).some((val) => !!val);
  });
}
