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

type KnownButtonActions = 'openInModal' | 'navigate' | 'edit' | 'delete';
type ButtonActions = KnownButtonActions | (string & {});

export interface DashboardButtonSettings {
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
  customActions?: DashboardButtonSettings[];
  editable?: boolean;
}
