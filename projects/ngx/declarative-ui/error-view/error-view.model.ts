export type ErrorViewButtonDesign =
  | 'Default'
  | 'Positive'
  | 'Negative'
  | 'Transparent'
  | 'Emphasized'
  | 'Attention';

export interface ErrorViewConfig<T extends ErrorViewButton = ErrorViewButton> {
  illustration: string;
  title?: string;
  subtitle?: string;
  buttons?: T[];
}

export interface ErrorViewButton {
  key: string;
  label: string;
  design?: ErrorViewButtonDesign;
  icon?: string;
  disabled?: boolean;
}
