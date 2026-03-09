import { TableFieldDefinition } from '../models';

type GroupBase = NonNullable<TableFieldDefinition['group']>;
type ProcessedGroup = GroupBase & {
  fields?: TableFieldDefinition[];
};

export type ProcessedTableFieldDefinition = Omit<TableFieldDefinition, 'group'> & {
  group?: ProcessedGroup;
};

export const processGroupFields = (
  fields: TableFieldDefinition[],
): ProcessedTableFieldDefinition[] => {
  return combineGroupFields(fields);
};

const collectGroupFields = (
  fields: TableFieldDefinition[],
): Record<string, TableFieldDefinition[]> => {
  return fields.reduce(
    (acc, f): Record<string, TableFieldDefinition[]> => {
      if (!f.group?.name) {
        return acc;
      }

      const key = f.group.name;
      if (!acc[key]) {
        acc[key] = [];
      }

      // Strip group information from the field when adding to the fields array
      const { group, ...fieldWithoutGroup } = f;
      acc[key].push(fieldWithoutGroup);
      return acc;
    },
    {} as Record<string, TableFieldDefinition[]>,
  );
};

const combineGroupFields = (fields: TableFieldDefinition[]): ProcessedTableFieldDefinition[] => {
  const seenGroup = new Set<string>();
  const groupFields = collectGroupFields(fields);
  const result: ProcessedTableFieldDefinition[] = [];

  fields.forEach((f) => {
    if (!f.group?.name) {
      result.push(f);
      return;
    }

    const key = f.group.name;
    if (seenGroup.has(key)) {
      return;
    }

    seenGroup.add(key);

    const grouped: ProcessedTableFieldDefinition = {
      ...f,
      group: {
        ...f.group,
        fields: groupFields[key],
      },
    };

    result.push(grouped);
  });

  return result;
};
