/** Subset of fields of a generic resource that the table/form components rely on. */
export interface GenericResource extends Record<string, unknown> {
  /** Optional unique identifier. */
  id?: string;
  /** Whether the resource is available/healthy. */
  isAvailable?: boolean;
  /** Human-readable name used for screen readers and tooltips. */
  accessibleName?: string;
}
