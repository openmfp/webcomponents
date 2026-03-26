export interface CardConfig {
  id: string;
  colSpan?: number;
  rowSpan?: number;
  title?: string;
  content?: CardContent;
}

export interface CardContent {
  type: 'table' | 'custom' | 'empty';
  data?: unknown;
}

export interface SectionConfig {
  id: string;
  colSpan?: number;
  rowSpan?: number;
  title?: string;
  cards: CardConfig[];
}

export interface DashboardConfig {
  columns?: number;
  rowHeight?: string;
  sections: SectionConfig[];
}
