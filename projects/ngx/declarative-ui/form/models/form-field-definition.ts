/** Definition for a single form field rendered by `mfp-declarative-form`. */
export interface FormFieldDefinition {
  /** JSON-path key used to read and write the field value (e.g. `metadata.name`). */
  name: string;
  /** Display label shown above the input. */
  label?: string;
  /** When `true`, passes the `required` attribute to the UI5 input — shows a visual required indicator. Validation itself is the host's responsibility via `FormFieldErrors`. */
  required?: boolean;
  /** Fixed list of options rendered as a select/dropdown. */
  values?: string[];
  /** When `true`, the field is disabled (not interactive). */
  disabled?: boolean;
  /** Controls when `fieldChange` is emitted for this field. When omitted, `fieldChange` is never emitted. */
  validation?: 'onBlur' | 'onChange';
}

/** Event payload emitted each time a single form field value changes. */
export interface FormFieldChangeEvent {
  /** The `name` (JSON-path key) of the field that changed. */
  fieldProperty: string;
  /** The new value entered by the user. */
  value: unknown;
}

/** Map of field names to their current validation error messages (`null` = no error). */
export type FormFieldErrors = Record<string, string | null>;
