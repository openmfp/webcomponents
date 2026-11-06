import { CardTemplate } from '../card-template/card-template.component';
import {
  CardTemplateAction,
  CardTemplateBackground,
  CardTemplateBadge,
  CardTemplateBadgeState,
  CardTemplateMessageStrip,
  CardTemplateSearch,
} from '../card-template/card-template.model';
import { STORY_THEMES, StoryTheme, applyStoryTheme } from './story-theme';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { List } from '@fundamental-ngx/ui5-webcomponents/list';
import { ListItemStandard } from '@fundamental-ngx/ui5-webcomponents/list-item-standard';
import type { Meta, StoryObj } from '@storybook/angular';

const SERVICES = [
  { title: 'olc-hana-db', description: 'SAP HANA Cloud' },
  { title: 'Cloud Identity Service', description: 'Identity Authentication' },
  { title: 'olc-hana-db-test', description: 'SAP HANA Cloud' },
  { title: 'applicationtest', description: 'Application Autoscaler' },
  { title: 'auditlog-name', description: 'Audit Log Service' },
  { title: 'checkout-api', description: 'Cloud Foundry App' },
  { title: 'internal-portal', description: 'HTML5 Application' },
];

const BADGE_STATES: CardTemplateBadgeState[] = [
  'Neutral',
  'Information',
  'Positive',
  'Negative',
  'Critical',
];

const ACTIONS: CardTemplateAction[] = [
  { key: 'export', text: 'Export to Spreadsheet' },
  { key: 'refresh', text: 'Refresh' },
  { key: 'configure', text: 'Configure' },
];

@Component({
  selector: 'mfp-card-template-story',
  imports: [CardTemplate, List, ListItemStandard],
  template: `
    <div class="card-template-story">
      <mfp-card-template
        class="card-template-story__card"
        [actions]="actions()"
        [actionsLabel]="actionsLabel()"
        [background]="background()"
        [badge]="badge()"
        [header]="header()"
        [messageStrip]="messageStrip()"
        [name]="name()"
        [search]="search()"
        [(searchValue)]="query"
        (actionPress)="actionPress.emit($event)"
      >
        <ui5-list accessibleName="Services">
          @for (service of visibleServices(); track service.title) {
            <ui5-li [description]="service.description">{{
              service.title
            }}</ui5-li>
          }
        </ui5-list>
      </mfp-card-template>
    </div>
  `,
  styles: `
    .card-template-story {
      padding: 2rem 1rem 1rem;
      background: var(--sapBackgroundColor);
    }

    .card-template-story__card {
      block-size: 25rem;
      max-inline-size: 30rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class CardTemplateStory {
  readonly name = input('Services');
  readonly header = input(true);
  readonly background = input<CardTemplateBackground>('solid');
  readonly badge = input<CardTemplateBadge>();
  readonly search = input<CardTemplateSearch>();
  readonly actions = input<CardTemplateAction[]>([]);
  readonly actionsLabel = input('More actions');
  readonly messageStrip = input<CardTemplateMessageStrip>();
  readonly theme = input<StoryTheme>('sap_horizon');

  readonly actionPress = output<string>();

  protected readonly query = signal('');
  protected readonly visibleServices = computed(() => {
    const query = this.query().toLowerCase();
    return SERVICES.filter((service) =>
      service.title.toLowerCase().includes(query),
    );
  });

  constructor() {
    effect(() => {
      applyStoryTheme(this.theme());
    });
  }
}

const ALL_FEATURES = {
  badge: { text: 'Action Needed', state: 'Critical' as const },
  search: { placeholder: 'Search services' },
  actions: ACTIONS,
  messageStrip: { text: 'Some services could not be loaded.' },
};

const meta: Meta<CardTemplateStory> = {
  title: 'Cards / CardTemplate',
  component: CardTemplateStory,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '`<mfp-card-template>` draws the MFP card frame and header — title, badge, search, overflow actions and message strip — around any content. The dashboard uses it for cards with `componentTemplate`; Angular apps can use it directly. The frame uses SAP theme tokens only, so it follows the active theme — switch it with the `theme` control. In these stories the search filters the list and the actions are logged in the Actions panel.',
      },
    },
  },
  argTypes: {
    name: { control: 'text' },
    header: { control: 'boolean' },
    background: { control: 'inline-radio', options: ['solid', 'transparent'] },
    badge: { control: 'object' },
    search: { control: 'object' },
    actions: { control: 'object' },
    actionsLabel: { control: 'text' },
    messageStrip: { control: 'object' },
    theme: { control: 'select', options: STORY_THEMES },
    actionPress: { action: 'actionPress' },
  },
  args: {
    name: 'Services',
    header: true,
    background: 'solid',
    actions: [],
    actionsLabel: 'More actions',
    theme: 'sap_horizon',
  },
};

export default meta;
type Story = StoryObj<CardTemplateStory>;

export const Default: Story = {};

export const AllFeatures: Story = {
  args: ALL_FEATURES,
};

export const Transparent: Story = {
  args: {
    ...ALL_FEATURES,
    background: 'transparent',
  },
};

export const FrameOnly: Story = {
  args: {
    ...ALL_FEATURES,
    header: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          '`header: false` draws only the frame: no title, badge, search, actions or message strip. The frame keeps `name` as its accessible name.',
      },
    },
  },
};

export const WithSearch: Story = {
  args: {
    search: { placeholder: 'Search services' },
  },
};

export const WithActions: Story = {
  args: {
    actions: ACTIONS,
  },
};

export const WithMessageStrip: Story = {
  args: {
    messageStrip: {
      text: 'Some services could not be loaded.',
      type: 'Negative',
    },
  },
};

export const BadgeStates: Story = {
  render: (args) => {
    applyStoryTheme(args.theme);
    return {
      props: { ...args, badgeStates: BADGE_STATES },
      template: `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(16rem,1fr));gap:2rem 1rem;padding:2rem 1rem 1rem;background:var(--sapBackgroundColor)">
        @for (state of badgeStates; track state) {
          <mfp-card-template style="block-size:8rem" [name]="state" [badge]="{ text: state + ' badge with a long text', state: state }" />
        }
      </div>
    `,
      moduleMetadata: { imports: [CardTemplate] },
    };
  },
};

export const HorizonDark: Story = {
  args: { ...ALL_FEATURES, theme: 'sap_horizon_dark' },
};

export const HighContrastBlack: Story = {
  args: { ...ALL_FEATURES, theme: 'sap_horizon_hcb' },
};

export const HighContrastWhite: Story = {
  args: { ...ALL_FEATURES, theme: 'sap_horizon_hcw' },
};
