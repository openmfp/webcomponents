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
| `tableRowClicked`        | `T`                                               | Emits when a table row is clicked                            |
| `loadMoreResources`      | -                                                 | Emits when the user triggers load more                       |
| `paginationLimitChanged` | `number`                                          | Emits when the user changes page size                        |
| `actionButtonClick`      | `ValueCellButtonClickEvent<T>`                    | Emits for row-action buttons other than built-in edit/delete |

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
