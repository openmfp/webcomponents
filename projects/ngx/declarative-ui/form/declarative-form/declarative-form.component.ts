import { DeclarativeDynamicSelect } from '../dynamic-select';
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
    DeclarativeDynamicSelect,
  ],
  templateUrl: './declarative-form.component.html',
  styleUrl: './declarative-form.component.scss',
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class DeclarativeForm {
  readonly fields = input.required<FormFieldDefinition[]>();
  readonly initialValues = input<Record<string, any>>({});
  readonly editMode = input<boolean>(false);

  readonly formValue = output<Record<string, any>>();
  readonly formValidChange = output<boolean>();

  form!: FormGroup;

  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    effect(() => {
      this.form = this.fb.group(this.createControls());
      this.subscribeToFormChanges();
    });

    effect(() => {
      this.setInitialValues();
    });
  }

  setFormControlValue($event: any, name: string): void {
    this.form.controls[name].setValue($event.target.value);
    this.form.controls[name].markAsTouched();
    this.form.controls[name].markAsDirty();
  }

  getValueState(
    name: string,
  ): 'None' | 'Positive' | 'Critical' | 'Negative' | 'Information' {
    const control = this.form.controls[name];
    return control.invalid && control.touched ? 'Negative' : ('None' as const);
  }

  onFieldBlur(name: string): void {
    this.form.controls[name].markAsTouched();
  }

  private createControls(): Record<string, FormControl> {
    const values = this.initialValues();
    return this.fields().reduce(
      (acc, field) => {
        const validators: ValidatorFn[] = [
          ...(field.required ? [Validators.required] : []),
          ...(field.validators ?? []),
        ];
        acc[field.name] = new FormControl(
          values?.[field.name] ?? '',
          validators,
        );
        return acc;
      },
      {} as Record<string, FormControl>,
    );
  }

  private subscribeToFormChanges(): void {
    this.form.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.formValidChange.emit(this.form.valid);
        if (this.form.valid) {
          this.formValue.emit(this.buildOutputValue());
        }
      });
  }

  private buildOutputValue(): Record<string, any> {
    const result = {} as Record<string, any>;
    for (const key in this.form.value) {
      setPropertyByPath(result, key.replaceAll('_', '.'), this.form.value[key]);
    }
    return result;
  }

  private setInitialValues(): void {
    const initialValues = this.initialValues();

    if (!this.form || !initialValues) {
      return;
    }

    this.form.patchValue(initialValues, { emitEvent: false });
  }
}
