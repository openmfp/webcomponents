import { Dashboard } from '../dashboard/dashboard.component';
import type { DashboardConfig } from '../models';
import type { Meta, StoryObj } from '@storybook/angular';

const SAMPLE_CONFIG: DashboardConfig = {
  title: 'System Overview',
  description:
    'Monitor your platform metrics, traffic and service health in real time.',
  backgroundImageUrl:
    'https://fastly.picsum.photos/id/302/1728/1080.jpg?hmac=HlMkTqLQIirH_eozQ6CaQzdfukIGHfvGqh0uxc6CSKQ',
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
  cards: [
    { id: 'loose-1', title: 'Quick Stats', colSpan: 4, rowSpan: 1 },
    { id: 'loose-2', title: 'Alerts', colSpan: 8, rowSpan: 1 },
  ],
};

const meta: Meta<Dashboard> = {
  title: 'Dashboard / Dashboard',
  component: Dashboard,
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
type Story = StoryObj<Dashboard>;

export const Default: Story = {};

export const CardsOnly: Story = {
  args: {
    config: {
      title: 'Cards Only',
      description: 'Top-level cards without sections.',
      cards: [
        { id: 'a', title: 'Revenue', colSpan: 3, rowSpan: 1 },
        { id: 'b', title: 'Users', colSpan: 3, rowSpan: 1 },
        { id: 'c', title: 'Conversion', colSpan: 3, rowSpan: 1 },
        { id: 'd', title: 'Churn', colSpan: 3, rowSpan: 1 },
        { id: 'e', title: 'Wide Chart', colSpan: 8, rowSpan: 2 },
        { id: 'f', title: 'Summary', colSpan: 4, rowSpan: 2 },
      ],
    },
  },
};

export const SectionsOnly: Story = {
  args: {
    config: {
      title: 'Sections Only',
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

export const Mixed: Story = {
  args: {
    config: SAMPLE_CONFIG,
  },
};

export const WithBackground: Story = {
  args: {
    config: {
      ...SAMPLE_CONFIG,
      backgroundImageUrl:
        'https://fastly.picsum.photos/id/100/2500/1656.jpg?hmac=gWyN-7ZB32rkAjMhKXQgdHOIBRHyTSgzuOK6U0vXb1w',
    },
  },
};
