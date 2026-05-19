import { FormFieldDefinition, FormFieldErrors } from '../../form';
import { ButtonSettings } from '../../models';
import { TableFieldDefinition } from '../../table';

export interface ResourceFormConfig {
  fields: FormFieldDefinition[];
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export interface TableCardFormState {
  fieldErrors?: FormFieldErrors;
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
  height?: number;
  growMode?: 'Scroll' | 'Button';
  loadMoreButtonText?: string;
}

export interface TableCardButtonSettings {
  createButton?: Partial<ButtonSettings>;
  searchButton?: Partial<ButtonSettings>;
  editButton?: Partial<ButtonSettings>;
  deleteButton?: Partial<ButtonSettings>;
}

export interface TableCardConfig {
  header?: string;
  headerTooltip?: string;
  tableConfig: TableConfig;
  buttonSettings?: TableCardButtonSettings;
  resourcesSearchable?: boolean;
  createResourceFormConfig?: ResourceFormConfig;
  editResourceFormConfig?: ResourceFormConfig;
  deleteResourceConfirmationConfig?: DeleteResourceConfirmationConfig;
}
