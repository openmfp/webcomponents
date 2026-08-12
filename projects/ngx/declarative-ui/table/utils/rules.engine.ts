import { CssRule, RuleCondition, ValueRule } from '../../models';

export const parseStringValue = (value: string) => {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  if (!isNaN(Number(value))) {
    return Number(value);
  }

  return value;
};

interface ConditionRule {
  if: { condition: RuleCondition; value: string };
}

export const ruleResolver = (
  rule: ConditionRule,
  resourceValue: string,
): boolean => {
  const parsedResouceValue = parseStringValue(resourceValue);
  const parsedConditionValue = parseStringValue(rule.if.value);

  switch (rule.if.condition) {
    case 'equals':
      return parsedResouceValue === parsedConditionValue;
    case 'notEquals':
      return parsedResouceValue !== parsedConditionValue;
    case 'greaterThan':
      return parsedResouceValue > parsedConditionValue;
    case 'greaterThanOrEqual':
      return parsedResouceValue >= parsedConditionValue;
    case 'lessThan':
      return parsedResouceValue < parsedConditionValue;
    case 'lessThanOrEqual':
      return parsedResouceValue <= parsedConditionValue;
    case 'contains':
      if (Array.isArray(parsedResouceValue)) {
        return parsedResouceValue.includes(parsedConditionValue);
      } else if (
        typeof parsedResouceValue === 'string' &&
        typeof parsedConditionValue === 'string'
      ) {
        return parsedResouceValue.includes(parsedConditionValue);
      }

      return false;
  }
  return false;
};

export const evaluateCssRules = (
  value: string,
  rules?: CssRule[],
): Partial<CSSStyleDeclaration> => {
  if (!rules) {
    return {};
  }

  return rules.reduce((acc, rule) => {
    const result = ruleResolver(rule, value);
    if (result) {
      return { ...acc, ...rule.styles };
    }
    return acc;
  }, {});
};

export const evaluateValueRules = (
  value: string,
  rules?: ValueRule[],
): string => {
  if (!rules) return value;
  for (const rule of rules) {
    if (ruleResolver(rule, value)) return rule.then;
  }
  return value;
};
