import type { CardConfig, SectionConfig } from '../dashboard/models';
import { filterStoryServices } from './story-services';
import '@ui5/webcomponents/dist/List.js';
import '@ui5/webcomponents/dist/ListItemStandard.js';

class StoryServiceListElement extends HTMLElement {
  private query = '';
  private lastAction = '';

  connectedCallback(): void {
    this.render();
  }

  onCardSearch(query: string): void {
    this.query = query;
    this.render();
  }

  onCardAction(key: string): void {
    this.lastAction = key;
    this.render();
  }

  private render(): void {
    const list = document.createElement('ui5-list');
    list.setAttribute('accessible-name', 'Services');
    list.setAttribute('no-data-text', 'No services found');
    for (const service of filterStoryServices(this.query)) {
      const item = document.createElement('ui5-li');
      item.setAttribute('description', service.description);
      item.textContent = service.title;
      list.append(item);
    }
    const content: HTMLElement[] = [list];
    if (this.lastAction) {
      const note = document.createElement('p');
      note.style.margin = '0.5rem 1rem';
      note.style.color = 'var(--sapTextColor)';
      note.style.fontFamily = 'var(--sapFontFamily)';
      note.textContent = `Action "${this.lastAction}" handled by the custom element.`;
      content.push(note);
    }
    this.replaceChildren(...content);
  }
}

if (!customElements.get('mfp-story-service-list')) {
  customElements.define('mfp-story-service-list', StoryServiceListElement);
}

const SEARCH = { placeholder: 'Search services' };

const ACTIONS = [
  { key: 'export', text: 'Export to Spreadsheet' },
  { key: 'share', text: 'Share' },
];

export const CARD_TEMPLATE_SECTIONS: SectionConfig[] = [
  {
    id: 'templated',
    title: 'Frame and header',
    w: 12,
    cardsHeight: 40,
  },
  {
    id: 'frame-only',
    title: 'Frame only — header: false',
    w: 12,
    cardsHeight: 15,
  },
];

const LOOSE_TEMPLATED_CARD: CardConfig = {
  id: 'loose-templated',
  label: 'Loose card from the catalogue',
  w: 6,
  h: 40,
  component: 'mfp-story-service-list',
  componentTemplate: {
    search: SEARCH,
    actions: ACTIONS,
  },
};

export const CARD_TEMPLATE_CARDS: CardConfig[] = [
  {
    id: 'templated-wc',
    label: 'Web component card',
    sectionId: 'templated',
    w: 4,
    component: 'mfp-story-service-list',
    componentTemplate: {
      badge: { text: 'Action Needed', state: 'Critical' },
      search: SEARCH,
      actions: ACTIONS,
      messageStrip: {
        text: 'Some services could not be loaded.',
        type: 'Negative',
      },
    },
  },
  {
    id: 'templated-angular',
    label: 'Angular card, transparent',
    sectionId: 'templated',
    w: 4,
    type: 'angular',
    component: 'mfp-story-service-list-card',
    componentTemplate: {
      background: 'transparent',
      badge: { text: 'New', state: 'Information' },
      search: SEARCH,
      actions: ACTIONS,
    },
  },
  {
    id: 'templated-sap-ui',
    label: 'SAP UI5 card',
    sectionId: 'templated',
    w: 4,
    type: 'sap-ui',
    component: 'mfp.story.cards.serviceList',
    componentTemplate: {
      search: SEARCH,
      actions: ACTIONS,
      messageStrip: { text: 'Rendered by an OpenUI5 Component.' },
    },
  },
  {
    id: 'frame-wc',
    label: 'Web component tile',
    sectionId: 'frame-only',
    w: 4,
    component: 'mfp-story-service-list',
    componentTemplate: { header: false },
  },
  {
    id: 'frame-angular',
    label: 'Angular tile',
    sectionId: 'frame-only',
    w: 4,
    type: 'angular',
    component: 'mfp-story-service-list-card',
    componentTemplate: { header: false },
  },
  {
    id: 'frame-sap-ui',
    label: 'SAP UI5 tile',
    sectionId: 'frame-only',
    w: 4,
    type: 'sap-ui',
    component: 'mfp.story.cards.serviceList',
    componentTemplate: { header: false },
  },
  LOOSE_TEMPLATED_CARD,
];

export const CARD_TEMPLATE_AVAILABLE_CARDS: CardConfig[] = [
  LOOSE_TEMPLATED_CARD,
];
