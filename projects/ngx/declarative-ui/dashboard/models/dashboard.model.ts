import { ButtonSettings } from '../../models/ui-definition';

export const CARD_TYPES = {
  WC: 'wc',
  ANGULAR: 'angular',
  SAP_UI: 'sap-ui',
} as const;

export type CardsType = (typeof CARD_TYPES)[keyof typeof CARD_TYPES];

export interface CardConfig {
  id: string;
  w?: number;
  h?: number;
  x?: number;
  y?: number;
  sectionId?: string;
  component: string;
  type?: CardsType;
  componentInputs?: Record<string, unknown>;
  label?: string;
}

export interface SectionConfig {
  id: string;
  w?: number;
  title?: string;
  editable?: boolean;
}

export interface DashboardButtonsSettings {
  editViewButton?: Partial<ButtonSettings>;
  addCardButton?: Partial<ButtonSettings>;
}

export interface DashboardConfig {
  title: string;
  description?: string;
  backgroundImageUrl?: string;
  buttonsSettings?: DashboardButtonsSettings;
  customActions?: ButtonSettings[];
  editable?: boolean;
}
