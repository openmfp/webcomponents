import { Favorites } from '../../cards/favorites/favorites.component';
import { MockCard } from '../../cards/mock-card/mock-card.component';
import { ServiceStatusCard } from '../../cards/service-status/service-status-card.component';
import {
  STORY_THEMES,
  StoryTheme,
  applyStoryTheme,
} from '../../cards/stories/story-theme';
import { VisitedServiceCard } from '../../cards/visited-service-card/visited-service-card.component';
import { Dashboard } from '../dashboard/dashboard/dashboard.component';
import { type DashboardTranslations, EN_DEFAULTS } from '../dashboard/i18n';
import {
  CARD_SIZES,
  type CardConfig,
  type DashboardConfig,
  type SectionConfig,
} from '../dashboard/models';
import { DataFetchTable, type DataFetchTableData } from '../data-fetch-table';
import { ButtonSettings } from '../models/ui-definition';
import type { TableFieldDefinition } from '../table';
import { DeclarativeTableCard } from '../table-card/declarative-table-card.component';
import {
  CARD_TEMPLATE_AVAILABLE_CARDS,
  CARD_TEMPLATE_CARDS,
  CARD_TEMPLATE_SECTIONS,
} from './dashboard.card-template';
import { CARDS, RAS_CARDS, SECTIONS } from './dashboard.cards';
import { loadOpenUi5 } from './openui5';
import {
  BASIC_POD_CARD_CONFIG,
  TABLE_CARD_CONFIG,
  TABLE_RESOURCES,
} from './pods-table.config';
import { StoryServiceListCard } from './story-service-list-card.component';
import type { Meta, StoryObj } from '@storybook/angular';

Dashboard.registerAngularComponents([
  Favorites,
  ServiceStatusCard,
  VisitedServiceCard,
  MockCard,
  StoryServiceListCard,
  DataFetchTable,
  DeclarativeTableCard,
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

const SAMPLE_I18N: DashboardTranslations = {
  ...EN_DEFAULTS,
  title: 'System Overview',
  description:
    'Monitor your platform metrics, traffic and service health in <b>real time</b>.',
};

const SAMPLE_CONFIG: DashboardConfig = {
  backgroundImageUrl: '/background-lightblue.png',
  editable: true,
};

const AVAILABLE_CARDS: CardConfig[] = [
  {
    id: 'table-pods',
    label: 'Pods Table',
    w: 12,
    h: 45,
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
    minW: 3,
    maxW: 6,
    minH: 10,
    maxH: 40,
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

// Empty placeholder cards used to fill out the z-flow grid so the reflow,
// drag/resize and width-swap behaviour is easy to see against a uniform
// baseline. Two cards of every card size, so each size shows its span on the
// current page size.
const ZFLOW_MOCK_CARDS: CardConfig[] = Object.values(CARD_SIZES).flatMap(
  (size) =>
    [1, 2].map((n) => ({
      id: `mock-card-${size}-${n}`,
      type: 'angular' as const,
      component: 'mfp-mock-card',
      componentInputs: {
        title: `Card size ${size.toUpperCase()} · ${n}`,
      },
      size,
      h: 40,
    })),
);

const SECTION_CARDS_HEIGHT_SECTIONS: SectionConfig[] = [
  {
    id: 'uniform',
    title: 'Uniform section — cardsHeight: 30 (300 px)',
    w: 12,
    cardsHeight: 30,
  },
  {
    id: 'per-card',
    title: 'Same cards, no cardsHeight — each card keeps its own h',
    w: 12,
  },
];

const SECTION_CARDS_HEIGHT_TEMPLATES = [
  {
    key: 'visited-service',
    w: 3,
    h: 10,
    type: 'angular' as const,
    component: 'mfp-visited-service-card',
    componentInputs: {
      serviceType: 'SAP HANA Cloud',
      serviceName: 'olc-hana-db',
      serviceIcon: 'database',
      serviceDescription: 'Angular card, own h: 10',
      path: '/hana/olc-hana-db',
    },
  },
  {
    key: 'service-status',
    w: 3,
    h: 55,
    type: 'angular' as const,
    component: 'mfp-service-status-card',
    componentInputs: {},
  },
  {
    key: 'favorites',
    w: 3,
    type: 'angular' as const,
    component: 'mfp-favorites',
    componentInputs: {},
  },
  {
    key: 'mock',
    w: 3,
    h: 80,
    type: 'angular' as const,
    component: 'mfp-mock-card',
    componentInputs: { title: 'Mock card, own h: 80' },
  },
  {
    key: 'table',
    w: 12,
    h: 45,
    component: 'mfp-wc-declarative-table-card',
    componentInputs: {
      config: TABLE_CARD_CONFIG,
      header: 'Pods',
      headerTooltip: 'Custom-element card, own h: 45',
      resources: TABLE_RESOURCES,
    },
  },
];

const SECTION_CARDS_HEIGHT_CARDS: CardConfig[] =
  SECTION_CARDS_HEIGHT_SECTIONS.flatMap((section) =>
    SECTION_CARDS_HEIGHT_TEMPLATES.map(({ key, ...template }) => ({
      ...template,
      id: `${section.id}-${key}`,
      sectionId: section.id,
    })),
  );

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<Dashboard> = {
  title: 'Declarative UI / Dashboard',
  component: Dashboard,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    webcomponentsBundle: true,
  },
  argTypes: {
    config: { control: 'object' },
    i18n: { control: 'object' },
    sections: { control: 'object' },
    cards: { control: 'object' },
    availableCards: { control: 'object' },
    customActions: { control: 'object' },
    loading: { control: 'boolean' },
    loadingDelay: { control: 'number' },
    actionButtonClick: { action: 'actionButtonClick' },
    saved: { action: 'saved' },
    cardAction: { action: 'cardAction' },
  },
  args: {
    config: SAMPLE_CONFIG,
    i18n: SAMPLE_I18N,
    sections: SECTIONS,
    cards: CARDS,
    availableCards: AVAILABLE_CARDS,
    customActions: CUSTOM_ACTIONS,
    loading: false,
    loadingDelay: 1000,
  },
  render: (args) => ({
    props: args,
    template: `<mfp-dashboard [config]="config" [i18n]="i18n" [sections]="sections" [cards]="cards" [availableCards]="availableCards" [customActions]="customActions" [loading]="loading" [loadingDelay]="loadingDelay" (actionButtonClick)="actionButtonClick($event)" (saved)="saved($event)" />`,
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
      <mfp-dashboard [config]="config" [i18n]="i18n" [sections]="sections" [cards]="cards" [availableCards]="availableCards" [customActions]="customActions">
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

export const EmptyState: Story = {
  args: {
    i18n: {
      ...SAMPLE_I18N,
      title: 'Hi Tina!',
      description: 'Welcome to your global account <b>ACME GA</b>.',
    },
    sections: [],
    cards: [],
  },
  parameters: {
    docs: {
      description: {
        story:
          'With no sections and no cards the dashboard renders the empty state. The artwork is the SAP "NoApplications" TNT scene illustration, applied as a background image so it can be swapped from CSS alone via `--mfp-dashboard-empty-image` — the same contract as `--mfp-dashboard-background`. Its Edit Home button enters edit mode and opens the Edit Cards dialog in one step. The button is dropped once edit mode is active, where the toolbar already offers Edit Cards.',
      },
    },
  },
};

export const EmptyStateWithSections: Story = {
  args: {
    i18n: {
      ...SAMPLE_I18N,
      title: 'Hi Tina!',
      description: 'Welcome to your global account <b>ACME GA</b>.',
    },
    sections: SECTIONS,
    cards: RAS_CARDS,
  },
  parameters: {
    docs: {
      description: {
        story:
          'The empty state tracks the loose-card grid, not the total card count. Here the app-provided "Recently accessed services" section is fully populated, yet the part of the home the user curates through Edit Cards holds nothing — so the section renders as usual with the empty state below it. Adding any card from the Edit Cards dialog fills the grid and the empty state disappears.',
      },
    },
  },
};

export const InitialLoading: Story = {
  args: {
    i18n: {
      ...SAMPLE_I18N,
      title: 'Hello Annika!',
      description: 'Welcome to your global account <b>BTP Fabric Design</b>.',
    },
    sections: [],
    cards: [],
    loading: true,
    loadingDelay: 0,
  },
  parameters: {
    docs: {
      description: {
        story:
          'The dashboard body — topbar, sections and the card grid alike — sits inside a `ui5-busy-indicator` driven by the `loading` input, so a home whose cards are still in flight shows one page-level spinner instead of a grid of half-drawn cards. The empty state is suppressed for the same reason: a dashboard that has not finished loading must not announce that it is empty. `loadingDelay` is forced to `0` here so the busy state is visible immediately in Storybook; see the **Loading Delay** story for the default one-second grace period.',
      },
    },
  },
};

export const LoadingDelay: Story = {
  args: {
    i18n: {
      ...SAMPLE_I18N,
      title: 'Loading Delay',
      description:
        'Toggle <b>loading</b> in the controls panel and watch the one-second grace period.',
    },
    sections: [],
    cards: [],
    loading: true,
    loadingDelay: 1000,
  },
  parameters: {
    docs: {
      description: {
        story:
          '`loadingDelay` (default `1000`) is the grace period between `loading` turning `true` and the busy state painting — not a minimum display time and not a timeout. The timer is cancelled if `loading` clears first, so a load that finishes inside the window leaves the page completely untouched: no spinner, no dimming, no reserved space. Flip `loading` off and on again in the controls panel within a second to see nothing happen; leave it on to see the spinner arrive.',
      },
    },
  },
};

export const CompactToolbar: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    chromatic: { viewports: [725] },
    docs: {
      description: {
        story:
          'Below 726 px the individual toolbar buttons collapse into a single overflow button. Click it to see the custom actions and Edit View item separated by a MenuSeparator.',
      },
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="width:725px;overflow:hidden">
        <mfp-dashboard [config]="config" [i18n]="i18n" [sections]="sections" [cards]="cards" [availableCards]="availableCards" [customActions]="customActions">
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
    config: SAMPLE_CONFIG,
    i18n: {
      ...SAMPLE_I18N,
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
      buttonsSettings: {
        editViewButton: {
          text: 'Edit View',
          icon: '',
          design: 'Default',
          tooltip: '',
        },
        editCardsButton: {
          text: 'Add Card',
          icon: '',
          design: 'Emphasized',
          tooltip: '',
        },
      },
    },
    i18n: {
      ...SAMPLE_I18N,
      title: 'Custom Button Settings',
      description:
        'Edit View and Add Card buttons configured via buttonSettings — text labels, no icons.',
    },
  },
};

export const ZFlowLayout: Story = {
  args: {
    config: {
      ...SAMPLE_CONFIG,
      zFlow: { cardHeight: 40, defaultCardSize: 'm' },
    },
    i18n: {
      ...SAMPLE_I18N,
      title: 'Z-Flow Layout',
      description:
        'Activates the z-flow grid engine, loose cards forced to a fixed height, and z-flow drag/resize.',
    },
    cards: [...RAS_CARDS.map((c) => ({ ...c, w: 1 })), ...ZFLOW_MOCK_CARDS],
    availableCards: [...ZFLOW_MOCK_CARDS],
  },
  parameters: {
    docs: {
      description: {
        story:
          'The z-flow engine reflows loose cards left-to-right, top-to-bottom. The loose cards come in all five card sizes (`s`, `m`, `l`, `xl`, `xxl`); resize the canvas to see each size take its column span on every page size. Card widths here are proportional to the Default story (default 12-col base → z-flow 4-col base), so a half-width card stays half-width.',
      },
    },
  },
};

export const SectionCardsHeight: Story = {
  args: {
    config: SAMPLE_CONFIG,
    i18n: {
      ...SAMPLE_I18N,
      title: 'Section Cards Height',
      description:
        'Both sections hold the <b>same five cards</b> with the same per-card <code>h</code>. The first section sets <code>cardsHeight: 30</code>, so every card is 300 px tall regardless of what it declares; the second leaves it unset, so each card keeps its own height.',
    },
    sections: SECTION_CARDS_HEIGHT_SECTIONS,
    cards: SECTION_CARDS_HEIGHT_CARDS,
    availableCards: [],
  },
  parameters: {
    docs: {
      description: {
        story:
          "`SectionConfig.cardsHeight` forces one row span on every card in the section. It wins over each card's own `h` and supplies a height to cards that declare none, so a section of mixed card types (Angular, custom element, no `h` at all) lines up on a single baseline. Only the height is touched — `w` still comes from each card, and the value is presentational: the cards keep their configured `h` in the `saved` payload. Set the same section's `cardsHeight` in the controls panel to retune the whole row at once.",
      },
    },
  },
};

export const CardTemplate: StoryObj<Dashboard & { theme: StoryTheme }> = {
  loaders: [
    async () => {
      await loadOpenUi5();
      return {};
    },
  ],
  argTypes: {
    theme: { control: 'select', options: STORY_THEMES },
  },
  args: {
    theme: 'sap_horizon',
    config: { editable: true },
    i18n: {
      ...SAMPLE_I18N,
      title: 'Card Template',
      description:
        'Cards with <code>componentTemplate</code> get the MFP card frame and header from the dashboard.',
    },
    sections: CARD_TEMPLATE_SECTIONS,
    cards: CARD_TEMPLATE_CARDS,
    availableCards: CARD_TEMPLATE_AVAILABLE_CARDS,
    customActions: [],
  },
  render: (args) => {
    applyStoryTheme(args.theme);
    return {
      props: args,
      template: `
        <div style="min-height:100vh;background:var(--sapBackgroundColor);font-family:var(--sapFontFamily)">
          <mfp-dashboard [config]="config" [i18n]="i18n" [sections]="sections" [cards]="cards" [availableCards]="availableCards" [customActions]="customActions" (cardAction)="cardAction($event)" (saved)="saved($event)" />
        </div>
      `,
    };
  },
  parameters: {
    webcomponentsBundle: false,
    docs: {
      description: {
        story:
          'The first section holds one card of each type — a custom element (`wc`), a registered Angular component (`angular`) and an OpenUI5 Component (`sap-ui`) — all wrapped by the dashboard from `componentTemplate`. The title comes from `label`, and the search and actions reach each card through its `onCardSearch(query)` and `onCardAction(key)` methods; every action is also emitted as `cardAction` (see the Actions panel). The second section uses `header: false`, so the dashboard draws only the frame. The loose card comes from `availableCards`, which the dashboard merges loose cards with by id. Switch the theme with the `theme` control. The OpenUI5 card loads OpenUI5 1.142.0 from `sdk.openui5.org`, so it needs network access.',
      },
    },
  },
};

const DESTINATION_NAME_GROUP = {
  name: 'destination',
  label: 'Name',
  multiline: true,
};

const DESTINATION_ROWS = [
  {
    id: 'C4C',
    type: 'HTTP',
    authentication: 'Basic Authentication',
    description: 'SAP Cloud for Customer SAP Task Center destination',
    subaccount: 'My Subaccount 3',
    subaccountId: '3',
  },
  {
    id: 'S4HANA',
    type: 'OnPremise',
    authentication: 'OAuth2Password',
    description: 'API Gateway module: Deletion of APIRule v1beta1',
    subaccount: 'My Subaccount 6',
    subaccountId: '6',
  },
  {
    id: 'S4HANAPE',
    type: 'OnPremise',
    authentication: 'Basic Authentication',
    description:
      'Multitarget Applications for Cloud Foundry: Deprecation of several module hooks',
    subaccount: 'My Subaccount 6',
    subaccountId: '6',
  },
];

const DESTINATION_OVERFLOW_ROWS = [
  ...DESTINATION_ROWS,
  ...[2, 3].flatMap((copy) =>
    DESTINATION_ROWS.map((row) => ({ ...row, id: `${row.id}-${copy}` })),
  ),
];

const DESTINATIONS_CARD = {
  id: 'destination-authentication',
  label: 'Destinations with not recommended authentication methods',
  size: 'm',
  type: 'angular',
  component: 'mfp-data-fetch-table',
  componentTemplate: {
    subtitle: 'Last updated: 30 minutes ago',
    status: {
      text: `${DESTINATION_OVERFLOW_ROWS.length} Destinations`,
      state: 'Critical',
    },
    contentScrollable: true,
    actions: [{ key: 'view-destinations', text: 'View destinations' }],
  },
  componentInputs: {
    data: { resource: DESTINATION_OVERFLOW_ROWS } satisfies DataFetchTableData,
    columns: [
      {
        property: 'id',
        group: DESTINATION_NAME_GROUP,
        columnSettings: { width: '41%' },
        uiSettings: {
          displayAs: 'link',
          linkSettings: { link: 'https://example.com/destinations/{{id}}' },
        },
      },
      { property: 'type', label: 'Type', group: DESTINATION_NAME_GROUP },
      {
        property: 'authentication',
        label: 'Authentication',
        group: DESTINATION_NAME_GROUP,
      },
      {
        property: 'description',
        label: 'Description',
        columnSettings: { width: '34%' },
      },
      {
        property: 'subaccount',
        label: 'Subaccount',
        columnSettings: { width: '25%' },
        uiSettings: {
          displayAs: 'link',
          linkSettings: {
            link: 'https://example.com/subaccounts/{{subaccountId}}',
          },
        },
      },
    ] satisfies TableFieldDefinition[],
  },
} satisfies CardConfig;

const SHOWCASE_PODS = [
  ...TABLE_RESOURCES,
  ...TABLE_RESOURCES.map((pod) => ({
    ...pod,
    id: `${pod.id}-replica`,
    metadata: {
      ...pod.metadata,
      name: `${pod.metadata.name}-replica`,
      uid: `${pod.metadata.uid}-replica`,
    },
  })),
];

const SHOWCASE_CARDS: CardConfig[] = [
  DESTINATIONS_CARD,
  {
    id: 'showcase-pods',
    label: 'Pods',
    size: 'xxl',
    type: 'angular',
    component: 'mfp-declarative-table-card',
    componentInputs: {
      config: {
        ...BASIC_POD_CARD_CONFIG,
        tableConfig: {
          ...BASIC_POD_CARD_CONFIG.tableConfig,
          paginationLimit: 10,
          // The 384px card surface also contains two 60px bars and a 2px border.
          height: 262,
        },
      },
      resources: SHOWCASE_PODS,
    },
  },
];

export const MfpCardsShowcase: Story = {
  args: {
    config: { zFlow: { cardHeight: 40, defaultCardSize: 'xxl' } },
    i18n: { ...EN_DEFAULTS, title: '', description: '' },
    sections: [],
    cards: SHOWCASE_CARDS,
    availableCards: SHOWCASE_CARDS,
    customActions: [],
  },
  parameters: { webcomponentsBundle: false },
  render: (args) => ({
    props: args,
    template: `
      <mfp-dashboard
        [availableCards]="availableCards"
        [cards]="cards"
        [config]="config"
        [i18n]="i18n"
        [sections]="sections"
        (cardAction)="cardAction($event)"
      />
    `,
  }),
};
