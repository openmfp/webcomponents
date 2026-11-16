import { Dashboard } from '../dashboard/dashboard/dashboard.component';
import { EN_DEFAULTS } from '../dashboard/i18n';
import type { CardConfig, DashboardConfig } from '../dashboard/models';
import {
  type BeforeCardRequest,
  DataFetchTable,
  type DataFetchTableData,
} from '../data-fetch-table';
import type { TableFieldDefinition } from '../table';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

const localRows = [
  { id: 'local-1', name: 'Local cluster', region: 'Europe' },
  { id: 'local-2', name: 'Local gateway', region: 'Asia' },
];

const request = {
  url:
    'data:application/json,' +
    encodeURIComponent(
      JSON.stringify({
        result: {
          rows: [
            { id: 'remote-1', name: 'Remote cluster', region: 'Europe' },
            { id: 'remote-2', name: 'Remote gateway', region: 'Asia' },
          ],
        },
      }),
    ),
};

Dashboard.registerAngularComponents([DataFetchTable]);

const dashboardConfig: DashboardConfig = {
  zFlow: { cardHeight: 40, defaultCardSize: 'xxl' },
};
const dashboardI18n = { ...EN_DEFAULTS, title: '', description: '' };

@Component({
  selector: 'mfp-data-fetch-table-story',
  imports: [Dashboard],
  standalone: true,
  template: `
    <mfp-dashboard
      [availableCards]="cards()"
      [beforeCardRequest]="beforeRequest"
      [cards]="cards()"
      [config]="dashboardConfig"
      [i18n]="dashboardI18n"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class DataFetchTableStory {
  readonly data = input<DataFetchTableData>();
  readonly columns = input<TableFieldDefinition[]>([]);
  readonly requestBehavior = input<'normal' | 'loading' | 'fail-once'>(
    'normal',
  );

  protected readonly dashboardConfig = dashboardConfig;
  protected readonly dashboardI18n = dashboardI18n;
  protected readonly cards = computed<CardConfig[]>(() => [
    {
      id: 'destination-authentication',
      label: 'Destinations',
      type: 'angular',
      component: 'mfp-data-fetch-table',
      size: 'm',
      componentTemplate: {
        contentScrollable: true,
        actions: [{ key: 'view-destinations', text: 'View destinations' }],
      },
      componentInputs: {
        data: this.data(),
        columns: this.columns(),
        lastUpdated: { label: 'Last updated:', text: '30 minutes ago' },
        status: { text: '{{$length}} Destinations', state: 'Critical' },
        emptyState: {
          title: 'No destinations found',
          subtitle: 'There are currently no destinations to show.',
        },
        errorState: {
          title: 'Unable to load destinations',
          subtitle: 'Retry to request the destinations again.',
          buttons: [{ key: 'retry', label: 'Retry', design: 'Emphasized' }],
        },
      },
    },
  ]);

  private hasFailed = false;

  protected readonly beforeRequest: BeforeCardRequest = (prepared) => {
    if (this.requestBehavior() === 'loading') {
      return new Promise<never>((_, reject) => {
        prepared.signal.throwIfAborted();
        prepared.signal.addEventListener(
          'abort',
          () => {
            reject(prepared.signal.reason);
          },
          { once: true },
        );
      });
    }

    if (this.requestBehavior() === 'fail-once' && !this.hasFailed) {
      this.hasFailed = true;
      return Promise.reject(new Error('The first request failed.'));
    }

    return undefined;
  };
}

const meta = {
  title: 'Declarative UI / DataFetchTable',
  component: DataFetchTableStory,
  tags: ['autodocs'],
  args: {
    columns: [
      { label: 'Name', property: 'name' },
      { label: 'Region', property: 'region' },
    ],
  },
  argTypes: {
    requestBehavior: { table: { disable: true } },
  },
} satisfies Meta<DataFetchTableStory>;

export default meta;

type Story = StoryObj<DataFetchTableStory>;

export const LocalRows: Story = {
  args: { data: { resource: localRows } },
};

export const FetchedRows: Story = {
  args: { data: { request, path: 'result.rows' } },
};

export const RequestTakesPriority: Story = {
  args: {
    data: {
      request,
      resource: { result: { rows: localRows } },
      path: 'result.rows',
    },
  },
};

export const Loading: Story = {
  args: { data: { request, path: 'result.rows' }, requestBehavior: 'loading' },
};

export const ErrorWithRetry: Story = {
  args: {
    data: { request, path: 'result.rows' },
    requestBehavior: 'fail-once',
  },
};

export const InvalidResource: Story = {
  args: { data: { resource: { result: {} }, path: 'result.rows' } },
};

export const Empty: Story = {
  args: { data: { resource: [] } },
};
