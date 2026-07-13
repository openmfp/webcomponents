import { FieldDefinition, GenericResource } from '../../models';
import { getResourceValueByJsonPath } from '../../table/utils/resource-field-by-path';
import { ResourceField } from '../resource-field.component';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { Icon } from '@fundamental-ngx/ui5-webcomponents/icon';
import '@ui5/webcomponents-icons/dist/navigation-down-arrow.js';
import '@ui5/webcomponents-icons/dist/navigation-right-arrow.js';

/** One `label: value` row of an expanded collection card. */
interface CollectionRow {
  label: string;
  field: FieldDefinition;
}

/**
 * Read-only display for a `propertyCollection` field. Renders the resolved
 * array as a column of collapsed cards; expanding a card lists each sub-field
 * as a `label: value` row rendered through `mfp-resource-field`, so per-
 * sub-field `uiSettings` still apply. Mirrors the styling of the editable
 * `mfp-form-collection-field`.
 */
@Component({
  selector: 'mfp-resource-collection-field',
  // `ResourceField` imports this component back, so the two form a module-init
  // cycle. `forwardRef` defers resolution until the template is instantiated.
  imports: [Icon, forwardRef(() => ResourceField)],
  templateUrl: './resource-collection-field.component.html',
  styleUrl: './resource-collection-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.ShadowDom,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ResourceCollectionField<
  T extends GenericResource,
  F extends FieldDefinition,
> {
  readonly fieldDefinition = input.required<F>();
  readonly resource = input<T>();

  protected readonly expandedIndex = signal<number | null>(null);

  private readonly collectionPath = computed(() => {
    const property = this.fieldDefinition().property;
    return typeof property === 'string' ? property : undefined;
  });

  protected readonly entries = computed<Record<string, unknown>[]>(() => {
    const value = getResourceValueByJsonPath(this.resource() ?? {}, {
      property: this.collectionPath(),
    });
    return Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
  });

  protected readonly rows = computed<CollectionRow[]>(() => {
    const parent = this.collectionPath();
    return (this.fieldDefinition().propertyCollection ?? []).map((sub) => {
      const property =
        typeof sub.property === 'string'
          ? this.stripParentPath(sub.property, parent)
          : sub.property;
      return {
        label: sub.label ?? this.leafOf(property),
        field: { ...sub, property } as FieldDefinition,
      };
    });
  });

  toggle(index: number, event?: Event): void {
    event?.stopPropagation();
    this.expandedIndex.set(this.expandedIndex() === index ? null : index);
  }

  previewFor(entry: Record<string, unknown>, index: number): string {
    for (const row of this.rows()) {
      const raw = getResourceValueByJsonPath(entry, {
        property: row.field.property,
      });
      if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
        return `${row.label}: ${String(raw)}`;
      }
    }
    const prefix = (this.fieldDefinition().label ?? '').trim() || 'Item';
    return `${prefix} ${index + 1}`;
  }

  private stripParentPath(name: string, parent: string | undefined): string {
    if (!parent) return name;
    if (name.startsWith(parent + '.')) {
      return name.slice(parent.length + 1);
    }
    return name;
  }

  private leafOf(property: string | string[] | undefined): string {
    if (typeof property !== 'string') return '';
    const segments = property.split('.');
    return segments[segments.length - 1];
  }
}
