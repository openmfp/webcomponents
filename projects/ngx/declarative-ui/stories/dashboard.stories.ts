import { Favorites } from '../../cards/favorites/favorites.component';
import { ServiceStatusCard } from '../../cards/service-status/service-status-card.component';
import { VisitedServiceCard } from '../../cards/visited-service-card/visited-service-card.component';
import { Dashboard } from '../dashboard/dashboard/dashboard.component';
import type { CardConfig, DashboardConfig } from '../dashboard/models';
import { ButtonSettings } from '../models/ui-definition';
import { CARDS, SECTIONS } from './dashboard.cards';
import { TABLE_CARD_CONFIG, TABLE_RESOURCES } from './pods-table.config';
import type { Meta, StoryObj } from '@storybook/angular';

Dashboard.registerAngularComponents([
  Favorites,
  ServiceStatusCard,
  VisitedServiceCard,
]);

// ---------------------------------------------------------------------------
// Shared config
// ---------------------------------------------------------------------------

const CUSTOM_ACTIONS: ButtonSettings[] = [
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
    id: 'table-pods',
    label: 'Pods Table',
    w: 12,
    h: 35,
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
    type: 'angular',
    w: 6,
    h: 55,
    component: 'mfp-whats-new',
  },
  {
    id: 'favorites',
    label: 'Favorites',
    type: 'angular',
    w: 6,
    h: 20,
    component: 'mfp-favorites',
  },
  {
    id: 'service-status',
    label: 'Service Status',
    type: 'angular',
    w: 6,
    h: 28,
    component: 'mfp-service-status-card',
  },
];

const REGISTRY_SECTIONS = [
  {
    id: 'angular-cards',
    title: 'Angular cards',
    editable: true,
    w: 12,
  },
  {
    id: 'wc-cards',
    title: 'Webcomponent cards',
    editable: true,
    w: 12,
  },
];

const REGISTRY_CARDS: CardConfig[] = [
  {
    id: 'angular-visited-service',
    w: 4,
    h: 10,
    sectionId: 'angular-cards',
    type: 'angular',
    component: 'mfp-visited-service-card',
    componentInputs: {
      serviceType: 'SAP HANA Cloud',
      serviceName: 'orders-db',
      serviceIcon: 'database',
      serviceDescription: 'Registered Angular component',
      path: '/hana/orders-db',
    },
  },
  {
    id: 'angular-favorites',
    sectionId: 'angular-cards',
    x: 0,
    y: 0,
    w: 5,
    h: 20,
    type: 'angular',
    component: 'mfp-favorites',
  },
  {
    id: 'webcomponent-table',
    sectionId: 'wc-cards',
    w: 12,
    h: 50,
    component: 'mfp-wc-declarative-table-card',
    componentInputs: {
      config: TABLE_CARD_CONFIG,
      header: 'Pods rendered by web component',
      headerTooltip:
        'This card intentionally uses the existing custom-element render path.',
      resources: TABLE_RESOURCES,
    },
  },
];

const ANGULAR_REGISTRY_AVAILABLE_CARDS: CardConfig[] = [
  {
    id: 'angular-service-status-template',
    label: 'Angular Service Status',
    w: 6,
    h: 29,
    component: 'mfp-service-status-card',
  },
  {
    id: 'webcomponent-whats-new-template',
    label: "Web Component What's New",
    w: 6,
    h: 56,
    component: 'mfp-whats-new',
  },
];

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<Dashboard> = {
  title: 'Declarative UI / Dashboard',
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
    saved: { action: 'saved' },
  },
  args: {
    config: SAMPLE_CONFIG,
    sections: SECTIONS,
    cards: CARDS,
    availableCards: AVAILABLE_CARDS,
  },
  render: (args) => ({
    props: args,
    template: `<mfp-dashboard [config]="config" [sections]="sections" [cards]="cards" [availableCards]="availableCards" (actionButtonClick)="actionButtonClick($event)" (saved)="saved($event)" />`,
  }),
};

export default meta;
type Story = StoryObj<Dashboard>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {};

export const WithSubheader: Story = {
  render: (args) => ({
    props: args,
    template: `
      <mfp-dashboard [config]="config" [sections]="sections" [cards]="cards" [availableCards]="availableCards">
        <div slot="dashboard-subheader" style="display:flex;align-items:center;gap:1.5rem;width:100%">
          <img src="https://platform-mesh.io/main/pm_logo.svg" alt="Platform Mesh logo" style="width:48px;height:48px;object-fit:contain;flex-shrink:0" />
          <div style="display:flex;gap:2rem;flex-wrap:wrap">
            <div style="display:flex;flex-direction:column;gap:0.25rem">
              <span style="font-size:0.75rem;color:var(--sapContent_LabelColor,#6a6d70)">Workspace Path</span>
              <span style="font-size:0.875rem">root:orgs:sub:a1</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:0.25rem">
              <span style="font-size:0.75rem;color:var(--sapContent_LabelColor,#6a6d70)">Description</span>
              <span style="font-size:0.875rem">Platform Mesh sub-organization</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:0.25rem">
              <span style="font-size:0.75rem;color:var(--sapContent_LabelColor,#6a6d70)">Display Name</span>
              <span style="font-size:0.875rem">a1</span>
            </div>
          </div>
        </div>
      </mfp-dashboard>
    `,
  }),
};

export const CompactToolbar: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    chromatic: { viewports: [725] },
    docs: {
      description: {
        story:
          'Below 726 px the individual toolbar buttons collapse into a single menu2 burger button. Click it to see the custom actions and Edit View item separated by a MenuSeparator.',
      },
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="width:725px;overflow:hidden">
        <mfp-dashboard [config]="config" [sections]="sections" [cards]="cards" [availableCards]="availableCards">
          <div slot="dashboard-subheader" style="display:flex;align-items:center;gap:1.5rem;width:100%">
            <img src="https://platform-mesh.io/main/pm_logo.svg" alt="Platform Mesh logo" style="width:48px;height:48px;object-fit:contain;flex-shrink:0" />
            <div style="display:flex;gap:2rem;flex-wrap:wrap">
              <div style="display:flex;flex-direction:column;gap:0.25rem">
                <span style="font-size:0.75rem;color:var(--sapContent_LabelColor,#6a6d70)">Workspace Path</span>
                <span style="font-size:0.875rem">root:orgs:sub:a1</span>
              </div>
              <div style="display:flex;flex-direction:column;gap:0.25rem">
                <span style="font-size:0.75rem;color:var(--sapContent_LabelColor,#6a6d70)">Description</span>
                <span style="font-size:0.875rem">Platform Mesh sub-organization</span>
              </div>
              <div style="display:flex;flex-direction:column;gap:0.25rem">
                <span style="font-size:0.75rem;color:var(--sapContent_LabelColor,#6a6d70)">Display Name</span>
                <span style="font-size:0.875rem">a1</span>
              </div>
            </div>
          </div>
        </mfp-dashboard>
      </div>
    `,
  }),
};

export const AngularComponentRegistry: Story = {
  args: {
    config: {
      ...SAMPLE_CONFIG,
      title: 'Angular Component Registry',
      description:
        'This story mixes registered Angular card components with existing web components.',
    },
    sections: REGISTRY_SECTIONS,
    cards: REGISTRY_CARDS,
    availableCards: ANGULAR_REGISTRY_AVAILABLE_CARDS,
  },
};

export const CustomButtonSettings: Story = {
  args: {
    config: {
      ...SAMPLE_CONFIG,
      title: 'Custom Button Settings',
      description:
        'Edit View and Add Card buttons configured via buttonSettings — text labels, no icons.',
      buttonsSettings: {
        editViewButton: {
          text: 'Edit View',
          icon: '',
          design: 'Default',
          tooltip: '',
        },
        addCardButton: {
          text: 'Add Card',
          icon: '',
          design: 'Emphasized',
          tooltip: '',
        },
      },
    },
  },
};
