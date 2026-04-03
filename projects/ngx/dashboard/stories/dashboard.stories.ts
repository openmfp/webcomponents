import { Dashboard } from '../dashboard/dashboard.component';
import type { CardConfig, DashboardConfig } from '../models';
import { CARDS, SECTIONS } from './dashboard.cards';
import { TABLE_COLUMNS, TABLE_RESOURCES } from './pods-table.config';
import type { Meta, StoryObj } from '@storybook/angular';

// ---------------------------------------------------------------------------
// Shared config
// ---------------------------------------------------------------------------

const SAMPLE_CONFIG: DashboardConfig = {
  title: 'System Overview',
  description:
    'Monitor your platform metrics, traffic and service health in real time.',
  backgroundImageUrl: '/background-lightblue.png',
};

const AVAILABLE_CARDS: CardConfig[] = [
  {
    label: 'Pods Table',
    colSpan: 12,
    rowSpan: 4,
    component: 'mfp-declarative-table',
    componentInputs: {
      columns: TABLE_COLUMNS,
      resources: TABLE_RESOURCES,
      trackByProperty: 'metadata.uid',
      hasMore: false,
      paginationLimit: 5,
    },
  },
  {
    label: "What's New",
    colSpan: 6,
    rowSpan: 3,
    component: 'mfp-whats-new',
  },
  {
    label: 'Favorites',
    colSpan: 5,
    rowSpan: 2,
    component: 'mfp-favorites',
  },
  {
    label: 'Service Status',
    colSpan: 4,
    rowSpan: 1,
    component: 'mfp-service-status-card',
  },
];

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
    availableCards: { control: 'object' },
  },
  args: {
    config: SAMPLE_CONFIG,
    sections: SECTIONS,
    cards: CARDS,
    availableCards: AVAILABLE_CARDS,
  },
  render: (args) => ({
    props: args,
    template: `<mfp-dashboard [config]="config" [sections]="sections" [cards]="cards" [availableCards]="availableCards" />`,
  }),
};

export default meta;
type Story = StoryObj<Dashboard>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {};
