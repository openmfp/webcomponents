export type CardMoveCommand =
  'left' | 'right' | 'up' | 'down' | 'row-start' | 'row-end';

export type CardKeyboardCommand = CardMoveCommand | 'grow' | 'shrink';

export const CARD_ARIA_KEYSHORTCUTS =
  'Shift+ArrowRight Shift+ArrowLeft Control+ArrowLeft Control+ArrowRight Control+ArrowUp Control+ArrowDown Control+Home Control+End Meta+ArrowLeft Meta+ArrowRight' as const;
