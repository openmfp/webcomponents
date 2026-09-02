import { coerceBoolean } from './coerce-boolean';

describe('coerceBoolean', () => {
  it('returns booleans unchanged', () => {
    expect(coerceBoolean(true)).toBe(true);
    expect(coerceBoolean(false)).toBe(false);
  });

  it('coerces only the string "true" (any casing) to true', () => {
    expect(coerceBoolean('true')).toBe(true);
    expect(coerceBoolean('TRUE')).toBe(true);
    expect(coerceBoolean('  True  ')).toBe(true);
  });

  it('coerces other strings to false', () => {
    expect(coerceBoolean('false')).toBe(false);
    expect(coerceBoolean('False')).toBe(false);
    expect(coerceBoolean('')).toBe(false);
    expect(coerceBoolean('yes')).toBe(false);
    expect(coerceBoolean('1')).toBe(false);
  });

  it('returns false for non-boolean, non-string values', () => {
    expect(coerceBoolean(1)).toBe(false);
    expect(coerceBoolean(0)).toBe(false);
    expect(coerceBoolean(null)).toBe(false);
    expect(coerceBoolean(undefined)).toBe(false);
  });
});
