import { GenericResource } from '../../models';
import {
  FormFieldChangeEvent,
  FormFieldDefinition,
  FormFieldErrors,
} from '../models';
import { setPropertyByPath } from '../utils/set-property-by-path';
import { FormCollectionField } from './form-collection-field/form-collection-field.component';
import {
  Component,
  ViewEncapsulation,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { Input } from '@fundamental-ngx/ui5-webcomponents/input';
import { Label } from '@fundamental-ngx/ui5-webcomponents/label';
import { Option } from '@fundamental-ngx/ui5-webcomponents/option';
import { Select } from '@fundamental-ngx/ui5-webcomponents/select';

@Component({
  selector: 'mfp-declarative-form',
  imports: [
    ReactiveFormsModule,
    Input,
    Label,
    Select,
    Option,
    FormCollectionField,
  ],
  templateUrl: './declarative-form.component.html',
  styleUrl: './declarative-form.component.scss',
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class DeclarativeForm<T extends GenericResource> {
  readonly fields = input.required<FormFieldDefinition[]>();
  readonly initialValues = input<T>({} as T);
  readonly fieldErrors = input<FormFieldErrors>({});

  readonly fieldChange = output<FormFieldChangeEvent>();
  readonly formSubmit = output<T>();
  readonly formValueChange = output<Record<string, unknown>>();

  readonly form: FormGroup;

  protected readonly collectionSeeds = signal<
    Record<string, Record<string, unknown>[]>
  >({});

  private readonly fb = inject(FormBuilder);

  constructor() {
    this.form = this.fb.group({});

    effect(() => {
      this.rebuildControls(this.fields());
    });

    effect(() => {
      this.setInitialValues(this.initialValues());
    });

    effect(() => {
      const fields = this.fields();
      this.initialValues();

      for (const field of fields) {
        if (field.validation) {
          this.fieldChange.emit({
            fieldProperty: field.name,
            value: this.form.controls[field.name]?.value ?? '',
          });
        }
      }
    });
  }

  setFormControlValue($event: Event, field: FormFieldDefinition): void {
    const target = $event.target as
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement;

    const control = this.form.controls[field.name];
    control.setValue(target.value);
    control.markAsTouched();
    control.markAsDirty();

    this.formValueChange.emit(this.form.value as Record<string, unknown>);

    if (field.validation === 'onChange') {
      this.fieldChange.emit({
        fieldProperty: field.name,
        value: control.value,
      });
    }
  }

  onCollectionValueChange(
    field: FormFieldDefinition,
    entries: Record<string, unknown>[],
  ): void {
    const array = this.form.controls[field.name] as FormArray | undefined;
    if (!array) return;

    while (array.length) array.removeAt(0);
    for (const entry of entries) {
      array.push(this.buildEntryGroup(entry));
    }
    array.markAsDirty();
    array.markAsTouched();

    if (field.validation === 'onChange' || field.validation === 'onBlur') {
      this.fieldChange.emit({
        fieldProperty: field.name,
        value: entries,
      });
    }
  }

  getError(name: string): string | null {
    const control = this.form.controls[name];
    const error = this.fieldErrors()[name];

    return error && (control.dirty || control.touched) ? error : null;
  }

  getValueState(name: string): 'None' | 'Negative' {
    return this.getError(name) ? 'Negative' : 'None';
  }

  onFieldBlur(field: FormFieldDefinition): void {
    this.form.controls[field.name]?.markAsTouched();

    if (field.validation === 'onBlur') {
      this.fieldChange.emit({
        fieldProperty: field.name,
        value: this.form.controls[field.name]?.value,
      });
    }
  }

  submit(): void {
    this.formSubmit.emit(this.buildOutputValue());
  }

  clear(): void {
    this.form.reset();
  }

  collectionEntries(field: FormFieldDefinition): Record<string, unknown>[] {
    return this.collectionSeeds()[field.name] ?? [];
  }

  private rebuildControls(fields: FormFieldDefinition[]): void {
    const existingControls = this.form.controls;
    const nextFieldNames = new Set(fields.map((field) => field.name));

    for (const field of fields) {
      const existingControl = existingControls[field.name];
      const wantsCollection = !!field.propertyCollection?.length;
      const existingIsCollection = existingControl instanceof FormArray;
      if (existingControl && wantsCollection !== existingIsCollection) {
        this.form.removeControl(field.name);
      } else if (existingControl) {
        existingControl.clearValidators();
        existingControl.updateValueAndValidity({ emitEvent: false });
        continue;
      }

      if (wantsCollection) {
        this.form.addControl(field.name, this.fb.array([]));
      } else {
        this.form.addControl(field.name, new FormControl(''));
      }
    }

    for (const controlName of Object.keys(existingControls)) {
      if (!nextFieldNames.has(controlName)) {
        this.form.removeControl(controlName);
      }
    }

    this.form.updateValueAndValidity({ emitEvent: false });
  }

  private setInitialValues(initialValues: T | null | undefined): void {
    if (!initialValues) {
      return;
    }

    const seeds: Record<string, Record<string, unknown>[]> = {};
    for (const field of this.fields()) {
      if (!field.propertyCollection?.length) continue;
      const raw = (initialValues as Record<string, unknown>)[field.name];
      const entries = Array.isArray(raw)
        ? (raw as Record<string, unknown>[])
        : [];

      const array = this.form.controls[field.name] as FormArray | undefined;
      if (array) {
        while (array.length) array.removeAt(0);
        for (const entry of entries) {
          array.push(this.buildEntryGroup(entry));
        }
      }
      seeds[field.name] = entries;
    }
    this.collectionSeeds.set(seeds);

    this.form.patchValue(initialValues, { emitEvent: false });
    this.form.markAsPristine({ emitEvent: false });
    this.form.updateValueAndValidity({ emitEvent: false });
  }

  private buildOutputValue(): T {
    const result = {} as T;

    for (const key of Object.keys(this.form.controls)) {
      const control = this.form.controls[key];
      let value: unknown = control.value;
      if (control instanceof FormArray) {
        value = control.controls.map(
          (group) => (group as FormGroup).controls['entry']?.value ?? {},
        );
      }
      setPropertyByPath(result, key, value);
    }

    return result;
  }

  private buildEntryGroup(entry: Record<string, unknown>): FormGroup {
    return this.fb.group({
      entry: new FormControl(entry),
    });
  }
}
