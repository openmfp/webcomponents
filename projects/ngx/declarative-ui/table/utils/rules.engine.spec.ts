import { CssRule, RuleCondition, ValueRule } from '../../models';
import {
  evaluateCssRules,
  evaluateValueRules,
  parseStringValue,
  ruleResolver,
} from './rules.engine';

describe('rules.engine', () => {
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

  describe('ruleResolver', () => {
    it('handles equality and inequality comparisons', () => {
      const equalsRule: CssRule = {
        if: { condition: 'equals', value: '10' },
        styles: {},
      };
      const notEqualsRule: CssRule = {
        if: { condition: 'notEquals', value: 'off' },
        styles: {},
      };

      expect(ruleResolver(equalsRule, '10')).toBe(true);
      expect(ruleResolver(notEqualsRule, 'on')).toBe(true);
      expect(ruleResolver(notEqualsRule, 'off')).toBe(false);
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

      expect(ruleResolver(greaterThanRule, '5')).toBe(true);
      expect(ruleResolver(greaterThanOrEqualRule, '3')).toBe(true);
      expect(ruleResolver(lessThanRule, '2')).toBe(true);
      expect(ruleResolver(lessThanOrEqualRule, '3')).toBe(true);
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

      expect(ruleResolver(stringContainsRule, 'hello world')).toBe(true);
      expect(
        ruleResolver(arrayContainsRule, ['blue', 'green'] as unknown as string),
      ).toBe(true);
      expect(ruleResolver(stringContainsRule, 'hello')).toBe(false);
    });

    it('returns false for contains when value is not string or array', () => {
      const rule: CssRule = {
        if: { condition: 'contains', value: '2' },
        styles: {},
      };

      expect(ruleResolver(rule, '123')).toBe(false);
    });

    it('returns false for unsupported conditions', () => {
      const rule: CssRule = {
        if: { condition: 'unknown' as RuleCondition, value: 'x' },
        styles: {},
      };

      expect(ruleResolver(rule, 'value')).toBe(false);
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

  describe('evaluateValueRules', () => {
    it('returns the original value when rules is undefined', () => {
      expect(evaluateValueRules('Active', undefined)).toBe('Active');
    });

    it('returns the original value when rules is an empty array', () => {
      expect(evaluateValueRules('Active', [])).toBe('Active');
    });

    it('returns the first matching rule then (first-match-wins)', () => {
      const rules: ValueRule[] = [
        { if: { condition: 'equals', value: 'x' }, then: 'First' },
        { if: { condition: 'equals', value: 'x' }, then: 'Second' },
      ];

      expect(evaluateValueRules('x', rules)).toBe('First');
    });

    it('returns the original value when no rule matches', () => {
      const rules: ValueRule[] = [
        { if: { condition: 'equals', value: 'Running' }, then: 'Active' },
      ];

      expect(evaluateValueRules('Pending', rules)).toBe('Pending');
    });

    it('maps activity-score ranges to labels', () => {
      const rules: ValueRule[] = [
        { if: { condition: 'lessThan', value: '20' }, then: 'Low' },
        { if: { condition: 'lessThan', value: '60' }, then: 'Medium' },
        { if: { condition: 'greaterThanOrEqual', value: '60' }, then: 'High' },
      ];

      expect(evaluateValueRules('10', rules)).toBe('Low');
      expect(evaluateValueRules('35', rules)).toBe('Medium');
      expect(evaluateValueRules('72', rules)).toBe('High');
    });
  });
});
