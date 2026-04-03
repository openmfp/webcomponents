export interface GenericResource extends Record<string, unknown> {
  id: string; // Controls row interactivity
  isAvailable?: boolean; // Controls row interactivity
  accessibleName?: string; // Optional accessible name for the resource
}
