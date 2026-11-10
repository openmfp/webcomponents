import {
  type BeforeRequest,
  DataFetchTable,
  type DataFetchTableData,
} from '../data-fetch-table';
import type { TableFieldDefinition } from '../table';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
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

@Component({
  selector: 'mfp-data-fetch-table-story',
  imports: [DataFetchTable],
  standalone: true,
  template: `
    <mfp-data-fetch-table
      [beforeRequest]="beforeRequest"
      [columns]="columns()"
      [data]="data()"
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

  private hasFailed = false;

  protected readonly beforeRequest: BeforeRequest = (prepared) => {
    if (this.requestBehavior() === 'loading') {
      return new Promise<void>((_, reject) => {
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

const meta: Meta<DataFetchTableStory> = {
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
};

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
