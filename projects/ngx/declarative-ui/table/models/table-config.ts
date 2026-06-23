import { TableFieldDefinition } from '../../models/ui-definition';

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
