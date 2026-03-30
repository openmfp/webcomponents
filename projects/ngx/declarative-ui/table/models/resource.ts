export interface GenericResource extends Record<string, unknown> {
  isAvailable?: boolean; // Controls row interactivity
  accessibleName?: string; // Optional accessible name for the resource
}
