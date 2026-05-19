import { FormFieldDefinition, FormFieldErrors } from '../../form';
import { ButtonSettings } from '../../models';
import { TableFieldDefinition } from '../../table';

/** Configuration for the create/edit resource form rendered inside the table card dialogs. */
export interface ResourceFormConfig {
  /** Ordered list of fields to render in the form. */
  fields: FormFieldDefinition[];
  /** Dialog title shown in the header. */
  title?: string;
  /** Label for the confirm/submit button. */
  confirmLabel?: string;
  /** Label for the cancel button. */
  cancelLabel?: string;
}

/** Runtime validation and submit state passed to the table card from the host. */
export interface TableCardFormState {
  /** Map of field names to their current error messages. Any truthy error in the map disables the submit button. */
  fieldErrors?: FormFieldErrors;
}

/** Configuration for the delete-confirmation dialog. */
export interface DeleteResourceConfirmationConfig {
  /** Dialog title. */
  title?: string;
  /** Explanatory message shown below the title. */
  message?: string;
  /** Label for the confirm/delete button. */
  confirmLabel?: string;
  /** Label for the cancel button. */
  cancelLabel?: string;
}

/** Configuration for the inner `mfp-declarative-table`. */
export interface TableConfig {
  /** Column definitions. */
  fields: TableFieldDefinition[];
  /** Total number of items on the server (used by pagination). */
  totalItemsCount?: number;
  /** Number of rows per page. */
  paginationLimit?: number;
  /** When `true`, the "Load More" control is shown. */
  hasMore?: boolean;
}

/** Overrides for the table card's built-in action buttons. */
export interface TableCardButtonSettings {
  /** Partial override for the "Create" button. */
  createButton?: Partial<ButtonSettings>;
  /** Partial override for the search toggle button. */
  searchButton?: Partial<ButtonSettings>;
  /** Partial override for the per-row "Edit" button. */
  editButton?: Partial<ButtonSettings>;
  /** Partial override for the per-row "Delete" button. */
  deleteButton?: Partial<ButtonSettings>;
}

/** Top-level configuration for `<mfp-declarative-table-card>`. */
export interface TableCardConfig {
  /** Card heading. */
  header?: string;
  /** Tooltip shown on hover of the card heading. */
  headerTooltip?: string;
  /** Required table configuration. */
  tableConfig: TableConfig;
  /** Overrides for built-in toolbar and row-action buttons. */
  buttonSettings?: TableCardButtonSettings;
  /** When `true`, shows the search input and button in the card toolbar. */
  resourcesSearchable?: boolean;
  /** When set, enables the "Create" button and create dialog. */
  createResourceFormConfig?: ResourceFormConfig;
  /** When set, enables per-row "Edit" button and edit dialog. */
  editResourceFormConfig?: ResourceFormConfig;
  /** When set, enables per-row "Delete" button and confirmation dialog. */
  deleteResourceConfirmationConfig?: DeleteResourceConfirmationConfig;
}
