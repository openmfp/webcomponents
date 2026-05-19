import type { GenericResource } from '../models';
import { DeclarativeTable } from '../table';
import type { TableFieldDefinition } from '../table/models';
import { CUSTOM_ELEMENTS_SCHEMA, Component, Input } from '@angular/core';
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
// Wrapper component (avoids attachShadow conflict)
// ---------------------------------------------------------------------------

@Component({
  selector: 'mfp-declarative-table-story',
  imports: [DeclarativeTable],
  template: `
    <mfp-declarative-table
      [columns]="columns"
      [hasMore]="hasMore"
      [paginationLimit]="paginationLimit"
      [resources]="resources"
      [totalItemsCount]="totalItemsCount"
      [trackByProperty]="trackByProperty"
    />
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DeclarativeTableStory {
  @Input() columns: TableFieldDefinition[] = [];
  @Input() resources: GenericResource[] = PODS;
  @Input() trackByProperty = 'metadata.uid';
  @Input() hasMore = false;
  @Input() paginationLimit = 5;
  @Input() totalItemsCount?: number;
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<DeclarativeTableStory> = {
  title: 'Declarative UI / DeclarativeTable',
  component: DeclarativeTableStory,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    columns: { control: 'object' },
    resources: { control: 'object' },
    trackByProperty: { control: 'text' },
    hasMore: { control: 'boolean' },
    paginationLimit: { control: 'number' },
    totalItemsCount: { control: 'number' },
  },
  args: {
    resources: PODS,
    trackByProperty: 'metadata.uid',
    hasMore: false,
    paginationLimit: 5,
  },
};

export default meta;
type Story = StoryObj<DeclarativeTableStory>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/** Minimal setup: three plain-text columns. */
export const Basic: Story = {
  args: {
    columns: [
      { label: 'Name', property: 'metadata.name' },
      { label: 'Namespace', property: 'metadata.namespace' },
      { label: 'Node', property: 'spec.nodeName' },
    ] satisfies TableFieldDefinition[],
  },
};

/**
 * Boolean icons, secret cell with inline copy button, and conditional colour
 * rules. The copy icon appears next to the masked value on the same line.
 */
export const CellDisplayModes: Story = {
  args: {
    columns: [
      { label: 'Name', property: 'metadata.name' },
      {
        label: 'Ready',
        property: 'status.ready',
        uiSettings: { displayAs: 'boolIcon' },
      },
      {
        label: 'Phase',
        property: 'status.phase',
        uiSettings: {
          cssRules: [
            {
              if: { condition: 'equals', value: 'Running' },
              styles: { color: 'green' },
            },
            {
              if: { condition: 'equals', value: 'Pending' },
              styles: { color: 'darkorange' },
            },
            {
              if: { condition: 'equals', value: 'Failed' },
              styles: { color: 'red', fontWeight: 'bold' },
            },
          ],
        },
      },
      {
        label: 'UID',
        property: 'metadata.uid',
        uiSettings: { displayAs: 'secret', withCopyButton: true },
      },
      {
        label: 'Image',
        property: 'spec.image',
        uiSettings: { displayAs: 'tooltip', tooltipIcon: 'information' },
      },
    ] satisfies TableFieldDefinition[],
  },
};

/** Two columns sharing the same group name are merged into one header. */
export const GroupedColumns: Story = {
  args: {
    columns: [
      {
        label: 'Name',
        property: 'metadata.name',
        group: { name: 'identity', label: 'Identity', delimiter: ' / ' },
      },
      {
        label: 'Namespace',
        property: 'metadata.namespace',
        group: { name: 'identity' },
      },
      { label: 'Phase', property: 'status.phase' },
      { label: 'Node', property: 'spec.nodeName' },
    ] satisfies TableFieldDefinition[],
  },
};

/**
 * Group with a space delimiter and labelDisplay — values rendered as blue
 * badge labels, separated by a single space. Also demonstrates the alert
 * display type: a warning icon appears when the field value is falsy.
 */
export const GroupedWithLabelsAndAlert: Story = {
  args: {
    columns: [
      { label: 'Name', property: 'metadata.name' },
      {
        property: 'spec.nodeName',
        uiSettings: { labelDisplay: true },
        group: {
          name: 'placement',
          label: 'Placement',
          delimiter: ' ',
          multiline: false,
        },
      },
      {
        property: 'spec.image',
        uiSettings: { labelDisplay: true },
        group: { name: 'placement' },
      },
      {
        label: 'OK',
        property: 'status.message',
        uiSettings: { displayAs: 'alert' },
      },
      { label: 'Message', property: 'status.message', value: '—' },
    ] satisfies TableFieldDefinition[],
  },
};

/**
 * `uiSettings.columnWidth` sets the width of the header cell (and thus the
 * whole column). Useful for icon-only columns like `alert` or `boolIcon` where
 * the default `auto` width is wider than necessary.
 */
export const ColumnWidth: Story = {
  args: {
    columns: [
      { label: 'Name', property: 'metadata.name' },
      {
        label: 'Alert',
        property: 'status.message',
        uiSettings: { displayAs: 'alert', columnWidth: '60px' },
      },
      {
        label: 'Ready',
        property: 'status.ready',
        uiSettings: { displayAs: 'boolIcon', columnWidth: '60px' },
      },
      { label: 'Phase', property: 'status.phase' },
    ] satisfies TableFieldDefinition[],
  },
};

/** JSONPath expression for deeply nested or array values. */
export const JsonPathExpression: Story = {
  args: {
    columns: [
      { label: 'Name', property: 'metadata.name' },
      { label: 'Namespace', jsonPathExpression: '$.metadata.namespace' },
      { label: 'Image', jsonPathExpression: '$.spec.image' },
      { label: 'Restarts', jsonPathExpression: '$.status.restarts' },
    ] satisfies TableFieldDefinition[],
  },
};

/** Static fallback value shown when the resource field is absent. */
export const StaticFallback: Story = {
  args: {
    columns: [
      { label: 'Name', property: 'metadata.name' },
      { label: 'Message', property: 'status.message', value: '—' },
    ] satisfies TableFieldDefinition[],
  },
};

/** Load-more pagination trigger. Click "Load More" to fire loadMoreResources. */
export const Pagination: Story = {
  args: {
    columns: [
      { label: 'Name', property: 'metadata.name' },
      { label: 'Namespace', property: 'metadata.namespace' },
      { label: 'Phase', property: 'status.phase' },
    ] satisfies TableFieldDefinition[],
    hasMore: true,
    paginationLimit: 5,
    totalItemsCount: 20,
  },
};

/** Button cell that fires buttonClick with { event, field, resource }. */
export const ButtonCell: Story = {
  args: {
    columns: [
      { label: 'Name', property: 'metadata.name' },
      { label: 'Phase', property: 'status.phase' },
      {
        label: 'Actions',
        property: 'metadata.name',
        uiSettings: {
          displayAs: 'button',
          buttonSettings: {
            text: 'Inspect',
            icon: 'inspect',
            design: 'Emphasized',
            action: 'navigate',
          },
        },
      },
    ] satisfies TableFieldDefinition[],
  },
};

/** Empty resources array triggers the illustrated empty-state message. */
export const EmptyState: Story = {
  args: {
    columns: [
      { label: 'Name', property: 'metadata.name' },
      { label: 'Namespace', property: 'metadata.namespace' },
    ] satisfies TableFieldDefinition[],
    resources: [],
  },
};

/**
 * isAvailable=false greys out the row and disables interaction.
 * accessibleName is used as the tooltip text on the alert icon for unavailable pods.
 */
export const RowAvailability: Story = {
  args: {
    columns: [
      { label: 'Name', property: 'metadata.name' },
      { label: 'Phase', property: 'status.phase' },
      { label: 'Node', property: 'spec.nodeName' },
      {
        label: 'Status',
        property: 'isAvailable',
        uiSettings: { displayAs: 'alert' },
      },
    ] satisfies TableFieldDefinition[],
  },
};
