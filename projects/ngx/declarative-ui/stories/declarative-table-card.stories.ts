import type { FormFieldChangeEvent, FormFieldDefinition } from '../form/models';
import type { GenericResource } from '../models/resource';
import { DeclarativeTableCard } from '../table-card/declarative-table-card.component';
import type {
  DeleteResourceConfirmationConfig,
  ResourceFormConfig,
  TableCardConfig,
  TableCardFormState,
  TableConfig,
} from '../table-card/models/configs';
import type { TableFieldDefinition } from '../table/models';
import { Component, Input } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

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
      [resources]="resources"
      (createFieldChange)="onCreateFieldChange($event)"
      (createSubmit)="onCreateSubmit($event, tableCard)"
    />
  `,
})
class DeclarativeTableCardCreateStory {
  @Input() config!: TableCardConfig;
  @Input() resources: GenericResource[] = [];
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
      editResourceFormConfig: {
        fields: POD_EDIT_FORM_FIELDS,
        title: 'Edit Pod',
        confirmLabel: 'Save',
        cancelLabel: 'Cancel',
      } satisfies ResourceFormConfig,
    },
  },
};

/** Adds Delete row-action button with a confirmation dialog. */
export const WithDelete: Story = {
  args: {
    config: {
      ...BASE_CONFIG,
      deleteResourceConfirmationConfig: {
        title: 'Delete Pod?',
        message:
          'This action cannot be undone. The pod will be permanently removed.',
        confirmLabel: 'Delete',
        cancelLabel: 'Cancel',
      } satisfies DeleteResourceConfirmationConfig,
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
      editResourceFormConfig: {
        fields: POD_EDIT_FORM_FIELDS,
        title: 'Edit Pod',
        confirmLabel: 'Save',
        cancelLabel: 'Cancel',
      } satisfies ResourceFormConfig,
      deleteResourceConfirmationConfig: {
        title: 'Delete Pod?',
        message:
          'This action cannot be undone. The pod will be permanently removed.',
        confirmLabel: 'Delete',
        cancelLabel: 'Cancel',
      } satisfies DeleteResourceConfirmationConfig,
    },
  },
};

/** Empty resources array triggers the illustrated empty-state message inside the table. */
export const EmptyState: Story = {
  args: {
    resources: [],
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
