import { CardTemplate } from '../../../cards/card-template/card-template.component';
import { DASHBOARD_CARD_DRAG_ORIGIN_CLASS } from '../constants';
import { DashboardI18nService } from '../i18n';
import { CardConfig } from '../models';
import { DashboardCard } from './dashboard-card.component';
import {
  addComponentToRegistry,
  resetDashboardCardRegistry,
} from './utils/dashboard-card-registry';
import { SapComponentCreatedEvent } from './utils/mount-sap-card';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { axe } from 'vitest-axe';

class SearchableWidget extends HTMLElement {
  readonly searches: string[] = [];
  readonly actions: string[] = [];

  onCardSearch(query: string): void {
    this.searches.push(query);
  }

  onCardAction(key: string): void {
    this.actions.push(key);
  }
}
customElements.define('searchable-widget', SearchableWidget);

@Component({
  selector: 'mfp-searchable-angular-card',
  template: '<span>angular card</span>',
})
class SearchableAngularCard {
  readonly searches: string[] = [];

  onCardSearch(query: string): void {
    this.searches.push(query);
  }
}

type Fixture = ComponentFixture<DashboardCard>;

function setup(): { fixture: Fixture; component: DashboardCard } {
  const fixture = TestBed.createComponent(DashboardCard);
  const component = fixture.componentInstance;
  return { fixture, component };
}

function root(fixture: Fixture): ShadowRoot | HTMLElement {
  return fixture.nativeElement.shadowRoot ?? fixture.nativeElement;
}

describe('DashboardCard', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardCard],
      providers: [DashboardI18nService],
    }).compileComponents();
  });

  it('uses w and h for grid placement on the host element', () => {
    const { fixture } = setup();

    fixture.componentRef.setInput('card', {
      id: 'card-1',
      component: 'demo-widget',
      w: 3,
      h: 2,
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.style.gridColumn).toBe('span 3');
    expect(fixture.nativeElement.style.gridRow).toBe('span 2');
  });

  it('uses x and y as zero-based grid start coordinates when provided', () => {
    const { fixture } = setup();

    fixture.componentRef.setInput('card', {
      id: 'card-1',
      component: 'demo-widget',
      w: 3,
      h: 2,
      x: 0,
      y: 4,
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.style.gridColumn).toBe('1 / span 3');
    expect(fixture.nativeElement.style.gridRow).toBe('5 / span 2');
  });

  it('renders a dynamic component and applies component inputs', () => {
    const { fixture } = setup();

    fixture.componentRef.setInput('card', {
      id: 'card-1',
      component: 'demo-widget',
      componentInputs: { title: 'Pods', count: 3 },
    });
    fixture.detectChanges();

    const element = root(fixture).querySelector('demo-widget') as
      (HTMLElement & { title?: string; count?: number }) | null;

    expect(element).not.toBeNull();
    expect(element?.title).toBe('Pods');
    expect(element?.count).toBe(3);
  });

  it('replaces the rendered dynamic component when the card definition changes', () => {
    const { fixture } = setup();

    fixture.componentRef.setInput('card', {
      id: 'card-1',
      component: 'demo-widget',
      componentInputs: { title: 'Pods' },
    });
    fixture.detectChanges();
    fixture.componentRef.setInput('card', {
      id: 'card-1',
      component: 'next-widget',
      componentInputs: { title: 'Services' },
    });
    fixture.detectChanges();

    const current = root(fixture).querySelector('next-widget') as
      (HTMLElement & { title?: string }) | null;

    expect(root(fixture).querySelector('demo-widget')).toBeNull();
    expect(current?.title).toBe('Services');
  });

  it('shows a remove action in edit mode and emits when it is clicked', () => {
    const { fixture, component } = setup();
    let emitted = 0;

    component.removeCard.subscribe(() => emitted++);
    fixture.componentRef.setInput('card', {
      id: 'card-1',
      component: 'demo-widget',
    });
    fixture.componentRef.setInput('editMode', true);
    fixture.detectChanges();

    const button = root(fixture).querySelector('.card__remove');
    button?.dispatchEvent(new Event('click'));

    expect(button).not.toBeNull();
    expect(emitted).toBe(1);
  });

  it('keeps only the card shell and remove action interactive in edit mode', () => {
    const { fixture } = setup();

    fixture.componentRef.setInput('card', {
      id: 'card-1',
      component: 'demo-widget',
    });
    fixture.componentRef.setInput('editMode', true);
    fixture.detectChanges();

    const componentHost =
      root(fixture).querySelector<HTMLElement>('.component-host');
    const removeButton = root(fixture).querySelector('.card__remove');

    expect(componentHost?.getAttribute('inert')).toBe('');
    expect(componentHost?.style.pointerEvents).toBe('none');
    expect(removeButton).not.toBeNull();
  });

  it('renders the fallback card shell when no dynamic component tag is provided', () => {
    const { fixture } = setup();

    fixture.componentRef.setInput('card', {
      id: 'card-1',
      component: '',
    });
    fixture.detectChanges();

    expect(root(fixture).querySelector('.card__body')).not.toBeNull();
    expect(root(fixture).querySelector('.component-card')).toBeNull();
  });

  it('marks the dynamic component host as the drag origin surface', () => {
    const { fixture } = setup();

    fixture.componentRef.setInput('card', {
      id: 'card-1',
      component: 'demo-widget',
    });
    fixture.detectChanges();

    expect(
      root(fixture).querySelector(
        `.component-host.${DASHBOARD_CARD_DRAG_ORIGIN_CLASS}`,
      ),
    ).not.toBeNull();
  });

  it('marks the fallback card body as the drag origin surface', () => {
    const { fixture } = setup();

    fixture.componentRef.setInput('card', {
      id: 'card-1',
      component: '',
    });
    fixture.detectChanges();

    expect(
      root(fixture).querySelector(
        `.card__body.${DASHBOARD_CARD_DRAG_ORIGIN_CLASS}`,
      ),
    ).not.toBeNull();
  });

  describe('data-testid attributes', () => {
    it('sets data-testid on the component-card wrapper when card has a component', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('card', {
        id: 'card-42',
        component: 'demo-widget',
      });
      fixture.detectChanges();

      const el = root(fixture).querySelector('.component-card');
      expect(el).not.toBeNull();
      expect(el?.getAttribute('data-testid')).toBe('dashboard-card-card-42');
    });

    it('sets data-testid on the fallback card wrapper when card has no component', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('card', {
        id: 'card-42',
        component: '',
      });
      fixture.detectChanges();

      const el = root(fixture).querySelector('.card');
      expect(el).not.toBeNull();
      expect(el?.getAttribute('data-testid')).toBe('dashboard-card-card-42');
    });

    it('sets data-testid on the remove button in edit mode', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('card', {
        id: 'card-42',
        component: 'demo-widget',
      });
      fixture.componentRef.setInput('editMode', true);
      fixture.detectChanges();

      const btn = root(fixture).querySelector('.card__remove');
      expect(btn).not.toBeNull();
      expect(btn?.getAttribute('data-testid')).toBe(
        'dashboard-card-card-42-remove',
      );
    });
  });

  describe('componentTemplate', () => {
    const templatedCard: CardConfig = {
      id: 'orders',
      label: 'Recent Orders',
      component: 'searchable-widget',
      componentTemplate: {
        search: { placeholder: 'Search orders' },
        actions: [{ key: 'export', text: 'Export' }],
      },
    };

    function cardTemplate(fixture: Fixture): CardTemplate {
      return fixture.debugElement.query(By.directive(CardTemplate))
        .componentInstance as CardTemplate;
    }

    function mountedWidget(fixture: Fixture): SearchableWidget {
      return root(fixture).querySelector(
        'searchable-widget',
      ) as SearchableWidget;
    }

    function search(fixture: Fixture, query: string): void {
      cardTemplate(fixture).searchValue.set(query);
      fixture.detectChanges();
    }

    afterEach(() => {
      resetDashboardCardRegistry();
    });

    it('renders the card as before when componentTemplate is not set', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('card', {
        id: 'orders',
        label: 'Recent Orders',
        component: 'demo-widget',
      });
      fixture.detectChanges();

      expect(root(fixture).querySelector('mfp-card-template')).toBeNull();
      expect(root(fixture).querySelector('demo-widget')).not.toBeNull();
    });

    it('wraps the card in the card template and takes the title from label', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('card', templatedCard);
      fixture.detectChanges();

      const template = root(fixture).querySelector('mfp-card-template');
      expect(template?.querySelector('searchable-widget')).not.toBeNull();
      expect(
        template?.querySelector('[data-testid="card-template-title"]')
          ?.textContent,
      ).toContain('Recent Orders');
    });

    it('draws only the frame for header: false and names it by label', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('card', {
        ...templatedCard,
        componentTemplate: { header: false },
      });
      fixture.detectChanges();

      const frame = root(fixture).querySelector(
        '[data-testid="card-template"]',
      );
      expect(frame?.getAttribute('aria-label')).toBe('Recent Orders');
      expect(frame?.querySelector('header')).toBeNull();
      expect(frame?.querySelector('searchable-widget')).not.toBeNull();
    });

    it('passes the search text to onCardSearch of the card', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('card', templatedCard);
      fixture.detectChanges();
      search(fixture, 'acme');

      expect(mountedWidget(fixture).searches).toEqual(['acme']);
    });

    it('does not call onCardSearch on mount while the search text is empty', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('card', templatedCard);
      fixture.detectChanges();

      expect(mountedWidget(fixture).searches).toEqual([]);
    });

    it('keeps the header and passes the search text to the new content when the card re-mounts', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('card', templatedCard);
      fixture.detectChanges();
      const template = cardTemplate(fixture);
      search(fixture, 'acme');
      const firstWidget = mountedWidget(fixture);

      fixture.componentRef.setInput('card', {
        ...templatedCard,
        componentInputs: { region: 'EU' },
      });
      fixture.detectChanges();

      expect(mountedWidget(fixture)).not.toBe(firstWidget);
      expect(mountedWidget(fixture).searches).toEqual(['acme']);
      expect(cardTemplate(fixture)).toBe(template);
      expect(cardTemplate(fixture).searchValue()).toBe('acme');
    });

    it('hides the search field and warns in dev mode when the card has no onCardSearch', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(vi.fn());
      const { fixture } = setup();

      fixture.componentRef.setInput('card', {
        ...templatedCard,
        component: 'demo-widget',
      });
      fixture.detectChanges();

      expect(
        root(fixture).querySelector('[data-testid="card-template-search"]'),
      ).toBeNull();
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('has no onCardSearch(query) method'),
      );
      warn.mockRestore();
    });

    it('shows the search field when the card implements onCardSearch', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('card', templatedCard);
      fixture.detectChanges();

      expect(
        root(fixture).querySelector('[data-testid="card-template-search"]'),
      ).not.toBeNull();
    });

    it('calls onCardAction of the card and emits cardAction when an action is chosen', () => {
      const { fixture, component } = setup();
      const emitted: string[] = [];
      component.cardAction.subscribe((key) => emitted.push(key));

      fixture.componentRef.setInput('card', templatedCard);
      fixture.detectChanges();
      cardTemplate(fixture).actionPress.emit('export');

      expect(mountedWidget(fixture).actions).toEqual(['export']);
      expect(emitted).toEqual(['export']);
    });

    it('emits cardAction for a card without onCardAction', () => {
      const { fixture, component } = setup();
      const emitted: string[] = [];
      component.cardAction.subscribe((key) => emitted.push(key));

      fixture.componentRef.setInput('card', {
        ...templatedCard,
        component: 'demo-widget',
      });
      fixture.detectChanges();
      cardTemplate(fixture).actionPress.emit('export');

      expect(emitted).toEqual(['export']);
    });

    it('passes the search text to an Angular card', () => {
      addComponentToRegistry([SearchableAngularCard]);
      const { fixture } = setup();

      fixture.componentRef.setInput('card', {
        ...templatedCard,
        type: 'angular',
        component: 'mfp-searchable-angular-card',
      });
      fixture.detectChanges();
      search(fixture, 'acme');

      const angularCard = fixture.debugElement.query(
        By.directive(SearchableAngularCard),
      ).componentInstance as SearchableAngularCard;
      expect(angularCard.searches).toEqual(['acme']);
    });

    it('draws the fallback card of a card without component as a frame without header', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('card', {
        id: 'empty',
        label: 'Placeholder',
        component: '',
      });
      fixture.detectChanges();

      const frame = root(fixture).querySelector(
        '.card [data-testid="card-template"]',
      );
      expect(frame?.getAttribute('aria-label')).toBe('Placeholder');
      expect(frame?.querySelector('header')).toBeNull();
    });

    it('has no automatically-detectable accessibility violations', async () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('card', templatedCard);
      fixture.detectChanges();

      expect(await axe(fixture.nativeElement)).toHaveNoViolations();
    });
  });

  describe('sap-ui type', () => {
    let placeAt: ReturnType<typeof vi.fn>;
    let destroy: ReturnType<typeof vi.fn>;
    let sapRequire: ReturnType<typeof vi.fn>;
    let ComponentContainer: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      placeAt = vi.fn();
      destroy = vi.fn();
      ComponentContainer = vi.fn(function (this: Record<string, unknown>) {
        this['placeAt'] = placeAt;
        this['destroy'] = destroy;
      });
      sapRequire = vi
        .fn()
        .mockImplementation((_deps: unknown, cb: (ctor: unknown) => void) => {
          cb(ComponentContainer);
        });

      (window as unknown as Record<string, unknown>)['sap'] = {
        ui: { require: sapRequire },
      };
    });

    afterEach(() => {
      delete (window as unknown as Record<string, unknown>)['sap'];
    });

    it('calls sap.ui.require with ComponentContainer dependency', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('card', {
        id: 'card-1',
        component: 'my.sap.App',
        type: 'sap-ui',
      });
      fixture.detectChanges();

      expect(sapRequire).toHaveBeenCalledWith(
        ['sap/ui/core/ComponentContainer'],
        expect.any(Function),
      );
    });

    it('mounts the SAP component with correct config', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('card', {
        id: 'card-1',
        component: 'my.sap.App',
        type: 'sap-ui',
        componentInputs: { env: 'prod' },
      });
      fixture.detectChanges();

      expect(placeAt).toHaveBeenCalledTimes(1);
      expect(placeAt.mock.calls[0][0]).toBeInstanceOf(HTMLElement);
    });

    it('destroys the SAP container when the card definition changes', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('card', {
        id: 'card-1',
        component: 'my.sap.App',
        type: 'sap-ui',
      });
      fixture.detectChanges();

      fixture.componentRef.setInput('card', {
        id: 'card-1',
        component: 'my.sap.Other',
        type: 'sap-ui',
      });
      fixture.detectChanges();

      expect(destroy).toHaveBeenCalledTimes(1);
    });

    it('does not mount a SAP container after the card is cleaned up', () => {
      const requireResolver: { current?: (ctor: unknown) => void } = {};
      sapRequire.mockImplementationOnce(
        (_deps: unknown, cb: (ctor: unknown) => void) => {
          requireResolver.current = cb;
        },
      );
      const { fixture } = setup();

      fixture.componentRef.setInput('card', {
        id: 'card-1',
        component: 'my.sap.App',
        type: 'sap-ui',
      });
      fixture.detectChanges();

      fixture.componentRef.setInput('card', {
        id: 'card-1',
        component: 'demo-widget',
      });
      fixture.detectChanges();

      requireResolver.current?.(ComponentContainer);

      expect(ComponentContainer).not.toHaveBeenCalled();
      expect(placeAt).not.toHaveBeenCalled();
    });

    it('passes search text and actions of a templated card to the UI5 Component', () => {
      const { fixture, component } = setup();
      const ui5Component = { onCardSearch: vi.fn(), onCardAction: vi.fn() };
      const emitted: string[] = [];
      component.cardAction.subscribe((key) => emitted.push(key));

      fixture.componentRef.setInput('card', {
        id: 'orders',
        label: 'Recent Orders',
        component: 'my.sap.App',
        type: 'sap-ui',
        componentTemplate: {
          search: { placeholder: 'Search orders' },
          actions: [{ key: 'export', text: 'Export' }],
        },
      });
      fixture.detectChanges();
      const [settings] = ComponentContainer.mock.calls[0] as [
        { componentCreated: (event: SapComponentCreatedEvent) => void },
      ];
      settings.componentCreated({ getParameter: () => ui5Component });
      fixture.detectChanges();

      const template = fixture.debugElement.query(By.directive(CardTemplate))
        .componentInstance as CardTemplate;
      template.searchValue.set('acme');
      fixture.detectChanges();
      template.actionPress.emit('export');

      expect(ui5Component.onCardSearch).toHaveBeenCalledWith('acme');
      expect(ui5Component.onCardAction).toHaveBeenCalledWith('export');
      expect(emitted).toEqual(['export']);
    });

    it('logs an error when window.sap is not available', () => {
      delete (window as unknown as Record<string, unknown>)['sap'];
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn());
      const { fixture } = setup();

      fixture.componentRef.setInput('card', {
        id: 'card-1',
        component: 'my.sap.App',
        type: 'sap-ui',
      });
      fixture.detectChanges();

      expect(consoleSpy).toHaveBeenCalledWith(
        '[DashboardCard] SAP UI5 is not available on window.sap',
      );
      consoleSpy.mockRestore();
    });
  });

  it('has no automatically-detectable accessibility violations', async () => {
    const { fixture } = setup();
    fixture.componentRef.setInput('card', {
      id: 'card-1',
      component: 'demo-widget',
      w: 3,
      h: 2,
    });
    fixture.detectChanges();

    expect(await axe(fixture.nativeElement)).toHaveNoViolations();
  });
});
