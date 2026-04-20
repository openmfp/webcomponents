import { Dashboard } from '../dashboard/dashboard.component';
import type { CardConfig, DashboardConfig } from '../models';
import { CARDS, SECTIONS } from './dashboard.cards';
import { TABLE_CARD_CONFIG, TABLE_RESOURCES } from './pods-table.config';
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
    id: 'table-pods',
    w: 12,
    h: 49,
    component: 'mfp-wc-declarative-table-card',
    componentInputs: {
      config: TABLE_CARD_CONFIG,
      header: 'Pods',
      headerTooltip: 'This table lists all pods running in the cluster.',
      resources: TABLE_RESOURCES,
    },
  },
  {
    id: 'whats-new',
    label: "What's New",
    w: 5,
    h: 56,
    component: 'mfp-wc-whats-new',
  },
  {
    id: 'favorites',
    label: 'Favorites',
    w: 4,
    h: 21,
    component: 'mfp-wc-favorites',
  },
  {
    id: 'service-status',
    label: 'Service Status',
    w: 4,
    h: 29,
    component: 'mfp-wc-service-status-card',
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
