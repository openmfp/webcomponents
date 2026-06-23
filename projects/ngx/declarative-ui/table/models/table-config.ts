import { FieldDefinition } from '../../models/ui-definition';
import { GenericResource } from '../../models/resource';

/** Configuration for the `mfp-declarative-table` component. */
export interface TableConfig {
  /** Column definitions. */
  fields: TableFieldDefinition[];
  /** Total number of items on the server (used by pagination). */
  totalItemsCount?: number;
  /** Number of rows per page. */
  paginationLimit?: number;
  /** When `true`, the "Load More" control is shown. */
  hasMore?: boolean;
  height?: number;
  growMode?: 'Scroll' | 'Button';
  loadMoreButtonText?: string;
}

export interface TableFieldDefinition extends FieldDefinition {
  /** Groups this column visually with adjacent columns that share the same `name`. */
  group?: {
    /** Logical group identifier. */
    name: string;
    /** Group header label shown above the grouped cells. */
    label?: string;
    /** Separator placed between values in the same group cell. */
    delimiter?: string;
    /** When `true`, each value is rendered on its own line. */
    multiline?: boolean;
  };
}

/** Event payload emitted when a button inside a table cell is clicked. */
export interface ResourceFieldButtonClickEvent<T extends GenericResource> {
  /** Original DOM click event. */
  event: MouseEvent;
  /** The field definition of the button cell that was clicked. */
  field: TableFieldDefinition;
  /** The data row associated with the clicked button. */
  resource: T | undefined;
}
