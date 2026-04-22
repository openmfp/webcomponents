import { ButtonSettings } from '../../models/ui-definition';

export interface CardConfig {
  id: string;
  w?: number;
  h?: number;
  x?: number;
  y?: number;
  sectionId?: string;
  component: string;
  componentInputs?: Record<string, unknown>;
  label?: string;
}

export interface SectionConfig {
  id: string;
  w?: number;
  title?: string;
  editable?: boolean;
}

export interface DashboardConfig {
  title: string;
  description?: string;
  backgroundImageUrl?: string;
  customActions?: ButtonSettings[];
  editable?: boolean;
}
