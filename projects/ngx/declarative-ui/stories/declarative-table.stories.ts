import type { GenericResource } from '../models';
import { DeclarativeTable } from '../table';
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
      [currentPage]="currentPage"
      [error]="error"
      [hasMore]="hasMore"
      [height]="height"
      [loadMode]="loadMode"
      [loading]="loading"
      [loadingDelay]="loadingDelay"
      [paginationLimit]="paginationLimit"
      [resources]="visibleResources"
      [totalItemsCount]="totalItemsCount"
      [trackByPath]="trackByProperty"
      (loadMoreResources)="loadMore()"
      (pageChange)="onPageChange($event)"
      (paginationLimitChanged)="onPageSizeChange($event)"
      (retry)="onRetry()"
    />
  `,
})
class DeclarativeTableStory {
  @Input() columns: TableFieldDefinition[] = [];
  @Input() resources: GenericResource[] = PODS;
  @Input() trackByProperty = 'metadata.uid';
  @Input() hasMore = false;
  @Input() paginationLimit = 5;
  @Input() totalItemsCount?: number;
  @Input() loadMode: 'scroll' | 'button' | 'pager' = 'scroll';
  @Input() height?: number;
  @Input() currentPage = 1;
  @Input() loading = false;
  @Input() loadingDelay = 1000;
  @Input() error = false;

  /**
   * In pager mode the story slices the full `resources` array to the current
   * page so the arrows visibly navigate; other modes show `resources` as-is.
   */
  get visibleResources(): GenericResource[] {
    if (this.loadMode !== 'pager') {
      return this.resources;
    }
    const start = (this.currentPage - 1) * this.paginationLimit;
    return this.resources.slice(start, start + this.paginationLimit);
  }

  loadMore(): void {
    const resources = [...this.resources];
    resources.push(...PODS);
    this.resources = resources;
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onPageSizeChange(limit: number): void {
    this.paginationLimit = limit;
    // Reset to the first page so the pager recalculates against the new size;
    // the full `resources` dataset is left intact so `visibleResources` and
    // `totalItemsCount` stay correct.
    this.currentPage = 1;
  }

  onRetry(): void {
    this.error = false;
  }
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
    currentPage: { control: 'number' },
    loading: { control: 'boolean' },
    loadingDelay: { control: 'number' },
    error: { control: 'boolean' },
    loadMode: { options: ['scroll', 'button', 'pager'], control: 'select' },
  },
  args: {
    resources: PODS,
    trackByProperty: 'metadata.uid',
    hasMore: false,
    paginationLimit: 5,
    loading: false,
    loadingDelay: 1000,
    error: false,
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

/** Native UI5 busy overlay shown while the host fetches the first page. */
export const Loading: Story = {
  args: {
    columns: [
      { label: 'Name', property: 'metadata.name' },
      { label: 'Namespace', property: 'metadata.namespace' },
      { label: 'Node', property: 'spec.nodeName' },
    ] satisfies TableFieldDefinition[],
    resources: [],
    loading: true,
    loadingDelay: 0,
  },
};

/** Failure illustration with a retry event owned by the host. */
export const Error: Story = {
  args: {
    columns: [
      { label: 'Name', property: 'metadata.name' },
      { label: 'Namespace', property: 'metadata.namespace' },
      { label: 'Node', property: 'spec.nodeName' },
    ] satisfies TableFieldDefinition[],
    resources: [],
    error: true,
  },
};

/**
 * `valueRules` maps raw numeric (or string) values to human-readable labels.
 * First match wins; falls back to the raw value when no rule matches.
 * Here the `activityScore` integer field is mapped to "Low" / "Medium" / "High"
 * while `cssRules` adds colour coding on the same thresholds.
 */
export const ValueRules: Story = {
  args: {
    columns: [
      { label: 'Name', property: 'metadata.name' },
      {
        label: 'Activity Score',
        property: 'activityScore',
        uiSettings: {
          valueRules: [
            { if: { condition: 'lessThan', value: '20' }, then: 'Low' },
            { if: { condition: 'lessThan', value: '60' }, then: 'Medium' },
            {
              if: { condition: 'greaterThanOrEqual', value: '60' },
              then: 'High',
            },
          ],
          cssRules: [
            {
              if: { condition: 'lessThan', value: '20' },
              styles: { color: 'red' },
            },
            {
              if: { condition: 'greaterThanOrEqual', value: '20' },
              styles: { color: 'darkorange' },
            },
            {
              if: { condition: 'greaterThanOrEqual', value: '60' },
              styles: { color: 'green' },
            },
          ],
        },
      },
    ] satisfies TableFieldDefinition[],
    resources: [
      { ...PODS[0], activityScore: 10 },
      { ...PODS[1], activityScore: 35 },
      { ...PODS[2], activityScore: 72 },
      { ...PODS[3], activityScore: 5 },
      { ...PODS[4], activityScore: 61 },
    ],
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
 * Group with a space delimiter and tag display — values rendered as ui5-tag
 * chips, separated by a single space. Also demonstrates the alert display
 * type: a warning icon appears when the field value is falsy.
 */
export const GroupedWithTagsAndAlert: Story = {
  args: {
    columns: [
      { label: 'Name', property: 'metadata.name' },
      {
        property: 'spec.nodeName',
        uiSettings: { displayAs: 'tag' },
        group: {
          name: 'placement',
          label: 'Placement',
          delimiter: ' ',
          multiline: false,
        },
      },
      {
        property: 'spec.image',
        uiSettings: { displayAs: 'tag' },
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

// /** JSONPath expression for deeply nested or array values. */
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

export const Pagination_Scroll: Story = {
  args: {
    columns: [
      { label: 'Name', property: 'metadata.name' },
      { label: 'Namespace', property: 'metadata.namespace' },
      { label: 'Phase', property: 'status.phase' },
    ] satisfies TableFieldDefinition[],
    hasMore: true,
    paginationLimit: 5,
    totalItemsCount: 20,
    loadMode: 'scroll',
    height: 200,
  },
};

export const Pagination_Button: Story = {
  args: {
    columns: [
      { label: 'Name', property: 'metadata.name' },
      { label: 'Namespace', property: 'metadata.namespace' },
      { label: 'Phase', property: 'status.phase' },
    ] satisfies TableFieldDefinition[],
    hasMore: true,
    paginationLimit: 5,
    totalItemsCount: 20,
    loadMode: 'button',
  },
};

/**
 * Arrow pager (`loadMode: 'pager'`). Controlled: the story owns `currentPage`
 * and slices the dataset to the visible page, so first/prev/next/last navigate
 * and the `X / Y` indicator updates. `pageChange` fires with the 1-based page.
 * First/prev disable on page 1; next/last on the last page.
 */
export const Pagination_Pager: Story = {
  args: {
    columns: [
      { label: 'Name', property: 'metadata.name' },
      { label: 'Namespace', property: 'metadata.namespace' },
      { label: 'Phase', property: 'status.phase' },
    ] satisfies TableFieldDefinition[],
    resources: Array.from({ length: 20 }, (_, i) => ({
      ...PODS[i % PODS.length],
      id: `pager-${i + 1}`,
      metadata: {
        ...PODS[i % PODS.length].metadata,
        name: `resource-${i + 1}`,
        uid: `pager-${i + 1}`,
      },
    })),
    trackByProperty: 'metadata.uid',
    loadMode: 'pager',
    paginationLimit: 5,
    totalItemsCount: 20,
    currentPage: 1,
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

/**
 * `displayAs: 'tag'` renders comma-separated strings (or arrays) as `<ui5-tag>` chips.
 * `tagSettings.valueSeparator` overrides the default `','` delimiter.
 * `tagSettings.design` sets the chip colour scheme.
 */
export const Tags: Story = {
  args: {
    columns: [
      { label: 'Name', property: 'metadata.name' },
      {
        label: 'Labels',
        property: 'labels',
        uiSettings: { displayAs: 'tag' },
      },
      {
        label: 'Environments',
        property: 'environments',
        uiSettings: {
          displayAs: 'tag',
          tagSettings: { design: 'Information', valueSeparator: '|' },
        },
      },
    ] satisfies TableFieldDefinition[],
    resources: [
      {
        ...PODS[0],
        labels: 'api,backend,v2',
        environments: ['prod', 'staging'],
      },
      { ...PODS[1], labels: 'worker', environments: 'dev' },
      {
        ...PODS[2],
        labels: 'cache,infra',
        environments: 'prod|dev|staging',
      },
    ],
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
