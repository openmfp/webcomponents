import { FormFieldDefinition } from '../../form';
import {
  ButtonSettings,
  TableFieldDefinition,
} from '@openmfp/webcomponents/declarative-ui';

export interface TableCardCreateConfig {
  fields: FormFieldDefinition[];
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export interface TableCardEditConfig extends TableCardCreateConfig {
  editButtonSettings?: Partial<ButtonSettings>;
}

export interface TableCardReadConfig {
  fields: TableFieldDefinition[];
  totalItemsCount?: number;
  paginationLimit?: number;
  hasMore?: boolean;
}

export interface TableCardDeleteConfig {
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  deleteButtonSettings?: Partial<ButtonSettings>;
}
