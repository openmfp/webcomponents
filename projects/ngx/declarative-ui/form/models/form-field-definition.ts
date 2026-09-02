/** Definition for a single form field rendered by `mfp-declarative-form`. */
export interface FormFieldDefinition {
  /** JSON-path key used to read and write the field value (e.g. `metadata.name`). */
  name: string;
  /** Display label shown above the input. */
  label: string;
  /** When `true`, passes the `required` attribute to the UI5 input — shows a visual required indicator. Validation itself is the host's responsibility via `FormFieldErrors`. */
  required?: boolean;
  /** Fixed list of options rendered as a select/dropdown. */
  values?: string[];
  /** When `true`, the field is disabled (not interactive). */
  disabled?: boolean;
  /** UI5 input type rendered by `mfp-declarative-form`. */
  inputType?: 'Text' | 'Password' | 'Switch';
  /**
   * When `inputType` is `Password`, renders a show/hide icon inside the input.
   * Defaults to `true`; set to `false` to keep the field masked without a toggle.
   */
  showPasswordToggle?: boolean;
  /** UI5 input placeholder (functional, not example values). */
  placeholder?: string;
  /** Persistent help text below the control; never submitted with the form. */
  hint?: string;
  /**
   * When `true`, the host should omit this field from read queries and skip
   * empty values on edit submit (e.g. write-only secrets).
   */
  writeOnly?: boolean;
  /** Controls when `fieldChange` is emitted for this field. When omitted, `fieldChange` is never emitted. */
  validation?: 'onBlur' | 'onChange';
  /**
   * Nested field definitions describing one item of an object collection.
   *
   * When set, this field represents an array of objects; the form renders it
   * as a stack of expandable/collapsible cards. Each card is a nested
   * `mfp-declarative-form` whose `fields` are the entries in
   * `propertyCollection`; an inline Add button appends entries and a trash
   * button removes them. Editing is live — no per-card Save/Cancel.
   *
   * The submitted value at this field's path is `Array<Record<string, unknown>>`,
   * with each entry keyed by the sub-fields' `name`s. When `required` is
   * `true`, the host is expected to require at least one entry in the array.
   */
  propertyCollection?: FormFieldDefinition[];
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
