import { ValidatorFn } from '@angular/forms';

export interface SelectOption {
  value: string;
  label: string;
}

export interface FormFieldDefinition {
  name: string;
  label?: string;
  required?: boolean;
  values?: string[];
  loadValues?: () => Promise<SelectOption[]>;
  validators?: ValidatorFn[];
  disabled?: boolean;
}
