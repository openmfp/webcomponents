# DeclarativeTable

A data table web component that renders rows and columns from a declarative column definition. Supports pagination, grouped columns, conditional cell styling, value mapping, and multiple cell display modes (plain text, link, boolean icon, secret, tooltip, button, image, tag).

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

      table.trackByPath = 'metadata.name';
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
      [trackByPath]="trackByPath"
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
  trackByPath = 'metadata.name';
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
| `trackByPath` | `string` | no | `'id'` | JSONPath (dot-notation) into each resource used as the row identity key |
| `totalItemsCount` | `number` | no | — | Total count of all items across pages |
| `paginationLimit` | `number` | no | `5` | Rows per page shown in the page-size selector |
| `hasMore` | `boolean` | no | `false` | Show the load-more trigger at the bottom |
| `growMode` | `'Button' \| 'Scroll'` | no | `'Button'` | Load-more strategy: `'Button'` shows a button, `'Scroll'` triggers on scroll |
| `loadMoreButtonText` | `string` | no | `'Load More'` | Label shown on the load-more button (used when `growMode` is `'Button'`) |
| `height` | `number` | no | — | Fixed height in pixels. When combined with `growMode: 'Scroll'`, enables scroll-based loading with a sticky header |
| `permissions` | `Map<string, string[]>` | no | — | Per-row permission map keyed by `resource.id`. Passed to every cell's `mfp-resource-field` to evaluate `requirePermission` on each column definition. |

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
| `'tag'` | One `<ui5-tag>` chip per value (split by `tagSettings.valueSeparator`, default `','`); also accepts an array of values |

### Copy button

Add a copy-to-clipboard icon to any cell:

```ts
{ label: 'ID', property: 'metadata.uid', uiSettings: { withCopyButton: true } }
```

### Column width

Set an explicit width on a column header cell:

```ts
{ label: 'Actions', uiSettings: { columnWidth: '10rem' } }
```

> **UI5 constraint.** The value must be a valid CSS `<length>` — `px`, `rem`, `em`, `%`, or `calc()`. Sizing keywords such as `min-content` and `max-content` are rejected by UI5 and fall back to equal-stretch distribution across all columns.

### Column alignment

Control the horizontal alignment of cell content using `uiSettings.align`. The value maps directly to the CSS `justify-content` property of the cell's flex wrapper.

| Value | Effect |
|---|---|
| `'start'` | Left-aligned (default browser behaviour) |
| `'center'` | Centred |
| `'end'` | Right-aligned |

```ts
{
  uiSettings: {
    displayAs: 'button',
    align: 'end',
    buttonSettings: { icon: 'delete', design: 'Transparent', action: 'delete' },
  },
  group: { name: 'actions', label: '' },
}
```

For group columns the alignment is driven by the **first** field's `uiSettings.align`.

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

### Column-level settings via the first field

The **first** field in a group sets the column-level configuration. `uiSettings.columnWidth` controls the `<ui5-table-header-cell>` width; `uiSettings.align` controls `justify-content` of the cell content wrapper. The column header text comes from `group.label` (or `group.name` if omitted) of the first field. These values on subsequent fields in the same group are ignored.

```ts
columns = [
  // First field — drives column width and right-alignment for the whole group
  {
    uiSettings: {
      displayAs: 'button',
      columnWidth: '8rem',
      align: 'end',
      buttonSettings: { icon: 'edit', design: 'Transparent', action: 'edit' },
    },
    group: { name: 'actions', label: '', multiline: false },
  },
  // Second field — uiSettings.columnWidth and uiSettings.align are ignored here
  {
    uiSettings: {
      displayAs: 'button',
      buttonSettings: { icon: 'decline', design: 'Transparent', action: 'delete' },
    },
    group: { name: 'actions', label: '', multiline: false },
  },
];
```

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

## Value rules (`valueRules`)

Map a cell's raw value to a display string. The first matching rule wins; when no rule matches the raw value is shown unchanged.

```ts
{
  label: 'Activity',
  property: 'metrics.score',
  uiSettings: {
    valueRules: [
      { if: { condition: 'lessThan',           value: '20' }, then: 'Low'    },
      { if: { condition: 'lessThan',           value: '60' }, then: 'Medium' },
      { if: { condition: 'greaterThanOrEqual', value: '60' }, then: 'High'   },
    ],
    cssRules: [
      { if: { condition: 'lessThan',           value: '20' }, styles: { color: 'red'       } },
      { if: { condition: 'greaterThanOrEqual', value: '20' }, styles: { color: 'darkorange' } },
      { if: { condition: 'greaterThanOrEqual', value: '60' }, styles: { color: 'green'     } },
    ],
  },
}
```

---

## Pagination

When `hasMore` is `true` a load-more trigger appears at the bottom of the table. The trigger behaviour is controlled by `growMode`:

- `growMode: 'Button'` (default) — a button labelled with `loadMoreButtonText` is shown. Clicking it fires `loadMoreResources`.
- `growMode: 'Scroll'` — loading is triggered automatically as the user scrolls. Set `height` to constrain the table height and enable scroll detection; the header row becomes sticky automatically.

A page-size selector is always present.

```js
// Button mode (default)
table.hasMore = true;
table.loadMoreButtonText = 'Load More';

// Scroll mode with a fixed height
table.growMode = 'Scroll';
table.height = 400; // pixels
table.hasMore = true;

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

Any plain object works as a resource. Three optional fields control table behaviour:

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Default `trackByPath` target; used as the row identity key unless overridden |
| `isAvailable` | `boolean` | When `false`, the row is rendered as non-interactive |
| `accessibleName` | `string` | Accessible label attached to the row element |

---

## Test IDs

All interactive elements carry `data-testid` attributes for reliable E2E targeting. See [docs/test-ids.md](./test-ids.md) for the full naming convention.

| Element | `data-testid` | Notes |
|---|---|---|
| Table element | `generic-table` | |
| Header cell | `generic-table-header-{column}` | `column` = `group.name` or `property` |
| Row | `generic-table-row-{i}` | `i` = 0-based index |
| Cell (simple column) | `generic-table-cell-{i}-{property}` | |
| Cell (grouped column) | `generic-table-cell-{i}-{group}` | `group` = `group.name` |
| Group sub-value | `generic-table-cell-{i}-{group}-{property}` | |
| No-data state | `generic-table-view-nodata` | Shown when `resources` is empty |
| Load-more trigger | `generic-table-growing` | Shown when `hasMore` is true |
| Page-size select | `generic-table-pagination-select` | Always present |
