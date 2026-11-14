export type DataFetchLastUpdated = { label: string } & (
  | { text: string; path?: never; locale?: never }
  | { path: string; text?: never; locale?: string }
);

export type CardStatusState =
  'Neutral' | 'Information' | 'Positive' | 'Negative' | 'Critical';

export interface CardStatus {
  text: string;
  state: CardStatusState;
}
