import { ValidatorFn } from '@angular/forms';

export interface FormFieldDefinition {
  name: string;
  label?: string;
  required?: boolean;
  values?: string[];
  validators?: ValidatorFn[];
  disabled?: boolean;
}
