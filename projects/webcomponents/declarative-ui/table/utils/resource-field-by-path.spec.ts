import type { PropertyField, Resource } from '@platform-mesh/portal-ui-lib/models';

vi.mock('jsonpath', () => {
  const query = vi.fn();
  return {
    __esModule: true,
    default: { query },
    query,
  };
});

describe('getResourceValueByJsonPath', () => {
  const mockResource: Resource = {
    metadata: { name: 'test-resource' },
    spec: { value: 'test-value', nested: { field: 'nested-value' } },
  } as any;

  let getResourceValueByJsonPath: (
    resource: Resource,
    field: {
      jsonPathExpression?: string;
      property?: string | string[];
      propertyField?: PropertyField;
    },
  ) => any;

  let encodeBase64: (s: string) => string;
  let decodeBase64: (s: string) => string;

  let jsonpath: any;

  beforeEach(async () => {
    vi.resetModules();

    const jp = await import('jsonpath');
    jsonpath = (jp as any).default ?? jp;

    const mod = await import('./resource-field-by-path');
    getResourceValueByJsonPath = mod.getResourceValueByJsonPath;
    encodeBase64 = mod.encodeBase64;
    decodeBase64 = mod.decodeBase64;

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('should return undefined when no property or jsonPathExpression is provided', () => {
    const result = getResourceValueByJsonPath(mockResource, {});
    expect(result).toBeUndefined();
  });

  it('should return undefined and log error when property is an array', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
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
    vi.mocked(jsonpath.query).mockReturnValue(['test-result']);

    const result = getResourceValueByJsonPath(mockResource, {
      jsonPathExpression: 'spec.value',
    });

    expect(jsonpath.query).toHaveBeenCalledWith(mockResource, '$.spec.value');
    expect(result).toBe('test-result');
  });

  it('should query resource using jsonPathExpression when "$." is already provided', () => {
    vi.mocked(jsonpath.query).mockReturnValue(['test-result']);

    const result = getResourceValueByJsonPath(mockResource, {
      jsonPathExpression: '$.spec.value',
    });

    expect(jsonpath.query).toHaveBeenCalledWith(mockResource, '$.spec.value');
    expect(result).toBe('test-result');
  });

  it('should query resource using property', () => {
    vi.mocked(jsonpath.query).mockReturnValue(['property-result']);

    const result = getResourceValueByJsonPath(mockResource, {
      property: 'metadata.name',
    });

    expect(jsonpath.query).toHaveBeenCalledWith(
      mockResource,
      '$.metadata.name',
    );
    expect(result).toBe('property-result');
  });

  it('should return undefined when query result is empty', () => {
    vi.mocked(jsonpath.query).mockReturnValue([]);

    const result = getResourceValueByJsonPath(mockResource, {
      property: 'nonexistent',
    });

    expect(result).toBeUndefined();
  });

  it('should apply propertyField transform when provided', () => {
    const mockValue = { key1: 'value1', key2: 'value2' };
    vi.mocked(jsonpath.query).mockReturnValue([mockValue]);

    const propertyField: PropertyField = {
      key: 'key1',
      transform: ['uppercase'],
    };

    const result = getResourceValueByJsonPath(mockResource, {
      property: 'spec.data',
      propertyField,
    });

    expect(result).toBe('VALUE1');
  });

  it('should handle none existing transform', () => {
    const mockValue = { text: 'hello world' };
    vi.mocked(jsonpath.query).mockReturnValue([mockValue]);

    const result = getResourceValueByJsonPath(mockResource, {
      property: 'spec.data',
      propertyField: { key: 'text', transform: ['notknown' as any] },
    });

    expect(result).toBe('hello world');
  });

  it('should handle uppercase transform', () => {
    const mockValue = { text: 'hello world' };
    vi.mocked(jsonpath.query).mockReturnValue([mockValue]);

    const result = getResourceValueByJsonPath(mockResource, {
      property: 'spec.data',
      propertyField: { key: 'text', transform: ['uppercase'] },
    });

    expect(result).toBe('HELLO WORLD');
  });

  it('should handle lowercase transform', () => {
    const mockValue = { text: 'HELLO WORLD' };
    vi.mocked(jsonpath.query).mockReturnValue([mockValue]);

    const result = getResourceValueByJsonPath(mockResource, {
      property: 'spec.data',
      propertyField: { key: 'text', transform: ['lowercase'] },
    });

    expect(result).toBe('hello world');
  });

  it('should handle capitalize transform', () => {
    const mockValue = { text: 'hello' };
    vi.mocked(jsonpath.query).mockReturnValue([mockValue]);

    const result = getResourceValueByJsonPath(mockResource, {
      property: 'spec.data',
      propertyField: { key: 'text', transform: ['capitalize'] },
    });

    expect(result).toBe('Hello');
  });

  it('should handle multiple transforms', () => {
    const mockValue = { text: 'HELLO WORLD' };
    vi.mocked(jsonpath.query).mockReturnValue([mockValue]);

    const result = getResourceValueByJsonPath(mockResource, {
      property: 'spec.data',
      propertyField: { key: 'text', transform: ['lowercase', 'capitalize'] },
    });

    expect(result).toBe('Hello world');
  });

  it('should handle encode transform', () => {
    const mockValue = { text: 'test' };
    vi.mocked(jsonpath.query).mockReturnValue([mockValue]);

    const result = getResourceValueByJsonPath(mockResource, {
      property: 'spec.data',
      propertyField: { key: 'text', transform: ['encode'] },
    });

    expect(result).toBe(encodeBase64('test'));
  });

  it('should return original value when encode transform fails', () => {
    vi.spyOn(globalThis, 'btoa').mockImplementation(() => {
      throw new Error('btoa error');
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const mockValue = { text: 'test-value' };
    vi.mocked(jsonpath.query).mockReturnValue([mockValue]);

    const result = getResourceValueByJsonPath(mockResource, {
      property: 'spec.data',
      propertyField: { key: 'text', transform: ['encode'] },
    });

    expect(result).toBe('test-value');
  });

  it('should handle decode transform', () => {
    const encoded = encodeBase64('test');
    const mockValue = { text: encoded };
    vi.mocked(jsonpath.query).mockReturnValue([mockValue]);

    const result = getResourceValueByJsonPath(mockResource, {
      property: 'spec.data',
      propertyField: { key: 'text', transform: ['decode'] },
    });

    expect(result).toBe('test');
  });

  it('should return original value when transform fails', () => {
    const mockValue = { text: 'invalid-base64!!!' };
    vi.mocked(jsonpath.query).mockReturnValue([mockValue]);

    const result = getResourceValueByJsonPath(mockResource, {
      property: 'spec.data',
      propertyField: { key: 'text', transform: ['decode'] },
    });

    expect(result).toBe('invalid-base64!!!');
  });

  it('should handle null value in transform', () => {
    const mockValue = { text: null };
    vi.mocked(jsonpath.query).mockReturnValue([mockValue]);

    const result = getResourceValueByJsonPath(mockResource, {
      property: 'spec.data',
      propertyField: { key: 'text', transform: ['uppercase'] },
    });

    expect(result).toBeNull();
  });

  it('should handle undefined value in transform', () => {
    const mockValue = { text: undefined };
    vi.mocked(jsonpath.query).mockReturnValue([mockValue]);

    const result = getResourceValueByJsonPath(mockResource, {
      property: 'spec.data',
      propertyField: { key: 'text', transform: ['uppercase'] },
    });

    expect(result).toBeUndefined();
  });

  it('should return value when no transform is provided', () => {
    const mockValue = { text: 'no-transform' };
    vi.mocked(jsonpath.query).mockReturnValue([mockValue]);

    const result = getResourceValueByJsonPath(mockResource, {
      property: 'spec.data',
      propertyField: { key: 'text' },
    });

    expect(result).toBe('no-transform');
  });

  it('should return value when transform is empty array', () => {
    const mockValue = { text: 'empty-transform' };
    vi.mocked(jsonpath.query).mockReturnValue([mockValue]);

    const result = getResourceValueByJsonPath(mockResource, {
      property: 'spec.data',
      propertyField: { key: 'text', transform: [] },
    });

    expect(result).toBe('empty-transform');
  });
});

describe('encodeBase64', () => {
  let encodeBase64: (s: string) => string;
  let decodeBase64: (s: string) => string;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('./resource-field-by-path');
    encodeBase64 = mod.encodeBase64;
    decodeBase64 = mod.decodeBase64;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

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
  });

  it('should log error when encoding fails', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(globalThis, 'btoa').mockImplementation(() => {
      throw new Error('btoa error');
    });

    try {
      encodeBase64('test');
    } catch {}

    expect(consoleSpy).toHaveBeenCalledWith(
      'Base64 encoding failed:',
      expect.any(Error),
    );
  });
});

describe('decodeBase64', () => {
  let encodeBase64: (s: string) => string;
  let decodeBase64: (s: string) => string;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('./resource-field-by-path');
    encodeBase64 = mod.encodeBase64;
    decodeBase64 = mod.decodeBase64;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

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
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      decodeBase64('invalid!!!');
    } catch {}

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
