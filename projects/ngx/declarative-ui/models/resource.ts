export interface GenericResource extends Record<string, unknown> {
  id?: string;
  isAvailable?: boolean;
  accessibleName?: string;
}
