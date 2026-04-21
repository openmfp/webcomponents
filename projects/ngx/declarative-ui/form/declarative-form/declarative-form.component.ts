import { FormFieldDefinition } from '../models';
import { setPropertyByPath } from '../utils/set-property-by-path';
import {
  Component,
  DestroyRef,
  ViewEncapsulation,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
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
  ],
  templateUrl: './declarative-form.component.html',
  styleUrl: './declarative-form.component.scss',
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class DeclarativeForm {
  readonly fields = input.required<FormFieldDefinition[]>();
  readonly initialValues = input<Record<string, unknown>>({});
  readonly editMode = input<boolean>(false);

  readonly formValue = output<Record<string, unknown>>();
  readonly formValidChange = output<boolean>();

  readonly form: FormGroup;

  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.form = this.fb.group({});

    this.subscribeToFormChanges();

    effect(() => {
      this.rebuildControls(this.fields());
    });

    effect(() => {
      this.setInitialValues(this.initialValues());
    });
  }

  setFormControlValue($event: Event, name: string): void {
    const target = $event.target as
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement;
    this.form.controls[name]?.setValue(target.value);
    this.form.controls[name]?.markAsTouched();
    this.form.controls[name]?.markAsDirty();
  }

  getValueState(
    name: string,
  ): 'None' | 'Positive' | 'Critical' | 'Negative' | 'Information' {
    const control = this.form.controls[name];
    return control?.invalid && control?.touched ? 'Negative' : 'None';
  }

  onFieldBlur(name: string): void {
    this.form.controls[name]?.markAsTouched();
  }

  private rebuildControls(fields: FormFieldDefinition[]): void {
    const existingControls = this.form.controls;
    const nextFieldNames = new Set(fields.map((field) => field.name));

    for (const field of fields) {
      const validators: ValidatorFn[] = [
        ...(field.required ? [Validators.required] : []),
        ...(field.validators ?? []),
      ];

      const existingControl = existingControls[field.name];

      if (existingControl) {
        existingControl.setValidators(validators);
        existingControl.updateValueAndValidity({ emitEvent: false });
        continue;
      }

      this.form.addControl(field.name, new FormControl('', validators));
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
    this.form.updateValueAndValidity({ emitEvent: false });

    this.formValidChange.emit(this.form.valid);

    if (this.form.valid) {
      this.formValue.emit(this.buildOutputValue());
    }
  }

  private subscribeToFormChanges(): void {
    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.formValidChange.emit(this.form.valid);

        if (this.form.valid) {
          this.formValue.emit(this.buildOutputValue());
        }
      });
  }

  private buildOutputValue(): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const key of Object.keys(this.form.controls)) {
      setPropertyByPath(result, key, this.form.controls[key].value);
    }

    return result;
  }
}
