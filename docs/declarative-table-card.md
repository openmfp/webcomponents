# DeclarativeTableCard

A card component that wraps `mfp-declarative-table` and adds a header, search, and optional create/edit/delete dialogs. Form validation and async submit state are owned by the host application.

## Tags

| Usage                              | Tag                               |
| ---------------------------------- | --------------------------------- |
| Angular component                  | `<mfp-declarative-table-card>`    |
| Web Component (framework-agnostic) | `<mfp-wc-declarative-table-card>` |

---

## Usage as a web component

```html
<mfp-wc-declarative-table-card id="card"></mfp-wc-declarative-table-card>

<script type="module">
  const card = document.getElementById('card');

  card.resources = [
    {
      id: '1',
      metadata: { name: 'api-server', namespace: 'default' },
      status: { phase: 'Running' },
    },
  ];

  card.config = {
    header: 'Pods',
    tableConfig: {
      fields: [
        { label: 'Name', property: 'metadata.name' },
        { label: 'Namespace', property: 'metadata.namespace' },
      ],
    },
    createResourceFormConfig: {
      fields: [
        { name: 'metadata.name', label: 'Name', required: true },
        { name: 'metadata.namespace', label: 'Namespace' },
      ],
      title: 'Create Pod',
      confirmLabel: 'Create',
    },
  };

  card.addEventListener('createFieldChange', (event) => {
    const { fieldProperty, value } = event.detail;

    card.createFormState = {
      fieldErrors: {
        ...card.createFormState?.fieldErrors,
        [fieldProperty]: !value ? 'Field is required' : null,
      },
    };
  });

  card.addEventListener('createSubmit', async (event) => {
    await createPod(event.detail);
    card.createFormState = {};
    card.closeCreateDialog();
  });
</script>
```

---

## Usage as an Angular component

```ts
import {
  DeclarativeTableCard,
  FormFieldChangeEvent,
  TableCardConfig,
  TableCardFormState,
} from '@openmfp/webcomponents';

@Component({
  imports: [DeclarativeTableCard],
  template: `
    <mfp-declarative-table-card
      #tableCard
      [config]="config"
      [resources]="pods"
      [createFormState]="createFormState"
      [editFormState]="editFormState"
      (createFieldChange)="onCreateFieldChange($event)"
      (editFieldChange)="onEditFieldChange($event)"
      (createSubmit)="onCreateSubmit($event, tableCard)"
      (editSubmit)="onEditSubmit($event, tableCard)"
      (deleteSubmit)="onDeleteSubmit($event, tableCard)"
      (searchChanged)="onSearch($event)"
      (searchSubmit)="onSearch($event)"
      (scopeChanged)="onSearch($event)"
    />
  `,
})
export class MyComponent {
  pods = [];
  createFormState: TableCardFormState = {};
  editFormState: TableCardFormState = {};

  config: TableCardConfig = {
    header: 'Pods',
    tableConfig: {
      fields: [
        { label: 'Name', property: 'metadata.name' },
        { label: 'Namespace', property: 'metadata.namespace' },
      ],
    },
    createResourceFormConfig: {
      fields: [
        { name: 'metadata.name', label: 'Name', required: true },
        { name: 'metadata.namespace', label: 'Namespace' },
      ],
      title: 'Create Pod',
      confirmLabel: 'Create',
    },
    deleteResourceConfirmationConfig: {
      title: 'Delete Pod?',
      message: 'This action cannot be undone.',
      confirmLabel: 'Delete',
    },
  };

  onCreateFieldChange(event: FormFieldChangeEvent): void {
    const { fieldProperty, value } = event;
    this.createFormState = {
      fieldErrors: {
        ...this.createFormState.fieldErrors,
        [fieldProperty]: !value ? 'Field is required' : null,
      },
    };
  }

  onEditFieldChange(event: {
    resource: Pod;
    formChangeEvent: FormFieldChangeEvent;
  }): void {
    // Validate event.formChangeEvent and update editFormState.
  }

  async onCreateSubmit(
    value: Record<string, unknown>,
    tableCard: DeclarativeTableCard<Pod>,
  ): Promise<void> {
    await this.createPod(value);
    this.createFormState = {};
    tableCard.closeCreateDialog();
  }

  async onEditSubmit(
    event: { resource: Pod; value: Record<string, unknown> },
    tableCard: DeclarativeTableCard<Pod>,
  ): Promise<void> {
    await this.updatePod(event.resource, event.value);
    this.editFormState = {};
    tableCard.closeEditDialog();
  }

  async onDeleteSubmit(
    pod: Pod,
    tableCard: DeclarativeTableCard<Pod>,
  ): Promise<void> {
    await this.deletePod(pod);
    tableCard.closeDeleteDialog();
  }

  onSearch({ value, scope }: { value: string; scope?: string }): void {
    // Re-fetch / filter `pods` based on the current search text and scope.
    this.reloadPods({ query: value, scope });
  }
}
```

---

## API

### Inputs

| Input             | Type                 | Required | Default | Description                                               |
| ----------------- | -------------------- | -------- | ------- | --------------------------------------------------------- |
| `resources`       | `T[]`                | yes      | -       | Data rows passed to the inner table                       |
| `config`          | `TableCardConfig`    | yes      | -       | Static table, button, and dialog configuration            |
| `createFormState` | `TableCardFormState` | no       | `{}`    | Runtime validation and submit state for the create dialog |
| `editFormState`   | `TableCardFormState` | no       | `{}`    | Runtime validation and submit state for the edit dialog   |

### Outputs / Events

| Event                    | Payload                                           | Description                                                  |
| ------------------------ | ------------------------------------------------- | ------------------------------------------------------------ |
| `createFieldChange`       | `FormFieldChangeEvent`                            | Re-emits per-field change from the create form               |
| `editFieldChange`         | `{ resource: T; formChangeEvent: FormFieldChangeEvent }` | Re-emits per-field change from the edit form with resource   |
| `createSubmit`           | `Record<string, unknown>`                         | Fires when the create dialog Save button is clicked          |
| `editSubmit`             | `{ resource: T; value: Record<string, unknown> }` | Fires when the edit dialog Save button is clicked            |
| `deleteSubmit`           | `T`                                               | Fires when the delete dialog Delete button is clicked        |
| `searchChanged`          | `{ value: string; scope?: string }`               | Emits 300 ms after the search input changes; `scope` reflects the currently active scope (if any) |
| `searchSubmit`           | `{ value: string; scope?: string }`               | Emits synchronously when the user submits the search (Enter or search icon) |
| `scopeChanged`           | `{ value: string; scope?: string }`               | Emits synchronously when the user picks a different scope from the dropdown; `value` is the current in-flight search text |
| `tableRowClicked`        | `T`                                               | Emits when a table row is clicked                            |
| `loadMoreResources`      | -                                                 | Emits when the user triggers load more                       |
| `paginationLimitChanged` | `number`                                          | Emits when the user changes page size                        |
| `actionButtonClick`      | `ResourceFieldButtonClickEvent<T>`                    | Emits for row-action buttons other than built-in edit/delete |

### Methods

| Method                | Description              |
| --------------------- | ------------------------ |
| `closeCreateDialog()` | Closes the create dialog |
| `closeEditDialog()`   | Closes the edit dialog   |
| `closeDeleteDialog()` | Closes the delete dialog |

Submit events do not close dialogs automatically. Close the dialog after successful validation, save, or delete.

---

## Configuration types

```ts
interface TableCardConfig {
  header?: string;
  headerTooltip?: string;
  tableConfig: TableConfig;
  buttonSettings?: TableCardButtonSettings;
  searchConfig?: TableCardSearchConfig;
  createResourceFormConfig?: ResourceFormConfig;
  editResourceFormConfig?: ResourceFormConfig;
  deleteResourceConfirmationConfig?: DeleteResourceConfirmationConfig;
}

/** One option in the `<ui5-search>` scopes dropdown. */
interface Scope {
  /** Visible label shown in the dropdown. */
  label: string;
  /** Logical value forwarded in `scopeChanged` / `searchSubmit` events. Used by `<ui5-search-scope value>` to match `scopeValue`. */
  value?: string;
}

/** Configuration for the `<ui5-search>` element rendered in the table-card header. */
interface TableCardSearchConfig {
  /** ARIA name for the search input. */
  accessibleName?: string;
  /** Placeholder text shown when the input is empty. */
  placeholder?: string;
  /** When `true`, the clear icon is shown inside the input. Default: `true`. */
  showClearIcon?: boolean;
  /** Initial / controlled scope `value` (matches one of `scopes[].value`). */
  scopeValue?: string;
  /** Initial / controlled search text value. */
  value?: string;
  /** Scope options shown in the scopes dropdown. Omit or leave empty to render the input without a scope dropdown. */
  scopes?: Scope[];
  /** When `true`, `<ui5-search>` is always visible in the toolbar.
   *  When `false` (default), the search is hidden behind a search-toggle icon button; clicking it expands the search and clicking it again (or losing focus on an empty input) collapses the search. Collapse preserves the entered text and active scope — re-expanding restores the in-flight query. Use the built-in clear icon (`showClearIcon`) to clear the value. */
  alwaysOnDisplay?: boolean;
}

interface TableConfig {
  fields: TableFieldDefinition[];
  totalItemsCount?: number;
  paginationLimit?: number;
  hasMore?: boolean;
  height?: number;           // fixed table height in pixels; enables scrollable body
  growMode?: 'Button' | 'Scroll'; // default: 'Button'
  loadMoreButtonText?: string;    // button label when growMode is 'Button'; default: 'Load More'
}

interface ResourceFormConfig {
  fields: FormFieldDefinition[];
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

interface TableCardFormState {
  fieldErrors?: FormFieldErrors;
}
```

`ResourceFormConfig` is static. Keep runtime errors in `createFormState` / `editFormState`. The submit button is disabled when any entry in `fieldErrors` is truthy.

> `TableConfig` is declared in `declarative-ui/table` and re-exported from `declarative-ui/table-card`. Importing it from `@openmfp/webcomponents` (the public-api barrel) continues to work unchanged.

---

## Search & Scopes

When `searchConfig` is set on `TableCardConfig`, the card renders a [`<ui5-search>`](https://ui5.github.io/webcomponents/components/fiori/Search/) element in the toolbar. Omit `searchConfig` to hide the search entirely. The previous `resourcesSearchable` boolean has been removed.

### Visibility (`alwaysOnDisplay`)

| `alwaysOnDisplay` | Toolbar UX |
| ----------------- | ---------- |
| `true`            | `<ui5-search>` is rendered inline at all times. No toggle button is shown. |
| `false` (default) | The search is hidden behind a search-toggle icon button. Clicking the button expands the input; clicking it again — or blurring an empty input — collapses it. `buttonSettings.searchButton` overrides the toggle button's icon, text, and design. |

### Collapse preserves state

Collapsing the search (toggle button or blur-on-empty) does **not** clear the entered text or the active scope. Re-expanding the search restores the same in-flight query. To clear the value the user clicks the built-in clear icon inside `<ui5-search>` (`showClearIcon` defaults to `true`), which fires `searchChanged` with an empty `value` through the normal 300 ms debounce.

### Event contract

The host owns data fetching and filtering. The card forwards user actions verbatim:

| Event           | When | Payload |
| --------------- | ---- | ------- |
| `searchChanged` | 300 ms after the input value changes (typing or clear icon) | `{ value, scope }` where `scope` is the currently active scope |
| `searchSubmit`  | User presses Enter or clicks the search icon (synchronous) | `{ value, scope }` |
| `scopeChanged`  | User picks a different scope from the dropdown (synchronous) | `{ value, scope }` where `value` is the current in-flight search text |

### Example — "My Contributions" / "All" scopes

```ts
import {
  DeclarativeTableCard,
  TableCardConfig,
} from '@openmfp/webcomponents';

@Component({
  imports: [DeclarativeTableCard],
  template: `
    <mfp-declarative-table-card
      [config]="config"
      [resources]="pods"
      (searchChanged)="onSearchChanged($event)"
      (searchSubmit)="onSearchSubmit($event)"
      (scopeChanged)="onScopeChanged($event)"
    />
  `,
})
export class MyComponent {
  pods: Pod[] = [];

  config: TableCardConfig = {
    header: 'Pods',
    tableConfig: {
      fields: [
        { label: 'Name', property: 'metadata.name' },
        { label: 'Namespace', property: 'metadata.namespace' },
      ],
    },
    searchConfig: {
      placeholder: 'Search pods…',
      accessibleName: 'Search pods',
      scopeValue: 'all',
      scopes: [
        { label: 'All', value: 'all' },
        { label: 'My Contributions', value: 'mine' },
      ],
    },
  };

  onSearchChanged({ value, scope }: { value: string; scope?: string }): void {
    // Debounced — call your list/search endpoint here.
    this.reloadPods({ query: value, scope });
  }

  onSearchSubmit({ value, scope }: { value: string; scope?: string }): void {
    // Synchronous — fired on Enter or the search icon. Useful for forcing
    // an immediate refresh that bypasses the 300 ms debounce.
    this.reloadPods({ query: value, scope });
  }

  onScopeChanged({ value, scope }: { value: string; scope?: string }): void {
    // Synchronous — re-fetch using the new scope and the current in-flight text.
    this.reloadPods({ query: value, scope });
  }
}
```

Set `alwaysOnDisplay: true` on `searchConfig` to skip the toggle UX and render `<ui5-search>` inline. Omit `scopes` (or pass an empty array) to render the input without a scope dropdown.

---

## Actions column

When `editResourceFormConfig` or `deleteResourceConfirmationConfig` is set, the component automatically appends icon buttons to a grouped column named `actions` at the end of the table.

### Customising built-in action buttons

Use `buttonSettings` inside `TableCardConfig` to override the default icon, text, or design of the built-in edit / delete buttons:

```ts
config: TableCardConfig = {
  // ...
  buttonSettings: {
    editButton:   { text: 'Edit resource',   icon: 'edit',    action: 'edit' },
    deleteButton: { text: 'Delete resource', icon: 'decline', action: 'delete' },
  },
};
```

`ButtonSettings` fields available for each button:

| Field    | Type     | Description                                                       |
| -------- | -------- | ----------------------------------------------------------------- |
| `text`   | `string` | Button label (icon-only when omitted)                             |
| `icon`   | `string` | UI5 icon name                                                     |
| `design` | `string` | `'Default'` \| `'Transparent'` \| `'Emphasized'` \| …            |
| `action` | `string` | Must stay `'edit'` / `'delete'` to keep built-in dialog handling  |

### Adding custom action buttons

Place extra `TableFieldDefinition` entries with `group: { name: 'actions' }` inside `tableConfig.fields`. The component appends the built-in edit / delete buttons after them.

```ts
tableConfig: {
  fields: [
    ...BASE_COLUMNS,
    {
      uiSettings: {
        displayAs: 'button',
        align: 'end',
        buttonSettings: { icon: 'detail-view', design: 'Transparent', action: 'view' },
      },
      group: { name: 'actions', label: '', multiline: false },
    },
  ],
},
```

Custom button clicks that are not `'edit'` or `'delete'` are forwarded through the `actionButtonClick` output.

### Controlling the actions column width

The column width is determined by `uiSettings.columnWidth` of the **first** field in the `actions` group (see [grouped columns](./declarative-table.md#grouped-columns)). Place a custom action field first and set `columnWidth` there:

```ts
tableConfig: {
  fields: [
    ...BASE_COLUMNS,
    {
      uiSettings: {
        columnWidth: '90px',   // ← drives the header cell width for the whole group
      },
      group: { name: 'actions', label: '', multiline: false },
    },
  ],
},
```

> **Note:** if only built-in edit / delete buttons are used (no custom field first), the column width defaults to `auto`. Add a field first to gain explicit width control.
