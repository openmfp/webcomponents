import {
  FormFieldChangeEvent,
  FormFieldDefinition,
  FormFieldErrors,
} from '../models';
import { setPropertyByPath } from '../utils/set-property-by-path';
import {
  Component,
  ViewEncapsulation,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import {
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
  imports: [ReactiveFormsModule, Input, Label, Select, Option],
  templateUrl: './declarative-form.component.html',
  styleUrl: './declarative-form.component.scss',
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class DeclarativeForm {
  readonly fields = input.required<FormFieldDefinition[]>();
  readonly initialValues = input<Record<string, unknown>>({});
  readonly fieldErrors = input<FormFieldErrors>({});

  readonly fieldChange = output<FormFieldChangeEvent>();
  readonly formSubmit = output<Record<string, unknown>>();

  readonly form: FormGroup;

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

    if (field.validation === 'onChange') {
      this.fieldChange.emit({ fieldProperty: field.name, value: control.value });
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

  private rebuildControls(fields: FormFieldDefinition[]): void {
    const existingControls = this.form.controls;
    const nextFieldNames = new Set(fields.map((field) => field.name));

    for (const field of fields) {
      const existingControl = existingControls[field.name];

      if (existingControl) {
        existingControl.clearValidators();
        existingControl.updateValueAndValidity({ emitEvent: false });
        continue;
      }

      this.form.addControl(field.name, new FormControl(''));
    }

    for (const controlName of Object.keys(existingControls)) {
      if (!nextFieldNames.has(controlName)) {
        this.form.removeControl(controlName);
      }
    }

    this.form.updateValueAndValidity({ emitEvent: false });
  }

  private setInitialValues(
    initialValues: Record<string, unknown> | null | undefined,
  ): void {
    if (!initialValues) {
      return;
    }

    this.form.patchValue(initialValues, { emitEvent: false });
    this.form.markAsPristine({ emitEvent: false });
    this.form.updateValueAndValidity({ emitEvent: false });
  }

  private buildOutputValue(): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const key of Object.keys(this.form.controls)) {
      setPropertyByPath(result, key, this.form.controls[key].value);
    }

    return result;
  }
}
