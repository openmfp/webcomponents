export interface CardConfig {
  id?: string;
  colSpan?: number;
  rowSpan?: number;
  sectionId?: string;
  component: string;
  componentInputs?: Record<string, unknown>;
  label?: string;
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
