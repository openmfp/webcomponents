import {
  FieldDefinition,
  GenericResource,
  ValueCellButtonClickEvent,
} from '../models';
import { evaluateCssRules } from '../table/utils/cssRules.engine';
import { getFieldValue } from '../table/utils/field-definition.utils';
import { BooleanValue } from './boolean-value/boolean-value.component';
import { LinkValue } from './link-value/link-value.component';
import { SecretValue } from './secret-value/secret-value.component';
import { TagListValue } from './tag-list-value/tag-list-value.component';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { Button } from '@fundamental-ngx/ui5-webcomponents/button';
import { Icon } from '@fundamental-ngx/ui5-webcomponents/icon';
import '@ui5/webcomponents-icons/dist/AllIcons.js';

@Component({
  selector: 'mfp-value-cell',
  imports: [Icon, BooleanValue, LinkValue, SecretValue, Button, TagListValue],
  templateUrl: './value-cell.component.html',
  styleUrl: './value-cell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.ShadowDom,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ValueCell<T extends GenericResource, F extends FieldDefinition> {
  fieldDefinition = input.required<F>();
  resource = input<T>();
  readonly buttonClick = output<ValueCellButtonClickEvent<T>>();

  value = computed(() =>
    getFieldValue(this.fieldDefinition(), this.resource()),
  );

  uiSettings = computed(() => this.fieldDefinition().uiSettings);
  displayAs = computed(() => this.uiSettings()?.displayAs);
  withCopyButton = computed(() => this.uiSettings()?.withCopyButton);
  cssCustomization = computed(() => this.uiSettings()?.cssCustomization);
  tooltipIcon = computed(() => this.uiSettings()?.tooltipIcon);
  cssRules = computed(() =>
    evaluateCssRules(this.value(), this.uiSettings()?.cssRules),
  );
  cssStyles = computed(() => ({
    ...this.cssCustomization(),
    ...this.cssRules(),
  }));

  isBoolLike = computed(() => this.boolValue() !== undefined);
  isUrlValue = computed(() => this.checkValidUrl(this.stringValue()));
  testId = computed(() => `value-cell-${this.fieldDefinition().property}`);

  boolValue = computed(() => this.normalizeBoolean(this.value()));
  stringValue = computed(() => this.normalizeString(this.value()));
  tags = computed(() => this.normalizeTagsArray(this.value()));
  isVisible = signal(false);
  copySuccess = signal(false);

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

  private normalizeTagsArray(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.map(v => String(v).trim()).filter(v => v.length > 0);
    }
    if (typeof value === 'string') {
      const separator = this.uiSettings()?.tagSettings?.separator ?? ',';
      return value.split(separator).map(v => v.trim()).filter(v => v.length > 0);
    }
    return [];
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
    navigator.clipboard.writeText(this.value() || '').then(() => {
      this.copySuccess.set(true);
      setTimeout(() => {
        this.copySuccess.set(false);
      }, 2000);
    });
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
