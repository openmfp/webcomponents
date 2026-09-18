import { ZFLOW_DASHBOARD_BREAKPOINTS } from '../../declarative-ui/dashboard/constants';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  ViewEncapsulation,
  signal,
  viewChild,
} from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

const OPENUI5_BOOTSTRAP_URL =
  'https://sdk.openui5.org/1.142.0/resources/sap-ui-core.js';

const DASHBOARD_COLUMNS = ZFLOW_DASHBOARD_BREAKPOINTS[0].c;

const THEMES = [
  'sap_horizon',
  'sap_horizon_dark',
  'sap_horizon_hcw',
  'sap_horizon_hcb',
] as const;

type Theme = (typeof THEMES)[number];

interface Ui5Event {
  getParameter(name: string): unknown;
}

interface Ui5Control {
  placeAt(target: HTMLElement): void;
  destroy(): void;
}

type Ui5ControlClass = new (settings?: Record<string, unknown>) => Ui5Control;

interface Ui5Filter {
  path: string;
  operator: string;
  value1: string;
}

interface Ui5ListBinding {
  filter(filters: unknown[]): void;
}

interface Ui5List extends Ui5Control {
  getBinding(aggregation: string): Ui5ListBinding | undefined;
}

type SapUiRequire = (
  dependencies: string[],
  callback: (...modules: never[]) => void,
  errback?: (error: Error) => void,
) => void;

interface SapGlobal {
  sap?: { ui?: { require?: SapUiRequire } };
}

interface CardModules {
  Card: Ui5ControlClass;
  Item: Ui5ControlClass;
  List: new (settings?: Record<string, unknown>) => Ui5List;
  StandardListItem: Ui5ControlClass;
  MessageStrip: Ui5ControlClass;
  JSONModel: new (data: unknown) => object;
  Filter: new (settings: Ui5Filter) => object;
  Theming: { setTheme(theme: string): void };
}

const SERVICES = [
  { title: 'olc-hana-db', description: 'SAP HANA Cloud' },
  { title: 'Cloud Identity Service', description: 'Identity Authentication' },
  { title: 'olc-hana-db-test', description: 'SAP HANA Cloud' },
  { title: 'applicationtest', description: 'Application Autoscaler' },
  { title: 'auditlog-name', description: 'Audit Log Service' },
  { title: 'checkout-api', description: 'Cloud Foundry App' },
  { title: 'internal-portal', description: 'HTML5 Application' },
];

let openUi5Ready: Promise<CardModules> | undefined;

function sapUiRequire(): SapUiRequire {
  const require = (globalThis as SapGlobal).sap?.ui?.require;
  if (!require) {
    throw new Error('OpenUI5 is not loaded');
  }
  return require;
}

function requireModules(dependencies: string[]): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    sapUiRequire()(
      dependencies,
      (...modules: never[]) => {
        resolve(modules);
      },
      reject,
    );
  });
}

function loadOpenUi5(): Promise<CardModules> {
  openUi5Ready ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.id = 'sap-ui-bootstrap';
    script.src = OPENUI5_BOOTSTRAP_URL;
    script.dataset['sapUiResourceRoots'] = JSON.stringify({
      'mfp.ui5.card': './ui5/mfp-card',
    });
    script.dataset['sapUiTheme'] = 'sap_horizon';
    script.dataset['sapUiLibs'] = 'sap.m';
    script.dataset['sapUiCompatVersion'] = 'edge';
    script.dataset['sapUiAsync'] = 'true';
    script.dataset['sapUiXxCssVariables'] = 'true';
    script.onload = () => {
      resolve();
    };
    script.onerror = () => {
      reject(new Error(`Failed to load ${OPENUI5_BOOTSTRAP_URL}`));
    };
    document.head.appendChild(script);
  })
    .then(() => requireModules(['sap/ui/core/Core']))
    .then(([Core]) => (Core as { ready(): Promise<void> }).ready())
    .then(() =>
      requireModules([
        'mfp/ui5/card/MfpCardTemplate',
        'sap/ui/core/Item',
        'sap/m/List',
        'sap/m/StandardListItem',
        'sap/m/MessageStrip',
        'sap/ui/model/json/JSONModel',
        'sap/ui/model/Filter',
        'sap/ui/core/Theming',
      ]),
    )
    .then(
      ([
        Card,
        Item,
        List,
        StandardListItem,
        MessageStrip,
        JSONModel,
        Filter,
        Theming,
      ]) =>
        ({
          Card,
          Item,
          List,
          StandardListItem,
          MessageStrip,
          JSONModel,
          Filter,
          Theming,
        }) as CardModules,
    );

  return openUi5Ready;
}

@Component({
  selector: 'mfp-ui5-card-story',
  template: `
    <div
      class="mfp-ui5-card-story__grid"
      [style.grid-template-columns]="
        'repeat(' + dashboardColumns + ', minmax(0, 1fr))'
      "
    >
      <div #cardHost style="display: contents"></div>
    </div>
    @if (error()) {
      <p class="mfp-ui5-card-story__error">{{ error() }}</p>
    }
    @if (events().length) {
      <ol class="mfp-ui5-card-story__events">
        @for (event of events(); track $index) {
          <li>{{ event }}</li>
        }
      </ol>
    }
  `,
  styles: `
    mfp-ui5-card-story {
      display: block;
      padding: 1.5rem 1rem 1rem;
      background: var(--sapBackgroundColor);
      color: var(--sapTextColor);
      font-family: var(--sapFontFamily);
    }

    .mfp-ui5-card-story__grid {
      display: grid;
      gap: 1rem;
    }

    .mfp-ui5-card-story__error {
      color: var(--sapNegativeTextColor);
    }

    .mfp-ui5-card-story__events {
      margin: 1rem 0 0;
      font-size: var(--sapFontSmallSize);
    }
  `,
  encapsulation: ViewEncapsulation.None,
})
class Ui5CardStory implements AfterViewInit, OnChanges, OnDestroy {
  @Input() name = '';
  @Input() background: 'solid' | 'transparent' = 'solid';
  @Input() height = '400px';
  @Input() width = 4;
  @Input() minWidth?: number;
  @Input() maxWidth?: number;
  @Input() badge = '';
  @Input() badgeState:
    'None' | 'Information' | 'Success' | 'Warning' | 'Error' = 'Warning';
  @Input() messageStrip = '';
  @Input() messageStripType: 'Information' | 'Success' | 'Warning' | 'Error' =
    'Information';
  @Input() showSearch = false;
  @Input() searchPlaceholder = '';
  @Input() actions: string[] = [];
  @Input() theme: Theme = 'sap_horizon';

  protected readonly dashboardColumns = DASHBOARD_COLUMNS;
  protected readonly events = signal<string[]>([]);
  protected readonly error = signal('');

  private readonly cardHost =
    viewChild.required<ElementRef<HTMLElement>>('cardHost');
  private card?: Ui5Control;
  private destroyed = false;

  ngOnChanges(): void {
    if (this.card) {
      void this.render();
    }
  }

  ngAfterViewInit(): void {
    void this.render();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.card?.destroy();
  }

  private async render(): Promise<void> {
    let modules: CardModules;
    try {
      modules = await loadOpenUi5();
    } catch (error) {
      this.error.set((error as Error).message);
      return;
    }
    if (this.destroyed) return;

    modules.Theming.setTheme(this.theme);
    this.card?.destroy();
    this.events.set([]);

    const list = new modules.List({
      items: {
        path: '/services',
        template: new modules.StandardListItem({
          title: '{title}',
          description: '{description}',
        }),
      },
    });

    const card = new modules.Card({
      name: this.name,
      background: this.background,
      height: this.height,
      width: this.width,
      minWidth: this.minWidth,
      maxWidth: this.maxWidth,
      badge: this.badge,
      badgeState: this.badgeState,
      showSearch: this.showSearch,
      searchPlaceholder: this.searchPlaceholder,
      messageStrip: this.messageStrip
        ? new modules.MessageStrip({
            text: this.messageStrip,
            type: this.messageStripType,
            showCloseButton: true,
            showIcon: true,
          })
        : undefined,
      actions: this.actions.map(
        (text) =>
          new modules.Item({
            key: text.toLowerCase().replace(/\s+/g, '-'),
            text,
          }),
      ),
      models: new modules.JSONModel({ services: SERVICES }),
      content: [list],
      searchLiveChange: (event: Ui5Event) => {
        const query = String(event.getParameter('newValue') ?? '');
        list.getBinding('items')?.filter(
          query
            ? [
                new modules.Filter({
                  path: 'title',
                  operator: 'Contains',
                  value1: query,
                }),
              ]
            : [],
        );
        this.logEvent(`searchLiveChange: "${query}"`);
      },
      search: (event: Ui5Event) => {
        this.logEvent(`search: "${String(event.getParameter('query'))}"`);
      },
      actionPress: (event: Ui5Event) => {
        this.logEvent(`actionPress: ${String(event.getParameter('key'))}`);
      },
    });

    card.placeAt(this.cardHost().nativeElement);
    this.card = card;
  }

  private logEvent(entry: string): void {
    this.events.update((events) => [...events, entry]);
  }
}

const meta: Meta<Ui5CardStory> = {
  title: 'Cards / MfpCardTemplate (mfp.ui5.card)',
  component: Ui5CardStory,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `OpenUI5 control \`mfp.ui5.card.MfpCardTemplate\` used as a template for SAP UI5 dashboard cards. Width is expressed in dashboard columns (${DASHBOARD_COLUMNS} in zFlow). The card follows the active SAP theme — switch it with the \`theme\` control.`,
      },
    },
  },
  argTypes: {
    name: { control: 'text' },
    background: { control: 'inline-radio', options: ['solid', 'transparent'] },
    height: { control: 'text' },
    width: { control: { type: 'range', min: 1, max: DASHBOARD_COLUMNS } },
    minWidth: { control: { type: 'number', min: 1, max: DASHBOARD_COLUMNS } },
    maxWidth: { control: { type: 'number', min: 1, max: DASHBOARD_COLUMNS } },
    badge: { control: 'text' },
    badgeState: {
      control: 'select',
      options: ['None', 'Information', 'Success', 'Warning', 'Error'],
    },
    messageStrip: { control: 'text' },
    messageStripType: {
      control: 'select',
      options: ['Information', 'Success', 'Warning', 'Error'],
    },
    showSearch: { control: 'boolean' },
    searchPlaceholder: { control: 'text' },
    actions: { control: 'object' },
    theme: { control: 'select', options: THEMES },
  },
  args: {
    name: 'Card Name',
    background: 'solid',
    height: '400px',
    width: 4,
    badge: '',
    badgeState: 'Warning',
    messageStrip: '',
    messageStripType: 'Information',
    showSearch: false,
    searchPlaceholder: '',
    actions: [],
    theme: 'sap_horizon',
  },
};

export default meta;
type Story = StoryObj<Ui5CardStory>;

export const Default: Story = {};

export const AllFeatures: Story = {
  args: {
    badge: 'Action Needed',
    messageStrip: 'Information Message',
    showSearch: true,
    actions: ['Action', 'Refresh', 'Configure'],
  },
};

export const Transparent: Story = {
  args: {
    background: 'transparent',
    showSearch: true,
    actions: ['Action'],
  },
};

export const WithMessageStrip: Story = {
  args: {
    messageStrip: 'Some services could not be loaded.',
    messageStripType: 'Warning',
  },
};

export const WithBadge: Story = {
  args: {
    badge: 'Action Needed',
  },
};

export const WithSearch: Story = {
  args: {
    showSearch: true,
    searchPlaceholder: 'Search services',
  },
};

export const WithActions: Story = {
  args: {
    actions: ['Action', 'Refresh', 'Configure'],
  },
};

export const Widths: Story = {
  render: (args) => ({
    props: args,
    template: `
      @for (width of [1, 2, 3, 4]; track width) {
        <mfp-ui5-card-story
          height="200px"
          [name]="'width: ' + width"
          [theme]="theme"
          [width]="width"
        />
      }
      <mfp-ui5-card-story
        height="200px"
        name="width: 4, maxWidth: 2"
        [maxWidth]="2"
        [theme]="theme"
        [width]="4"
      />
    `,
  }),
};

export const DarkTheme: Story = {
  args: {
    ...AllFeatures.args,
    theme: 'sap_horizon_dark',
  },
};

export const HighContrastBlack: Story = {
  args: {
    ...AllFeatures.args,
    theme: 'sap_horizon_hcb',
  },
};
