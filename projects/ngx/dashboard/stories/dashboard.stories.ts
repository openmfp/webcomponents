import { Dashboard } from '../dashboard/dashboard.component';
import type {
  CardConfig,
  DashboardButtonSettings,
  DashboardConfig,
} from '../models';
import { CARDS, SECTIONS } from './dashboard.cards';
import { TABLE_CARD_CONFIG, TABLE_RESOURCES } from './pods-table.config';
import type { Meta, StoryObj } from '@storybook/angular';

// ---------------------------------------------------------------------------
// Shared config
// ---------------------------------------------------------------------------

const CUSTOM_ACTIONS: DashboardButtonSettings[] = [
  {
    action: 'download-config',
    text: 'Download config',
    icon: 'download',
    design: 'Default',
    tooltip: 'Download the current dashboard configuration',
  },
  {
    action: 'switch-account',
    text: 'Switch account',
    icon: 'customer',
    design: 'Default',
    tooltip: 'Switch to a different account',
  },
];

const SAMPLE_CONFIG: DashboardConfig = {
  title: 'System Overview',
  description:
    'Monitor your platform metrics, traffic and service health in real time.',
  backgroundImageUrl: '/background-lightblue.png',
  customActions: CUSTOM_ACTIONS,
  editable: true,
};

const AVAILABLE_CARDS: CardConfig[] = [
  {
    label: 'Pods Table',
    colSpan: 12,
    rowSpan: 4,
    component: 'mfp-wc-declarative-table-card',
    componentInputs: {
      config: TABLE_CARD_CONFIG,
      header: 'Pods',
      headerTooltip: 'This table lists all pods running in the cluster.',
      resources: TABLE_RESOURCES,
    },
  },
  {
    label: "What's New",
    colSpan: 6,
    rowSpan: 3,
    component: 'mfp-wc-whats-new',
  },
  {
    label: 'Favorites',
    colSpan: 5,
    rowSpan: 2,
    component: 'mfp-wc-favorites',
  },
  {
    label: 'Service Status',
    colSpan: 4,
    rowSpan: 1,
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
    actionButtonClick: { action: 'actionButtonClick' },
  },
  args: {
    config: SAMPLE_CONFIG,
    sections: SECTIONS,
    cards: CARDS,
    availableCards: AVAILABLE_CARDS,
  },
  render: (args) => ({
    props: args,
    template: `<mfp-dashboard [config]="config" [sections]="sections" [cards]="cards" [availableCards]="availableCards" (actionButtonClick)="actionButtonClick($event)" />`,
  }),
};

export default meta;
type Story = StoryObj<Dashboard>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {};
