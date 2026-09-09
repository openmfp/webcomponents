import { GenericResource, PropertyField, TransformType } from '../../models';
import {
  decodeBase64,
  encodeBase64,
  getResourceValueByJsonPath,
  resolveLinkTemplate,
} from './resource-field-by-path';

const mockResource = {
  id: 'mock-1',
  metadata: { name: 'test-resource' },
  spec: { value: 'test-value', nested: { field: 'nested-value' } },
} satisfies GenericResource;

describe('getResourceValueByJsonPath', () => {
  it('should return undefined when no property or jsonPathExpression is provided', () => {
    const result = getResourceValueByJsonPath(mockResource, {});
    expect(result).toBeUndefined();
  });

  it('should return undefined and log error when property is an array', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      /* noop */
    });
    const result = getResourceValueByJsonPath(mockResource, {
      property: ['path1', 'path2'],
    });

    expect(result).toBeUndefined();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Property defined as an array'),
    );
    consoleSpy.mockRestore();
  });

  it('should query resource using jsonPathExpression', () => {
    const result = getResourceValueByJsonPath(mockResource, {
      jsonPathExpression: 'spec.value',
    });

    expect(result).toBe('test-value');
  });

  it('should query resource using jsonPathExpression when "$." is already provided', () => {
    const result = getResourceValueByJsonPath(mockResource, {
      jsonPathExpression: '$.spec.value',
    });

    expect(result).toBe('test-value');
  });

  it('should query resource using property', () => {
    const result = getResourceValueByJsonPath(mockResource, {
      property: 'metadata.name',
    });

    expect(result).toBe('test-resource');
  });

  it('should return undefined when query result is empty', () => {
    const result = getResourceValueByJsonPath(mockResource, {
      property: 'nonexistent',
    });

    expect(result).toBeUndefined();
  });

  it('should apply propertyField transform when provided', () => {
    const resource = {
      spec: { data: { key1: 'value1', key2: 'value2' } },
    } as unknown as GenericResource;

    const propertyField: PropertyField = {
      key: 'key1',
      transform: ['uppercase'],
    };

    const result = getResourceValueByJsonPath(resource, {
      property: 'spec.data',
      propertyField,
    });

    expect(result).toBe('VALUE1');
  });

  it('should handle none existing transform', () => {
    const resource = {
      spec: { data: { text: 'hello world' } },
    } as unknown as GenericResource;

    const result = getResourceValueByJsonPath(resource, {
      property: 'spec.data',
      propertyField: { key: 'text', transform: ['notknown' as TransformType] },
    });

    expect(result).toBe('hello world');
  });

  it('should handle uppercase transform', () => {
    const resource = {
      spec: { data: { text: 'hello world' } },
    } as unknown as GenericResource;

    const result = getResourceValueByJsonPath(resource, {
      property: 'spec.data',
      propertyField: { key: 'text', transform: ['uppercase'] },
    });

    expect(result).toBe('HELLO WORLD');
  });

  it('should handle lowercase transform', () => {
    const resource = {
      spec: { data: { text: 'HELLO WORLD' } },
    } as unknown as GenericResource;

    const result = getResourceValueByJsonPath(resource, {
      property: 'spec.data',
      propertyField: { key: 'text', transform: ['lowercase'] },
    });

    expect(result).toBe('hello world');
  });

  it('should handle capitalize transform', () => {
    const resource = {
      spec: { data: { text: 'hello' } },
    } as unknown as GenericResource;

    const result = getResourceValueByJsonPath(resource, {
      property: 'spec.data',
      propertyField: { key: 'text', transform: ['capitalize'] },
    });

    expect(result).toBe('Hello');
  });

  it('should handle multiple transforms', () => {
    const resource = {
      spec: { data: { text: 'HELLO WORLD' } },
    } as unknown as GenericResource;

    const result = getResourceValueByJsonPath(resource, {
      property: 'spec.data',
      propertyField: { key: 'text', transform: ['lowercase', 'capitalize'] },
    });

    expect(result).toBe('Hello world');
  });

  it('should handle encode transform', () => {
    const resource = {
      spec: { data: { text: 'test' } },
    } as unknown as GenericResource;

    const result = getResourceValueByJsonPath(resource, {
      property: 'spec.data',
      propertyField: { key: 'text', transform: ['encode'] },
    });

    expect(result).toBe(encodeBase64('test'));
  });

  it('should return original value when encode transform fails', () => {
    vi.spyOn(globalThis, 'btoa').mockImplementation(() => {
      throw new Error('btoa error');
    });
    vi.spyOn(console, 'error').mockImplementation(() => {
      /* noop */
    });

    const resource = {
      spec: { data: { text: 'test-value' } },
    } as unknown as GenericResource;

    const result = getResourceValueByJsonPath(resource, {
      property: 'spec.data',
      propertyField: { key: 'text', transform: ['encode'] },
    });

    expect(result).toBe('test-value');
    vi.restoreAllMocks();
  });

  it('should handle decode transform', () => {
    const encoded = encodeBase64('test');
    const resource = {
      spec: { data: { text: encoded } },
    } as unknown as GenericResource;

    const result = getResourceValueByJsonPath(resource, {
      property: 'spec.data',
      propertyField: { key: 'text', transform: ['decode'] },
    });

    expect(result).toBe('test');
  });

  it('should return original value when transform fails', () => {
    const resource = {
      spec: { data: { text: 'invalid-base64!!!' } },
    } as unknown as GenericResource;

    const result = getResourceValueByJsonPath(resource, {
      property: 'spec.data',
      propertyField: { key: 'text', transform: ['decode'] },
    });

    expect(result).toBe('invalid-base64!!!');
  });

  it('should handle null value in transform', () => {
    const resource = {
      spec: { data: { text: null } },
    } as unknown as GenericResource;

    const result = getResourceValueByJsonPath(resource, {
      property: 'spec.data',
      propertyField: { key: 'text', transform: ['uppercase'] },
    });

    expect(result).toBeNull();
  });

  it('should handle undefined value in transform', () => {
    const resource = {
      spec: { data: { text: undefined } },
    } as unknown as GenericResource;

    const result = getResourceValueByJsonPath(resource, {
      property: 'spec.data',
      propertyField: { key: 'text', transform: ['uppercase'] },
    });

    expect(result).toBeUndefined();
  });

  it('should return value when no transform is provided', () => {
    const resource = {
      spec: { data: { text: 'no-transform' } },
    } as unknown as GenericResource;

    const result = getResourceValueByJsonPath(resource, {
      property: 'spec.data',
      propertyField: { key: 'text' },
    });

    expect(result).toBe('no-transform');
  });

  it('should return value when transform is empty array', () => {
    const resource = {
      spec: { data: { text: 'empty-transform' } },
    } as unknown as GenericResource;

    const result = getResourceValueByJsonPath(resource, {
      property: 'spec.data',
      propertyField: { key: 'text', transform: [] },
    });

    expect(result).toBe('empty-transform');
  });
});

describe('encodeBase64', () => {
  it('should encode simple ASCII string', () => {
    const result = encodeBase64('hello');
    expect(result).toBe('aGVsbG8=');
  });

  it('should encode UTF-8 string with special characters', () => {
    const result = encodeBase64('Hello, 世界');
    expect(decodeBase64(result)).toBe('Hello, 世界');
  });

  it('should encode emojis', () => {
    const result = encodeBase64('👍🎉');
    expect(decodeBase64(result)).toBe('👍🎉');
  });

  it('should encode empty string', () => {
    const result = encodeBase64('');
    expect(result).toBe('');
  });

  it('should throw error when encoding fails', () => {
    vi.spyOn(globalThis, 'btoa').mockImplementation(() => {
      throw new Error('btoa error');
    });

    expect(() => encodeBase64('test')).toThrow(
      'Failed to encode string to Base64',
    );
    vi.restoreAllMocks();
  });

  it('should log error when encoding fails', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      /* noop */
    });
    vi.spyOn(globalThis, 'btoa').mockImplementation(() => {
      throw new Error('btoa error');
    });

    try {
      encodeBase64('test');
    } catch {
      /* expected to throw */
    }

    expect(consoleSpy).toHaveBeenCalledWith(
      'Base64 encoding failed:',
      expect.any(Error),
    );
    vi.restoreAllMocks();
  });
});

describe('decodeBase64', () => {
  it('should decode simple ASCII string', () => {
    const result = decodeBase64('aGVsbG8=');
    expect(result).toBe('hello');
  });

  it('should decode UTF-8 string with special characters', () => {
    const encoded = encodeBase64('Hello, 世界');
    const result = decodeBase64(encoded);
    expect(result).toBe('Hello, 世界');
  });

  it('should decode emojis', () => {
    const encoded = encodeBase64('👍🎉');
    const result = decodeBase64(encoded);
    expect(result).toBe('👍🎉');
  });

  it('should decode empty string', () => {
    const result = decodeBase64('');
    expect(result).toBe('');
  });

  it('should throw error for invalid base64', () => {
    expect(() => decodeBase64('invalid!!!')).toThrow(
      'Failed to decode Base64 string',
    );
  });

  it('should log error when decoding fails', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      /* noop */
    });

    try {
      decodeBase64('invalid!!!');
    } catch {
      /* expected to throw */
    }

    expect(consoleSpy).toHaveBeenCalledWith(
      'Base64 decoding failed:',
      expect.any(Error),
    );

    consoleSpy.mockRestore();
  });

  it('should handle round-trip encoding and decoding', () => {
    const original = 'Test string with 特殊字符 and emojis 🚀';
    const encoded = encodeBase64(original);
    const decoded = decodeBase64(encoded);
    expect(decoded).toBe(original);
  });
});

describe('resolveLinkTemplate', () => {
  it('replaces a single placeholder with the resolved resource value', () => {
    const resource = {
      metadata: { name: 'foo' },
    } as unknown as GenericResource;
    const result = resolveLinkTemplate('/{{metadata.name}}/accounts', resource);
    expect(result).toBe('/foo/accounts');
  });

  it('replaces multiple placeholders in a single template', () => {
    const resource = {
      metadata: { namespace: 'prod', name: 'my-app' },
    } as unknown as GenericResource;
    const result = resolveLinkTemplate(
      '/{{metadata.namespace}}/{{metadata.name}}/detail',
      resource,
    );
    expect(result).toBe('/prod/my-app/detail');
  });

  it('substitutes an empty string for an unresolvable path', () => {
    const resource = {
      metadata: { name: 'foo' },
    } as unknown as GenericResource;
    const result = resolveLinkTemplate(
      '/{{metadata.missing}}/accounts',
      resource,
    );
    expect(result).toBe('//accounts');
  });

  it('returns a string with all placeholders empty when resource is undefined', () => {
    const result = resolveLinkTemplate(
      '/{{metadata.name}}/accounts',
      undefined,
    );
    expect(result).toBe('//accounts');
  });

  it('handles whitespace inside the placeholder delimiters', () => {
    const resource = {
      metadata: { name: 'bar' },
    } as unknown as GenericResource;
    const result = resolveLinkTemplate('/{{ metadata.name }}/detail', resource);
    expect(result).toBe('/bar/detail');
  });

  it('returns the template unchanged when it contains no placeholders', () => {
    const resource = {
      metadata: { name: 'foo' },
    } as unknown as GenericResource;
    const result = resolveLinkTemplate('/static/path', resource);
    expect(result).toBe('/static/path');
  });

  it('handles an empty template string', () => {
    const resource = {
      metadata: { name: 'foo' },
    } as unknown as GenericResource;
    const result = resolveLinkTemplate('', resource);
    expect(result).toBe('');
  });

  it('substitutes an empty string when the resolved value is null', () => {
    const resource = {
      metadata: { name: null },
    } as unknown as GenericResource;
    const result = resolveLinkTemplate('/{{metadata.name}}/detail', resource);
    expect(result).toBe('//detail');
  });
});
