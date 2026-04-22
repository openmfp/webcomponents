import { FieldDefinition } from '../../models';
import { getResourceValueByJsonPath } from './resource-field-by-path';

export function getFieldValue<T>(
  field: FieldDefinition,
  resource: T | undefined,
) {
  if (resource) {
    return getResourceValueByJsonPath<T>(resource, field) ?? field.value;
  }

  return field.value;
}
