export type CardStatusState =
  'Neutral' | 'Information' | 'Positive' | 'Negative' | 'Critical';

export interface CardStatus {
  text: string;
  state: CardStatusState;
}
