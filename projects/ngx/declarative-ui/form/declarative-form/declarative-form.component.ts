import { GenericResource } from '../../models';
import {
  FormFieldChangeEvent,
  FormFieldDefinition,
  FormFieldErrors,
} from '../models';
import { coerceBoolean } from '../utils/coerce-boolean';
import { setPropertyByPath } from '../utils/set-property-by-path';
import { FormCollectionField } from './form-collection-field/form-collection-field.component';
import {
  ChangeDetectorRef,
  Component,
  ViewEncapsulation,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { Input } from '@fundamental-ngx/ui5-webcomponents/input';
import { InputIcon } from '@fundamental-ngx/ui5-webcomponents/input-icon';
import { Label } from '@fundamental-ngx/ui5-webcomponents/label';
import { Option } from '@fundamental-ngx/ui5-webcomponents/option';
import { Select } from '@fundamental-ngx/ui5-webcomponents/select';
import { Switch } from '@fundamental-ngx/ui5-webcomponents/switch';

@Component({
  selector: 'mfp-declarative-form',
  imports: [
    ReactiveFormsModule,
    Input,
    InputIcon,
    Label,
    Select,
    Option,
    Switch,
    FormCollectionField,
  ],
  templateUrl: './declarative-form.component.html',
  styleUrl: './declarative-form.component.scss',
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class DeclarativeForm<T extends GenericResource> {
  readonly fields = input<FormFieldDefinition[]>([]);
  readonly initialValues = input<T>({} as T);
  readonly fieldErrors = input<FormFieldErrors>({});

  /**
   * Emitted on user interaction with a validated field (change/blur/switch/
   * collection) with `source: 'user'`, and on every `[initialValues]` input
   * identity push for every validated field with `source: 'seed'`. Mirrors
   * Angular's `AbstractControl.setValue(v, { emitEvent })` convention: the
   * input binding is the "emit" path, {@link patchForm} is the "silent"
   * path. Consumers distinguishing user changes from seeds (e.g. dependent
   * resolvers) must gate on `source`.
   */
  readonly fieldChange = output<FormFieldChangeEvent>();
  readonly formSubmit = output<T>();
  readonly formValueChange = output<Record<string, unknown>>();

  readonly form: FormGroup;

  protected readonly collectionSeeds = signal<
    Record<string, Record<string, unknown>[]>
  >({});

  private readonly passwordVisible = signal<Record<string, boolean>>({});

  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  constructor() {
    this.form = this.fb.group({});

    effect(() => {
      this.rebuildControls(this.fields());
    });

    effect(() => {
      const values = this.initialValues();
      untracked(() => {
        this.setInitialValues(values);
      });
    });

    effect(() => {
      this.initialValues();
      untracked(() => {
        this.seedValidationFields();
      });
    });
  }

  /**
   * Programmatically seed the form's values.
   *
   * When `emitEvent` is false, {@link fieldChange} is NOT fired for the seeded
   * values — useful when the host is reloading an existing resource (edit
   * open) and does not want dependent-field resolvers to interpret the seeded
   * parent as a user change (which would trigger a self-clear).
   *
   * When `emitEvent` is omitted or `true` (default), behavior matches an
   * `[initialValues]` input push: `fieldChange` fires once for every
   * validation field with its resulting control value.
   */
  patchForm(
    values: Partial<T>,
    options?: { emitEvent?: boolean; markAsDirty?: boolean },
  ): void {
    this.setInitialValues(values as T, false);
    if (options?.markAsDirty) {
      for (const name of Object.keys(values as object)) {
        this.form.controls[name]?.markAsDirty();
      }
    }
    if (options?.emitEvent !== false) {
      this.seedValidationFields();
    }
    this.cdr.markForCheck();
  }

  private seedValidationFields(): void {
    for (const field of this.fields()) {
      if (!field.validation) continue;
      const control = this.form.controls[field.name];
      if (!control) continue;
      this.fieldChange.emit({
        fieldProperty: field.name,
        value: control.value,
        source: 'seed',
        formValues: this.form.getRawValue(),
      });
    }
  }

  setFormControlValue($event: Event, field: FormFieldDefinition): void {
    const target = $event.target as
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

    const control = this.form.controls[field.name];
    control.setValue(target.value);
    control.markAsTouched();
    control.markAsDirty();

    this.formValueChange.emit(this.form.value as Record<string, unknown>);

    if (field.validation === 'onChange') {
      this.fieldChange.emit({
        fieldProperty: field.name,
        value: control.value,
        source: 'user',
        formValues: this.form.getRawValue(),
      });
    }
  }

  setSwitchValue($event: Event, field: FormFieldDefinition): void {
    const target = $event.target as HTMLInputElement & { checked?: boolean };
    const control = this.form.controls[field.name];
    const checked = coerceBoolean(target.checked);
    control.setValue(checked);
    control.markAsTouched();
    control.markAsDirty();

    this.formValueChange.emit(this.form.value as Record<string, unknown>);

    if (field.validation === 'onChange') {
      this.fieldChange.emit({
        fieldProperty: field.name,
        value: checked,
        source: 'user',
        formValues: this.form.getRawValue(),
      });
    }
  }

  protected readonly coerceChecked = coerceBoolean;

  isPasswordVisible(field: FormFieldDefinition): boolean {
    return this.passwordVisible()[field.name] ?? false;
  }

  passwordInputType(field: FormFieldDefinition): 'Text' | 'Password' {
    if (field.inputType !== 'Password') {
      return 'Text';
    }

    return this.isPasswordVisible(field) ? 'Text' : 'Password';
  }

  passwordToggleIcon(field: FormFieldDefinition): 'hide' | 'show' {
    return this.isPasswordVisible(field) ? 'hide' : 'show';
  }

  passwordToggleLabel(field: FormFieldDefinition): string {
    return this.isPasswordVisible(field) ? 'Hide value' : 'Show value';
  }

  shouldShowPasswordToggle(field: FormFieldDefinition): boolean {
    return field.inputType === 'Password' && (field.showPasswordToggle ?? true);
  }

  togglePasswordVisibility(field: FormFieldDefinition, event: Event): void {
    event.stopPropagation();
    this.passwordVisible.update((state) => ({
      ...state,
      [field.name]: !this.isPasswordVisible(field),
    }));
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
        source: 'user',
        formValues: this.form.getRawValue(),
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
      const value = this.form.controls[field.name]?.value;
      this.fieldChange.emit({
        fieldProperty: field.name,
        value,
        source: 'user',
        formValues: this.form.getRawValue(),
      });
    }
  }

  submit(): void {
    this.formSubmit.emit(this.buildOutputValue());
  }

  clear(): void {
    this.form.reset();
    this.collectionSeeds.set({});
    this.passwordVisible.set({});
  }

  protected selectOptions(
    field: FormFieldDefinition,
    currentValue: unknown,
  ): string[] {
    const options = ['', ...(field.values ?? [])];
    if (
      typeof currentValue === 'string' &&
      currentValue &&
      !options.includes(currentValue)
    ) {
      options.push(currentValue);
    }
    return options;
  }

  collectionEntries(field: FormFieldDefinition): Record<string, unknown>[] {
    return this.collectionSeeds()[field.name] ?? [];
  }

  private rebuildControls(fields: FormFieldDefinition[]): void {
    const existingControls = this.form.controls;
    const nextFieldNames = new Set(fields.map((field) => field.name));
    const added: string[] = [];

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
      } else if (field.inputType === 'Switch') {
        this.form.addControl(field.name, new FormControl(false));
      } else {
        this.form.addControl(field.name, new FormControl(''));
      }
      added.push(field.name);
    }

    for (const controlName of Object.keys(existingControls)) {
      if (!nextFieldNames.has(controlName)) {
        this.form.removeControl(controlName);
      }
    }

    this.form.updateValueAndValidity({ emitEvent: false });
    if (added.length) {
      const values = untracked(this.initialValues) as Record<string, unknown>;
      const seed = Object.fromEntries(
        added
          .filter((name) => this.hasKey(values, name))
          .map((name) => [name, values[name]]),
      );
      this.setInitialValues(seed as T, false);
    }
  }

  private setInitialValues(
    initialValues: T | null | undefined,
    markPristine = true,
  ): void {
    if (!initialValues) {
      return;
    }

    this.rebuildCollectionArrays(initialValues);
    const normalizedValues =
      this.buildPatchObjectWithSwitchCoercion(initialValues);

    this.form.patchValue(normalizedValues, { emitEvent: false });
    if (markPristine) this.form.markAsPristine({ emitEvent: false });
    this.form.updateValueAndValidity({ emitEvent: false });
  }

  private rebuildCollectionArrays(initialValues: T): void {
    const seeds: Record<string, Record<string, unknown>[]> = {
      ...untracked(this.collectionSeeds),
    };
    for (const field of this.fields()) {
      if (!field.propertyCollection?.length) {
        continue;
      }

      if (!this.hasKey(initialValues, field.name)) {
        continue;
      }

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
  }

  private buildPatchObjectWithSwitchCoercion(
    initialValues: T,
  ): Record<string, unknown> {
    const normalizedValues = { ...(initialValues as Record<string, unknown>) };
    for (const field of this.fields()) {
      if (
        field.inputType === 'Switch' &&
        this.hasKey(normalizedValues, field.name)
      ) {
        normalizedValues[field.name] = coerceBoolean(
          normalizedValues[field.name],
        );
      }
    }
    return normalizedValues;
  }

  private hasKey(obj: unknown, name: string): boolean {
    return (
      obj != null &&
      typeof obj === 'object' &&
      Object.prototype.hasOwnProperty.call(obj, name)
    );
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
