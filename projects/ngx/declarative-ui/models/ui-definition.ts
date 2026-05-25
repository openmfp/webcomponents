import { GenericResource } from './resource';

/** Text transformation applied to a field value before display. */
export type TransformType =
  | 'uppercase'
  | 'lowercase'
  | 'capitalize'
  | 'decode'
  | 'encode';

/** Resolves a field value via a property path with optional transforms. */
export interface PropertyField {
  /** Dot-separated JSON path to the value (e.g. `metadata.name`). */
  key: string;
  /** Ordered list of transforms applied to the resolved string. */
  transform?: TransformType[];
}

/** Appearance settings for tag chip rendering. */
export interface TagSettings {
  design?: 'Neutral' | 'Positive' | 'Critical' | 'Negative' | 'Information' | 'Set1' | 'Set2';
  colorScheme?: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10';
  /** Delimiter used to split a plain-string value into individual tags. Default: `','`. */
  separator?: string;
}

/** Display and interaction settings for a table cell. */
export interface UiSettings {
  /** How the cell value is rendered. Defaults to plain text when omitted. */
  displayAs?:
    | 'secret'
    | 'boolIcon'
    | 'link'
    | 'tooltip'
    | 'alert'
    | 'img'
    | 'button'
    | 'tag';
  /** Button appearance and action — only used when `displayAs` is `'button'`. */
  buttonSettings?: ButtonSettings;
  /** Tag chip configuration — only used when `displayAs` is `'tag'`. */
  tagSettings?: TagSettings;
  /** SAP UI5 icon name shown as the tooltip trigger icon. */
  tooltipIcon?: string;
  /** When `true`, a copy-to-clipboard button is rendered next to the value. */
  withCopyButton?: boolean;
  /** Inline CSS overrides applied unconditionally to the cell. */
  cssCustomization?: Partial<CSSStyleDeclaration>;
  /** Conditional CSS rules evaluated against the cell value at render time. */
  cssRules?: CssRule[];
  /** Fixed column width including unit (e.g. `'200px'`, `'20%'`). */
  columnWidth?: string;
  align?: 'start' | 'center' | 'end';
}

type KnownButtonActions = 'openInModal' | 'navigate' | 'edit' | 'delete';
type ButtonActions = KnownButtonActions | (string & {});

/** Appearance and action configuration for a button rendered inside a table cell or toolbar. */
export interface ButtonSettings {
  /** Button label text. */
  text?: string;
  /** SAP UI5 icon name placed before the label. */
  icon?: string;
  /** SAP UI5 icon name placed after the label. */
  endIcon?: string;
  /** SAP UI5 button design variant. */
  design?:
    | 'Default'
    | 'Positive'
    | 'Negative'
    | 'Transparent'
    | 'Emphasized'
    | 'Attention';
  /** Tooltip shown on hover. */
  tooltip?: string;
  /** Action identifier. `'edit'` and `'delete'` are handled internally; all other values are forwarded to the host via `actionButtonClick`. */
  action: ButtonActions;
  /** Settings for the modal opened when `action` is `'openInModal'`. */
  modalSettings?: ModalSettings;
}

/** Size and dimension overrides for the modal opened by a button with `action: 'openInModal'`. */
export interface ModalSettings {
  /** Modal title shown in the dialog header. */
  title?: string;
  /** Named size breakpoint. */
  size?: 'fullscreen' | 'l' | 'm' | 's';
  /** Explicit width override. */
  width?: string;
  /** Explicit height override. */
  height?: string;
}

/** Comparison operator used in a conditional CSS rule. */
export type CssRuleCondition =
  | 'equals'
  | 'notEquals'
  | 'greaterThan'
  | 'greaterThanOrEqual'
  | 'lessThan'
  | 'lessThanOrEqual'
  | 'contains';

/** Conditional CSS rule: applies `styles` to the cell when `if` evaluates to `true`. */
export interface CssRule {
  /** Condition evaluated against the cell's string value. */
  if: { condition: CssRuleCondition; value: string };
  /** CSS properties applied when the condition is met. */
  styles: Partial<CSSStyleDeclaration>;
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

/** Base field definition shared by table columns and form fields. */
export interface FieldDefinition {
  /** Column header / form label. */
  label?: string;
  /** Dot-separated path to the resource property (e.g. `metadata.name`). */
  property?: string | string[];
  /** Alternative path resolver with optional transforms. */
  propertyField?: PropertyField;
  /** JSONPath expression evaluated against the resource when `property` is not enough. */
  jsonPathExpression?: string;
  /** Static value — used when the cell shows a constant rather than a resource field. */
  value?: string;
  /** Display and interaction configuration for this cell. */
  uiSettings?: UiSettings;
}

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
