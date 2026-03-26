import { DashboardComponent } from '../dashboard/dashboard.component';
import type { DashboardConfig } from '../models';
import type { Meta, StoryObj } from '@storybook/angular';

const SAMPLE_CONFIG: DashboardConfig = {
  title: 'System Overview',
  description:
    'Monitor your platform metrics, traffic and service health in real time.',
  sections: [
    {
      id: 'overview',
      title: 'Overview',
      colSpan: 12,
      cards: [
        { id: 'card-1', title: 'Total Users', colSpan: 3, rowSpan: 1 },
        { id: 'card-2', title: 'Active Sessions', colSpan: 3, rowSpan: 1 },
        { id: 'card-3', title: 'Errors', colSpan: 3, rowSpan: 1 },
        { id: 'card-4', title: 'Uptime', colSpan: 3, rowSpan: 1 },
      ],
    },
    {
      id: 'traffic',
      title: 'Traffic',
      colSpan: 12,
      cards: [
        { id: 'card-5', title: 'Requests Over Time', colSpan: 8, rowSpan: 2 },
        { id: 'card-6', title: 'Top Endpoints', colSpan: 4, rowSpan: 2 },
      ],
    },
  ],
};

const meta: Meta<DashboardComponent> = {
  title: 'Dashboard / Dashboard',
  component: DashboardComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    config: { control: 'object' },
  },
  args: {
    config: SAMPLE_CONFIG,
  },
  render: (args) => ({
    props: args,
    template: `<mfp-dashboard [config]="config" />`,
  }),
};

export default meta;
type Story = StoryObj<DashboardComponent>;

export const Default: Story = {};

export const SingleSection: Story = {
  args: {
    config: {
      title: 'Single Section',
      sections: [
        {
          id: 'main',
          title: 'Main',
          colSpan: 12,
          cards: [
            { id: 'a', title: 'Wide Card', colSpan: 6, rowSpan: 2 },
            { id: 'b', title: 'Narrow Top', colSpan: 3, rowSpan: 1 },
            { id: 'c', title: 'Narrow Bottom', colSpan: 3, rowSpan: 1 },
            { id: 'd', title: 'Footer', colSpan: 6, rowSpan: 1 },
          ],
        },
      ],
    },
  },
};

export const TwoSections: Story = {
  args: {
    config: SAMPLE_CONFIG,
  },
};
