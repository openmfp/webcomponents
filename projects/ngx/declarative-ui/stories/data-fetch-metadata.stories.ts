import type { DataFetchRowsSnapshot } from '../../services/data-fetch-rows.service';
import { DataFetchMetadata } from '../data-fetch-metadata/data-fetch-metadata.component';
import type { Meta, StoryObj } from '@storybook/angular';

type Story = StoryObj<DataFetchMetadata>;

const renderMetadata: NonNullable<Story['render']> = (args) => ({
  props: args,
  template: `
    <mfp-data-fetch-metadata
      style="max-inline-size: 24rem"
      [lastUpdated]="lastUpdated"
      [snapshot]="snapshot"
      [status]="status"
    />
  `,
});

const meta: Meta<DataFetchMetadata> = {
  title: 'Declarative UI / DataFetchMetadata',
  component: DataFetchMetadata,
  tags: ['autodocs'],
  render: renderMetadata,
  argTypes: {
    lastUpdated: { control: 'object' },
    snapshot: { table: { disable: true } },
    status: { control: 'object' },
  },
};

export default meta;

export const Static: Story = {
  args: {
    lastUpdated: { label: 'Last updated:', text: '30 minutes ago' },
    status: { text: 'All services operational', state: 'Positive' },
  },
};

export const FromResponse: Story = {
  args: {
    lastUpdated: {
      label: 'Last updated:',
      path: 'metadata.updatedAt',
      locale: 'en',
    },
    status: {
      text: '{{$length}} of {{response.totalCount}} subaccounts affected',
      state: 'Critical',
    },
  },
  render: (args, context) => {
    const rows = [{ name: 'Production' }, { name: 'Staging' }];
    const snapshot: DataFetchRowsSnapshot = {
      rows,
      response: {
        items: rows,
        totalCount: 8,
        metadata: {
          updatedAt: new Date(Date.now() - 30 * 60_000).toISOString(),
        },
      },
    };

    return renderMetadata({ ...args, snapshot }, context);
  },
};
