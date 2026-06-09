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
    throw new Error('Failed to encode string to Base64');
  }
};

export const decodeBase64 = (base64: string): string => {
  try {
    const binaryString = atob(base64);
    const bytes = Uint8Array.from(binaryString, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch (error) {
    console.error('Base64 decoding failed:', error);
    throw new Error('Failed to decode Base64 string');
  }
};
