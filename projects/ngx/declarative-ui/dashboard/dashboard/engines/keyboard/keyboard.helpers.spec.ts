import { parseCardKeyCommand } from './keyboard.helpers';

function keydown(
  key: string,
  modifiers: Partial<
    Pick<KeyboardEvent, 'shiftKey' | 'ctrlKey' | 'metaKey' | 'altKey'>
  > = {},
): KeyboardEvent {
  return new KeyboardEvent('keydown', { key, ...modifiers });
}

describe('parseCardKeyCommand', () => {
  it.each([
    ['ArrowRight', 'grow'],
    ['ArrowLeft', 'shrink'],
  ] as const)('maps Shift+%s to %s', (key, command) => {
    expect(parseCardKeyCommand(keydown(key, { shiftKey: true }))).toBe(command);
  });

  it.each([
    ['ArrowLeft', 'left'],
    ['ArrowRight', 'right'],
    ['ArrowUp', 'up'],
    ['ArrowDown', 'down'],
    ['Home', 'row-start'],
    ['End', 'row-end'],
  ] as const)('maps Ctrl+%s to %s', (key, command) => {
    expect(parseCardKeyCommand(keydown(key, { ctrlKey: true }))).toBe(command);
  });

  it.each([
    ['ArrowLeft', 'row-start'],
    ['ArrowRight', 'row-end'],
  ] as const)('maps Meta+%s to %s', (key, command) => {
    expect(parseCardKeyCommand(keydown(key, { metaKey: true }))).toBe(command);
  });

  it.each([
    keydown('ArrowRight'),
    keydown('ArrowRight', { shiftKey: true, altKey: true }),
    keydown('ArrowRight', { shiftKey: true, ctrlKey: true }),
    keydown('ArrowRight', { ctrlKey: true, metaKey: true }),
    keydown('PageDown', { ctrlKey: true }),
  ])('rejects unsupported or ambiguous shortcuts', (event) => {
    expect(parseCardKeyCommand(event)).toBeNull();
  });
});
