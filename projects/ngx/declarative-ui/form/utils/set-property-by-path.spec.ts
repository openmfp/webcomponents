import { setPropertyByPath } from './set-property-by-path';

describe('setPropertyByPath', () => {
  describe('normal behaviour', () => {
    it('sets a top-level property', () => {
      const target: Record<string, unknown> = {};

      setPropertyByPath(target, 'name', 'value');

      expect(target).toEqual({ name: 'value' });
    });

    it('creates intermediate objects for a nested path', () => {
      const target: Record<string, unknown> = {};

      setPropertyByPath(target, 'a.b.c', 42);

      expect(target).toEqual({ a: { b: { c: 42 } } });
    });

    it('reuses existing intermediate objects instead of replacing them', () => {
      const target: Record<string, unknown> = { a: { keep: true } };

      setPropertyByPath(target, 'a.added', 1);

      expect(target).toEqual({ a: { keep: true, added: 1 } });
    });

    it('overwrites a non-object intermediate value with a fresh object', () => {
      const target: Record<string, unknown> = { a: 'scalar' };

      setPropertyByPath(target, 'a.b', 1);

      expect(target).toEqual({ a: { b: 1 } });
    });

    it('overwrites a null intermediate value with a fresh object', () => {
      const target: Record<string, unknown> = { a: null };

      setPropertyByPath(target, 'a.b', 1);

      expect(target).toEqual({ a: { b: 1 } });
    });

    it('preserves any value type at the leaf, including undefined', () => {
      const target: Record<string, unknown> = {};

      setPropertyByPath(target, 'a.b', undefined);

      expect(target).toEqual({ a: { b: undefined } });
      expect('b' in (target.a as Record<string, unknown>)).toBe(true);
    });

    it('ignores empty segments produced by leading, trailing or doubled dots', () => {
      const target: Record<string, unknown> = {};

      setPropertyByPath(target, '.a..b.', 1);

      expect(target).toEqual({ a: { b: 1 } });
    });

    it('returns the object unchanged for an empty path', () => {
      const target: Record<string, unknown> = { a: 1 };

      const result = setPropertyByPath(target, '', 2);

      expect(result).toBe(target);
      expect(target).toEqual({ a: 1 });
    });

    it('returns the same object reference it was given', () => {
      const target: Record<string, unknown> = {};

      const result = setPropertyByPath(target, 'a', 1);

      expect(result).toBe(target);
    });
  });

  describe('prototype pollution protection', () => {
    afterEach(() => {
      // Safety net: ensure no test leaked a pollution onto Object.prototype.
      delete (Object.prototype as Record<string, unknown>).polluted;
      delete (Object.prototype as Record<string, unknown>).x;
    });

    it('does not pollute Object.prototype via __proto__ (issue #235 case 1)', () => {
      setPropertyByPath({}, '__proto__.polluted', 'YES');

      expect(({} as Record<string, unknown>).polluted).toBeUndefined();
      expect(
        (Object.prototype as Record<string, unknown>).polluted,
      ).toBeUndefined();
    });

    it('does not pollute Object.prototype via constructor.prototype (issue #235 case 2)', () => {
      setPropertyByPath({}, 'constructor.prototype.x', 'YES');

      expect(({} as Record<string, unknown>).x).toBeUndefined();
      expect((Object.prototype as Record<string, unknown>).x).toBeUndefined();
    });

    it('rejects a path whose only segment is __proto__', () => {
      const target: Record<string, unknown> = {};

      setPropertyByPath(target, '__proto__', { polluted: 'YES' });

      expect(({} as Record<string, unknown>).polluted).toBeUndefined();
      expect(Object.getPrototypeOf(target)).toBe(Object.prototype);
    });

    it('rejects a dangerous segment appearing at the leaf position', () => {
      const target: Record<string, unknown> = {};

      setPropertyByPath(target, 'a.__proto__', 'YES');

      expect(target).toEqual({});
    });

    it('rejects a dangerous segment appearing in the middle of a path', () => {
      const target: Record<string, unknown> = {};

      setPropertyByPath(target, 'a.constructor.b', 'YES');

      expect(target).toEqual({});
    });

    it('rejects the bare constructor segment', () => {
      const target: Record<string, unknown> = {};

      setPropertyByPath(target, 'constructor', 'YES');

      expect(target).toEqual({});
      expect(target.constructor).toBe(Object);
    });

    it('rejects the bare prototype segment', () => {
      const target: Record<string, unknown> = {};

      setPropertyByPath(target, 'prototype', 'YES');

      expect(target).toEqual({});
    });

    it('does not create partial intermediate objects when a later segment is forbidden', () => {
      const target: Record<string, unknown> = {};

      setPropertyByPath(target, 'safe.__proto__.polluted', 'YES');

      expect(target).toEqual({});
      expect('safe' in target).toBe(false);
    });

    it('returns the object unchanged when a path is rejected', () => {
      const target: Record<string, unknown> = { existing: 1 };

      const result = setPropertyByPath(target, '__proto__.polluted', 'YES');

      expect(result).toBe(target);
      expect(target).toEqual({ existing: 1 });
    });

    it('does not treat property names that merely contain a forbidden word as forbidden', () => {
      const target: Record<string, unknown> = {};

      setPropertyByPath(target, 'my__proto__field.constructorName', 'ok');

      expect(target).toEqual({
        my__proto__field: { constructorName: 'ok' },
      });
    });
  });
});
