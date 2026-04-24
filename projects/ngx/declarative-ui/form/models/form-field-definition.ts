export interface FormFieldDefinition {
  name: string;
  label?: string;
  required?: boolean;
  values?: string[];
  disabled?: boolean;
  validation?: 'onBlur' | 'onChange';
}

export interface FormFieldChangeEvent {
  controlName: string;
  value: unknown;
}

export type FormFieldErrors = Record<string, string | null>;
