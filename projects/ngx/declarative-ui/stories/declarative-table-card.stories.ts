import type { FormFieldChangeEvent, FormFieldDefinition } from '../form/models';
import type { GenericResource } from '../models/resource';
import { DeclarativeTableCard } from '../table-card/declarative-table-card.component';
import type {
  DeleteResourceConfirmationConfig,
  FieldFilterDefinition,
  ResourceFormConfig,
  TableCardConfig,
  TableCardFormState,
  TableConfig,
} from '../table-card/models/configs';
import type { TableFieldDefinition } from '../table/models';
import { Component, Input } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';
import '@ui5/webcomponents-icons/dist/detail-view.js';
import '@ui5/webcomponents-icons/dist/inspect.js';
import '@ui5/webcomponents-icons/dist/restart.js';
import '@ui5/webcomponents-icons/dist/stop.js';

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

interface Pod extends GenericResource {
  id: string;
  metadata: { name: string; namespace: string; uid: string };
  status: { phase: string; ready: boolean; restarts: number; message?: string };
  spec: { nodeName: string; image: string };
}

const PODS: Pod[] = [
  {
    id: 'abc-001',
    metadata: { name: 'api-server-7d9f', namespace: 'default', uid: 'abc-001' },
    status: { phase: 'Running', ready: true, restarts: 0 },
    spec: { nodeName: 'node-1', image: 'nginx:1.25' },
    isAvailable: true,
  },
  {
    id: 'abc-002',
    metadata: { name: 'worker-5bc8', namespace: 'default', uid: 'abc-002' },
    status: {
      phase: 'Pending',
      ready: false,
      restarts: 3,
      message: 'ImagePullBackOff',
    },
    spec: { nodeName: 'node-2', image: 'myapp:latest' },
    isAvailable: false,
    accessibleName: 'Pod unavailable: ImagePullBackOff',
  },
  {
    id: 'abc-003',
    metadata: {
      name: 'cache-redis-0',
      namespace: 'kube-system',
      uid: 'abc-003',
    },
    status: { phase: 'Running', ready: true, restarts: 1 },
    spec: { nodeName: 'node-1', image: 'redis:7' },
    isAvailable: true,
  },
  {
    id: 'abc-004',
    metadata: {
      name: 'db-postgres-0',
      namespace: 'production',
      uid: 'abc-004',
    },
    status: {
      phase: 'Failed',
      ready: false,
      restarts: 5,
      message: 'CrashLoopBackOff',
    },
    spec: { nodeName: 'node-3', image: 'postgres:16' },
    isAvailable: false,
    accessibleName: 'Pod unavailable: CrashLoopBackOff',
  },
  {
    id: 'abc-005',
    metadata: {
      name: 'ingress-ctrl-xkp',
      namespace: 'default',
      uid: 'abc-005',
    },
    status: { phase: 'Running', ready: true, restarts: 0 },
    spec: { nodeName: 'node-2', image: 'nginx-ingress:1.9' },
    isAvailable: true,
  },
];

// ---------------------------------------------------------------------------
// Shared definitions
// ---------------------------------------------------------------------------

const BASE_COLUMNS: TableFieldDefinition[] = [
  { label: 'Name', property: 'metadata.name' },
  { label: 'Namespace', property: 'metadata.namespace' },
  { label: 'Phase', property: 'status.phase' },
  { label: 'Node', property: 'spec.nodeName' },
];

const POD_FORM_FIELDS: FormFieldDefinition[] = [
  { name: 'metadata.name', label: 'Name', required: true },
  {
    name: 'metadata.namespace',
    label: 'Namespace',
    required: true,
    values: ['default', 'kube-system', 'production'],
  },
];

const CREATE_FORM_STATE_FIELDS: FormFieldDefinition[] = [
  {
    name: 'metadata.name',
    label: 'Name',
    required: true,
    validation: 'onChange',
  },
  {
    name: 'metadata.namespace',
    label: 'Namespace',
    required: true,
    validation: 'onBlur',
  },
];

const POD_EDIT_FORM_FIELDS: FormFieldDefinition[] = [
  { name: 'metadata.name', label: 'Name', required: true, disabled: true },
  {
    name: 'metadata.namespace',
    label: 'Namespace',
    required: true,
    values: ['default', 'kube-system', 'production'],
  },
];

const BASE_TABLE_CONFIG: TableConfig = {
  fields: BASE_COLUMNS,
  paginationLimit: 5,
  hasMore: false,
};

const BASE_CONFIG: TableCardConfig = {
  header: 'Pods',
  searchConfig: {},
  tableConfig: BASE_TABLE_CONFIG,
};

// ---------------------------------------------------------------------------
// Wrapper component for stories that need host-owned state
// ---------------------------------------------------------------------------

@Component({
  selector: 'mfp-declarative-table-card-create-story',
  imports: [DeclarativeTableCard],
  template: `
    <mfp-declarative-table-card
      #tableCard
      [config]="config"
      [createFormState]="createFormState"
      [permissions]="permissions"
      [resources]="resources"
      (createFieldChange)="onCreateFieldChange($event)"
      (createSubmit)="onCreateSubmit($event, tableCard)"
    />
  `,
})
class DeclarativeTableCardCreateStory {
  @Input() config!: TableCardConfig;
  @Input() resources: GenericResource[] = [];
  @Input() permissions: Record<string, string[]> | undefined;
  createFormState: TableCardFormState = {};

  onCreateFieldChange(event: FormFieldChangeEvent): void {
    const fieldErrors: Record<string, string | null> = {
      ...this.createFormState.fieldErrors,
    };

    switch (event.fieldProperty) {
      case 'metadata.name':
        fieldErrors[event.fieldProperty] = event.value
          ? null
          : 'Name is required';
        break;
      case 'metadata.namespace':
        fieldErrors[event.fieldProperty] = event.value
          ? null
          : 'Namespace is required';
        break;
    }

    this.createFormState = { fieldErrors };
  }

  onCreateSubmit(
    _value: Record<string, unknown>,
    tableCard: DeclarativeTableCard<GenericResource>,
  ): void {
    setTimeout(() => {
      alert(JSON.stringify(_value));
      tableCard.closeCreateDialog();
    }, 1000);
  }
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<DeclarativeTableCard<GenericResource>> = {
  title: 'Declarative UI / DeclarativeTableCard',
  component: DeclarativeTableCardCreateStory,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    config: { control: 'object' },
    createFormState: { control: 'object' },
    editFormState: { control: 'object' },
  },
  args: {
    config: BASE_CONFIG,
    editFormState: {} satisfies TableCardFormState,
    resources: PODS,
  },
};

export default meta;
type Story = StoryObj<DeclarativeTableCard<GenericResource>>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/** Minimal card: header, columns, and resources. No dialogs or action buttons. */
export const Basic: Story = {};

/** Header with an info icon that shows a tooltip on hover. */
export const WithHeaderTooltip: Story = {
  args: {
    config: {
      ...BASE_CONFIG,
      headerTooltip: 'This table lists all pods running in the cluster.',
    },
  },
};

/** Adds a Create button that opens a dialog with name + namespace fields. */
export const WithCreate: Story = {
  args: {
    config: {
      ...BASE_CONFIG,
      createResourceFormConfig: {
        fields: POD_FORM_FIELDS,
        title: 'Create Pod',
        confirmLabel: 'Create',
        cancelLabel: 'Cancel',
      } satisfies ResourceFormConfig,
    },
  },
};

/** Create dialog with host-owned validation and submit state. */
export const WithCreateFormState: StoryObj<DeclarativeTableCardCreateStory> = {
  render: (args) => ({
    props: args,
    component: DeclarativeTableCardCreateStory,
  }),
  args: {
    config: {
      ...BASE_CONFIG,
      createResourceFormConfig: {
        fields: CREATE_FORM_STATE_FIELDS,
        title: 'Create Pod',
        confirmLabel: 'Create',
        cancelLabel: 'Cancel',
      } satisfies ResourceFormConfig,
    },
    resources: PODS,
  },
};

/** Adds Edit row-action button. Clicking it opens a pre-filled dialog. */
export const WithEdit: Story = {
  args: {
    config: {
      ...BASE_CONFIG,
      editResourceFormConfig: () =>
        ({
          fields: POD_EDIT_FORM_FIELDS,
          title: 'Edit Pod',
          confirmLabel: 'Save',
          cancelLabel: 'Cancel',
        }) satisfies ResourceFormConfig,
    },
  },
};

/** Adds Delete row-action button with a confirmation dialog. */
export const WithDelete: Story = {
  args: {
    config: {
      ...BASE_CONFIG,
      deleteResourceConfirmationConfig: () =>
        ({
          title: 'Delete Pod?',
          message:
            'This action cannot be undone. The pod will be permanently removed.',
          confirmLabel: 'Delete',
          cancelLabel: 'Cancel',
        }) satisfies DeleteResourceConfirmationConfig,
    },
  },
};

/** Full action suite: Create button, Edit row button, Delete row button. */
export const WithAllActions: Story = {
  args: {
    config: {
      ...BASE_CONFIG,
      createResourceFormConfig: {
        fields: POD_FORM_FIELDS,
        title: 'Create Pod',
        confirmLabel: 'Create',
        cancelLabel: 'Cancel',
      } satisfies ResourceFormConfig,
      editResourceFormConfig: () =>
        ({
          fields: POD_EDIT_FORM_FIELDS,
          title: 'Edit Pod',
          confirmLabel: 'Save',
          cancelLabel: 'Cancel',
        }) satisfies ResourceFormConfig,
      deleteResourceConfirmationConfig: () =>
        ({
          title: 'Delete Pod?',
          message:
            'This action cannot be undone. The pod will be permanently removed.',
          confirmLabel: 'Delete',
          cancelLabel: 'Cancel',
        }) satisfies DeleteResourceConfirmationConfig,
    },
  },
};

/**
 * Edit and delete actions alongside a custom action button.
 * Verifies that the actions column stays narrow and right-aligned even
 * when additional buttons are present.
 */
export const WithCustomActions: Story = {
  args: {
    config: {
      ...BASE_CONFIG,
      tableConfig: {
        ...BASE_TABLE_CONFIG,
        fields: [
          ...BASE_COLUMNS,
          {
            uiSettings: {
              displayAs: 'button',
              align: 'end',
              buttonSettings: {
                icon: 'detail-view',
                design: 'Transparent',
                action: 'view',
                tooltip: 'View details',
              },
            },
            group: { name: 'actions', label: '', multiline: false },
          } satisfies TableFieldDefinition,
        ],
      },
      editResourceFormConfig: () =>
        ({
          fields: POD_EDIT_FORM_FIELDS,
          title: 'Edit Pod',
          confirmLabel: 'Save',
          cancelLabel: 'Cancel',
        }) satisfies ResourceFormConfig,
      deleteResourceConfirmationConfig: () =>
        ({
          title: 'Delete Pod?',
          message:
            'This action cannot be undone. The pod will be permanently removed.',
          confirmLabel: 'Delete',
          cancelLabel: 'Cancel',
        }) satisfies DeleteResourceConfirmationConfig,
    },
  },
};

/** Empty resources array triggers the illustrated empty-state message inside the table. */
export const EmptyState: Story = {
  args: {
    resources: [],
  },
};

/**
 * Customises the toolbar's Create and Search buttons via `buttonSettings`.
 * Per-row edit/delete button text is not configurable via `buttonSettings`
 * (those keys were removed when edit/delete moved to the factory-function
 * configs); their appearance is fixed by the component.
 */
export const WithTextActions: Story = {
  args: {
    config: {
      ...BASE_CONFIG,
      buttonSettings: {
        createButton: { text: 'Add Pod', icon: 'add' },
        searchButton: { text: 'Find', icon: 'search' },
      },
      createResourceFormConfig: {
        fields: POD_FORM_FIELDS,
        title: 'Add Pod',
        confirmLabel: 'Add',
        cancelLabel: 'Cancel',
      } satisfies ResourceFormConfig,
      editResourceFormConfig: () =>
        ({
          fields: POD_EDIT_FORM_FIELDS,
          title: 'Edit Pod',
          confirmLabel: 'Save',
          cancelLabel: 'Cancel',
        }) satisfies ResourceFormConfig,
      deleteResourceConfirmationConfig: () =>
        ({
          title: 'Delete Pod?',
          message: 'This action cannot be undone.',
          confirmLabel: 'Delete',
          cancelLabel: 'Cancel',
        }) satisfies DeleteResourceConfirmationConfig,
    },
  },
};

/**
 * Actions column constrained to 90 px via `columnWidth`.
 * The width is driven by the first field in the `actions` group — here a custom
 * detail-view button placed before the auto-generated edit / delete buttons.
 */
export const WithNarrowActionsColumn: Story = {
  args: {
    config: {
      ...BASE_CONFIG,
      tableConfig: {
        ...BASE_TABLE_CONFIG,
        fields: [
          ...BASE_COLUMNS,
          {
            uiSettings: {
              columnWidth: '90px',
            },
            group: { name: 'actions', label: '', multiline: false },
          } satisfies TableFieldDefinition,
        ],
      },
      editResourceFormConfig: () =>
        ({
          fields: POD_EDIT_FORM_FIELDS,
          title: 'Edit Pod',
          confirmLabel: 'Save',
          cancelLabel: 'Cancel',
        }) satisfies ResourceFormConfig,
      deleteResourceConfirmationConfig: () =>
        ({
          title: 'Delete Pod?',
          message:
            'This action cannot be undone. The pod will be permanently removed.',
          confirmLabel: 'Delete',
          cancelLabel: 'Cancel',
        }) satisfies DeleteResourceConfirmationConfig,
    },
  },
};

/** Shows pagination controls when hasMore is true. */
export const WithPagination: Story = {
  args: {
    config: {
      ...BASE_CONFIG,
      tableConfig: {
        ...BASE_TABLE_CONFIG,
        totalItemsCount: 42,
        paginationLimit: 5,
        hasMore: true,
      },
    },
  },
};

/**
 * Renders a horizontal filter-tab strip above the table. The component
 * automatically prepends an "All" tab; `default: true` on one of the tabs
 * makes it the initially-active selection instead of "All".
 *
 * Selecting a tab fires `filterTabChanged` with the picked
 * `FieldFilterDefinition` (or `undefined` for the "All" tab). The host owns
 * the actual filtering — this story logs the event to the Actions panel.
 */
export const WithFilterTabs: Story = {
  args: {
    config: {
      ...BASE_CONFIG,
      searchConfig: {
        filterTabs: [
          {
            label: 'Running',
            property: 'status.phase',
            value: 'Running',
            default: true,
          },
          { label: 'Pending', property: 'status.phase', value: 'Pending' },
          { label: 'Failed', property: 'status.phase', value: 'Failed' },
        ] satisfies FieldFilterDefinition[],
      },
    },
  },
};

/**
 * Demonstrates an explicit "All" tab authored as a regular `FieldFilterDefinition`.
 * The strip no longer auto-prepends one — if you want a "show everything"
 * option, model it the same way as the others. The host decides how `All`'s
 * `property` / `value` map to its data layer (here a wildcard).
 *
 * `default: true` on the "All" entry makes it the initial selection.
 */
export const WithExplicitAllTab: Story = {
  args: {
    config: {
      ...BASE_CONFIG,
      searchConfig: {
        filterTabs: [
          {
            label: 'All',
            property: 'status.phase',
            value: '*',
            default: true,
          },
          { label: 'Running', property: 'status.phase', value: 'Running' },
          { label: 'Pending', property: 'status.phase', value: 'Pending' },
          { label: 'Failed', property: 'status.phase', value: 'Failed' },
        ] satisfies FieldFilterDefinition[],
      },
    },
  },
};

/**
 * Many filters whose combined width exceeds the card. Left/right chevron
 * buttons appear at the strip's edges and scroll the viewport in ~70%-of-width
 * steps; the native scrollbar is hidden. Resize the Storybook viewport to
 * watch the chevrons appear/disappear as overflow changes.
 *
 * The labels mirror the SAP BTP service catalog filter strip the design is
 * based on.
 */
export const WithFilterTabsOverflow: Story = {
  args: {
    config: {
      ...BASE_CONFIG,
      searchConfig: {
        filterTabs: [
          {
            label: 'AI',
            property: 'category',
            value: 'ai',
            default: true,
          },
          {
            label: 'Application Development and Automation',
            property: 'category',
            value: 'app-dev-automation',
          },
          {
            label: 'Data and Analysis',
            property: 'category',
            value: 'data-analysis',
          },
          {
            label: 'Foundation / Cross Services',
            property: 'category',
            value: 'foundation-cross-services',
          },
          {
            label: 'Integration',
            property: 'category',
            value: 'integration',
          },
          {
            label: 'Mobile',
            property: 'category',
            value: 'mobile',
          },
          {
            label: 'Networking',
            property: 'category',
            value: 'networking',
          },
          {
            label: 'Observability',
            property: 'category',
            value: 'observability',
          },
          {
            label: 'Runtime',
            property: 'category',
            value: 'runtime',
          },
          {
            label: 'Security and Identity',
            property: 'category',
            value: 'security-identity',
          },
          {
            label: 'Storage',
            property: 'category',
            value: 'storage',
          },
          {
            label: 'User Experience',
            property: 'category',
            value: 'ux',
          },
        ] satisfies FieldFilterDefinition[],
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Rich collection cells: a collection column whose sub-fields exercise tags,
// a secret, a css-coloured phrase, and icon-only row actions
// ---------------------------------------------------------------------------

interface RichPod extends GenericResource {
  id: string;
  metadata: { name: string; namespace: string; uid: string };
  spec: { description: string };
  status: {
    conditions: {
      type: string;
      status: string;
      phase: string;
      token: string;
    }[];
  };
}

const RICH_PODS: RichPod[] = [
  {
    id: 'rp-001',
    metadata: { name: 'api-server-7d9f', namespace: 'default', uid: 'rp-001' },
    spec: { description: 'Front-facing API server pod' },
    status: {
      conditions: [
        {
          type: 'Ready',
          status: 'True',
          phase: 'Running',
          token: 'sk-live-7f3a9c21b48e5d0f',
        },
        {
          type: 'Initialized',
          status: 'True',
          phase: 'Pending',
          token: 'sk-live-0d1e2f3a4b5c6d7e',
        },
      ],
    },
    isAvailable: true,
  },
  {
    id: 'rp-002',
    metadata: { name: 'worker-5bc8', namespace: 'default', uid: 'rp-002' },
    spec: { description: 'Background job worker' },
    status: {
      conditions: [
        {
          type: 'Ready',
          status: 'False',
          phase: 'Failed',
          token: 'sk-live-1a2b3c4d5e6f7a8b',
        },
      ],
    },
    isAvailable: true,
  },
  {
    id: 'rp-003',
    metadata: {
      name: 'db-postgres-0',
      namespace: 'production',
      uid: 'rp-003',
    },
    spec: { description: 'Primary Postgres database' },
    status: {
      conditions: [
        {
          type: 'Ready',
          status: 'True',
          phase: 'Running',
          token: 'sk-live-9z8y7x6w5v4u3t2s',
        },
      ],
    },
    isAvailable: false,
  },
];

const PHASE_CSS_RULES = [
  {
    if: { condition: 'equals' as const, value: 'Running' },
    styles: { color: 'var(--sapPositiveColor, #107e3e)', fontWeight: '600' },
  },
  {
    if: { condition: 'equals' as const, value: 'Pending' },
    styles: { color: 'var(--sapCriticalColor, #e9730c)', fontWeight: '600' },
  },
  {
    if: { condition: 'equals' as const, value: 'Failed' },
    styles: { color: 'var(--sapNegativeColor, #bb0000)', fontWeight: '600' },
  },
];

const RICH_COLUMNS: TableFieldDefinition[] = [
  { label: 'Name', property: 'metadata.name' },
  { label: 'Description', property: 'spec.description' },
  {
    label: 'Conditions',
    property: 'status.conditions',
    propertyCollection: [
      {
        label: 'Type',
        property: 'status.conditions.type',
        uiSettings: {
          displayAs: 'tag',
          tagSettings: { design: 'Set2', colorScheme: '2' },
        },
      },
      {
        label: 'Status',
        property: 'status.conditions.status',
        uiSettings: {
          displayAs: 'tag',
          tagSettings: { design: 'Set2', colorScheme: '6' },
        },
      },
      {
        label: 'Phase',
        property: 'status.conditions.phase',
        uiSettings: { cssRules: PHASE_CSS_RULES },
      },
      {
        label: 'Token',
        property: 'status.conditions.token',
        uiSettings: { displayAs: 'secret', withCopyButton: true },
      },
      {
        label: 'Restart',
        uiSettings: {
          displayAs: 'button',
          buttonSettings: {
            icon: 'restart',
            design: 'Transparent',
            action: 'restart',
            tooltip: 'Restart',
          },
        },
      },
      {
        label: 'Stop',
        uiSettings: {
          displayAs: 'button',
          buttonSettings: {
            icon: 'stop',
            design: 'Transparent',
            action: 'stop',
            tooltip: 'Stop',
          },
        },
      },
    ],
  },
  {
    uiSettings: {
      displayAs: 'button',
      align: 'end',
      buttonSettings: {
        icon: 'inspect',
        design: 'Transparent',
        action: 'inspect',
        tooltip: 'Inspect',
      },
    },
    group: { name: 'actions', label: '', multiline: false },
  },
];

/**
 * A collection column whose sub-fields exercise every rich cell renderer.
 *
 * Top-level columns are just **Name**, **Description**, and the trailing
 * **Actions** column. The **Conditions** column is a `propertyCollection` —
 * each row renders as a stack of collapsed cards, and expanding one shows the
 * sub-fields:
 *
 * - **Type** / **Status** as coloured **tags**.
 * - **Phase** as a phrase coloured by `cssRules` (green / orange / red).
 * - **Token** as a `secret` with a **copy button** and an **eye** toggle.
 * - **Restart** and **Stop** as icon-only buttons (no text).
 */
export const WithRichCells: Story = {
  args: {
    config: {
      ...BASE_CONFIG,
      header: 'Pods (rich collection cells)',
      tableConfig: {
        ...BASE_TABLE_CONFIG,
        fields: RICH_COLUMNS,
      },
    },
    resources: RICH_PODS,
  },
};

/**
 * Demonstrates per-row field permission gating threaded through
 * DeclarativeTableCard → DeclarativeTable → ResourceField, matched by row `id`.
 *
 * The **Update** and **Delete** action buttons each carry a `requirePermission`
 * (`'update'` / `'delete'`). Each row's `id` is looked up in the `permissions`
 * map; a button renders only when that row's granted actions include the verb.
 * Rows absent from the map render neither button (fail-closed).
 *
 * | Row id   | In map | Granted actions        | Update btn | Delete btn |
 * |----------|--------|------------------------|------------|------------|
 * | abc-001  | yes    | get, update            | yes        | no         |
 * | abc-002  | yes    | get                    | no         | no         |
 * | abc-003  | yes    | get, update, delete    | yes        | yes        |
 * | abc-004  | yes    | get, delete            | no         | yes        |
 * | abc-005  | no     | —                      | no         | no         |
 */
export const WithRowPermissions: Story = {
  args: {
    config: {
      ...BASE_CONFIG,
      header: 'Pods (per-row permission gating)',
      tableConfig: {
        ...BASE_TABLE_CONFIG,
        fields: [
          { label: 'Name', property: 'metadata.name' },
          { label: 'Namespace', property: 'metadata.namespace' },
          { label: 'Phase', property: 'status.phase' },
          {
            // No `label` — a button cell must not print a "label:" prefix.
            // Rendered only when the row's granted actions include 'update'.
            requirePermission: 'update',
            uiSettings: {
              displayAs: 'button',
              align: 'end',
              buttonSettings: {
                icon: 'edit',
                design: 'Transparent',
                action: 'update',
                tooltip: 'Update',
              },
            },
            group: { name: 'actions', label: '', multiline: false },
          } satisfies TableFieldDefinition,
          {
            // No `label` — a button cell must not print a "label:" prefix.
            // Rendered only when the row's granted actions include 'delete'.
            requirePermission: 'delete',
            uiSettings: {
              displayAs: 'button',
              align: 'end',
              buttonSettings: {
                icon: 'delete',
                design: 'Transparent',
                action: 'delete',
                tooltip: 'Delete',
              },
            },
            group: { name: 'actions', label: '', multiline: false },
          } satisfies TableFieldDefinition,
        ],
      },
    } satisfies TableCardConfig,
    resources: PODS,
    // Keyed by row id (permissionKey). abc-005 is absent → fail-closed.
    permissions: {
      'abc-001': ['get', 'update'],
      'abc-002': ['get'],
      'abc-003': ['get', 'update', 'delete'],
      'abc-004': ['get', 'delete'],
    },
  },
};
