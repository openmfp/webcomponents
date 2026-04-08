import { GenericResource } from './resource';

export type TransformType = 'uppercase' | 'lowercase' | 'capitalize' | 'decode' | 'encode';

export interface PropertyField {
  key: string;
  transform?: TransformType[];
}

export interface UiSettings {
  labelDisplay?: boolean;
  displayAs?:
    | 'secret'
    | 'boolIcon'
    | 'link'
    | 'tooltip'
    | 'alert'
    | 'img'
    | 'button';
  buttonSettings?: ButtonSettings;
  tooltipIcon?: string;
  withCopyButton?: boolean;
  cssCustomization?: Partial<CSSStyleDeclaration>;
  cssRules?: CssRule[];
}

type KnownButtonActions = 'openInModal' | 'navigate' | 'edit' | 'delete';
type ButtonActions = KnownButtonActions | (string & {});

export interface ButtonSettings {
  text?: string;
  icon?: string;
  endIcon?: string;
  design?:
    | 'Default'
    | 'Positive'
    | 'Negative'
    | 'Transparent'
    | 'Emphasized'
    | 'Attention';
  tooltip?: string;
  action: ButtonActions;
  modalSettings?: ModalSettings;
}

export interface ModalSettings {
  title?: string;
  size?: 'fullscreen' | 'l' | 'm' | 's'; // ze of the modal
  width?: string; //updates the width of the modal. Allowed units are 'px', '%', 'rem', 'em', 'vh' and 'vw
  height?: string; //updates the height of the modal. Allowed units are 'px', '%', 'rem', 'em', 'vh' and 'vw
}

export type CssRuleCondition =
  | 'equals'
  | 'notEquals'
  | 'greaterThan'
  | 'greaterThanOrEqual'
  | 'lessThan'
  | 'lessThanOrEqual'
  | 'contains';

export interface CssRule {
  if: { condition: CssRuleCondition; value: string };
  styles: Partial<CSSStyleDeclaration>;
}

export interface ValueCellButtonClickEvent<T extends GenericResource> {
  event: MouseEvent;
  field: TableFieldDefinition;
  resource: T | undefined;
}

export interface FieldDefinition {
  label?: string;
  property?: string | string[];
  propertyField?: PropertyField;
  jsonPathExpression?: string;
  value?: string;
  uiSettings?: UiSettings;
}

export interface TableFieldDefinition extends FieldDefinition {
  group?: {
    name: string;
    label?: string;
    delimiter?: string;
    multiline?: boolean;
  };
}
