import { evaluateCssRules } from '../utils/cssRules.engine';
import { getFieldValue } from '../utils/field-definition.utils';
import { BooleanValue } from './boolean-value/boolean-value.component';
import { LinkValue } from './link-value/link-value.component';
import { SecretValue } from './secret-value/secret-value.component';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { Button } from '@fundamental-ngx/ui5-webcomponents/button';
import { Icon } from '@fundamental-ngx/ui5-webcomponents/icon';
import { FieldDefinition, GenericResource, ValueCellButtonClickEvent } from '../models';

@Component({
  selector: 'mfp-value-cell',
  imports: [Icon, BooleanValue, LinkValue, SecretValue, Button],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './value-cell.component.html',
  styleUrls: ['./value-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ValueCellComponent<T extends GenericResource, F extends FieldDefinition> {
  fieldDefinition = input.required<F>();
  resource = input<T>();
  buttonClick = output<ValueCellButtonClickEvent<T>>();

  value = computed(() => getFieldValue(this.fieldDefinition(), this.resource()));

  uiSettings = computed(() => this.fieldDefinition().uiSettings);
  displayAs = computed(() => this.uiSettings()?.displayAs);
  withCopyButton = computed(() => this.uiSettings()?.withCopyButton);
  labelDisplay = computed(() => this.uiSettings()?.labelDisplay);
  cssCustomization = computed(() => this.uiSettings()?.cssCustomization);
  tooltipIcon = computed(() => this.uiSettings()?.tooltipIcon);
  cssRules = computed(() => evaluateCssRules(this.value(), this.uiSettings()?.cssRules));
  cssStyles = computed(() => ({
    ...this.cssCustomization(),
    ...this.cssRules(),
  }));

  isBoolLike = computed(() => this.boolValue() !== undefined);
  isUrlValue = computed(() => this.checkValidUrl(this.stringValue()));
  testId = computed(() => `value-cell-${this.fieldDefinition().property}`);

  boolValue = computed(() => this.normalizeBoolean(this.value()));
  stringValue = computed(() => this.normalizeString(this.value()));
  isVisible = signal(false);

  toggleVisibility(e: Event): void {
    e.stopPropagation();
    this.isVisible.set(!this.isVisible());
  }

  private normalizeBoolean(value: unknown): boolean | undefined {
    const normalizedValue = value?.toString()?.toLowerCase();
    if (normalizedValue === 'true') {
      return true;
    }
    if (normalizedValue === 'false') {
      return false;
    }
    return undefined;
  }

  private normalizeString(value: unknown): string | undefined {
    if (typeof value !== 'string' || !value.trim()) {
      return undefined;
    }

    return value;
  }

  private checkValidUrl(value: string | undefined): boolean {
    if (!value) {
      return false;
    }

    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  public copyValue(event: Event) {
    event.stopPropagation();
    navigator.clipboard.writeText(this.value() || '');
  }

  protected buttonClicked(event: MouseEvent) {
    event.stopPropagation();
    this.buttonClick.emit({
      event,
      field: this.fieldDefinition(),
      resource: this.resource(),
    });
  }
}
