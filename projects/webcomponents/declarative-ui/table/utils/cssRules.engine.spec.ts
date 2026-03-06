import {
  cssRuleResolver,
  evaluateCssRules,
  parseStringValue,
} from './cssRules.engine';
import { CssRule } from '@platform-mesh/portal-ui-lib/models/models';

describe('cssRules.engine', () => {
  describe('parseStringValue', () => {
    it('returns boolean for true and false strings', () => {
      expect(parseStringValue('true')).toBe(true);
      expect(parseStringValue('false')).toBe(false);
    });

    it('returns number for numeric strings', () => {
      expect(parseStringValue('42')).toBe(42);
    });

    it('returns original string when not boolean or number', () => {
      expect(parseStringValue('text')).toBe('text');
    });
  });

  describe('cssRuleResolver', () => {
    it('handles equality and inequality comparisons', () => {
      const equalsRule: CssRule = {
        if: { condition: 'equals', value: '10' },
        styles: {},
      };
      const notEqualsRule: CssRule = {
        if: { condition: 'notEquals', value: 'off' },
        styles: {},
      };

      expect(cssRuleResolver(equalsRule, '10')).toBe(true);
      expect(cssRuleResolver(notEqualsRule, 'on')).toBe(true);
      expect(cssRuleResolver(notEqualsRule, 'off')).toBe(false);
    });

    it('handles numeric comparisons', () => {
      const greaterThanRule: CssRule = {
        if: { condition: 'greaterThan', value: '3' },
        styles: {},
      };
      const greaterThanOrEqualRule: CssRule = {
        if: { condition: 'greaterThanOrEqual', value: '3' },
        styles: {},
      };
      const lessThanRule: CssRule = {
        if: { condition: 'lessThan', value: '3' },
        styles: {},
      };
      const lessThanOrEqualRule: CssRule = {
        if: { condition: 'lessThanOrEqual', value: '3' },
        styles: {},
      };

      expect(cssRuleResolver(greaterThanRule, '5')).toBe(true);
      expect(cssRuleResolver(greaterThanOrEqualRule, '3')).toBe(true);
      expect(cssRuleResolver(lessThanRule, '2')).toBe(true);
      expect(cssRuleResolver(lessThanOrEqualRule, '3')).toBe(true);
    });

    it('checks containment for strings and arrays', () => {
      const stringContainsRule: CssRule = {
        if: { condition: 'contains', value: 'world' },
        styles: {},
      };
      const arrayContainsRule: CssRule = {
        if: { condition: 'contains', value: 'green' },
        styles: {},
      };

      expect(cssRuleResolver(stringContainsRule, 'hello world')).toBe(true);
      expect(
        cssRuleResolver(arrayContainsRule, [
          'blue',
          'green',
        ] as unknown as string),
      ).toBe(true);
      expect(cssRuleResolver(stringContainsRule, 'hello')).toBe(false);
    });

    it('returns false for contains when value is not string or array', () => {
      const rule: CssRule = {
        if: { condition: 'contains', value: '2' },
        styles: {},
      };

      expect(cssRuleResolver(rule, '123')).toBe(false);
    });

    it('returns false for unsupported conditions', () => {
      const rule: CssRule = {
        if: { condition: 'unknown' as any, value: 'x' },
        styles: {},
      };

      expect(cssRuleResolver(rule, 'value')).toBe(false);
    });
  });

  describe('evaluateCssRules', () => {
    it('returns empty object when rules are missing', () => {
      expect(evaluateCssRules('value', undefined)).toEqual({});
    });

    it('applies styles for matching rules only', () => {
      const rules: CssRule[] = [
        {
          if: { condition: 'equals', value: 'active' },
          styles: { color: 'green' },
        },
        {
          if: { condition: 'notEquals', value: 'active' },
          styles: { color: 'red', fontWeight: '700' },
        },
      ];

      expect(evaluateCssRules('active', rules)).toEqual({ color: 'green' });
    });

    it('merges styles from multiple matching rules', () => {
      const rules: CssRule[] = [
        {
          if: { condition: 'equals', value: 'ok' },
          styles: { color: 'blue' },
        },
        {
          if: { condition: 'contains', value: 'o' },
          styles: { backgroundColor: 'yellow' },
        },
        {
          if: { condition: 'notEquals', value: 'fail' },
          styles: { borderColor: 'black' },
        },
      ];

      expect(evaluateCssRules('ok', rules)).toEqual({
        color: 'blue',
        backgroundColor: 'yellow',
        borderColor: 'black',
      });
    });
  });
});
