import type { Meta, StoryObj } from '@storybook/angular';
import { DeclarativeTable } from '../table/declarative-table/declarative-table.component';
import type { TableFieldDefinition } from '../table/models';

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

interface Pod {
  metadata: { name: string; namespace: string; uid: string };
  status: { phase: string; ready: boolean; restarts: number; message?: string };
  spec: { nodeName: string; image: string };
}

const PODS: Pod[] = [
  {
    metadata: { name: 'api-server-7d9f', namespace: 'default', uid: 'abc-001' },
    status: { phase: 'Running', ready: true, restarts: 0, message: undefined },
    spec: { nodeName: 'node-1', image: 'nginx:1.25' },
  },
  {
    metadata: { name: 'worker-5bc8', namespace: 'default', uid: 'abc-002' },
    status: { phase: 'Pending', ready: false, restarts: 3, message: 'ImagePullBackOff' },
    spec: { nodeName: 'node-2', image: 'myapp:latest' },
  },
  {
    metadata: { name: 'cache-redis-0', namespace: 'kube-system', uid: 'abc-003' },
    status: { phase: 'Running', ready: true, restarts: 1, message: undefined },
    spec: { nodeName: 'node-1', image: 'redis:7' },
  },
  {
    metadata: { name: 'db-postgres-0', namespace: 'production', uid: 'abc-004' },
    status: { phase: 'Failed', ready: false, restarts: 5, message: 'CrashLoopBackOff' },
    spec: { nodeName: 'node-3', image: 'postgres:16' },
  },
  {
    metadata: { name: 'ingress-ctrl-xkp', namespace: 'default', uid: 'abc-005' },
    status: { phase: 'Running', ready: true, restarts: 0, message: undefined },
    spec: { nodeName: 'node-2', image: 'nginx-ingress:1.9' },
  },
];

const trackBy = (item: Pod) => item.metadata.uid;

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<DeclarativeTable<Pod>> = {
  title: 'Declarative UI / DeclarativeTable',
  component: DeclarativeTable,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<DeclarativeTable<Pod>>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/** Minimal setup: three plain-text columns. */
export const Basic: Story = {
  render: () => ({
    props: {
      columns: [
        { label: 'Name', property: 'metadata.name' },
        { label: 'Namespace', property: 'metadata.namespace' },
        { label: 'Node', property: 'spec.nodeName' },
      ] satisfies TableFieldDefinition[],
      resources: PODS,
      trackBy,
    },
    template: `<mfp-declarative-table [columns]="columns" [resources]="resources" [trackBy]="trackBy" />`,
  }),
};

/** Boolean icons, secret cell, copy button, and conditional colour rules. */
export const CellDisplayModes: Story = {
  render: () => ({
    props: {
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
              { if: { condition: 'equals', value: 'Running' }, styles: { color: 'green' } },
              { if: { condition: 'equals', value: 'Pending' }, styles: { color: 'darkorange' } },
              { if: { condition: 'equals', value: 'Failed' }, styles: { color: 'red', fontWeight: 'bold' } },
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
      resources: PODS,
      trackBy,
    },
    template: `<mfp-declarative-table [columns]="columns" [resources]="resources" [trackBy]="trackBy" />`,
  }),
};

/** Two columns sharing the same group name are merged into one header. */
export const GroupedColumns: Story = {
  render: () => ({
    props: {
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
      resources: PODS,
      trackBy,
    },
    template: `<mfp-declarative-table [columns]="columns" [resources]="resources" [trackBy]="trackBy" />`,
  }),
};

/**
 * Group with a space delimiter and labelDisplay — fields rendered inline as
 * "Label: value" pairs separated by a single space. Also demonstrates the
 * alert display type: a warning icon appears when the field value is falsy
 * (pods without an error message show the alert, pods with a message show
 * the message text).
 */
export const GroupedWithLabelsAndAlert: Story = {
  render: () => ({
    props: {
      columns: [
        { label: 'Name', property: 'metadata.name' },
        {
          property: 'spec.nodeName',
          uiSettings: { labelDisplay: true },
          group: { name: 'placement', label: 'Placement', delimiter: ' ', multiline: false },
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
      resources: PODS,
      trackBy,
    },
    template: `<mfp-declarative-table [columns]="columns" [resources]="resources" [trackBy]="trackBy" />`,
  }),
};

/** JSONPath expression for deeply nested or array values. */
export const JsonPathExpression: Story = {
  render: () => ({
    props: {
      columns: [
        { label: 'Name', property: 'metadata.name' },
        { label: 'Namespace', jsonPathExpression: '$.metadata.namespace' },
        { label: 'Image', jsonPathExpression: '$.spec.image' },
        { label: 'Restarts', jsonPathExpression: '$.status.restarts' },
      ] satisfies TableFieldDefinition[],
      resources: PODS,
      trackBy,
    },
    template: `<mfp-declarative-table [columns]="columns" [resources]="resources" [trackBy]="trackBy" />`,
  }),
};

/** Static fallback value shown when the resource field is absent. */
export const StaticFallback: Story = {
  render: () => ({
    props: {
      columns: [
        { label: 'Name', property: 'metadata.name' },
        { label: 'Message', property: 'status.message', value: '—' },
      ] satisfies TableFieldDefinition[],
      resources: PODS,
      trackBy,
    },
    template: `<mfp-declarative-table [columns]="columns" [resources]="resources" [trackBy]="trackBy" />`,
  }),
};

/** Load-more pagination trigger. Click "Load More" to fire loadMoreResources. */
export const Pagination: Story = {
  render: () => ({
    props: {
      columns: [
        { label: 'Name', property: 'metadata.name' },
        { label: 'Namespace', property: 'metadata.namespace' },
        { label: 'Phase', property: 'status.phase' },
      ] satisfies TableFieldDefinition[],
      resources: PODS,
      trackBy,
      hasMore: true,
      paginationLimit: 2,
      totalItemsCount: 20,
    },
    template: `<mfp-declarative-table [columns]="columns" [resources]="resources" [trackBy]="trackBy" [hasMore]="hasMore" [paginationLimit]="paginationLimit" [totalItemsCount]="totalItemsCount" />`,
  }),
};

/** Button cell that fires buttonClick with { event, field, resource }. */
export const ButtonCell: Story = {
  render: () => ({
    props: {
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
      resources: PODS,
      trackBy,
    },
    template: `<mfp-declarative-table [columns]="columns" [resources]="resources" [trackBy]="trackBy" />`,
  }),
};

/** Empty resources array triggers the illustrated empty-state message. */
export const EmptyState: Story = {
  render: () => ({
    props: {
      columns: [
        { label: 'Name', property: 'metadata.name' },
        { label: 'Namespace', property: 'metadata.namespace' },
      ] satisfies TableFieldDefinition[],
      resources: [],
      trackBy,
    },
    template: `<mfp-declarative-table [columns]="columns" [resources]="resources" [trackBy]="trackBy" />`,
  }),
};
