# DeclarativeTableCard

A card component that wraps `mfp-declarative-table` and adds a header, search, and optional create/edit/delete dialogs — all configured declaratively.

## Tags

| Usage | Tag |
|---|---|
| Angular component | `<mfp-declarative-table-card>` |
| Web Component (framework-agnostic) | `<mfp-wc-declarative-table-card>` |

---

## Usage as a web component

Include the bundle and set properties via JavaScript.

```html
<!DOCTYPE html>
<html>
  <head>
    <script type="module" src="declarative-table-card.js"/>
  </head>
  <body>
    <mfp-wc-declarative-table-card id="card"></mfp-wc-declarative-table-card>

    <script type="module">
      const card = document.getElementById('card');

      card.header = 'Pods';
      card.resources = [
        { id: '1', metadata: { name: 'api-server', namespace: 'default' }, status: { phase: 'Running' } },
      ];
      card.readConfig = {
        fields: [
          { label: 'Name',      property: 'metadata.name' },
          { label: 'Namespace', property: 'metadata.namespace' },
        ],
        paginationLimit: 10,
        hasMore: false,
      };
      card.createConfig = {
        fields: [
          { name: 'metadata.name',      label: 'Name',      required: true },
          { name: 'metadata.namespace', label: 'Namespace', required: true },
        ],
        title: 'Create Pod',
        confirmLabel: 'Create',
      };

      card.addEventListener('createConfirmed', (e) => console.log('create', e.detail));
      card.addEventListener('editConfirmed',   (e) => console.log('edit',   e.detail));
      card.addEventListener('deleteConfirmed', (e) => console.log('delete', e.detail));
      card.addEventListener('searchChanged',   (e) => console.log('search', e.detail));
    </script>
  </body>
</html>
```

> All inputs (`header`, `resources`, `readConfig`, etc.) are JavaScript properties, not HTML attributes. They must be set programmatically after the element is available in the DOM.

---

## Usage as an Angular component

```ts
import { DeclarativeTableCardComponent } from '@openmfp/webcomponents';
import {
  TableCardReadConfig,
  TableCardCreateConfig,
  TableCardEditConfig,
  TableCardDeleteConfig,
} from '@openmfp/webcomponents';

@Component({
  imports: [DeclarativeTableCardComponent],
  template: `
    <mfp-declarative-table-card
      header="Pods"
      [resources]="pods"
      [readConfig]="readConfig"
      [createConfig]="createConfig"
      [editConfig]="editConfig"
      [deleteConfig]="deleteConfig"
      (createConfirmed)="onCreate($event)"
      (editConfirmed)="onEdit($event)"
      (deleteConfirmed)="onDelete($event)"
      (searchChanged)="onSearch($event)"
    />
  `,
})
export class MyComponent {
  pods = [...];

  readConfig: TableCardReadConfig = {
    fields: [
      { label: 'Name',      property: 'metadata.name' },
      { label: 'Namespace', property: 'metadata.namespace' },
    ],
    paginationLimit: 10,
    hasMore: false,
  };

  createConfig: TableCardCreateConfig = {
    fields: [
      { name: 'metadata.name',      label: 'Name',      required: true },
      { name: 'metadata.namespace', label: 'Namespace', required: true },
    ],
    title: 'Create Pod',
    confirmLabel: 'Create',
    cancelLabel: 'Cancel',
  };

  editConfig: TableCardEditConfig = {
    fields: [
      { name: 'metadata.name',      label: 'Name',      disabled: true },
      { name: 'metadata.namespace', label: 'Namespace', required: true },
    ],
    title: 'Edit Pod',
    confirmLabel: 'Save',
  };

  deleteConfig: TableCardDeleteConfig = {
    title: 'Delete Pod?',
    message: 'This action cannot be undone.',
    confirmLabel: 'Delete',
  };

  onCreate(formValue: Record<string, unknown>) { /* ... */ }
  onEdit({ resource, formValue }: { resource: Pod; formValue: Record<string, unknown> }) { /* ... */ }
  onDelete(resource: Pod) { /* ... */ }
  onSearch(query: string) { /* ... */ }
}
```

---

## API

### Inputs

| Input | Type | Required | Default | Description |
|---|---|---|---|---|
| `header` | `string` | yes | — | Text shown in the card header |
| `resources` | `T[]` | yes | — | Data rows passed to the inner table |
| `readConfig` | `TableCardReadConfig` | yes | — | Column definitions and pagination settings |
| `headerTooltip` | `string` | no | — | When set, renders an info icon next to the header. The value is used as the tooltip text |
| `createConfig` | `TableCardCreateConfig` | no | — | Enables the Create button and dialog |
| `editConfig` | `TableCardEditConfig` | no | — | Adds an Edit row-action button and dialog |
| `deleteConfig` | `TableCardDeleteConfig` | no | — | Adds a Delete row-action button with a confirmation dialog |

### Outputs / Events

| Event | Payload | Description |
|---|---|---|
| `searchChanged` | `string` | Emits 300 ms after the search input changes. Empty string when cleared |
| `createConfirmed` | `Record<string, unknown>` | Emitted when the user confirms the create dialog |
| `editConfirmed` | `{ resource: T; formValue: Record<string, unknown> }` | Emitted when the user confirms the edit dialog |
| `deleteConfirmed` | `T` | Emitted when the user confirms the delete dialog |
| `tableRowClicked` | `T` | Emitted when a table row is clicked |
| `loadMoreResources` | — | Emitted when the user triggers load more |
| `paginationLimitChanged` | `number` | Emitted when the user changes the page size |
| `actionButtonClick` | `ValueCellButtonClickEvent<T>` | Emitted for row-action buttons that are not `"edit"` or `"delete"` |

---

## Configuration types

### `TableCardReadConfig`

```ts
interface TableCardReadConfig {
  fields:           TableFieldDefinition[]; // column definitions — see declarative-table.md
  totalItemsCount?: number;                 // total rows across all pages
  paginationLimit?: number;                 // rows per page (default: 5)
  hasMore?:         boolean;                // show Load More trigger
}
```

### `TableCardCreateConfig`

```ts
interface TableCardCreateConfig {
  fields:         FormFieldDefinition[]; // form fields shown in the dialog
  title?:         string;                // dialog heading (default: "Create")
  confirmLabel?:  string;                // confirm button label (default: "Save")
  cancelLabel?:   string;                // cancel button label (default: "Cancel")
}
```

### `TableCardEditConfig`

Extends `TableCardCreateConfig` and adds:

```ts
interface TableCardEditConfig extends TableCardCreateConfig {
  editButtonSettings?: Partial<ButtonSettings>; // override the row-action button appearance
}
```

To make a field read-only in edit mode, set `disabled: true` on the field definition:

```ts
editConfig = {
  fields: [
    { name: 'metadata.name', label: 'Name', disabled: true }, // non-editable
    { name: 'metadata.namespace', label: 'Namespace' },
  ],
};
```

### `TableCardDeleteConfig`

```ts
interface TableCardDeleteConfig {
  title?:                string;                // dialog heading (default: "Confirm Delete")
  message?:              string;                // body text shown in the dialog
  confirmLabel?:         string;                // confirm button label (default: "Delete")
  cancelLabel?:          string;                // cancel button label (default: "Cancel")
  deleteButtonSettings?: Partial<ButtonSettings>; // override the row-action button appearance
}
```

---

## Search

A search icon is always shown in the card header. Clicking it expands a text input with a slide animation. The input collapses automatically when it loses focus and is empty.

The `searchChanged` output is debounced by 300 ms and is the primary hook for filtering:

```ts
onSearch(query: string) {
  this.filteredPods = query
    ? this.pods.filter(p => p.metadata.name.includes(query))
    : this.pods;
}
```

---

## Custom action buttons

To add row-action buttons beyond edit and delete, define button columns directly in `readConfig.fields` and listen to `actionButtonClick`:

```ts
readConfig: TableCardReadConfig = {
  fields: [
    { label: 'Name', property: 'metadata.name' },
    {
      uiSettings: {
        displayAs: 'button',
        buttonSettings: { icon: 'action', design: 'Transparent', action: 'navigate' },
      },
      group: { name: 'actions', label: '', multiline: false },
    },
  ],
};
```

```html
(actionButtonClick)="onAction($event)"
```
