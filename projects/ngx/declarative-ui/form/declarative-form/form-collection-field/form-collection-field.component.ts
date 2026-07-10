import { FormFieldDefinition } from '../../models';
import { DeclarativeForm } from '../declarative-form.component';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  forwardRef,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { Button } from '@fundamental-ngx/ui5-webcomponents/button';
import { Icon } from '@fundamental-ngx/ui5-webcomponents/icon';
import '@ui5/webcomponents-icons/dist/add.js';
import '@ui5/webcomponents-icons/dist/delete.js';
import '@ui5/webcomponents-icons/dist/navigation-down-arrow.js';
import '@ui5/webcomponents-icons/dist/navigation-right-arrow.js';

/**
 * Internal collection editor rendered by `mfp-declarative-form` when a field
 * carries `collection` sub-fields.
 *
 * Each entry renders as a collapsible card whose expanded body is a nested
 * `<mfp-declarative-form>` bound to that entry. Live changes flow up
 * through the nested form's `(formValueChange)` output — no `viewChildren`
 * on the class, so this component can safely participate in the mutual
 * import cycle with `DeclarativeForm`.
 */
@Component({
  selector: 'mfp-form-collection-field',
  standalone: true,
  // `DeclarativeForm` is imported via `forwardRef` because it also imports
  // this component — a strict module-init cycle. Angular resolves the
  // `forwardRef` when the template is instantiated, by which point both
  // classes are fully defined.
  imports: [Button, Icon, forwardRef(() => DeclarativeForm)],
  templateUrl: './form-collection-field.component.html',
  styleUrl: './form-collection-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class FormCollectionField {
  readonly fields = input.required<FormFieldDefinition[]>();
  readonly label = input.required<string>();

  readonly initialEntries = input<Record<string, unknown>[]>([]);
  readonly valueChange = output<Record<string, unknown>[]>();

  protected readonly entries = linkedSignal<Record<string, unknown>[]>(() => [
    ...(this.initialEntries() ?? []),
  ]);

  protected readonly expandedIndex = linkedSignal<
    Record<string, unknown>[],
    number | null
  >({
    source: this.initialEntries,
    computation: () => null,
  });

  previewFor(entry: Record<string, unknown>, index: number): string {
    for (const field of this.fields()) {
      const raw = entry[field.name];
      if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
        return `${field.label ?? field.name}: ${String(raw)}`;
      }
    }
    const prefix = this.label().trim() || 'Item';
    return `${prefix} ${index + 1}`;
  }

  toggle(index: number): void {
    this.expandedIndex.set(this.expandedIndex() === index ? null : index);
  }

  add(): void {
    const next = [...this.entries(), {}];
    this.entries.set(next);
    this.expandedIndex.set(next.length - 1);
    this.valueChange.emit(next);
  }

  remove(index: number): void {
    const next = this.entries().filter((_, i) => i !== index);
    this.entries.set(next);
    const expandedIndex = this.expandedIndex() as number;
    if (expandedIndex === index) {
      this.expandedIndex.set(null);
    } else if (expandedIndex !== null && expandedIndex > index) {
      // Preserve the same expanded row after removing an earlier one.
      this.expandedIndex.set(expandedIndex - 1);
    }
    this.valueChange.emit(next);
  }

  onEntryValueChange(index: number, value: Record<string, unknown>): void {
    const next = this.entries().map((entry, i) =>
      i === index ? { ...value } : entry,
    );
    this.entries.set(next);
    this.valueChange.emit(next);
  }
}
