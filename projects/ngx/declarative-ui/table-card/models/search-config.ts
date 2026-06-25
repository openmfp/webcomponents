/** One option in the `<ui5-search>` scopes dropdown. */
export interface Scope {
  /** Visible label shown in the dropdown. */
  label: string;
  /** Logical value forwarded in `scopeChanged` / `searchSubmit` events. Used by `<ui5-search-scope value>` to match `scopeValue`. */
  value: string;
  /** The name of the property the value refers to **/
  property: string;
}

/** Configuration for the `<ui5-search>` element rendered in the table-card header. */
export interface TableCardSearchConfig {
  /** ARIA name for the search input. */
  accessibleName?: string;
  /** Placeholder text shown when the input is empty. */
  placeholder?: string;
  /** When `true`, the clear icon is shown inside the input. Default: `true`. */
  showClearIcon?: boolean;
  /** Initial / controlled scope `value` (matches one of `scopes[].value`). */
  initialScopeValue?: Scope;
  /** Initial / controlled search text value. */
  value?: string;
  /** Scope options shown in the scopes dropdown. Omit or leave empty to render the input without a scope dropdown. */
  scopes?: Scope[];
}
