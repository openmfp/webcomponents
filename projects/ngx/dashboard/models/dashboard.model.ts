export interface CardConfig {
  id: string;
  colSpan?: number;
  rowSpan?: number;
  title?: string;
  content?: CardContent;
  sectionId?: string;
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
  editable?: boolean;
}

export interface DashboardConfig {
  title: string;
  description?: string;
  backgroundImageUrl?: string;
}
