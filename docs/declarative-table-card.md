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
| `searchChanged`          | `string`                                          | Emits 300 ms after the search input changes                  |
| `filterTabChanged`       | `FieldFilterDefinition \| undefined`              | Emits when the user picks a filter tab |
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
  header: string;
  headerTooltip?: string;
  tableConfig: TableConfig;
  buttonSettings?: TableCardButtonSettings;
  createResourceFormConfig?: ResourceFormConfig;
  editResourceFormConfig?: ResourceFormConfig;
  deleteResourceConfirmationConfig?: DeleteResourceConfirmationConfig;
  /** Predefined filters rendered as a horizontal tab strip above the table. */
  filterTabs?: FieldFilterDefinition[];
}

interface FieldFilterDefinition {
  /** Visible label rendered as the tab text. */
  label: string;
  /** Name of the property the value applies to. Passed through to the host. */
  property: string;
  /** Value compared against `property` when the host applies the filter. */
  value: string;
  /** When `true`, this tab is selected on initial render; otherwise the first tab is. */
  default?: boolean;
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

---

## Filter tabs

When `filterTabs` is set on `TableCardConfig`, the card renders a horizontal tab strip above the table — one tab per `FieldFilterDefinition`. Omit `filterTabs` (or pass an empty array) to hide the strip entirely. The strip does **not** auto-prepend an "All / no filter" tab; if you want one, author it explicitly as a regular filter entry (e.g. `{ label: 'All', property: 'category', value: '*' }`).

### Visual behavior

| State | Styling |
| ----- | ------- |
| Inactive tab | Standard text color, no underline |
| Active tab | SAP blue (`var(--sapButton_Selected_TextColor)`) + 3 px blue underline bar directly below the label |
| Hover (inactive) | Subtle color shift toward the link color |

When the combined tab width exceeds the card width, the strip becomes a **horizontal carousel**: left/right chevron buttons appear at the edges only when there's room to scroll that direction. Each chevron click scrolls by ~70 % of the visible width so one tab overlaps for context. The native scrollbar is hidden; navigation is via the chevrons (with a `ResizeObserver` watching the strip to keep the chevron-visibility state in sync as the card resizes).

### Initial selection

- If any `FieldFilterDefinition` has `default: true`, it is the active tab on first render.
- Otherwise, the first tab in the array is active.

### Responding to selection changes

The host owns the actual filtering — the card just emits which tab the user picked. Subscribe to `filterTabChanged`:

```ts
import {
  DeclarativeTableCard,
  FieldFilterDefinition,
  TableCardConfig,
} from '@openmfp/webcomponents';

@Component({
  imports: [DeclarativeTableCard],
  template: `
    <mfp-declarative-table-card
      [config]="config"
      [resources]="visiblePods"
      (filterTabChanged)="onFilterTabChanged($event)"
    />
  `,
})
export class MyComponent {
  pods: Pod[] = [];
  visiblePods: Pod[] = [];

  config: TableCardConfig = {
    header: 'Pods',
    tableConfig: {
      fields: [
        { label: 'Name', property: 'metadata.name' },
        { label: 'Namespace', property: 'metadata.namespace' },
        { label: 'Phase', property: 'status.phase' },
      ],
    },
    filterTabs: [
      {
        label: 'Running',
        property: 'status.phase',
        value: 'Running',
        default: true,
      },
      { label: 'Pending', property: 'status.phase', value: 'Pending' },
      { label: 'Failed',  property: 'status.phase', value: 'Failed'  },
    ],
  };

  onFilterTabChanged(tab: FieldFilterDefinition | undefined): void {
    if (!tab) {
      // Defensive: the strip only emits user-picked tabs, but the signature
      // permits `undefined` for forward compatibility. Treat it as "no filter".
      this.visiblePods = this.pods;
      return;
    }

    // Use `property` + `value` to derive the filtered set. `property` is a
    // dotted JSON path against each resource; the helper below handles nesting.
    this.visiblePods = this.pods.filter(
      (pod) => readByPath(pod, tab.property) === tab.value,
    );
  }
}

// Small helper — pick whatever path resolver the rest of your app uses.
function readByPath(obj: any, path: string): unknown {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}
```

### Server-backed filtering

For larger datasets the host typically forwards the picked tab to its data layer instead of filtering in memory. Two common shapes:

```ts
// Pass through as a filter parameter to an OpenSearch-style backend.
onFilterTabChanged(tab: FieldFilterDefinition | undefined): void {
  this.reload({
    filter: tab ? `${tab.property}=${tab.value}` : undefined,
  });
}

// Or roundtrip via the URL so reloads / shared links restore the tab.
onFilterTabChanged(tab: FieldFilterDefinition | undefined): void {
  this.router.navigate([], {
    queryParams: { [tab?.property ?? 'filter']: tab?.value },
    queryParamsHandling: 'merge',
  });
}
```

The active tab is owned by the card internally — the host doesn't need to set or reset it. The `default: true` flag is consulted only on initial render; if the host later swaps in a fresh `filterTabs` array, the card re-seeds from `default: true` (falling back to the first tab) in that new array. The host never has to compute "which tab should be selected".

### Notes

- **Single-select only.** Exactly one tab is active at any time; clicking another deactivates the previous. No multi-select API.
- **No state on the host side is required.** Listen to `filterTabChanged` and update your data; the card handles visual selection.
- **Keyboard accessible.** Each tab is a real `<button role="tab">`; Tab focuses, Enter / Space activates. The container is `role="tablist"` and each tab carries `aria-selected`.

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
