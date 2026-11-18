import { CardTemplate } from '../../../cards/card-template/card-template.component';
import { DataFetchList } from '../../data-fetch-list';
import type { AfterRequest, BeforeRequest } from '../../data-fetch-table';
import { DASHBOARD_CARD_DRAG_ORIGIN_CLASS } from '../constants';
import { DashboardI18nService } from '../i18n';
import { CARD_TYPES, CardConfig } from '../models';
import { DashboardCard } from './dashboard-card.component';
import {
  addComponentToRegistry,
  resetDashboardCardRegistry,
} from './utils/dashboard-card-registry';
import { SapComponentCreatedEvent } from './utils/mount-sap-card';
import { Component, ErrorHandler, input } from '@angular/core';
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
customElements.define('demo-widget', class extends HTMLElement {});
customElements.define('next-widget', class extends HTMLElement {});

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

class ThrowingActionWidget extends HTMLElement {
  onCardAction(): void {
    throw new Error('action failed');
  }
}
customElements.define('throwing-action-widget', ThrowingActionWidget);

class ActionsAwareWidget extends HTMLElement {
  actionsHook?: (key: string) => void;

  onCardAction(key: string): void {
    this.actionsHook?.(key);
  }
}
customElements.define('actions-aware-widget', ActionsAwareWidget);

class RequestAwareWidget extends HTMLElement {
  beforeRequest?: BeforeRequest;
  afterRequest?: AfterRequest;
  data?: object;
}
customElements.define('mfp-request-aware-widget', RequestAwareWidget);

@Component({
  selector: 'mfp-request-aware-angular-card',
  template: '',
})
class RequestAwareAngularCard {
  readonly beforeRequest = input<BeforeRequest>();
  readonly afterRequest = input<AfterRequest>(undefined, {
    alias: 'mfp-request-aware-angular-cardAfterRequest',
  });
  readonly data = input<object>();
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

  it('leaves the row placement to its container when the card declares no h', () => {
    const { fixture } = setup();

    fixture.componentRef.setInput('card', {
      id: 'card-1',
      component: 'demo-widget',
      w: 3,
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.style.gridRow).toBe('');
  });

  describe('h auto', () => {
    let resize: (() => void) | undefined;
    let disconnect: ReturnType<typeof vi.fn>;
    let originalResizeObserver: typeof ResizeObserver;

    beforeEach(() => {
      resize = undefined;
      disconnect = vi.fn();
      originalResizeObserver = globalThis.ResizeObserver;
      globalThis.ResizeObserver = class {
        constructor(callback: () => void) {
          resize = callback;
        }
        observe = (): void => undefined;
        unobserve = (): void => undefined;
        disconnect = disconnect;
      } as unknown as typeof ResizeObserver;
    });

    afterEach(() => {
      globalThis.ResizeObserver = originalResizeObserver;
    });

    function setupAutoCard(frameHeight: number): Fixture {
      const { fixture } = setup();
      const grid = document.createElement('div');
      grid.style.gridAutoRows = '10px';
      grid.style.rowGap = '4px';
      document.body.appendChild(grid);
      grid.appendChild(fixture.nativeElement);
      fixture.componentRef.setInput('card', {
        id: 'card-1',
        component: 'demo-widget',
        h: 'auto',
      });
      fixture.detectChanges();
      const frame = root(fixture).querySelector(
        '.component-card',
      ) as HTMLElement;
      Object.defineProperty(frame, 'offsetHeight', {
        configurable: true,
        value: frameHeight,
      });
      return fixture;
    }

    it('marks the host so the card frame takes its content height', () => {
      const fixture = setupAutoCard(95);

      expect(fixture.nativeElement.classList).toContain(
        'dashboard-card--auto-height',
      );
    });

    it('spans as many rows of the section grid as the measured frame needs', () => {
      const fixture = setupAutoCard(95);

      resize?.();
      fixture.detectChanges();

      expect(fixture.nativeElement.style.gridRow).toBe('span 8');
    });

    it('follows the frame when its content grows', () => {
      const fixture = setupAutoCard(95);
      resize?.();
      fixture.detectChanges();

      const frame = root(fixture).querySelector(
        '.component-card',
      ) as HTMLElement;
      Object.defineProperty(frame, 'offsetHeight', {
        configurable: true,
        value: 200,
      });
      resize?.();
      fixture.detectChanges();

      expect(fixture.nativeElement.style.gridRow).toBe('span 15');
    });

    it('stops measuring once the card switches to a numeric h', () => {
      const fixture = setupAutoCard(95);

      fixture.componentRef.setInput('card', {
        id: 'card-1',
        component: 'demo-widget',
        h: 20,
      });
      fixture.detectChanges();

      expect(disconnect).toHaveBeenCalled();
      expect(fixture.nativeElement.style.gridRow).toBe('span 20');
      expect(fixture.nativeElement.classList).not.toContain(
        'dashboard-card--auto-height',
      );
    });
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

  it('forwards the latest request hooks and card ID without remounting the web component', async () => {
    const { fixture } = setup();
    const data = { resource: [{ id: 'local' }] };
    const request = new Request('https://example.test/rows');
    const firstHook = vi.fn();
    const secondHook = vi.fn(() => request);
    const response = { items: [] };
    const firstAfterHook = vi.fn();
    const secondAfterHook = vi.fn(async () => ({ items: [{ id: 'mapped' }] }));
    fixture.componentRef.setInput('card', {
      id: 'orders',
      component: 'mfp-request-aware-widget',
      componentInputs: { data },
    });
    fixture.componentRef.setInput('beforeCardRequest', firstHook);
    fixture.componentRef.setInput('afterCardRequest', firstAfterHook);
    await fixture.whenStable();

    const widget = root(fixture).querySelector<RequestAwareWidget>(
      'mfp-request-aware-widget',
    );
    expect(widget?.data).toBe(data);
    expect(widget?.beforeRequest).toBeTypeOf('function');
    widget?.beforeRequest?.(request);
    expect(firstHook).toHaveBeenCalledWith(request, 'orders');
    const afterRequest = widget?.afterRequest;
    expect(afterRequest).toBeTypeOf('function');
    afterRequest?.(response);
    expect(firstAfterHook).toHaveBeenCalledExactlyOnceWith(response, 'orders');

    fixture.componentRef.setInput('beforeCardRequest', secondHook);
    fixture.componentRef.setInput('afterCardRequest', secondAfterHook);
    await fixture.whenStable();

    expect(root(fixture).querySelector('mfp-request-aware-widget')).toBe(
      widget,
    );
    expect(secondHook).not.toHaveBeenCalled();
    expect(widget?.beforeRequest?.(request)).toBe(request);
    expect(secondHook).toHaveBeenCalledWith(request, 'orders');
    expect(widget?.afterRequest).toBe(afterRequest);
    expect(secondAfterHook).not.toHaveBeenCalled();
    await expect(afterRequest?.(response)).resolves.toEqual({
      items: [{ id: 'mapped' }],
    });
    expect(secondAfterHook).toHaveBeenCalledExactlyOnceWith(response, 'orders');
  });

  describe.each([CARD_TYPES.ANGULAR, CARD_TYPES.WC])(
    '%s request adapters',
    (type) => {
      const selector =
        type === CARD_TYPES.ANGULAR
          ? 'mfp-request-aware-angular-card'
          : 'mfp-request-aware-widget';

      beforeEach(() => {
        addComponentToRegistry([RequestAwareAngularCard]);
      });

      afterEach(() => {
        resetDashboardCardRegistry();
      });

      function mountedCard(fixture: Fixture) {
        if (type === CARD_TYPES.ANGULAR) {
          const instance: RequestAwareAngularCard = fixture.debugElement.query(
            By.directive(RequestAwareAngularCard),
          ).componentInstance;
          return {
            instance,
            beforeRequest: instance.beforeRequest(),
            afterRequest: instance.afterRequest(),
          };
        }

        const instance =
          root(fixture).querySelector<RequestAwareWidget>(selector);
        return {
          instance,
          beforeRequest: instance?.beforeRequest,
          afterRequest: instance?.afterRequest,
        };
      }

      it('selects each live local hook independently and ignores hooks from a replaced mount', () => {
        const { fixture } = setup();
        const request = new Request('https://example.test/rows');
        const response = { items: [] };
        const dashboardBefore = vi.fn(() => request);
        const dashboardAfter = vi.fn(() => response);
        const localBefore = vi.fn();
        const localAfter = vi.fn(() => null);
        const nextBefore = vi.fn(() => request);
        const nextAfter = vi.fn();
        const ignoredHook = vi.fn();
        const responseBinding =
          type === CARD_TYPES.ANGULAR
            ? 'mfp-request-aware-angular-cardAfterRequest'
            : 'afterRequest';
        const card: CardConfig = { id: 'orders', type, component: selector };
        const setHooks = (componentInputs: CardConfig['componentInputs']) => {
          fixture.componentRef.setInput('card', { ...card, componentInputs });
          fixture.detectChanges();
        };
        fixture.componentRef.setInput('beforeCardRequest', dashboardBefore);
        fixture.componentRef.setInput('afterCardRequest', dashboardAfter);
        setHooks({
          ...(type === CARD_TYPES.ANGULAR ? { afterRequest: ignoredHook } : {}),
          beforeRequest: localBefore,
          [responseBinding]: localAfter,
        });

        const mounted = mountedCard(fixture);
        const { beforeRequest, afterRequest } = mounted;
        expect(mounted.instance).toBeTruthy();
        expect(beforeRequest?.(request)).toBeUndefined();
        expect(afterRequest?.(response)).toBeNull();
        expect(localBefore).toHaveBeenCalledExactlyOnceWith(request);
        expect(localAfter).toHaveBeenCalledExactlyOnceWith(response);
        expect(ignoredHook).not.toHaveBeenCalled();
        expect(dashboardBefore).not.toHaveBeenCalled();
        expect(dashboardAfter).not.toHaveBeenCalled();

        setHooks({ [responseBinding]: nextAfter });
        expect(mountedCard(fixture)).toEqual(mounted);
        expect(beforeRequest?.(request)).toBe(request);
        expect(afterRequest?.(response)).toBeUndefined();
        expect(dashboardBefore).toHaveBeenCalledExactlyOnceWith(
          request,
          'orders',
        );
        expect(nextAfter).toHaveBeenCalledExactlyOnceWith(response);
        expect(dashboardAfter).not.toHaveBeenCalled();

        setHooks({ beforeRequest: nextBefore });
        const updated = mountedCard(fixture);
        expect(updated.instance).toBe(mounted.instance);
        expect(updated.beforeRequest).toBe(beforeRequest);
        expect(updated.afterRequest).toBe(afterRequest);
        expect(beforeRequest?.(request)).toBe(request);
        expect(afterRequest?.(response)).toBe(response);
        expect(nextBefore).toHaveBeenCalledExactlyOnceWith(request);
        expect(dashboardAfter).toHaveBeenCalledExactlyOnceWith(
          response,
          'orders',
        );

        const replacementHook = vi.fn();
        fixture.componentRef.setInput('card', {
          ...card,
          id: 'replacement-orders',
          componentInputs: {
            data: {},
            beforeRequest: replacementHook,
            [responseBinding]: replacementHook,
          },
        });
        expect(beforeRequest?.(request)).toBeUndefined();
        expect(afterRequest?.(response)).toBeUndefined();
        expect(replacementHook).not.toHaveBeenCalled();
        expect(localBefore).toHaveBeenCalledTimes(1);
        expect(localAfter).toHaveBeenCalledTimes(1);
        expect(nextBefore).toHaveBeenCalledTimes(1);
        expect(nextAfter).toHaveBeenCalledTimes(1);
        expect(dashboardBefore).toHaveBeenCalledTimes(1);
        expect(dashboardAfter).toHaveBeenCalledTimes(1);
      });

      it('invalidates adapters when the template replaces their host or the card is destroyed', () => {
        const { fixture } = setup();
        const request = new Request('https://example.test/rows');
        const response = { items: [] };
        const dashboardBefore = vi.fn(() => request);
        const dashboardAfter = vi.fn(() => response);
        const card: CardConfig = { id: 'orders', type, component: selector };
        fixture.componentRef.setInput('beforeCardRequest', dashboardBefore);
        fixture.componentRef.setInput('afterCardRequest', dashboardAfter);
        fixture.componentRef.setInput('card', card);
        fixture.detectChanges();

        const original = mountedCard(fixture);
        expect(original.beforeRequest).toBeTypeOf('function');
        expect(original.afterRequest).toBeTypeOf('function');
        fixture.componentRef.setInput('card', {
          ...card,
          componentTemplate: { header: false },
        });
        fixture.detectChanges();

        const replacement = mountedCard(fixture);
        expect(replacement.instance).not.toBe(original.instance);
        expect(original.beforeRequest?.(request)).toBeUndefined();
        expect(original.afterRequest?.(response)).toBeUndefined();
        expect(replacement.beforeRequest?.(request)).toBe(request);
        expect(replacement.afterRequest?.(response)).toBe(response);
        expect(dashboardBefore).toHaveBeenCalledExactlyOnceWith(
          request,
          'orders',
        );
        expect(dashboardAfter).toHaveBeenCalledExactlyOnceWith(
          response,
          'orders',
        );

        fixture.destroy();
        expect(replacement.beforeRequest?.(request)).toBeUndefined();
        expect(replacement.afterRequest?.(response)).toBeUndefined();
        expect(dashboardBefore).toHaveBeenCalledTimes(1);
        expect(dashboardAfter).toHaveBeenCalledTimes(1);
      });
    },
  );

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

    it('passes a chosen action to the actionsHook of a data fetch card', () => {
      addComponentToRegistry([DataFetchList]);
      const warn = vi.spyOn(console, 'warn').mockImplementation(vi.fn());
      const actionsHook = vi.fn<(key: string) => void>();
      const { fixture, component } = setup();
      const emitted: string[] = [];
      component.cardAction.subscribe((key) => emitted.push(key));

      fixture.componentRef.setInput('card', {
        ...templatedCard,
        type: 'angular',
        component: 'mfp-data-fetch-list-card',
        componentInputs: { actionsHook },
      });
      fixture.detectChanges();
      cardTemplate(fixture).actionPress.emit('export');

      expect(actionsHook).toHaveBeenCalledWith('export');
      expect(emitted).toEqual(['export']);
      warn.mockRestore();
    });

    it('emits cardAction and reports the error when onCardAction throws', () => {
      const handleError = vi
        .spyOn(TestBed.inject(ErrorHandler), 'handleError')
        .mockImplementation(vi.fn());
      const { fixture, component } = setup();
      const emitted: string[] = [];
      component.cardAction.subscribe((key) => emitted.push(key));

      fixture.componentRef.setInput('card', {
        ...templatedCard,
        componentTemplate: {
          actions: templatedCard.componentTemplate?.actions,
        },
        component: 'throwing-action-widget',
      });
      fixture.detectChanges();
      cardTemplate(fixture).actionPress.emit('export');

      expect(handleError).toHaveBeenCalledExactlyOnceWith(
        new Error('action failed'),
      );
      expect(emitted).toEqual(['export']);
    });

    it('calls the latest actionsHook of an Angular data fetch card without remounting it', () => {
      addComponentToRegistry([DataFetchList]);
      const firstHook = vi.fn<(key: string) => void>();
      const secondHook = vi.fn<(key: string) => void>();
      const { fixture } = setup();
      const card: CardConfig = {
        ...templatedCard,
        componentTemplate: {
          actions: templatedCard.componentTemplate?.actions,
        },
        type: 'angular',
        component: 'mfp-data-fetch-list-card',
      };

      fixture.componentRef.setInput('card', {
        ...card,
        componentInputs: { actionsHook: firstHook },
      });
      fixture.detectChanges();
      const mounted = fixture.debugElement.query(By.directive(DataFetchList));
      fixture.componentRef.setInput('card', {
        ...card,
        componentInputs: { actionsHook: secondHook },
      });
      fixture.detectChanges();
      cardTemplate(fixture).actionPress.emit('export');

      expect(fixture.debugElement.query(By.directive(DataFetchList))).toBe(
        mounted,
      );
      expect(firstHook).not.toHaveBeenCalled();
      expect(secondHook).toHaveBeenCalledExactlyOnceWith('export');
    });

    it('calls the latest actionsHook of a web component card without remounting it', () => {
      const firstHook = vi.fn<(key: string) => void>();
      const secondHook = vi.fn<(key: string) => void>();
      const { fixture } = setup();
      const card: CardConfig = {
        ...templatedCard,
        componentTemplate: {
          actions: templatedCard.componentTemplate?.actions,
        },
        component: 'actions-aware-widget',
      };

      fixture.componentRef.setInput('card', {
        ...card,
        componentInputs: { actionsHook: firstHook },
      });
      fixture.detectChanges();
      const widget = root(fixture).querySelector('actions-aware-widget');
      fixture.componentRef.setInput('card', {
        ...card,
        componentInputs: { actionsHook: secondHook },
      });
      fixture.detectChanges();
      cardTemplate(fixture).actionPress.emit('export');

      expect(root(fixture).querySelector('actions-aware-widget')).toBe(widget);
      expect(firstHook).not.toHaveBeenCalled();
      expect(secondHook).toHaveBeenCalledExactlyOnceWith('export');
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
