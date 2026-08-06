import {
  FieldDefinition,
  GenericResource,
  ResourceFieldButtonClickEvent,
} from '../models';
import { getFieldValue } from '../table/utils/field-definition.utils';
import {
  evaluateCssRules,
  evaluateValueRules,
} from '../table/utils/rules.engine';
import { BooleanValue } from './boolean-value/boolean-value.component';
import { LinkValue } from './link-value/link-value.component';
import { ResourceCollectionField } from './resource-collection-field/resource-collection-field.component';
import { SecretValue } from './secret-value/secret-value.component';
import { TagListValue } from './tag-list-value/tag-list-value.component';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  forwardRef,
  input,
  output,
  signal,
} from '@angular/core';
import { Button } from '@fundamental-ngx/ui5-webcomponents/button';
import { Icon } from '@fundamental-ngx/ui5-webcomponents/icon';
import '@ui5/webcomponents-icons/dist/AllIcons.js';

@Component({
  selector: 'mfp-resource-field',
  imports: [
    Icon,
    BooleanValue,
    LinkValue,
    SecretValue,
    Button,
    TagListValue,
    // `ResourceCollectionField` imports this component back (each expanded
    // card renders its sub-fields via `mfp-resource-field`), so the two form
    // a module-init cycle. `forwardRef` defers resolution until the template
    // is instantiated, by which point both classes are defined.
    forwardRef(() => ResourceCollectionField),
  ],
  templateUrl: './resource-field.component.html',
  styleUrl: './resource-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.ShadowDom,
  host: {
    '[class.resource-field--collection]': 'isCollection()',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ResourceField<
  T extends GenericResource,
  F extends FieldDefinition,
> {
  fieldDefinition = input.required<F>();
  resource = input<T>();
  readonly buttonClick = output<ResourceFieldButtonClickEvent<T>>();

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
  displayValue = computed(() =>
    evaluateValueRules(this.value() ?? '', this.uiSettings()?.valueRules),
  );

  isBoolLike = computed(() => this.boolValue() !== undefined);
  isUrlValue = computed(() => this.checkValidUrl(this.stringValue()));
  testId = computed(() => `resource-field-${this.fieldDefinition().property}`);
  buttonDisabled = computed(() => this.resource()?.isAvailable === false);
  buttonAccessibleName = computed(
    () =>
      (this.buttonDisabled() ? this.resource()?.accessibleName : undefined) ??
      this.uiSettings()?.buttonSettings?.text ??
      this.uiSettings()?.buttonSettings?.tooltip ??
      this.uiSettings()?.buttonSettings?.icon ??
      '',
  );

  boolValue = computed(() => this.normalizeBoolean(this.value()));
  stringValue = computed(() => this.normalizeString(this.value()));
  tags = computed(() => this.normalizeTagsArray(this.value()));
  isVisible = signal(false);
  copySuccess = signal(false);

  isCollection = computed(
    () => !!this.fieldDefinition().propertyCollection?.length,
  );

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
      return value.map((v) => String(v).trim()).filter((v) => v.length > 0);
    }
    if (typeof value === 'string') {
      const separator = this.uiSettings()?.tagSettings?.valueSeparator ?? ',';
      return value
        .split(separator)
        .map((v) => v.trim())
        .filter((v) => v.length > 0);
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
    if (this.buttonDisabled()) {
      return;
    }

    this.buttonClick.emit({
      event,
      field: this.fieldDefinition(),
      resource: this.resource(),
    });
  }
}
