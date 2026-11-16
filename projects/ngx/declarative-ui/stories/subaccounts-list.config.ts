import type { DataFetchListData } from '../data-fetch-list';
import type { FieldDefinition } from '../models';

export const SUBACCOUNTS_LIST_INPUTS = {
  description: 'Review the affected subaccounts.',
  data: {
    request: {
      url: new URL('./data-fetch-list.fixture.json', document.baseURI).href,
    },
    path: 'subaccounts',
  } satisfies DataFetchListData,
  fieldDefinition: {
    property: 'name',
    uiSettings: {
      displayAs: 'link',
      linkSettings: {
        link: 'https://example.com/subaccounts/{{id}}/details',
      },
    },
  } satisfies FieldDefinition,
};
