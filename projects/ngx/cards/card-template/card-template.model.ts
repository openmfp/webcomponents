import type { CardStatusState } from '../../models/card-status.model';

export type CardTemplateBackground = 'solid' | 'transparent';

export type CardTemplateBadgeState = CardStatusState;

export type CardTemplateMessageStripType =
  'Information' | 'Positive' | 'Negative' | 'Critical';

export interface CardTemplateBadge {
  text: string;
  state?: CardTemplateBadgeState;
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
  contentScrollable?: boolean;
  search?: CardTemplateSearch;
  actions?: CardTemplateAction[];
  messageStrip?: CardTemplateMessageStrip;
}
