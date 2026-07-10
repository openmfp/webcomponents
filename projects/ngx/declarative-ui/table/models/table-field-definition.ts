import { FieldDefinition } from '../../models';

/** Table column definition — extends `FieldDefinition` with optional column grouping. */
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
