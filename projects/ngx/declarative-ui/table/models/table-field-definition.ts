import { FieldDefinition } from '../../models';

/** Layout and responsive settings specific to table columns. */
export interface TableColumnSettings {
  /** Column width including unit, e.g. '200px' or '20%'. */
  width?: string;
  /** Minimum width for automatic or percentage-width columns. Defaults to 3rem. */
  minWidth?: string;
  /** Higher values keep the column visible longer. Defaults to 0. */
  importance?: number;
  /** Label in the pop-in area. Defaults to the column/group label. */
  popinText?: string;
  /** Hides the value on narrow screens. Defaults to false. */
  popinHidden?: boolean;
}

/** Table column definition — extends `FieldDefinition` with optional column grouping. */
export interface TableFieldDefinition extends FieldDefinition {
  columnSettings?: TableColumnSettings;
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
