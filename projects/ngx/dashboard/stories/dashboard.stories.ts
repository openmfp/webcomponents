import { Dashboard } from '../dashboard/dashboard.component';
import type { CardConfig, DashboardConfig, SectionConfig } from '../models';
import type { Meta, StoryObj } from '@storybook/angular';

const SAMPLE_CONFIG: DashboardConfig = {
  title: 'System Overview',
  description:
    'Monitor your platform metrics, traffic and service health in real time.',
  backgroundImageUrl:
    'https://fastly.picsum.photos/id/302/1728/1080.jpg?hmac=HlMkTqLQIirH_eozQ6CaQzdfukIGHfvGqh0uxc6CSKQ',
};

const SAMPLE_SECTIONS: SectionConfig[] = [
  { id: 'overview', title: 'Overview', colSpan: 12 },
  { id: 'traffic', title: 'Traffic', colSpan: 12 },
];

const SAMPLE_CARDS: CardConfig[] = [
  {
    id: 'card-1',
    title: 'Total Users',
    colSpan: 3,
    rowSpan: 1,
    sectionId: 'overview',
  },
  {
    id: 'card-2',
    title: 'Active Sessions',
    colSpan: 3,
    rowSpan: 1,
    sectionId: 'overview',
  },
  {
    id: 'card-3',
    title: 'Errors',
    colSpan: 3,
    rowSpan: 1,
    sectionId: 'overview',
  },
  {
    id: 'card-4',
    title: 'Uptime',
    colSpan: 3,
    rowSpan: 1,
    sectionId: 'overview',
  },
  {
    id: 'card-5',
    title: 'Requests Over Time',
    colSpan: 8,
    rowSpan: 2,
    sectionId: 'traffic',
  },
  {
    id: 'card-6',
    title: 'Top Endpoints',
    colSpan: 4,
    rowSpan: 2,
    sectionId: 'traffic',
  },
  { id: 'loose-1', title: 'Quick Stats', colSpan: 4, rowSpan: 1 },
  { id: 'loose-2', title: 'Alerts', colSpan: 8, rowSpan: 1 },
];

const meta: Meta<Dashboard> = {
  title: 'Dashboard / Dashboard',
  component: Dashboard,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    config: { control: 'object' },
    sections: { control: 'object' },
    cards: { control: 'object' },
  },
  args: {
    config: SAMPLE_CONFIG,
    sections: SAMPLE_SECTIONS,
    cards: SAMPLE_CARDS,
  },
  render: (args) => ({
    props: args,
    template: `<mfp-dashboard [config]="config" [sections]="sections" [cards]="cards" />`,
  }),
};

export default meta;
type Story = StoryObj<Dashboard>;

export const Default: Story = {};

export const CardsOnly: Story = {
  args: {
    sections: [],
    cards: [
      { id: 'a', title: 'Revenue', colSpan: 3, rowSpan: 1 },
      { id: 'b', title: 'Users', colSpan: 3, rowSpan: 1 },
      { id: 'c', title: 'Conversion', colSpan: 3, rowSpan: 1 },
      { id: 'd', title: 'Churn', colSpan: 3, rowSpan: 1 },
      { id: 'e', title: 'Wide Chart', colSpan: 8, rowSpan: 2 },
      { id: 'f', title: 'Summary', colSpan: 4, rowSpan: 2 },
    ],
  },
};

export const SectionsOnly: Story = {
  args: {
    sections: [{ id: 'main', title: 'Main', colSpan: 12 }],
    cards: [
      {
        id: 'a',
        title: 'Wide Card',
        colSpan: 6,
        rowSpan: 2,
        sectionId: 'main',
      },
      {
        id: 'b',
        title: 'Narrow Top',
        colSpan: 3,
        rowSpan: 1,
        sectionId: 'main',
      },
      {
        id: 'c',
        title: 'Narrow Bottom',
        colSpan: 3,
        rowSpan: 1,
        sectionId: 'main',
      },
      { id: 'd', title: 'Footer', colSpan: 6, rowSpan: 1, sectionId: 'main' },
    ],
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

export const NonEditableSection: Story = {
  args: {
    config: {
      title: 'Mixed Editability',
      description: 'One section is locked, the other is editable.',
    },
    sections: [
      { id: 'locked', title: 'Locked Section', colSpan: 12, editable: false },
      { id: 'editable', title: 'Editable Section', colSpan: 12 },
    ],
    cards: [
      {
        id: 'l-1',
        title: 'Fixed Card A',
        colSpan: 4,
        rowSpan: 1,
        sectionId: 'locked',
      },
      {
        id: 'l-2',
        title: 'Fixed Card B',
        colSpan: 4,
        rowSpan: 1,
        sectionId: 'locked',
      },
      {
        id: 'l-3',
        title: 'Fixed Card C',
        colSpan: 4,
        rowSpan: 1,
        sectionId: 'locked',
      },
      {
        id: 'e-1',
        title: 'Removable Card A',
        colSpan: 6,
        rowSpan: 1,
        sectionId: 'editable',
      },
      {
        id: 'e-2',
        title: 'Removable Card B',
        colSpan: 6,
        rowSpan: 1,
        sectionId: 'editable',
      },
    ],
  },
};
