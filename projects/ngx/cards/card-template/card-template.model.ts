export type CardTemplateBackground = 'solid' | 'transparent';

export type CardTemplateBadgeState =
  'Neutral' | 'Information' | 'Positive' | 'Negative' | 'Critical';

export type CardTemplateMessageStripType =
  'Information' | 'Positive' | 'Negative' | 'Critical';

export interface CardTemplateBadge {
  text: string;
  state?: CardTemplateBadgeState;
}

export interface CardTemplateStatus {
  text: string;
  state: CardTemplateBadgeState;
}

export interface CardTemplateSearch {
  placeholder: string;
}

export interface CardTemplateAction {
  key: string;
  text: string;
}

export interface CardTemplateMessageStrip {
  text: string;
  type?: CardTemplateMessageStripType;
}

export interface CardTemplateConfig {
  header?: boolean;
  background?: CardTemplateBackground;
  badge?: CardTemplateBadge;
  subtitle?: string;
  status?: CardTemplateStatus;
  contentScrollable?: boolean;
  search?: CardTemplateSearch;
  actions?: CardTemplateAction[];
  messageStrip?: CardTemplateMessageStrip;
}
