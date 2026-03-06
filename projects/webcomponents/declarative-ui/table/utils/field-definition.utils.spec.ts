import { executeButtonAction, getFieldValue } from './field-definition.utils';
import { FieldDefinition, Resource } from '@platform-mesh/portal-ui-lib/models';

const getResourceValueByJsonPathMock = vi.fn();

vi.mock('@platform-mesh/portal-ui-lib/utils', () => ({
  getResourceValueByJsonPath: getResourceValueByJsonPathMock,
}));

describe('field-definition.utils', () => {
  let mockLuigiClient: any;
  let mockLinkManager: any;

  beforeEach(() => {
    mockLinkManager = {
      navigate: vi.fn(),
      openAsModal: vi.fn(),
    };

    mockLuigiClient = {
      linkManager: vi.fn().mockReturnValue(mockLinkManager),
    } as any;

    vi.clearAllMocks();
  });

  describe('getFieldValue', () => {
    it('should return value from resource using jsonPath when resource exists', () => {
      const field: FieldDefinition = {
        property: 'metadata.name',
        value: 'default-value',
      };
      const resource: Resource = {
        id: 'resource-name',
        metadata: { name: 'resource-name' },
      };

      const result = getFieldValue(field, resource);

      expect(result).toBe('resource-name');
    });

    it('should return according to indicated property', () => {
      const field: FieldDefinition = {
        property: 'metadata.name',
        value: 'fallback-value',
      };
      const resource: Resource = {
        metadata: { name: '' },
      };

      const result = getFieldValue(field, resource);

      expect(result).toBe('');
    });

    it('should return field.value when resource is undefined', () => {
      const field: FieldDefinition = {
        property: 'metadata.name',
        value: 'static-value',
      };

      const result = getFieldValue(field, undefined);

      expect(result).toBe('static-value');
      expect(getResourceValueByJsonPathMock).not.toHaveBeenCalled();
    });

    it('should return field.value when resource is null', () => {
      const field: FieldDefinition = {
        property: 'metadata.name',
        value: 'static-value',
      };

      const result = getFieldValue(field, null as any);

      expect(result).toBe('static-value');
      expect(getResourceValueByJsonPathMock).not.toHaveBeenCalled();
    });

    it('should return undefined when field.value is undefined and resource is undefined', () => {
      const field: FieldDefinition = {
        property: 'metadata.name',
      };

      const result = getFieldValue(field, undefined);

      expect(result).toBeUndefined();
    });

    it('should return empty string when field.value is empty string', () => {
      const field: FieldDefinition = {
        property: 'metadata.name',
        value: '',
      };

      const result = getFieldValue(field, undefined);

      expect(result).toBe('');
    });

    it('should prefer jsonPath value over field.value when jsonPath returns falsy but not null/undefined', () => {
      const field: FieldDefinition = {
        property: 'spec.enabled',
        value: 'default',
      };
      const resource: Resource = {
        id: 'test',
        metadata: { name: 'test' },
        spec: { enabled: false } as any,
      };

      getResourceValueByJsonPathMock.mockReturnValue(false);

      const result = getFieldValue(field, resource);

      expect(result).toBe(false);
    });

    it('should handle complex object as field value', () => {
      const complexValue = { nested: { data: 'value' } };
      const field: FieldDefinition = {
        property: 'spec.config',
        value: complexValue as any,
      };

      const result = getFieldValue(field, undefined);

      expect(result).toEqual(complexValue);
    });

    it('should handle array as field value', () => {
      const arrayValue = ['item1', 'item2', 'item3'];
      const field: FieldDefinition = {
        property: 'spec.items',
        value: arrayValue as any,
      };

      const result = getFieldValue(field, undefined);

      expect(result).toEqual(arrayValue);
    });
  });

  describe('executeButtonAction', () => {
    it('should navigate when action is navigate', () => {
      const field: FieldDefinition = {
        value: '/path/to/resource',
        uiSettings: {
          buttonSettings: {
            action: 'navigate',
          },
        },
      };
      const resource: Resource = {
        id: 'resource-name',
        metadata: { name: 'test-resource' },
      };

      getResourceValueByJsonPathMock.mockReturnValue('/path/to/resource');

      executeButtonAction(mockLuigiClient, field, resource);

      expect(mockLuigiClient.linkManager).toHaveBeenCalled();
      expect(mockLinkManager.navigate).toHaveBeenCalledWith(
        '/path/to/resource',
      );
    });

    it('should navigate with field.value when resource is undefined', () => {
      const field: FieldDefinition = {
        property: 'metadata.name',
        value: '/static/path',
        uiSettings: {
          buttonSettings: {
            action: 'navigate',
          },
        },
      };

      executeButtonAction(mockLuigiClient, field, undefined);

      expect(mockLinkManager.navigate).toHaveBeenCalledWith('/static/path');
    });

    it('should openAsModal when action is openInModal', () => {
      const field: FieldDefinition = {
        property: 'spec.modalPath',
        value: '/modal/path',
        uiSettings: {
          buttonSettings: {
            action: 'openInModal',
            modalSettings: {
              title: 'Test Modal',
              size: 'l',
            },
          },
        },
      };
      const resource: Resource = {
        metadata: { name: 'test' },
        spec: { modalPath: '/modal/path' } as any,
      };

      getResourceValueByJsonPathMock.mockReturnValue('/modal/path');

      executeButtonAction(mockLuigiClient, field, resource);

      expect(mockLuigiClient.linkManager).toHaveBeenCalled();
      expect(mockLinkManager.openAsModal).toHaveBeenCalledWith('/modal/path', {
        title: 'Test Modal',
        size: 'l',
      });
    });

    it('should openAsModal with all modal settings', () => {
      const field: FieldDefinition = {
        value: '/modal/path',
        uiSettings: {
          buttonSettings: {
            action: 'openInModal',
            modalSettings: {
              title: 'Full Modal',
              size: 'fullscreen',
              width: '800px',
              height: '600px',
            },
          },
        },
      };

      executeButtonAction(mockLuigiClient, field, undefined);

      expect(mockLinkManager.openAsModal).toHaveBeenCalledWith('/modal/path', {
        title: 'Full Modal',
        size: 'fullscreen',
        width: '800px',
        height: '600px',
      });
    });

    it('should openAsModal with undefined modalSettings', () => {
      const field: FieldDefinition = {
        value: '/modal/path',
        uiSettings: {
          buttonSettings: {
            action: 'openInModal',
          },
        },
      };

      executeButtonAction(mockLuigiClient, field, undefined);

      expect(mockLinkManager.openAsModal).toHaveBeenCalledWith(
        '/modal/path',
        undefined,
      );
    });

    it('should throw error when buttonSettings is missing', () => {
      const field: FieldDefinition = {
        value: '/path',
        label: 'Test Button',
        uiSettings: {},
      };

      expect(() => {
        executeButtonAction(mockLuigiClient, field, undefined);
      }).toThrow('Missing button action for field "Test Button"');
    });

    it('should throw error when action is missing', () => {
      const field: FieldDefinition = {
        value: '/path',
        property: 'metadata.link',
        uiSettings: {
          buttonSettings: {} as any,
        },
      };

      expect(() => {
        executeButtonAction(mockLuigiClient, field, undefined);
      }).toThrow('Missing button action for field "metadata.link"');
    });

    it('should throw error when action is undefined', () => {
      const field: FieldDefinition = {
        value: '/path',
        label: 'My Button',
        uiSettings: {
          buttonSettings: {
            action: undefined as any,
          },
        },
      };

      expect(() => {
        executeButtonAction(mockLuigiClient, field, undefined);
      }).toThrow('Missing button action for field "My Button"');
    });

    it('should throw error when action is null', () => {
      const field: FieldDefinition = {
        value: '/path',
        property: 'spec.action',
        uiSettings: {
          buttonSettings: {
            action: null as any,
          },
        },
      };

      expect(() => {
        executeButtonAction(mockLuigiClient, field, undefined);
      }).toThrow('Missing button action for field "spec.action"');
    });

    it('should throw error when uiSettings is undefined', () => {
      const field: FieldDefinition = {
        value: '/path',
        label: 'Test',
      };

      expect(() => {
        executeButtonAction(mockLuigiClient, field, undefined);
      }).toThrow('Missing button action for field "Test"');
    });

    it('should throw error when path is empty string', () => {
      const field: FieldDefinition = {
        value: '',
        label: 'Empty Path Button',
        uiSettings: {
          buttonSettings: {
            action: 'navigate',
          },
        },
      };

      expect(() => {
        executeButtonAction(mockLuigiClient, field, undefined);
      }).toThrow(
        'Missing or invalid button path for field "Empty Path Button"',
      );
    });

    it('should throw error when path is whitespace only', () => {
      const field: FieldDefinition = {
        value: '   ',
        property: 'metadata.path',
        uiSettings: {
          buttonSettings: {
            action: 'navigate',
          },
        },
      };

      expect(() => {
        executeButtonAction(mockLuigiClient, field, undefined);
      }).toThrow('Missing or invalid button path for field "metadata.path"');
    });

    it('should throw error when path is not a string', () => {
      const field: FieldDefinition = {
        value: 123 as any,
        label: 'Numeric Path',
        uiSettings: {
          buttonSettings: {
            action: 'navigate',
          },
        },
      };

      expect(() => {
        executeButtonAction(mockLuigiClient, field, undefined);
      }).toThrow('Missing or invalid button path for field "Numeric Path"');
    });

    it('should throw error when path is undefined', () => {
      const field: FieldDefinition = {
        property: 'metadata.link',
        uiSettings: {
          buttonSettings: {
            action: 'navigate',
          },
        },
      };

      expect(() => {
        executeButtonAction(mockLuigiClient, field, undefined);
      }).toThrow('Missing or invalid button path for field "metadata.link"');
    });

    it('should throw error when path is null', () => {
      const field: FieldDefinition = {
        value: null as any,
        label: 'Null Path',
        uiSettings: {
          buttonSettings: {
            action: 'navigate',
          },
        },
      };

      expect(() => {
        executeButtonAction(mockLuigiClient, field, undefined);
      }).toThrow('Missing or invalid button path for field "Null Path"');
    });

    it('should throw error for unsupported action', () => {
      const field: FieldDefinition = {
        value: '/some/path',
        uiSettings: {
          buttonSettings: {
            action: 'unsupportedAction' as any,
          },
        },
      };

      expect(() => {
        executeButtonAction(mockLuigiClient, field, undefined);
      }).toThrow('Unsupported action: unsupportedAction');
    });

    it('should throw error with field declaration for unsupported action', () => {
      const field: FieldDefinition = {
        property: 'test',
        value: '/path',
        uiSettings: {
          buttonSettings: {
            action: 'invalidAction' as any,
          },
        },
      };

      expect(() => {
        executeButtonAction(mockLuigiClient, field, undefined);
      }).toThrow(/in field declaration:/);
    });

    it('should use label in error message when available', () => {
      const field: FieldDefinition = {
        label: 'My Custom Label',
        property: 'metadata.name',
        uiSettings: {},
      };

      expect(() => {
        executeButtonAction(mockLuigiClient, field, undefined);
      }).toThrow('Missing button action for field "My Custom Label"');
    });

    it('should use property in error message when label is missing', () => {
      const field: FieldDefinition = {
        property: 'spec.buttonPath',
        uiSettings: {},
      };

      expect(() => {
        executeButtonAction(mockLuigiClient, field, undefined);
      }).toThrow('Missing button action for field "spec.buttonPath"');
    });

    it('should use unknown in error message when both label and property are missing', () => {
      const field: FieldDefinition = {
        value: '/path',
        uiSettings: {},
      };

      expect(() => {
        executeButtonAction(mockLuigiClient, field, undefined);
      }).toThrow('Missing button action for field "unknown"');
    });

    it('should use unknown in error message when property is array', () => {
      const field: FieldDefinition = {
        property: ['metadata', 'name'],
        uiSettings: {},
      };

      expect(() => {
        executeButtonAction(mockLuigiClient, field, undefined);
      }).toThrow('Missing button action for field "unknown"');
    });

    it('should navigate with valid path', () => {
      const field: FieldDefinition = {
        value: '/valid/path',
        uiSettings: {
          buttonSettings: {
            action: 'navigate',
          },
        },
      };

      executeButtonAction(mockLuigiClient, field, undefined);

      expect(mockLinkManager.navigate).toHaveBeenCalledWith('/valid/path');
    });

    it('should call linkManager once per action', () => {
      const field: FieldDefinition = {
        value: '/path',
        uiSettings: {
          buttonSettings: {
            action: 'navigate',
          },
        },
      };

      executeButtonAction(mockLuigiClient, field, undefined);

      expect(mockLuigiClient.linkManager).toHaveBeenCalledTimes(1);
    });

    it('should handle navigate action multiple times', () => {
      const field1: FieldDefinition = {
        value: '/path1',
        uiSettings: {
          buttonSettings: {
            action: 'navigate',
          },
        },
      };
      const field2: FieldDefinition = {
        value: '/path2',
        uiSettings: {
          buttonSettings: {
            action: 'navigate',
          },
        },
      };

      executeButtonAction(mockLuigiClient, field1, undefined);
      executeButtonAction(mockLuigiClient, field2, undefined);

      expect(mockLinkManager.navigate).toHaveBeenCalledTimes(2);
      expect(mockLinkManager.navigate).toHaveBeenNthCalledWith(1, '/path1');
      expect(mockLinkManager.navigate).toHaveBeenNthCalledWith(2, '/path2');
    });

    it('should use fallback value when jsonPath returns null', () => {
      const field: FieldDefinition = {
        property: 'metadata.link',
        value: '/fallback/path',
        uiSettings: {
          buttonSettings: {
            action: 'navigate',
          },
        },
      };
      const resource: Resource = {
        metadata: { name: 'test' },
      };

      getResourceValueByJsonPathMock.mockReturnValue(null);

      executeButtonAction(mockLuigiClient, field, resource);

      expect(mockLinkManager.navigate).toHaveBeenCalledWith('/fallback/path');
    });

    it('should include field JSON in unsupported action error message', () => {
      const field: FieldDefinition = {
        property: 'test.property',
        value: '/path',
        label: 'Test Label',
        uiSettings: {
          buttonSettings: {
            action: 'wrongAction' as any,
          },
        },
      };

      expect(() => {
        executeButtonAction(mockLuigiClient, field, undefined);
      }).toThrow(/"property":"test.property"/);
    });
  });
});
