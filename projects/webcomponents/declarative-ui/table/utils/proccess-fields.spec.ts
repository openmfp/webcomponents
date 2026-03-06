import { processGroupFields } from './proccess-fields';
import { FieldDefinition } from '@platform-mesh/portal-ui-lib/models';

describe('proccess-fields', () => {
  describe('processFields', () => {
    it('should return empty array when input is empty', () => {
      const result = processGroupFields([]);
      expect(result).toEqual([]);
    });

    it('should return fields without groups unchanged', () => {
      const fields: FieldDefinition[] = [
        {
          property: 'name',
          label: 'Name',
        },
        {
          property: 'age',
          label: 'Age',
        },
      ];

      const result = processGroupFields(fields);
      expect(result).toEqual(fields);
    });

    it('should combine fields with the same group name', () => {
      const fields: FieldDefinition[] = [
        {
          property: 'firstName',
          label: 'First Name',
          group: {
            name: 'personalInfo',
            label: 'Personal Information',
          },
        },
        {
          property: 'lastName',
          label: 'Last Name',
          group: {
            name: 'personalInfo',
            label: 'Personal Information',
          },
        },
        {
          property: 'email',
          label: 'Email',
          group: {
            name: 'personalInfo',
            label: 'Personal Information',
          },
        },
      ];

      const result = processGroupFields(fields);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        property: 'firstName',
        label: 'First Name',
        group: {
          name: 'personalInfo',
          label: 'Personal Information',
          fields: [
            { property: 'firstName', label: 'First Name' },
            { property: 'lastName', label: 'Last Name' },
            { property: 'email', label: 'Email' },
          ],
        },
      });
    });

    it('should handle multiple different groups', () => {
      const fields: FieldDefinition[] = [
        {
          property: 'firstName',
          label: 'First Name',
          group: {
            name: 'personalInfo',
            label: 'Personal Information',
          },
        },
        {
          property: 'lastName',
          label: 'Last Name',
          group: {
            name: 'personalInfo',
            label: 'Personal Information',
          },
        },
        {
          property: 'street',
          label: 'Street',
          group: {
            name: 'address',
            label: 'Address',
          },
        },
        {
          property: 'city',
          label: 'City',
          group: {
            name: 'address',
            label: 'Address',
          },
        },
      ];

      const result = processGroupFields(fields);

      expect(result).toHaveLength(2);

      const personalInfoField = result.find(
        (f) => f.group?.name === 'personalInfo',
      );
      const addressField = result.find((f) => f.group?.name === 'address');

      expect(personalInfoField).toEqual({
        property: 'firstName',
        label: 'First Name',
        group: {
          name: 'personalInfo',
          label: 'Personal Information',
          fields: [
            { property: 'firstName', label: 'First Name' },
            { property: 'lastName', label: 'Last Name' },
          ],
        },
      });

      expect(addressField).toEqual({
        property: 'street',
        label: 'Street',
        group: {
          name: 'address',
          label: 'Address',
          fields: [
            { property: 'street', label: 'Street' },
            { property: 'city', label: 'City' },
          ],
        },
      });
    });

    it('should handle mixed fields with and without groups', () => {
      const fields: FieldDefinition[] = [
        {
          property: 'id',
          label: 'ID',
        },
        {
          property: 'firstName',
          label: 'First Name',
          group: {
            name: 'personalInfo',
            label: 'Personal Information',
          },
        },
        {
          property: 'lastName',
          label: 'Last Name',
          group: {
            name: 'personalInfo',
            label: 'Personal Information',
          },
        },
        {
          property: 'status',
          label: 'Status',
        },
      ];

      const result = processGroupFields(fields);

      expect(result).toHaveLength(3);

      const idField = result.find((f) => f.property === 'id');
      const statusField = result.find((f) => f.property === 'status');
      const personalInfoField = result.find(
        (f) => f.group?.name === 'personalInfo',
      );

      expect(idField).toEqual({
        property: 'id',
        label: 'ID',
      });

      expect(statusField).toEqual({
        property: 'status',
        label: 'Status',
      });

      expect(personalInfoField).toEqual({
        property: 'firstName',
        label: 'First Name',
        group: {
          name: 'personalInfo',
          label: 'Personal Information',
          fields: [
            { property: 'firstName', label: 'First Name' },
            { property: 'lastName', label: 'Last Name' },
          ],
        },
      });
    });

    it('should use jsonPathExpression when available instead of property', () => {
      const fields: FieldDefinition[] = [
        {
          property: 'firstName',
          label: 'First Name',
          jsonPathExpression: 'user.personal.firstName',
          group: {
            name: 'personalInfo',
            label: 'Personal Information',
          },
        },
        {
          property: 'lastName',
          label: 'Last Name',
          jsonPathExpression: 'user.personal.lastName',
          group: {
            name: 'personalInfo',
            label: 'Personal Information',
          },
        },
        {
          property: 'email',
          label: 'Email',
          group: {
            name: 'personalInfo',
            label: 'Personal Information',
          },
        },
      ];

      const result = processGroupFields(fields);

      expect(result).toHaveLength(1);
      expect(result[0].group?.fields).toEqual([
        {
          property: 'firstName',
          label: 'First Name',
          jsonPathExpression: 'user.personal.firstName',
        },
        {
          property: 'lastName',
          label: 'Last Name',
          jsonPathExpression: 'user.personal.lastName',
        },
        { property: 'email', label: 'Email' },
      ]);
    });

    it('should handle array properties', () => {
      const fields: FieldDefinition[] = [
        {
          property: ['firstName', 'first_name'],
          label: 'First Name',
          group: {
            name: 'personalInfo',
            label: 'Personal Information',
          },
        },
        {
          property: ['lastName', 'last_name'],
          label: 'Last Name',
          group: {
            name: 'personalInfo',
            label: 'Personal Information',
          },
        },
      ];

      const result = processGroupFields(fields);

      expect(result).toHaveLength(1);
      expect(result[0].group?.fields).toEqual([
        { property: ['firstName', 'first_name'], label: 'First Name' },
        { property: ['lastName', 'last_name'], label: 'Last Name' },
      ]);
    });

    it('should handle fields with group but no name', () => {
      const fields: FieldDefinition[] = [
        {
          property: 'firstName',
          label: 'First Name',
          group: {
            name: '',
            label: 'Personal Information',
          },
        },
        {
          property: 'lastName',
          label: 'Last Name',
          group: {
            name: 'personalInfo',
            label: 'Personal Information',
          },
        },
      ];

      const result = processGroupFields(fields);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        property: 'firstName',
        label: 'First Name',
        group: {
          name: '',
          label: 'Personal Information',
        },
      });
      expect(result[1]).toEqual({
        property: 'lastName',
        label: 'Last Name',
        group: {
          name: 'personalInfo',
          label: 'Personal Information',
          fields: [{ property: 'lastName', label: 'Last Name' }],
        },
      });
    });

    it('should handle fields with undefined group', () => {
      const fields: FieldDefinition[] = [
        {
          property: 'firstName',
          label: 'First Name',
          group: undefined,
        },
        {
          property: 'lastName',
          label: 'Last Name',
          group: {
            name: 'personalInfo',
            label: 'Personal Information',
          },
        },
      ];

      const result = processGroupFields(fields);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        property: 'firstName',
        label: 'First Name',
        group: undefined,
      });
      expect(result[1]).toEqual({
        property: 'lastName',
        label: 'Last Name',
        group: {
          name: 'personalInfo',
          label: 'Personal Information',
          fields: [{ property: 'lastName', label: 'Last Name' }],
        },
      });
    });

    it('should preserve all original field properties in the result', () => {
      const fields: FieldDefinition[] = [
        {
          property: 'firstName',
          label: 'First Name',
          required: true,
          values: ['John', 'Jane'],
          group: {
            name: 'personalInfo',
            label: 'Personal Information',
            delimiter: ' | ',
          },
          dynamicValuesDefinition: {
            operation: 'query',
            gqlQuery: 'query { users { name } }',
            value: 'name',
            key: 'id',
          },
        },
        {
          property: 'lastName',
          label: 'Last Name',
          required: false,
          group: {
            name: 'personalInfo',
            label: 'Personal Information',
            delimiter: ' | ',
          },
        },
      ];

      const result = processGroupFields(fields);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        property: 'firstName',
        label: 'First Name',
        required: true,
        values: ['John', 'Jane'],
        group: {
          name: 'personalInfo',
          label: 'Personal Information',
          delimiter: ' | ',
          fields: [
            {
              property: 'firstName',
              label: 'First Name',
              required: true,
              values: ['John', 'Jane'],
              dynamicValuesDefinition: {
                operation: 'query',
                gqlQuery: 'query { users { name } }',
                value: 'name',
                key: 'id',
              },
            },
            {
              property: 'lastName',
              label: 'Last Name',
              required: false,
            },
          ],
        },
        dynamicValuesDefinition: {
          operation: 'query',
          gqlQuery: 'query { users { name } }',
          value: 'name',
          key: 'id',
        },
      });
    });

    it('should handle complex nested group scenarios', () => {
      const fields: FieldDefinition[] = [
        {
          property: 'id',
          label: 'ID',
        },
        {
          property: 'firstName',
          label: 'First Name',
          group: {
            name: 'personalInfo',
            label: 'Personal Information',
          },
        },
        {
          property: 'lastName',
          label: 'Last Name',
          group: {
            name: 'personalInfo',
            label: 'Personal Information',
          },
        },
        {
          property: 'street',
          label: 'Street',
          group: {
            name: 'address',
            label: 'Address',
          },
        },
        {
          property: 'city',
          label: 'City',
          group: {
            name: 'address',
            label: 'Address',
          },
        },
        {
          property: 'country',
          label: 'Country',
          group: {
            name: 'address',
            label: 'Address',
          },
        },
        {
          property: 'status',
          label: 'Status',
        },
      ];

      const result = processGroupFields(fields);

      expect(result).toHaveLength(4);

      const idField = result.find((f) => f.property === 'id');
      const statusField = result.find((f) => f.property === 'status');
      const personalInfoField = result.find(
        (f) => f.group?.name === 'personalInfo',
      );
      const addressField = result.find((f) => f.group?.name === 'address');

      expect(idField?.property).toBe('id');
      expect(statusField?.property).toBe('status');

      expect(personalInfoField?.group?.fields).toEqual([
        { property: 'firstName', label: 'First Name' },
        { property: 'lastName', label: 'Last Name' },
      ]);
      expect(addressField?.group?.fields).toEqual([
        { property: 'street', label: 'Street' },
        { property: 'city', label: 'City' },
        { property: 'country', label: 'Country' },
      ]);
    });
  });
});
