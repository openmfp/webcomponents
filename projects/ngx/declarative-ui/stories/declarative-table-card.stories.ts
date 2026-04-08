import type { FormFieldDefinition } from '../form/models';
import type {
  TableCardCreateEditConfig,
  TableCardDeleteConfig,
} from '../table-card/declarative-table-card.component';
import type { GenericResource, TableFieldDefinition } from '../table/models';
import { CUSTOM_ELEMENTS_SCHEMA, Component, Input } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

// ---------------------------------------------------------------------------
// Sample data (same PODS array used in declarative-table.stories.ts)
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
    status: { phase: 'Running', ready: true, restarts: 0, message: undefined },
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
    status: { phase: 'Running', ready: true, restarts: 1, message: undefined },
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
    status: { phase: 'Running', ready: true, restarts: 0, message: undefined },
    spec: { nodeName: 'node-2', image: 'nginx-ingress:1.9' },
    isAvailable: true,
  },
];

// ---------------------------------------------------------------------------
// Shared column definitions
// ---------------------------------------------------------------------------

const BASE_COLUMNS: TableFieldDefinition[] = [
  { label: 'Name', property: 'metadata.name' },
  { label: 'Namespace', property: 'metadata.namespace' },
  { label: 'Phase', property: 'status.phase' },
  { label: 'Node', property: 'spec.nodeName' },
];

// ---------------------------------------------------------------------------
// Shared form field definitions
// ---------------------------------------------------------------------------

const POD_FORM_FIELDS: FormFieldDefinition[] = [
  { name: 'name', label: 'Name', required: true },
  { name: 'namespace', label: 'Namespace', required: true },
];

// ---------------------------------------------------------------------------
// Wrapper component (avoids attachShadow conflict in Storybook)
// ---------------------------------------------------------------------------

@Component({
  selector: 'mfp-declarative-table-card-story',
  template: `
    <mfp-declarative-table-card
      [columns]="columns"
      [createConfig]="createConfig"
      [deleteConfig]="deleteConfig"
      [editDeleteConfig]="editDeleteConfig"
      [hasMore]="hasMore"
      [header]="header"
      [paginationLimit]="paginationLimit"
      [resources]="resources"
      [totalItemsCount]="totalItemsCount"
    />
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DeclarativeTableCardStory {
  @Input() columns: TableFieldDefinition[] = BASE_COLUMNS;
  @Input() resources: GenericResource[] = PODS;
  @Input() header?: string;
  @Input() createConfig?: TableCardCreateEditConfig;
  @Input() editDeleteConfig?: TableCardCreateEditConfig;
  @Input() deleteConfig?: TableCardDeleteConfig;
  @Input() hasMore = false;
  @Input() paginationLimit = 5;
  @Input() totalItemsCount?: number;
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<DeclarativeTableCardStory> = {
  title: 'Declarative UI / DeclarativeTableCard',
  component: DeclarativeTableCardStory,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    columns: { control: 'object' },
    resources: { control: 'object' },
    header: { control: 'text' },
    createConfig: { control: 'object' },
    editDeleteConfig: { control: 'object' },
    deleteConfig: { control: 'object' },
    hasMore: { control: 'boolean' },
    paginationLimit: { control: 'number' },
    totalItemsCount: { control: 'number' },
  },
  args: {
    columns: BASE_COLUMNS,
    resources: PODS,
    hasMore: false,
    paginationLimit: 5,
  },
};

export default meta;
type Story = StoryObj<DeclarativeTableCardStory>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Minimal card: header, columns, and resources. No dialogs or action buttons.
 */
export const Basic: Story = {
  args: {
    header: 'Pods',
    columns: BASE_COLUMNS,
    resources: PODS,
  },
};

/**
 * Adds a Create button. Clicking it opens a dialog with name + namespace fields.
 */
export const WithCreate: Story = {
  args: {
    header: 'Pods',
    columns: BASE_COLUMNS,
    resources: PODS,
    createConfig: {
      fields: POD_FORM_FIELDS,
      title: 'Create Pod',
      confirmLabel: 'Create',
      cancelLabel: 'Cancel',
    } satisfies TableCardCreateEditConfig,
  },
};

/**
 * Adds edit row-action buttons. The "name" field is disabled in the edit dialog
 * because it is listed as a createOnlyField.
 */
export const WithEditDelete: Story = {
  args: {
    header: 'Pods',
    columns: BASE_COLUMNS,
    resources: PODS,
    editDeleteConfig: {
      fields: POD_FORM_FIELDS,
      title: 'Edit Pod',
      confirmLabel: 'Save',
      cancelLabel: 'Cancel',
      createOnlyFields: ['name'],
    } satisfies TableCardCreateEditConfig,
  },
};

/**
 * Full action suite: Create button, Edit row button, Delete row button.
 * Opening the delete dialog shows a confirmation prompt.
 */
export const WithAllActions: Story = {
  args: {
    header: 'Pods',
    columns: BASE_COLUMNS,
    resources: PODS,
    createConfig: {
      fields: POD_FORM_FIELDS,
      title: 'Create Pod',
      confirmLabel: 'Create',
      cancelLabel: 'Cancel',
    } satisfies TableCardCreateEditConfig,
    editDeleteConfig: {
      fields: POD_FORM_FIELDS,
      title: 'Edit Pod',
      confirmLabel: 'Save',
      cancelLabel: 'Cancel',
      createOnlyFields: ['name'],
    } satisfies TableCardCreateEditConfig,
    deleteConfig: {
      title: 'Delete Pod?',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    } satisfies TableCardDeleteConfig,
  },
};

/**
 * Empty resources array triggers the illustrated empty-state message inside the table.
 */
export const EmptyState: Story = {
  args: {
    header: 'Pods',
    columns: BASE_COLUMNS,
    resources: [],
  },
};
