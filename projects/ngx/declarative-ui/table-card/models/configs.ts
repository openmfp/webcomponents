import { FormFieldDefinition } from '../../form';
import {
  ButtonSettings,
  TableFieldDefinition,
} from '@openmfp/webcomponents/declarative-ui';

export interface ResourceFormConfig {
  fields: FormFieldDefinition[];
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export interface DeleteResourceConfirmationConfig {
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export interface TableConfig {
  fields: TableFieldDefinition[];
  totalItemsCount?: number;
  paginationLimit?: number;
  hasMore?: boolean;
}

export interface TableCardButtonSettings {
  createButton?: Partial<ButtonSettings>;
  searchButton?: Partial<ButtonSettings>;
  editButton?: Partial<ButtonSettings>;
  deleteButton?: Partial<ButtonSettings>;
}

export interface TableCardConfig {
  header: string;
  headerTooltip?: string;
  tableConfig: TableConfig;
  buttonSettings?: TableCardButtonSettings;
  createResourceFormConfig?: ResourceFormConfig;
  editResourceFormConfig?: ResourceFormConfig;
  deleteResourceConfirmationConfig?: DeleteResourceConfirmationConfig;
}
