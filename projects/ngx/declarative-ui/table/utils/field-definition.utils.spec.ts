import { getFieldValue } from './field-definition.utils';
import { FieldDefinition } from '../models';

describe('field-definition.utils', () => {
  describe('getFieldValue', () => {
    it('returns resource property value when resource is provided', () => {
      const field: FieldDefinition = { property: 'name' };
      expect(getFieldValue(field, { name: 'Alice' })).toBe('Alice');
    });

    it('returns nested property via jsonpath dot notation', () => {
      const field: FieldDefinition = { property: 'metadata.name' };
      expect(getFieldValue(field, { metadata: { name: 'test' } })).toBe('test');
    });

    it('returns empty string when property resolves to empty string', () => {
      const field: FieldDefinition = { property: 'metadata.name', value: 'fallback' };
      expect(getFieldValue(field, { metadata: { name: '' } })).toBe('');
    });

    it('returns falsy value (false) over field.value fallback', () => {
      const field: FieldDefinition = { property: 'spec.enabled', value: 'default' };
      expect(getFieldValue(field, { spec: { enabled: false } })).toBe(false);
    });

    it('falls back to field.value when resource property is undefined', () => {
      const field: FieldDefinition = { property: 'missing', value: 'fallback' };
      expect(getFieldValue(field, {})).toBe('fallback');
    });

    it('returns field.value when resource is undefined', () => {
      const field: FieldDefinition = { property: 'name', value: 'static' };
      expect(getFieldValue(field, undefined)).toBe('static');
    });

    it('returns undefined when field.value is undefined and resource is undefined', () => {
      const field: FieldDefinition = { property: 'name' };
      expect(getFieldValue(field, undefined)).toBeUndefined();
    });

    it('returns empty string field.value when resource is undefined', () => {
      const field: FieldDefinition = { property: 'name', value: '' };
      expect(getFieldValue(field, undefined)).toBe('');
    });

    it('returns complex object as field.value', () => {
      const complexValue = { nested: { data: 'value' } };
      const field: FieldDefinition = { property: 'spec.config', value: complexValue as unknown as string };
      expect(getFieldValue(field, undefined)).toEqual(complexValue);
    });

    it('returns array as field.value', () => {
      const arrayValue = ['item1', 'item2'];
      const field: FieldDefinition = { property: 'spec.items', value: arrayValue as unknown as string };
      expect(getFieldValue(field, undefined)).toEqual(arrayValue);
    });
  });
});
