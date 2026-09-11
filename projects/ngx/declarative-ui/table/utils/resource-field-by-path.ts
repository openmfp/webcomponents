import { PropertyField, TransformType } from '../../models';
import { JSONPath } from 'jsonpath-plus';

export const getResourceValueByJsonPath = <T>(
  resource: T,
  field: {
    jsonPathExpression?: string;
    property?: string | string[];
    propertyField?: PropertyField;
  },
) => {
  const property = field.jsonPathExpression || field.property;
  if (!property) {
    return undefined;
  }

  if (property instanceof Array) {
    console.error(
      `Property defined as an array: ${JSON.stringify(property)}, provide "jsonPathExpression" field to properly ready resource value`,
    );
    return undefined;
  }

  const prefix = property.startsWith('$.') ? '' : '$.';
  // jsonpath-plus's `JSONPath` is overloaded: by default `resultType: 'value'`
  // returns an array of matched values, but the TS overload defaults to
  // returning a `JSONPathClass` unless we pin `<T>` to the array shape.
  // The `json` parameter is typed as a concrete JSON-shape union; the generic
  // `T` of this function is unconstrained, so we cast at the boundary. The
  // returned array is `any[]` (matching jsonpath's old typing) so the
  // downstream `value[field.propertyField.key]` access keeps compiling.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const queryResult = JSONPath<any[]>({
    path: `${prefix}${property}`,
    json: resource as object,
  });
  const value = queryResult.length ? queryResult[0] : undefined;

  if (value && field.propertyField) {
    return executeTransform(
      value[field.propertyField.key],
      field.propertyField.transform,
    );
  }

  return value;
};

const executeTransform = (
  value: string | undefined,
  transform: TransformType[] | undefined,
): string | undefined => {
  if (value == null || transform == null || !transform.length) return value;

  return transform.reduce((acc, t) => {
    if (acc == null) return acc;

    switch (t) {
      case 'uppercase':
        return acc.toUpperCase();
      case 'lowercase':
        return acc.toLowerCase();
      case 'capitalize': {
        const str = String(acc);
        return str.length ? str.charAt(0).toUpperCase() + str.slice(1) : str;
      }
      case 'decode': {
        try {
          return decodeBase64(acc);
        } catch {
          return acc;
        }
      }
      case 'encode': {
        try {
          return encodeBase64(acc);
        } catch {
          return acc;
        }
      }
      default:
        return acc;
    }
  }, value);
};

export const encodeBase64 = (str: string): string => {
  try {
    const utf8Bytes = new TextEncoder().encode(str);
    const binaryString = Array.from(utf8Bytes, (byte) =>
      String.fromCharCode(byte),
    ).join('');
    return btoa(binaryString);
  } catch (error) {
    console.error('Base64 encoding failed:', error);
    throw new Error('Failed to encode string to Base64', { cause: error });
  }
};

export const decodeBase64 = (base64: string): string => {
  try {
    const binaryString = atob(base64);
    const bytes = Uint8Array.from(binaryString, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch (error) {
    console.error('Base64 decoding failed:', error);
    throw new Error('Failed to decode Base64 string', { cause: error });
  }
};

/**
 * Replaces every `{{path}}` placeholder in `template` with the value resolved
 * from `resource` via the given path (dot-notation). Unresolved placeholders
 * become an empty string.
 *
 * After substitution, the resulting href is resolved against `baseHref`
 * (typically the current `window.location.href`):
 * - An absolute URL (with a protocol, e.g. `https://…`) is returned unchanged.
 * - A relative path is resolved via the standard URL algorithm:
 *   a leading `/` resolves from the origin root, otherwise it resolves
 *   relative to the current path.
 */
export const resolveLinkTemplate = <T>(
  template: string,
  resource: T | undefined,
  baseHref: string = window.location.href,
): string => {
  const substituted = template.replace(
    /\{\{\s*([^}]+?)\s*\}\}/g,
    (_match, path: string) => {
      if (!resource) return '';
      const value = getResourceValueByJsonPath(resource, { property: path });
      return value == null ? '' : String(value);
    },
  );

  if (!substituted || isAbsoluteUrl(substituted)) {
    return substituted;
  }

  try {
    return new URL(substituted, baseHref + '/').href;
  } catch {
    return substituted;
  }
};

/**
 * True when `value` parses as an absolute URL on its own (has a protocol,
 * e.g. `https://…`, `mailto:…`). Relative paths return `false`.
 */
const isAbsoluteUrl = (value: string): boolean => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};
