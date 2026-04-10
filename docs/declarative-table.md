# DeclarativeTable

A data table web component that renders rows and columns from a declarative column definition. Supports pagination, grouped columns, conditional cell styling, and multiple cell display modes (plain text, link, boolean icon, secret, tooltip, button, image).

## Tags

| Usage | Tag |
|---|---|
| Angular component | `<mfp-declarative-table>` |
| Web Component (framework-agnostic) | `<mfp-wc-declarative-table>` |

---

## Usage as a web component

Include the bundle and set properties via JavaScript. Because the component uses Shadow DOM, no extra CSS setup is needed.

```html
<!DOCTYPE html>
<html>
  <head>
    <script type="module" src="declarative-table.js"/>
  </head>
  <body>
    <mfp-wc-declarative-table id="table"></mfp-wc-declarative-table>

    <script type="module">
      const table = document.getElementById('table');

      table.columns = [
        { label: 'Name',   property: 'metadata.name' },
        { label: 'Status', property: 'status.phase' },
      ];

      table.resources = [
        { metadata: { name: 'pod-1' }, status: { phase: 'Running' } },
        { metadata: { name: 'pod-2' }, status: { phase: 'Pending' } },
      ];

      table.trackBy = (item) => item.metadata.name;
    </script>
  </body>
</html>
```

> `columns`, `resources`, and `trackBy` are JavaScript properties, not HTML attributes. They must be set programmatically after the element is available in the DOM.

---

## Usage as an Angular component

```ts
import { DeclarativeTable } from '@openmfp/webcomponents';
import { TableFieldDefinition } from '@openmfp/webcomponents';

@Component({
  imports: [DeclarativeTable],
  template: `
    <mfp-declarative-table
      [columns]="columns"
      [resources]="resources"
      [trackBy]="trackBy"
      [hasMore]="hasMore"
      [paginationLimit]="pageSize"
      [totalItemsCount]="total"
      (tableRowClicked)="onRowClick($event)"
      (loadMoreResources)="loadMore()"
      (paginationLimitChanged)="onPageSizeChange($event)"
    />
  `,
})
export class MyComponent {
  columns: TableFieldDefinition[] = [
    { label: 'Name',   property: 'metadata.name' },
    { label: 'Status', property: 'status.phase' },
  ];
  resources = [...];
  trackBy = (item: any) => item.metadata.name;
  hasMore = false;
  pageSize = 10;
  total = 0;
}
```

---

## API

### Inputs

| Input | Type | Required | Default | Description |
|---|---|---|---|---|
| `columns` | `TableFieldDefinition[]` | yes | — | Column definitions |
| `resources` | `GenericResource[]` | yes | — | Data rows |
| `trackBy` | `(item) => string \| number` | yes | — | Unique key function for row identity |
| `totalItemsCount` | `number` | no | — | Total count of all items across pages |
| `paginationLimit` | `number` | no | `5` | Rows per page shown in the page-size selector |
| `hasMore` | `boolean` | no | `false` | Show the load-more trigger at the bottom |

### Outputs / Events

| Event | Detail payload | Description |
|---|---|---|
| `tableRowClicked` | row object | Fires when a row is clicked |
| `buttonClick` | `{ event, field, resource }` | Fires when a button cell is clicked |
| `loadMoreResources` | — | Fires when the user triggers load more |
| `paginationLimitChanged` | `number` | Fires when the user changes the page size |

**Listening to events from a web component:**

```js
table.addEventListener('tableRowClicked', (e) => console.log(e.detail));
table.addEventListener('loadMoreResources', () => fetchNextPage());
table.addEventListener('paginationLimitChanged', (e) => {
  table.paginationLimit = e.detail;
});
table.addEventListener('buttonClick', (e) => {
  const { field, resource } = e.detail;
  console.log('Button clicked for', resource);
});
```

---

## Column definition (`TableFieldDefinition`)

```ts
interface TableFieldDefinition {
  label?:              string;
  property?:           string;        // dot-notation path into the resource object
  jsonPathExpression?: string;        // explicit JSONPath expression
  propertyField?:      PropertyField; // access a sub-key with optional transforms
  value?:              string;        // static fallback value
  uiSettings?:         UiSettings;
  group?: {
    name:       string;  // columns sharing the same name are merged into one header
    label?:     string;  // label for the merged header
    delimiter?: string;  // separator between values (default: space)
    multiline?: boolean; // render values on separate lines instead
  };
}
```

### Resolving cell values

Values are resolved in this order:

1. `jsonPathExpression` — evaluated as a JSONPath query against the resource (e.g. `$.spec.containers[0].image`)
2. `property` — dot-notation path; a `$.` prefix is added automatically if missing
3. `propertyField` — accesses `resource[property][propertyField.key]` with optional transforms
4. `value` — static string, used as a fallback when the resource yields no value

**Examples:**

```ts
// Simple dot-notation
{ label: 'Name', property: 'metadata.name' }

// Explicit JSONPath
{ label: 'Image', jsonPathExpression: '$.spec.containers[0].image' }

// Sub-key with transform
{ label: 'Created', property: 'metadata', propertyField: { key: 'creationTimestamp', transform: ['uppercase'] } }

// Static fallback when property may be absent
{ label: 'Message', property: 'status.message', value: 'N/A' }
```

### `PropertyField` transforms

Transforms can be chained and are applied left to right.

| Transform | Effect |
|---|---|
| `uppercase` | `hello` → `HELLO` |
| `lowercase` | `HELLO` → `hello` |
| `capitalize` | `hello` → `Hello` |
| `encode` | Base64-encodes the value |
| `decode` | Base64-decodes the value |

```ts
{ property: 'metadata', propertyField: { key: 'name', transform: ['capitalize'] } }
```

---

## Cell display modes (`uiSettings.displayAs`)

By default a cell renders its value as plain text. Use `uiSettings.displayAs` to change the rendering:

| `displayAs` | Renders as |
|---|---|
| _(unset)_ | Plain text |
| `'secret'` | Masked value with a toggle-visibility button |
| `'boolIcon'` | Check / X icon for `"true"` / `"false"` string values |
| `'link'` | Clickable anchor (the value must be a valid URL) |
| `'tooltip'` | Text with an info icon; the full value appears on hover |
| `'alert'` | Alert-styled text |
| `'img'` | `<img>` element using the value as `src` |
| `'button'` | Action button (requires `buttonSettings`) |

### Copy button

Add a copy-to-clipboard icon to any cell:

```ts
{ label: 'ID', property: 'metadata.uid', uiSettings: { withCopyButton: true } }
```

### Button cells

```ts
{
  label: 'Actions',
  property: 'metadata.name',
  uiSettings: {
    displayAs: 'button',
    buttonSettings: {
      text: 'Open',
      icon: 'action',
      design: 'Emphasized', // 'Default' | 'Positive' | 'Negative' | 'Transparent' | 'Emphasized' | 'Attention'
      action: 'navigate',   // 'navigate' | 'openInModal'
    },
  },
}
```

A `buttonClick` event fires with `{ event, field, resource }` when clicked.

---

## Grouped columns

Columns that share the same `group.name` are collapsed into a single table column. Their values are displayed together, separated by `group.delimiter` or on separate lines when `group.multiline` is `true`.

```ts
columns = [
  {
    label: 'First name',
    property: 'firstName',
    group: { name: 'fullName', label: 'Full Name', delimiter: ' ' },
  },
  {
    label: 'Last name',
    property: 'lastName',
    group: { name: 'fullName' },
  },
  { label: 'Email', property: 'email' },
];
```

The above produces two visible columns: **Full Name** and **Email**.

---

## Conditional cell styling (`cssRules`)

Apply inline styles to a cell when its value meets a condition:

```ts
{
  label: 'Status',
  property: 'status.phase',
  uiSettings: {
    cssRules: [
      { if: { condition: 'equals',    value: 'Running' }, styles: { color: 'green' } },
      { if: { condition: 'equals',    value: 'Failed' },  styles: { color: 'red', fontWeight: 'bold' } },
      { if: { condition: 'contains',  value: 'Pending' }, styles: { color: 'orange' } },
    ],
  },
}
```

Available conditions: `equals`, `notEquals`, `greaterThan`, `greaterThanOrEqual`, `lessThan`, `lessThanOrEqual`, `contains`.

`cssCustomization` applies static styles unconditionally:

```ts
uiSettings: { cssCustomization: { fontStyle: 'italic' } }
```

---

## Pagination

When `hasMore` is `true` a **Load More** trigger appears at the bottom of the table. A page-size selector is always present.

```js
table.hasMore = true;
table.totalItemsCount = 100;
table.paginationLimit = 10;

table.addEventListener('loadMoreResources', () => {
  fetchNextPage().then((rows) => {
    table.resources = [...table.resources, ...rows];
  });
});

table.addEventListener('paginationLimitChanged', (e) => {
  table.paginationLimit = e.detail;
  reloadWithNewLimit(e.detail);
});
```

---

## Resource shape

Any plain object works as a resource. Two optional fields control table behaviour:

| Field | Type | Description |
|---|---|---|
| `isAvailable` | `boolean` | When `false`, the row is rendered as non-interactive |
| `accessibleName` | `string` | Accessible label attached to the row element |
