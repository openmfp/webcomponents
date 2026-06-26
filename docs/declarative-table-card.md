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
      (searchChanged)="onSearchChanged($event)"
      (searchSubmit)="onSearchSubmit($event)"
      (scopeChanged)="onScopeChanged($event)"
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

  onSearchChanged(value: string | null): void {
    // Debounced (~300 ms) — fires while the user types and on clear-icon click.
    // The currently active scope is tracked separately via `scopeChanged`.
    this.reloadPods({ query: value ?? '' });
  }

  onSearchSubmit(value: string | null): void {
    // Synchronous — fired on Enter or the search icon. Useful for forcing
    // an immediate refresh that bypasses the debounce.
    this.reloadPods({ query: value ?? '' });
  }

  onScopeChanged(scope: Scope | undefined): void {
    // Synchronous — re-fetch using the new scope.
    this.reloadPods({ scope });
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
| `searchChanged`          | `string \| null`                                  | Emits ~300 ms after the search input changes (typing or clear icon click). The empty string is emitted immediately on clear. |
| `searchSubmit`           | `string \| null`                                  | Emits synchronously when the user submits the search (Enter or search icon) |
| `scopeChanged`           | `Scope \| undefined`                              | Emits synchronously when the user picks a different scope from the dropdown. The full scope object is forwarded; `undefined` means "no scope selected". |
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
  /** Stable identifier used to match `initialScopeValue` and as `<ui5-search-scope value>`. */
  id: string;
  /** Visible label shown in the dropdown. */
  label: string;
  /** Logical value forwarded to the host (e.g. for filtering, URL query string). */
  value: string;
  /** Name of the property this scope filters by — used by the host to build the filter expression. */
  property: string;
}

/** Configuration for the `<ui5-search>` element rendered in the table-card header. */
interface TableCardSearchConfig {
  /** ARIA name for the search input. */
  accessibleName?: string;
  /** Placeholder text shown when the input is empty. */
  placeholder?: string;
  /** When `true`, the clear icon is shown inside the input. Default: `true`. */
  showClearIcon?: boolean;
  /** Initial / controlled scope — must be one of the entries in `scopes`. Matched against `scopes[].id`. */
  initialScopeValue?: Scope;
  /** Initial / controlled search text value. */
  value?: string;
  /** Scope options shown in the scopes dropdown. Omit or leave empty to render the input without a scope dropdown. */
  scopes?: Scope[];
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

When `searchConfig` is set on `TableCardConfig`, the card renders a [`<ui5-search>`](https://ui5.github.io/webcomponents/components/fiori/Search/) element inline in the toolbar. Omit `searchConfig` to hide the search entirely.

### Clearing the input

`showClearIcon` defaults to `true` — the user can click the inline X icon to empty the input. Clearing emits `searchChanged` with an empty string **immediately** (bypassing the typing debounce), so the host can refetch / un-filter without waiting.

### Scopes

`scopes` is an array of `Scope` objects shown in the dropdown next to the search input. Each scope is matched by its `id`; `initialScopeValue` (a full `Scope`) selects the initially-active scope. Omit `scopes` (or pass an empty array) to render the input without a scope dropdown.

The `value` and `property` fields on `Scope` are passed through verbatim in `scopeChanged` — the host decides how to use them (e.g. as `?<property>=<value>` in the URL, as an OpenSearch `filter=<property>=<value>` parameter, etc.).

### Event contract

The host owns data fetching and filtering. The card forwards user actions verbatim:

| Event           | When | Payload |
| --------------- | ---- | ------- |
| `searchChanged` | ~300 ms after the input value changes while typing; **immediately** when the clear icon is clicked | `string \| null` — the current input value |
| `searchSubmit`  | User presses Enter or clicks the search icon (synchronous) | `string \| null` — the current input value |
| `scopeChanged`  | User picks a different scope from the dropdown (synchronous) | `Scope \| undefined` — the full scope object, or `undefined` when no scope is active |

The search text and the active scope are emitted on separate events. The host is responsible for keeping the most recent value of each and combining them when issuing the next request.

### Example — "My Contributions" / "All" scopes

```ts
import {
  DeclarativeTableCard,
  Scope,
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

  private currentQuery = '';
  private currentScope: Scope | undefined;

  private readonly ALL_SCOPE: Scope = {
    id: 'all',
    label: 'All',
    value: '*',
    property: 'owner',
  };
  private readonly MINE_SCOPE: Scope = {
    id: 'mine',
    label: 'My Contributions',
    value: 'me',
    property: 'owner',
  };

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
      scopes: [this.ALL_SCOPE, this.MINE_SCOPE],
      initialScopeValue: this.ALL_SCOPE,
    },
  };

  onSearchChanged(value: string | null): void {
    // Debounced while typing; instant on clear. Combine with the current scope
    // when reloading.
    this.currentQuery = value ?? '';
    this.reload();
  }

  onSearchSubmit(value: string | null): void {
    // Synchronous — fired on Enter or the search icon. Useful for forcing
    // an immediate refresh that bypasses the typing debounce.
    this.currentQuery = value ?? '';
    this.reload();
  }

  onScopeChanged(scope: Scope | undefined): void {
    // Synchronous — re-fetch with the current in-flight search text and the
    // newly-selected scope.
    this.currentScope = scope;
    this.reload();
  }

  private reload(): void {
    this.reloadPods({
      query: this.currentQuery,
      filter: this.currentScope
        ? `${this.currentScope.property}=${this.currentScope.value}`
        : undefined,
    });
  }
}
```

Omit `scopes` (or pass an empty array) to render the input without a scope dropdown.

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
