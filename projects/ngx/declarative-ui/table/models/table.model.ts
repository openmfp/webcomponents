import { GenericResource } from '../../models/resource';
import { FieldDefinition } from '../../models/ui-definition';

export interface ValueCellButtonClickEvent<T extends GenericResource> {
  event: MouseEvent;
  field: TableFieldDefinition;
  resource: T | undefined;
}

export interface TableFieldDefinition extends FieldDefinition {
  group?: {
    name: string;
    label?: string;
    delimiter?: string;
    multiline?: boolean;
  };
}
