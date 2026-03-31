import { Dashboard } from '../dashboard/dashboard.component';
import type { DashboardConfig } from '../models';
import type { Meta, StoryObj } from '@storybook/angular';
import { CARDS, SECTIONS } from './dashboard.cards';

// ---------------------------------------------------------------------------
// Shared config
// ---------------------------------------------------------------------------

const SAMPLE_CONFIG: DashboardConfig = {
  title: 'System Overview',
  description:
    'Monitor your platform metrics, traffic and service health in real time.',
  backgroundImageUrl: '/background-lightblue.png',
};

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

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
    sections: SECTIONS,
    cards: CARDS,
  },
  render: (args) => ({
    props: args,
    template: `<mfp-dashboard [config]="config" [sections]="sections" [cards]="cards" />`,
  }),
};

export default meta;
type Story = StoryObj<Dashboard>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {};

export const CardsOnly: Story = {
  args: {
    sections: [],
    cards: [
      { id: 'a', colSpan: 3, rowSpan: 1 },
      { id: 'b', colSpan: 3, rowSpan: 1 },
      { id: 'c', colSpan: 3, rowSpan: 1 },
      { id: 'd', colSpan: 3, rowSpan: 1 },
      { id: 'e', colSpan: 8, rowSpan: 2 },
      { id: 'f', colSpan: 4, rowSpan: 2 },
    ],
  },
};

export const SectionsOnly: Story = {
  args: {
    sections: [{ id: 'main', title: 'Main', colSpan: 12 }],
    cards: [
      { id: 'a', colSpan: 6, rowSpan: 2, sectionId: 'main' },
      { id: 'b', colSpan: 3, rowSpan: 1, sectionId: 'main' },
      { id: 'c', colSpan: 3, rowSpan: 1, sectionId: 'main' },
      { id: 'd', colSpan: 6, rowSpan: 1, sectionId: 'main' },
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
      { id: 'l-1', colSpan: 4, rowSpan: 1, sectionId: 'locked' },
      { id: 'l-2', colSpan: 4, rowSpan: 1, sectionId: 'locked' },
      { id: 'l-3', colSpan: 4, rowSpan: 1, sectionId: 'locked' },
      { id: 'e-1', colSpan: 6, rowSpan: 1, sectionId: 'editable' },
      { id: 'e-2', colSpan: 6, rowSpan: 1, sectionId: 'editable' },
    ],
  },
};
