export type CardMoveCommand =
  | 'left'
  | 'right'
  | 'up'
  | 'down'
  | 'row-start'
  | 'row-end';

export type CardKeyboardCommand = CardMoveCommand | 'grow' | 'shrink';

type KeyboardModifier = 'shift' | 'ctrl' | 'meta';

function isOnlyModifier(
  event: KeyboardEvent,
  modifier: KeyboardModifier,
): boolean {
  const modifiers = {
    shift: event.shiftKey,
    ctrl: event.ctrlKey,
    meta: event.metaKey,
    alt: event.altKey,
  };

  return (
    modifiers[modifier] &&
    Object.entries(modifiers).every(
      ([name, isPressed]) => name === modifier || !isPressed,
    )
  );
}

export function parseCardKeyCommand(
  event: KeyboardEvent,
): CardKeyboardCommand | null {
  if (isOnlyModifier(event, 'shift')) {
    if (event.key === 'ArrowRight') return 'grow';
    if (event.key === 'ArrowLeft') return 'shrink';
  }
  if (isOnlyModifier(event, 'meta')) {
    if (event.key === 'ArrowLeft') return 'row-start';
    if (event.key === 'ArrowRight') return 'row-end';
  }
  if (isOnlyModifier(event, 'ctrl')) {
    if (event.key === 'ArrowLeft') return 'left';
    if (event.key === 'ArrowRight') return 'right';
    if (event.key === 'ArrowUp') return 'up';
    if (event.key === 'ArrowDown') return 'down';
    if (event.key === 'Home') return 'row-start';
    if (event.key === 'End') return 'row-end';
  }

  return null;
}
