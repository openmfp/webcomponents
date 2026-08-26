import { resetDashboardCardRegistry } from '../card/utils/dashboard-card-registry';
import { DASHBOARD_CARD_DRAG_ORIGIN_CLASS, XL_PAGE } from '../constants';
import { EN_DEFAULTS } from '../i18n';
import { CardConfig, SectionConfig } from '../models';
import { Dashboard } from './dashboard.component';
import { ZflowGridStackEngine } from './engines/zflow/z-flow-engine';
import type { ZFlowGridStackNode } from './engines/zflow/z-flow.helpers';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { GridStackMoveOpts, GridStackNode } from 'gridstack';
import { axe } from 'vitest-axe';

vi.mock('gridstack', () => ({}));

vi.mock('gridstack/dist/angular', async () => {
  const { Component, EventEmitter, Input, Output } =
    await import('@angular/core');

  @Component({
    selector: 'mfp-gridstack',
    standalone: true,
    template: '<ng-content />',
  })
  class GridstackComponent {
    @Input() options?: unknown;
    @Output() readonly changeCB = new EventEmitter<unknown>();

    gridstackItems = {
      toArray: () => [],
    };
  }

  @Component({
    selector: 'mfp-gridstack-item',
    standalone: true,
    template: '<ng-content />',
  })
  class GridstackItemComponent {
    @Input() options?: unknown;
  }

  return {
    GridstackComponent,
    GridstackItemComponent,
  };
});

type Fixture = ComponentFixture<Dashboard>;

function setup(): { fixture: Fixture; component: Dashboard } {
  const fixture = TestBed.createComponent(Dashboard);
  const component = fixture.componentInstance;
  return { fixture, component };
}

function root(fixture: Fixture): ShadowRoot | HTMLElement {
  return fixture.nativeElement.shadowRoot ?? fixture.nativeElement;
}

function mockRect(
  element: Element,
  rect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>,
): void {
  element.getBoundingClientRect = vi.fn(
    () =>
      ({
        ...rect,
        x: rect.left,
        y: rect.top,
        right: rect.left + rect.width,
        bottom: rect.top + rect.height,
        toJSON: () => rect,
      }) as DOMRect,
  );
}

describe('Dashboard', () => {
  beforeEach(async () => {
    resetDashboardCardRegistry();
    await TestBed.configureTestingModule({
      imports: [Dashboard],
    }).compileComponents();
  });

  it('creates and applies the configured background image.', () => {
    const { fixture, component } = setup();

    fixture.componentRef.setInput('config', {
      title: 'Operations',
      backgroundImageUrl: 'https://example.com/bg.png',
    });
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(fixture.nativeElement.style.backgroundImage).toContain(
      'https://example.com/bg.png',
    );
  });

  it('renders dashboard metadata, sections and loose cards from the provided inputs', () => {
    const { fixture, component } = setup();

    fixture.componentRef.setInput('config', {});
    fixture.componentRef.setInput('i18n', {
      ...EN_DEFAULTS,
      title: 'Operations',
      description: 'Platform status',
    });
    component.sections.set([{ id: 'alpha', title: 'Alpha' }]);
    component.cards.set([
      { id: 'card-1', component: 'mfp-a', sectionId: 'alpha' },
      { id: 'card-2', component: 'mfp-b' },
    ]);
    fixture.detectChanges();

    expect(root(fixture).textContent).toContain('Operations');
    expect(root(fixture).textContent).toContain('Platform status');
    expect(
      root(fixture).querySelectorAll('mfp-dashboard-section'),
    ).toHaveLength(1);
    expect(root(fixture).querySelectorAll('gridstack-item')).toHaveLength(1);
    expect(
      root(fixture).querySelector('.mfp-dashboard__toolbar ui5-button'),
    ).toBeNull();
  });

  it('switches the template into edit mode and opens the add-card dialog from the toolbar', () => {
    const { fixture, component } = setup();

    fixture.componentRef.setInput('config', {
      title: 'Operations',
      editable: true,
    });
    component.cards.set([{ id: 'card-1', component: 'mfp-a' }]);
    fixture.detectChanges();

    const editButton = root(fixture).querySelector(
      '.mfp-dashboard__toolbar ui5-button',
    );

    editButton?.dispatchEvent(new Event('click'));
    fixture.detectChanges();

    const editCardsButton = root(fixture).querySelector('#edit-cards-btn');

    expect(component.editMode()).toBe(true);
    expect(editCardsButton).not.toBeNull();
    expect(
      root(fixture).querySelectorAll('.mfp-dashboard__edit-bar ui5-button'),
    ).toHaveLength(2);

    editCardsButton?.dispatchEvent(new Event('click'));
    fixture.detectChanges();

    expect(component.cardDialogOpen()).toBe(true);
  });

  it('computes added components, section cards, loose cards and drag options from state', () => {
    const { fixture, component } = setup();
    const cards: CardConfig[] = [
      { id: 'card-1', component: 'mfp-a', sectionId: 'alpha' },
      { id: 'card-2', component: 'mfp-b' },
      { id: 'card-3', component: 'mfp-c' },
    ];
    const gridOptions = (
      component as unknown as { gridOptions: () => { disableDrag: boolean } }
    ).gridOptions;

    fixture.componentRef.setInput('config', { title: 'T' });
    component.cards.set(cards);

    expect(component['addedCardsIds']()).toEqual(
      new Set(['card-1', 'card-2', 'card-3']),
    );
    expect(component['sectionCards']()('alpha')).toEqual([cards[0]]);
    expect(component['looseCards']()).toEqual([cards[1], cards[2]]);
    expect(gridOptions().disableDrag).toBe(true);

    component.editMode.set(true);

    expect(gridOptions().disableDrag).toBe(false);
  });

  it('captures snapshots and grid positions when entering edit mode', () => {
    const { component } = setup();
    const sections: SectionConfig[] = [{ id: 'alpha', title: 'Alpha' }];
    const cards: CardConfig[] = [
      { id: 'card-1', component: 'mfp-a', x: 0, y: 0 },
      { id: 'card-2', component: 'mfp-b', sectionId: 'alpha', x: 1, y: 1 },
    ];

    component.sections.set(sections);
    component.cards.set(cards);
    (component as unknown as { gridStack: () => unknown }).gridStack = () => ({
      gridstackItems: {
        toArray: () => [
          { options: { id: 'card-1', x: 4, y: 2, w: 6, h: 20 } },
          { options: { id: 'card-2', x: 1, y: 3, w: 4, h: 10 } },
        ],
      },
    });

    component.enterEditMode();

    expect(component.editMode()).toBe(true);
    expect(
      (component as unknown as { sectionsSnapshot: SectionConfig[] })
        .sectionsSnapshot,
    ).toEqual(sections);
    expect(
      (component as unknown as { cardsSnapshot: CardConfig[] }).cardsSnapshot,
    ).toEqual(cards);
    expect(component['cardsPosition'].get('card-1')).toEqual({
      x: 4,
      y: 2,
      w: 6,
      h: 20,
    });
    expect(component['cardsPosition'].get('card-2')).toEqual({
      x: 1,
      y: 3,
      w: 4,
      h: 10,
    });
  });

  it('emits the saved payload and persists the latest order on save', () => {
    const { component } = setup();
    const sections: SectionConfig[] = [{ id: 'alpha', title: 'Alpha' }];
    const cards: CardConfig[] = [{ id: 'card-1', component: 'mfp-a' }];
    const emitted: { sections: SectionConfig[]; cards: CardConfig[] }[] = [];

    component.sections.set(sections);
    component.cards.set(cards);
    (component as unknown as { gridStack: () => unknown }).gridStack = () => ({
      gridstackItems: {
        toArray: () => [{ options: { id: 'card-1', x: 7, y: 5, w: 8, h: 30 } }],
      },
    });
    component.editMode.set(true);
    component.saved.subscribe((value) => emitted.push(value));
    component.onGridChange();

    component.saveEdit();

    expect(emitted).toEqual([
      {
        sections,
        cards: [{ id: 'card-1', component: 'mfp-a', x: 7, y: 5, w: 8, h: 30 }],
      },
    ]);
    expect(component['cardsPosition'].get('card-1')).toEqual({
      x: 7,
      y: 5,
      w: 8,
      h: 30,
    });
    expect(component.editMode()).toBe(false);
  });

  it('emits updated w and h in the saved payload when a card is resized', () => {
    const { component } = setup();
    const cards: CardConfig[] = [
      { id: 'card-1', component: 'mfp-a', w: 6, h: 20 },
    ];
    const emitted: { sections: SectionConfig[]; cards: CardConfig[] }[] = [];

    component.cards.set(cards);
    (component as unknown as { gridStack: () => unknown }).gridStack = () => ({
      gridstackItems: {
        toArray: () => [{ options: { id: 'card-1', x: 0, y: 0, w: 3, h: 10 } }],
      },
    });
    component.editMode.set(true);
    component.saved.subscribe((value) => emitted.push(value));
    component.onGridChange();

    component.saveEdit();

    expect(emitted[0].cards[0]).toMatchObject({ id: 'card-1', w: 3, h: 10 });
    expect(component.editMode()).toBe(false);
  });

  it('preserves saved w/h after save-then-re-enter-then-cancel (regression)', () => {
    const { component } = setup();
    const cards: CardConfig[] = [
      { id: 'card-1', component: 'mfp-a', w: 6, h: 20 },
    ];

    component.cards.set(cards);
    (component as unknown as { gridStack: () => unknown }).gridStack = () => ({
      gridstackItems: {
        toArray: () => [{ options: { id: 'card-1', x: 0, y: 0, w: 3, h: 10 } }],
      },
    });

    component.enterEditMode();
    component.onGridChange();

    const emitted: { sections: SectionConfig[]; cards: CardConfig[] }[] = [];
    component.saved.subscribe((value) => emitted.push(value));
    component.saveEdit();

    expect(emitted[0].cards[0]).toMatchObject({ id: 'card-1', w: 3, h: 10 });

    component.enterEditMode();

    component.cancelEdit();

    expect(component.discardDialogOpen()).toBe(false);
    expect(component.editMode()).toBe(false);
    expect(component.cards()[0]).toMatchObject({ id: 'card-1', w: 3, h: 10 });
  });

  it('restores snapshot data and saved positions when edit mode is cancelled', () => {
    const { component } = setup();
    const sections: SectionConfig[] = [{ id: 'alpha', title: 'Alpha' }];
    const cards: CardConfig[] = [
      { id: 'card-1', component: 'mfp-a', x: 0, y: 0 },
      { id: 'card-2', component: 'mfp-b', sectionId: 'alpha', x: 1, y: 1 },
    ];

    component.sections.set(sections);
    component.cards.set(cards);
    (component as unknown as { gridStack: () => unknown }).gridStack = () => ({
      gridstackItems: {
        toArray: () => [
          { options: { id: 'card-1', x: 3, y: 6 } },
          { options: { id: 'card-2', x: 8, y: 1 } },
        ],
      },
    });
    component.enterEditMode();
    component.sections.set([{ id: 'beta', title: 'Beta' }]);
    component.cards.set([{ id: 'temp', component: 'mfp-temp', x: 9, y: 9 }]);
    component.cardDialogOpen.set(true);

    component.cancelEdit();
    // Unsaved changes were present, so cancelEdit opens the discard popup
    // instead of reverting. Confirm the discard to actually revert.
    expect(component.discardDialogOpen()).toBe(true);
    component.confirmDiscard();

    expect(component.sections()).toEqual(sections);
    expect(component.cards()).toEqual([
      { id: 'card-1', component: 'mfp-a', x: 3, y: 6 },
      { id: 'card-2', component: 'mfp-b', sectionId: 'alpha', x: 8, y: 1 },
    ]);
    expect(component.cardDialogOpen()).toBe(false);
    expect(component.editMode()).toBe(false);
  });

  describe('discard-changes confirmation', () => {
    it('opens the discard popup instead of reverting when cancelEdit is called with unsaved changes', () => {
      const { component } = setup();
      component.sections.set([{ id: 'alpha', title: 'Alpha' }]);
      (component as unknown as { gridStack: () => unknown }).gridStack =
        () => ({ gridstackItems: { toArray: () => [] } });

      component.enterEditMode();
      component.sections.set([{ id: 'beta', title: 'Beta' }]);

      component.cancelEdit();

      expect(component.discardDialogOpen()).toBe(true);
      // No revert yet — user has not confirmed.
      expect(component.editMode()).toBe(true);
      expect(component.sections()).toEqual([{ id: 'beta', title: 'Beta' }]);
    });

    it('reverts immediately when cancelEdit is called without unsaved changes', () => {
      const { component } = setup();
      component.sections.set([{ id: 'alpha', title: 'Alpha' }]);
      (component as unknown as { gridStack: () => unknown }).gridStack =
        () => ({ gridstackItems: { toArray: () => [] } });

      component.enterEditMode();

      component.cancelEdit();

      expect(component.discardDialogOpen()).toBe(false);
      expect(component.editMode()).toBe(false);
    });

    it('confirmDiscard reverts the snapshot and closes the popup', () => {
      const { component } = setup();
      const sections: SectionConfig[] = [{ id: 'alpha', title: 'Alpha' }];
      component.sections.set(sections);
      (component as unknown as { gridStack: () => unknown }).gridStack =
        () => ({ gridstackItems: { toArray: () => [] } });

      component.enterEditMode();
      component.sections.set([{ id: 'beta', title: 'Beta' }]);
      component.cancelEdit();
      expect(component.discardDialogOpen()).toBe(true);

      component.confirmDiscard();

      expect(component.discardDialogOpen()).toBe(false);
      expect(component.sections()).toEqual(sections);
      expect(component.editMode()).toBe(false);
    });

    it('cancelDiscard closes the popup and keeps the user in edit mode with their changes', () => {
      const { component } = setup();
      component.sections.set([{ id: 'alpha', title: 'Alpha' }]);
      (component as unknown as { gridStack: () => unknown }).gridStack =
        () => ({ gridstackItems: { toArray: () => [] } });

      component.enterEditMode();
      component.sections.set([{ id: 'beta', title: 'Beta' }]);
      component.cancelEdit();
      expect(component.discardDialogOpen()).toBe(true);

      component.cancelDiscard();

      expect(component.discardDialogOpen()).toBe(false);
      expect(component.editMode()).toBe(true);
      expect(component.sections()).toEqual([{ id: 'beta', title: 'Beta' }]);
    });
  });

  it('removes sections together with their cards and removes loose cards by id', () => {
    const { fixture, component } = setup();

    fixture.componentRef.setInput('config', { title: 'T' });
    component.sections.set([
      { id: 'alpha', title: 'Alpha' },
      { id: 'beta', title: 'Beta' },
    ]);
    component.cards.set([
      { id: 'card-1', component: 'mfp-a', sectionId: 'alpha' },
      { id: 'card-2', component: 'mfp-b', sectionId: 'beta' },
      { id: 'card-3', component: 'mfp-c' },
    ]);

    component.removeSection('alpha');
    component.removeCard('card-3');

    expect(component.sections()).toEqual([{ id: 'beta', title: 'Beta' }]);
    expect(component.cards()).toEqual([
      { id: 'card-2', component: 'mfp-b', sectionId: 'beta' },
    ]);
  });

  it('opens and closes the add-card dialog', () => {
    const { component } = setup();

    component.openCardPanel();
    expect(component.cardDialogOpen()).toBe(true);

    component.closeCardPanel();
    expect(component.cardDialogOpen()).toBe(false);
  });

  it('adds new cards and closes the panel', () => {
    const { fixture, component } = setup();

    fixture.componentRef.setInput('config', { title: 'T' });
    component.cards.set([{ id: 'card-1', component: 'mfp-a' }]);
    component.cardDialogOpen.set(true);

    component.onCardsEdited({
      added: [
        {
          id: 'template-card',
          component: 'mfp-b',
          label: 'Table',
          componentInputs: { size: 'L' },
        },
      ],
      removed: [],
    });

    expect(component.cards()).toEqual([
      { id: 'card-1', component: 'mfp-a' },
      {
        id: 'template-card',
        component: 'mfp-b',
        label: 'Table',
        componentInputs: { size: 'L' },
      },
    ]);
    expect(component.cardDialogOpen()).toBe(false);
  });

  it('preserves and commits z-flow around edit-card dialog changes', () => {
    const { fixture, component } = setup();
    const engine = new ZflowGridStackEngine({ column: 4, nodes: [] });
    const syncOrder = vi.spyOn(engine, 'syncZFlowOrderFromLayout');
    const commitLayout = vi.spyOn(engine, 'commitZFlowLayout');

    fixture.componentRef.setInput('config', {
      title: 'T',
      zFlow: { cardHeight: 40 },
    });
    component.cards.set([{ id: 'card-1', component: 'mfp-a' }]);
    (component as unknown as { gridStack: () => unknown }).gridStack = () => ({
      grid: { engine },
    });

    component.onCardsEdited({
      added: [{ id: 'card-2', component: 'mfp-b' }],
      removed: [],
    });
    component.onGridChange();

    expect(syncOrder).toHaveBeenCalledOnce();
    expect(commitLayout).toHaveBeenCalledOnce();
  });

  it('positions the drag origin placeholder from the dragged grid item', () => {
    const { fixture, component } = setup();
    fixture.componentRef.setInput('config', {
      title: 'T',
      zFlow: { cardHeight: 40 },
    });
    const gridEl = document.createElement('div');
    const gridItemEl = document.createElement('div');

    mockRect(gridEl, { left: 50, top: 100, width: 400, height: 600 });
    mockRect(gridItemEl, { left: 70, top: 130, width: 220, height: 180 });
    (component as unknown as { gridStack: () => unknown }).gridStack = () => ({
      el: gridEl,
    });

    component.onDragStart({ el: gridItemEl });

    expect(
      (
        component as unknown as {
          dragOriginStyle: () => {
            top: string;
            left: string;
            width: string;
            height: string;
          } | null;
        }
      ).dragOriginStyle(),
    ).toEqual({
      top: '30px',
      left: '20px',
      width: '220px',
      height: '180px',
    });
  });

  it('syncs stale z-flow order from the current layout before a new drag starts', () => {
    const { fixture, component } = setup();
    fixture.componentRef.setInput('config', {
      title: 'T',
      zFlow: { cardHeight: 40 },
    });
    const gridEl = document.createElement('div');
    const gridItemEl = document.createElement('div');
    const dragOriginEl = document.createElement('div');
    const nodes: ZFlowGridStackNode[] = [
      { id: 'favorites', x: 0, y: 0, w: 1, h: 10, zFlowOrder: 0 },
      { id: 'recent', x: 1, y: 0, w: 1, h: 10, zFlowOrder: 1 },
      { id: 'resource', x: 2, y: 0, w: 1, h: 10, zFlowOrder: 2 },
      { id: 'cost', x: 3, y: 0, w: 1, h: 10, zFlowOrder: 4 },
      { id: 'team', x: 0, y: 10, w: 1, h: 10, zFlowOrder: 3 },
      { id: 'quick', x: 1, y: 10, w: 1, h: 10, zFlowOrder: 5 },
    ];
    const engine = new ZflowGridStackEngine({ column: 4, nodes });

    dragOriginEl.className = DASHBOARD_CARD_DRAG_ORIGIN_CLASS;
    gridItemEl.appendChild(dragOriginEl);
    mockRect(gridEl, { left: 0, top: 0, width: 400, height: 200 });
    mockRect(dragOriginEl, { left: 200, top: 0, width: 100, height: 100 });
    (component as unknown as { gridStack: () => unknown }).gridStack = () => ({
      el: gridEl,
      grid: { engine },
    });

    component.onDragStart({ el: gridItemEl });

    expect(nodes.map((node) => [node.id, node.zFlowOrder])).toEqual([
      ['favorites', 0],
      ['recent', 1],
      ['resource', 2],
      ['cost', 3],
      ['team', 4],
      ['quick', 5],
    ]);

    const source = nodes[2] as GridStackNode & { _moving: boolean };
    source._moving = true;

    const changed = engine.moveNodeCheck(source, {
      cellWidth: 100,
      cellHeight: 10,
      rect: { x: 200, y: 0, w: 100, h: 100 },
    } as GridStackMoveOpts);

    expect(changed).toBe(false);
    expect(engine.commitZFlowLayout()).toBe(false);
    expect(
      nodes.map((node) => ({ id: node.id, x: node.x, y: node.y })),
    ).toEqual([
      { id: 'favorites', x: 0, y: 0 },
      { id: 'recent', x: 1, y: 0 },
      { id: 'resource', x: 2, y: 0 },
      { id: 'cost', x: 3, y: 0 },
      { id: 'team', x: 0, y: 10 },
      { id: 'quick', x: 1, y: 10 },
    ]);
  });

  describe('drag origin placeholder visibility', () => {
    it('dragOriginVisible is false initially', () => {
      const { component } = setup();

      expect(component.dragOriginVisible()).toBe(false);
    });

    it('onDragStart sets dragOriginStyle and sets dragOriginVisible to true (when renderOriginPosition is on)', () => {
      const { fixture, component } = setup();
      fixture.componentRef.setInput('config', {
        zFlow: { cardHeight: 30 },
      });
      fixture.detectChanges();

      const gridEl = document.createElement('div');
      const gridItemEl = document.createElement('div');
      mockRect(gridEl, { left: 0, top: 0, width: 400, height: 200 });
      mockRect(gridItemEl, { left: 10, top: 20, width: 100, height: 50 });
      (component as unknown as { gridStack: () => unknown }).gridStack =
        () => ({
          el: gridEl,
        });

      component.onDragStart({ el: gridItemEl });

      expect(component.dragOriginVisible()).toBe(true);
      expect(component.dragOriginStyle()).not.toBeNull();
      expect(component.dragOriginStyle()).toEqual({
        top: '20px',
        left: '10px',
        width: '100px',
        height: '50px',
      });
    });

    it('onDragStart skips style and keeps dragOriginVisible false when renderOriginPosition is off', () => {
      const { fixture, component } = setup();
      fixture.componentRef.setInput('config', { title: 'T' });
      fixture.detectChanges();

      const gridEl = document.createElement('div');
      const gridItemEl = document.createElement('div');
      (component as unknown as { gridStack: () => unknown }).gridStack =
        () => ({
          el: gridEl,
        });

      component.onDragStart({ el: gridItemEl });

      expect(component.dragOriginVisible()).toBe(false);
      expect(component.dragOriginStyle()).toBeNull();
    });

    it('onDrag resets dragOriginVisible to false', () => {
      const { component } = setup();
      component.dragOriginVisible.set(true);

      component.onDrag();

      expect(component.dragOriginVisible()).toBe(false);
    });

    it('onDragStop resets dragOriginVisible to false and clears dragOriginStyle', () => {
      const { component } = setup();
      component.dragOriginVisible.set(true);
      component.dragOriginStyle.set({
        top: '1px',
        left: '2px',
        width: '3px',
        height: '4px',
      });

      component.onDragStop();

      expect(component.dragOriginVisible()).toBe(false);
      expect(component.dragOriginStyle()).toBeNull();
    });
  });

  describe('createDragOriginClone', () => {
    it('returns null when the grid item has no drag-origin child', () => {
      const { component } = setup();

      const clone = (
        component as unknown as {
          createDragOriginClone: (el: Element) => HTMLElement | null;
        }
      ).createDragOriginClone(document.createElement('div'));

      expect(clone).toBeNull();
    });

    it('returns a clone with the mfp-dashboard__drag-origin-content class', () => {
      const { component } = setup();
      const gridItemEl = document.createElement('div');
      const source = document.createElement('div');
      source.classList.add(DASHBOARD_CARD_DRAG_ORIGIN_CLASS);
      gridItemEl.appendChild(source);

      const clone = (
        component as unknown as {
          createDragOriginClone: (el: Element) => HTMLElement | null;
        }
      ).createDragOriginClone(gridItemEl);

      expect(clone).not.toBeNull();
      expect(
        clone?.classList.contains('mfp-dashboard__drag-origin-content'),
      ).toBe(true);
    });

    it('clone has aria-hidden="true" and no id', () => {
      const { component } = setup();
      const gridItemEl = document.createElement('div');
      const source = document.createElement('div');
      source.classList.add(DASHBOARD_CARD_DRAG_ORIGIN_CLASS);
      source.id = 'source-id';
      gridItemEl.appendChild(source);

      const clone = (
        component as unknown as {
          createDragOriginClone: (el: Element) => HTMLElement | null;
        }
      ).createDragOriginClone(gridItemEl);

      expect(clone?.getAttribute('aria-hidden')).toBe('true');
      expect(clone?.hasAttribute('id')).toBe(false);
    });

    it('clone strips ids from all descendants', () => {
      const { component } = setup();
      const gridItemEl = document.createElement('div');
      const source = document.createElement('div');
      source.classList.add(DASHBOARD_CARD_DRAG_ORIGIN_CLASS);
      const nested = document.createElement('span');
      nested.id = 'nested-id';
      source.appendChild(nested);
      const grandChild = document.createElement('div');
      grandChild.id = 'grand-child-id';
      nested.appendChild(grandChild);
      gridItemEl.appendChild(source);

      const clone = (
        component as unknown as {
          createDragOriginClone: (el: Element) => HTMLElement | null;
        }
      ).createDragOriginClone(gridItemEl);

      expect(clone?.querySelectorAll('[id]')).toHaveLength(0);
    });
  });

  describe('drag origin placeholder template rendering', () => {
    it('placeholder div is absent when dragOriginStyle is null', () => {
      const { fixture } = setup();
      fixture.detectChanges();

      expect(
        root(fixture).querySelector('.mfp-dashboard__drag-origin-placeholder'),
      ).toBeNull();
    });

    it('placeholder div is absent when dragOriginStyle is set but dragOriginVisible is false', () => {
      const { fixture, component } = setup();
      component.dragOriginStyle.set({
        top: '1px',
        left: '2px',
        width: '3px',
        height: '4px',
      });
      fixture.detectChanges();

      expect(
        root(fixture).querySelector('.mfp-dashboard__drag-origin-placeholder'),
      ).toBeNull();
    });

    it('placeholder div is present when both dragOriginStyle and dragOriginVisible are true', () => {
      const { fixture, component } = setup();
      component.dragOriginStyle.set({
        top: '1px',
        left: '2px',
        width: '3px',
        height: '4px',
      });
      component.dragOriginVisible.set(true);
      fixture.detectChanges();

      expect(
        root(fixture).querySelector('.mfp-dashboard__drag-origin-placeholder'),
      ).not.toBeNull();
    });
  });

  it('preserves card constraint fields (maxH/maxW/minH/minW) through saveEdit', () => {
    const { component } = setup();
    const cards: CardConfig[] = [
      {
        id: 'card-1',
        component: 'mfp-a',
        x: 0,
        y: 0,
        maxH: 4,
        maxW: 6,
        minH: 1,
        minW: 2,
      },
    ];

    component.cards.set(cards);
    (component as unknown as { gridStack: () => unknown }).gridStack = () => ({
      gridstackItems: {
        toArray: () => [{ options: { id: 'card-1', x: 1, y: 2 } }],
      },
    });
    component.editMode.set(true);
    component.saved.subscribe(() => false);
    component.onGridChange();

    component.saveEdit();

    expect(component.cards()[0]).toMatchObject({
      maxH: 4,
      maxW: 6,
      minH: 1,
      minW: 2,
    });
  });

  it('still closes the panel when no changes are made', () => {
    const { fixture, component } = setup();

    fixture.componentRef.setInput('config', { title: 'T' });
    component.cardDialogOpen.set(true);
    component.cards.set([{ id: 'card-1', component: 'mfp-a' }]);

    component.onCardsEdited({ added: [], removed: [] });

    expect(component.cards()).toEqual([{ id: 'card-1', component: 'mfp-a' }]);
    expect(component.cardDialogOpen()).toBe(false);
  });

  it('removes cards by id and closes the panel when onCardsEdited receives removed ids', () => {
    const { fixture, component } = setup();

    fixture.componentRef.setInput('config', { title: 'T' });
    component.cards.set([
      { id: 'card-1', component: 'mfp-a' },
      { id: 'card-2', component: 'mfp-b' },
    ]);
    component.cardDialogOpen.set(true);

    component.onCardsEdited({ added: [], removed: ['card-1'] });

    expect(component.cards()).toEqual([{ id: 'card-2', component: 'mfp-b' }]);
    expect(component.cardDialogOpen()).toBe(false);
  });

  describe('title and description rendering', () => {
    it('renders title inside a ui5-title with level H3', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('config', {});
      fixture.componentRef.setInput('i18n', {
        ...EN_DEFAULTS,
        title: 'My Dashboard',
      });
      fixture.detectChanges();

      const titleEl = root(fixture).querySelector('ui5-title[level="H3"]');
      expect(titleEl).not.toBeNull();
      expect(titleEl?.textContent?.trim()).toBe('My Dashboard');
    });

    it('renders description inside a ui5-title with level H5', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('config', {});
      fixture.componentRef.setInput('i18n', {
        ...EN_DEFAULTS,
        description: 'Platform status',
      });
      fixture.detectChanges();

      const descEl = root(fixture).querySelector('ui5-title[level="H5"]');
      expect(descEl).not.toBeNull();
      expect(descEl?.textContent?.trim()).toBe('Platform status');
    });

    it('renders safe HTML markup in the title', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('config', {});
      fixture.componentRef.setInput('i18n', {
        ...EN_DEFAULTS,
        title: 'Hello <b>World</b>',
      });
      fixture.detectChanges();

      const span = root(fixture).querySelector('ui5-title[level="H3"] span');
      expect(span?.querySelector('b')).not.toBeNull();
      expect(span?.querySelector('b')?.textContent).toBe('World');
    });

    it('renders safe HTML markup in the description', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('config', {});
      fixture.componentRef.setInput('i18n', {
        ...EN_DEFAULTS,
        description: 'Status in <b>real time</b>.',
      });
      fixture.detectChanges();

      const span = root(fixture).querySelector('ui5-title[level="H5"] span');
      expect(span?.querySelector('b')).not.toBeNull();
      expect(span?.querySelector('b')?.textContent).toBe('real time');
    });

    it('strips dangerous script tags from the title', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('config', {});
      fixture.componentRef.setInput('i18n', {
        ...EN_DEFAULTS,
        title: 'Safe<script>alert(1)</script>',
      });
      fixture.detectChanges();

      const span = root(fixture).querySelector('ui5-title[level="H3"] span');
      expect(span?.querySelector('script')).toBeNull();
      expect(span?.textContent).toContain('Safe');
    });

    it('strips dangerous script tags from the description', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('config', {});
      fixture.componentRef.setInput('i18n', {
        ...EN_DEFAULTS,
        description: 'Info<script>alert(1)</script>',
      });
      fixture.detectChanges();

      const span = root(fixture).querySelector('ui5-title[level="H5"] span');
      expect(span?.querySelector('script')).toBeNull();
      expect(span?.textContent).toContain('Info');
    });

    it('does not render the description block when description is empty', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('config', {});
      fixture.componentRef.setInput('i18n', {
        ...EN_DEFAULTS,
        description: '',
      });
      fixture.detectChanges();

      expect(root(fixture).querySelector('ui5-title[level="H5"]')).toBeNull();
    });
  });

  describe('editCardsButton', () => {
    it('takes design from buttonsSettings but text from i18n.editCardsButton', () => {
      const { fixture, component } = setup();

      fixture.componentRef.setInput('config', {
        buttonsSettings: {
          editCardsButton: { text: 'ignored override', design: 'Emphasized' },
        },
      });
      fixture.componentRef.setInput('i18n', {
        ...EN_DEFAULTS,
        editCardsButton: 'Karte hinzufügen',
      });
      fixture.detectChanges();

      // i18n wins over buttonsSettings for the text; design is still overridable.
      expect(component['editCardsButton']().text).toBe('Karte hinzufügen');
      expect(component['editCardsButton']().design).toBe('Emphasized');
    });
  });

  describe('data-testid attributes', () => {
    it('root div has data-testid="dashboard"', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('config', { title: 'Operations' });
      fixture.detectChanges();

      const el = root(fixture).querySelector('[data-testid="dashboard"]');
      expect(el).not.toBeNull();
    });

    it('save button has data-testid="dashboard-save-btn" in edit mode', () => {
      const { fixture, component } = setup();

      fixture.componentRef.setInput('config', {
        title: 'Operations',
        editable: true,
      });
      fixture.detectChanges();

      component.editMode.set(true);
      fixture.detectChanges();

      const btn = root(fixture).querySelector(
        '[data-testid="dashboard-save-btn"]',
      );
      expect(btn).not.toBeNull();
    });

    it('cancel button has data-testid="dashboard-cancel-btn" in edit mode', () => {
      const { fixture, component } = setup();

      fixture.componentRef.setInput('config', {
        title: 'Operations',
        editable: true,
      });
      fixture.detectChanges();

      component.editMode.set(true);
      fixture.detectChanges();

      const btn = root(fixture).querySelector(
        '[data-testid="dashboard-cancel-btn"]',
      );
      expect(btn).not.toBeNull();
    });

    it('save and cancel buttons are absent when not in edit mode', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('config', { title: 'Operations' });
      fixture.detectChanges();

      expect(
        root(fixture).querySelector('[data-testid="dashboard-save-btn"]'),
      ).toBeNull();
      expect(
        root(fixture).querySelector('[data-testid="dashboard-cancel-btn"]'),
      ).toBeNull();
    });
  });

  describe('hasUnsavedChanges indicator', () => {
    function configureFor(component: Dashboard) {
      (component as unknown as { gridStack: () => unknown }).gridStack =
        () => ({
          gridstackItems: { toArray: () => [] },
        });
    }

    it('is false when not in edit mode', () => {
      const { fixture, component } = setup();
      fixture.componentRef.setInput('config', { title: 'Operations' });
      configureFor(component);
      fixture.detectChanges();

      expect(component['hasUnsavedChanges']()).toBe(false);
    });

    it('is false right after entering edit mode without any modifications', () => {
      const { fixture, component } = setup();
      fixture.componentRef.setInput('config', { title: 'Operations' });
      configureFor(component);
      fixture.detectChanges();

      component.enterEditMode();

      expect(component.editMode()).toBe(true);
      expect(component['hasUnsavedChanges']()).toBe(false);
    });

    it('flips to true when sections change while in edit mode', () => {
      const { fixture, component } = setup();
      fixture.componentRef.setInput('config', { title: 'Operations' });
      component.sections.set([{ id: 'alpha', title: 'Alpha' }]);
      configureFor(component);
      fixture.detectChanges();

      component.enterEditMode();
      expect(component['hasUnsavedChanges']()).toBe(false);

      component.sections.set([{ id: 'beta', title: 'Beta' }]);
      expect(component['hasUnsavedChanges']()).toBe(true);
    });

    it('flips to true when cards change while in edit mode', () => {
      const { fixture, component } = setup();
      fixture.componentRef.setInput('config', { title: 'Operations' });
      component.cards.set([{ id: 'c1', component: 'mfp-a' }]);
      configureFor(component);
      fixture.detectChanges();

      component.enterEditMode();
      expect(component['hasUnsavedChanges']()).toBe(false);

      component.removeCard('c1');
      expect(component['hasUnsavedChanges']()).toBe(true);
    });

    it('flips to true when the gridstack reports a change while in edit mode', () => {
      const { fixture, component } = setup();
      fixture.componentRef.setInput('config', { title: 'Operations' });
      configureFor(component);
      fixture.detectChanges();

      component.enterEditMode();
      expect(component['hasUnsavedChanges']()).toBe(false);

      component.onGridChange();
      expect(component['hasUnsavedChanges']()).toBe(true);
    });

    it('ignores grid change events fired outside edit mode', () => {
      const { fixture, component } = setup();
      fixture.componentRef.setInput('config', { title: 'Operations' });
      configureFor(component);
      fixture.detectChanges();

      component.onGridChange();

      expect(component['hasUnsavedChanges']()).toBe(false);
    });

    it('resets to false after saveEdit', () => {
      const { fixture, component } = setup();
      fixture.componentRef.setInput('config', { title: 'Operations' });
      configureFor(component);
      fixture.detectChanges();

      component.enterEditMode();
      component.sections.set([{ id: 'new', title: 'New' }]);
      expect(component['hasUnsavedChanges']()).toBe(true);

      component.saveEdit();

      expect(component.editMode()).toBe(false);
      expect(component['hasUnsavedChanges']()).toBe(false);
    });

    it('resets to false after cancelEdit', () => {
      const { fixture, component } = setup();
      fixture.componentRef.setInput('config', { title: 'Operations' });
      component.sections.set([{ id: 'alpha', title: 'Alpha' }]);
      configureFor(component);
      fixture.detectChanges();

      component.enterEditMode();
      component.sections.set([{ id: 'beta', title: 'Beta' }]);
      expect(component['hasUnsavedChanges']()).toBe(true);

      component.cancelEdit();
      // cancelEdit now defers the revert behind the discard popup when there
      // are unsaved changes; confirming finishes the cancel.
      component.confirmDiscard();

      expect(component.editMode()).toBe(false);
      expect(component['hasUnsavedChanges']()).toBe(false);
    });

    it('renders the indicator only when there are unsaved changes', () => {
      const { fixture, component } = setup();
      fixture.componentRef.setInput('config', { title: 'Operations' });
      configureFor(component);
      fixture.detectChanges();

      expect(
        root(fixture).querySelector('.mfp-dashboard__unsaved-changes'),
      ).toBeNull();

      component.enterEditMode();
      component.sections.set([{ id: 'beta', title: 'Beta' }]);
      fixture.detectChanges();

      const indicator = root(fixture).querySelector(
        '.mfp-dashboard__unsaved-changes',
      ) as HTMLElement | null;
      expect(indicator).not.toBeNull();
      expect(indicator!.textContent).toContain('Unsaved Changes');
      expect(
        indicator!.querySelector('ui5-icon[name="user-edit"]'),
      ).not.toBeNull();
    });
  });

  describe('navigation guard (requestNavigation)', () => {
    function enterEditWithDirty(component: Dashboard): void {
      component.sections.set([{ id: 'alpha', title: 'Alpha' }]);
      (component as unknown as { gridStack: () => unknown }).gridStack =
        () => ({ gridstackItems: { toArray: () => [] } });
      component.enterEditMode();
      // Make the snapshot diverge so hasUnsavedChanges() flips to true.
      component.sections.set([{ id: 'beta', title: 'Beta' }]);
    }

    it('runs the proceed callback synchronously and returns true when there are no unsaved changes', () => {
      const { component } = setup();
      let ran = 0;

      const result = component.requestNavigation(() => ran++);

      expect(result).toBe(true);
      expect(ran).toBe(1);
      expect(component.unsavedNavDialogOpen()).toBe(false);
    });

    it('queues the navigation and opens the unsaved-changes dialog when there are unsaved changes', () => {
      const { component } = setup();
      enterEditWithDirty(component);
      let ran = 0;

      const result = component.requestNavigation(() => ran++);

      expect(result).toBe(false);
      expect(ran).toBe(0);
      expect(component.unsavedNavDialogOpen()).toBe(true);
    });

    it('Save persists the changes, closes the dialog, and runs the queued navigation', () => {
      const { component } = setup();
      enterEditWithDirty(component);
      let ran = 0;
      let savedPayload: unknown = null;
      component.saved.subscribe((p) => (savedPayload = p));

      component.requestNavigation(() => ran++);
      component.onUnsavedNavSave();

      expect(component.unsavedNavDialogOpen()).toBe(false);
      expect(component.editMode()).toBe(false);
      expect(savedPayload).not.toBeNull();
      expect(ran).toBe(1);
    });

    it('Discard reverts the snapshot, closes the dialog, and runs the queued navigation', () => {
      const { component } = setup();
      const original: SectionConfig[] = [{ id: 'alpha', title: 'Alpha' }];
      component.sections.set(original);
      (component as unknown as { gridStack: () => unknown }).gridStack =
        () => ({ gridstackItems: { toArray: () => [] } });
      component.enterEditMode();
      component.sections.set([{ id: 'beta', title: 'Beta' }]);
      let ran = 0;

      component.requestNavigation(() => ran++);
      component.onUnsavedNavDiscard();

      expect(component.unsavedNavDialogOpen()).toBe(false);
      expect(component.editMode()).toBe(false);
      expect(component.sections()).toEqual(original);
      expect(ran).toBe(1);
    });

    it('Cancel closes the dialog, drops the queued navigation, and keeps the user in edit mode', () => {
      const { component } = setup();
      enterEditWithDirty(component);
      let ran = 0;

      component.requestNavigation(() => ran++);
      component.onUnsavedNavCancel();

      expect(component.unsavedNavDialogOpen()).toBe(false);
      expect(component.editMode()).toBe(true);
      expect(ran).toBe(0);
    });

    it('a fresh requestNavigation replaces an already-pending one (the new callback wins on Save)', () => {
      const { component } = setup();
      enterEditWithDirty(component);
      let firstRan = 0;
      let secondRan = 0;

      component.requestNavigation(() => firstRan++);
      component.requestNavigation(() => secondRan++);
      component.onUnsavedNavSave();

      expect(firstRan).toBe(0);
      expect(secondRan).toBe(1);
    });
  });

  describe('beforeunload listener', () => {
    it('preventDefault is called when there are unsaved changes', () => {
      const { fixture, component } = setup();
      fixture.componentRef.setInput('config', { title: 'Operations' });
      fixture.detectChanges();
      component.sections.set([{ id: 'alpha', title: 'Alpha' }]);
      (component as unknown as { gridStack: () => unknown }).gridStack =
        () => ({ gridstackItems: { toArray: () => [] } });
      component.enterEditMode();
      component.sections.set([{ id: 'beta', title: 'Beta' }]);

      const event = new Event('beforeunload', { cancelable: true });
      const preventSpy = vi.spyOn(event, 'preventDefault');

      window.dispatchEvent(event);

      expect(preventSpy).toHaveBeenCalled();
    });

    it('preventDefault is NOT called when there are no unsaved changes', () => {
      const { fixture, component } = setup();
      fixture.componentRef.setInput('config', { title: 'Operations' });
      fixture.detectChanges();
      // Not in edit mode → hasUnsavedChanges() returns false unconditionally.
      void component;

      const event = new Event('beforeunload', { cancelable: true });
      const preventSpy = vi.spyOn(event, 'preventDefault');

      window.dispatchEvent(event);

      expect(preventSpy).not.toHaveBeenCalled();
    });

    it('removes the listener on destroy', () => {
      const { fixture, component } = setup();
      fixture.componentRef.setInput('config', { title: 'Operations' });
      fixture.detectChanges();
      component.sections.set([{ id: 'alpha', title: 'Alpha' }]);
      (component as unknown as { gridStack: () => unknown }).gridStack =
        () => ({ gridstackItems: { toArray: () => [] } });
      component.enterEditMode();
      component.sections.set([{ id: 'beta', title: 'Beta' }]);

      fixture.destroy();

      const event = new Event('beforeunload', { cancelable: true });
      const preventSpy = vi.spyOn(event, 'preventDefault');
      window.dispatchEvent(event);

      expect(preventSpy).not.toHaveBeenCalled();
    });
  });

  describe('engine profile gating', () => {
    it('resolves to the zFlow profile when config().zFlow is set', () => {
      const { fixture, component } = setup();

      fixture.componentRef.setInput('config', {
        title: 'T',
        zFlow: { cardHeight: 30 },
      });
      fixture.detectChanges();

      const profile = component['engineProfile']();
      expect(profile.engineClass).toBe(ZflowGridStackEngine);
      expect(profile.fixedCardHeight).toBe(true);
      expect(profile.xlWidthSwap).toBe(true);
      expect(profile.sectionColumns).toEqual([1, 2, 3, 3]);
    });

    it('resolves to the default profile when config().zFlow is absent', () => {
      const { fixture, component } = setup();

      fixture.componentRef.setInput('config', { title: 'T' });
      fixture.detectChanges();

      const profile = component['engineProfile']();
      expect(profile.engineClass).toBeUndefined();
      expect(profile.fixedCardHeight).toBe(false);
      expect(profile.xlWidthSwap).toBe(false);
      expect(profile.sectionColumns).toEqual([1, 8, 12, 14]);
    });

    it('gridStackEngine() returns ZflowGridStackEngine under zFlow', () => {
      const { fixture, component } = setup();

      fixture.componentRef.setInput('config', {
        title: 'T',
        zFlow: { cardHeight: 30 },
      });
      fixture.detectChanges();

      expect(component['gridStackEngine']()).toBe(ZflowGridStackEngine);
    });

    it('gridStackEngine() returns undefined by default', () => {
      const { fixture, component } = setup();

      fixture.componentRef.setInput('config', { title: 'T' });
      fixture.detectChanges();

      expect(component['gridStackEngine']()).toBeUndefined();
    });

    it('gridBreakpoints() column counts are [4,4,4,1] under zFlow', () => {
      const { fixture, component } = setup();

      fixture.componentRef.setInput('config', {
        title: 'T',
        zFlow: { cardHeight: 30 },
      });
      fixture.detectChanges();

      expect(component['gridBreakpoints']().map((bp) => bp.c)).toEqual([
        4, 4, 4, 1,
      ]);
    });

    it('gridBreakpoints() column counts are [14,12,8,1] by default', () => {
      const { fixture, component } = setup();

      fixture.componentRef.setInput('config', { title: 'T' });
      fixture.detectChanges();

      expect(component['gridBreakpoints']().map((bp) => bp.c)).toEqual([
        14, 12, 8, 1,
      ]);
    });

    it('columnVars() reflects the zFlow column layout', () => {
      const { fixture, component } = setup();

      fixture.componentRef.setInput('config', {
        title: 'T',
        zFlow: { cardHeight: 30 },
      });
      fixture.detectChanges();

      expect(component['columnVars']()).toEqual({
        '--dashboard-cols-sm': 1,
        '--dashboard-cols-md': 2,
        '--dashboard-cols-lg': 3,
        '--dashboard-cols-xl': 3,
      });
    });

    it('columnVars() reflects 14-column layout by default', () => {
      const { fixture, component } = setup();

      fixture.componentRef.setInput('config', { title: 'T' });
      fixture.detectChanges();

      expect(component['columnVars']()).toEqual({
        '--dashboard-cols-sm': 1,
        '--dashboard-cols-md': 8,
        '--dashboard-cols-lg': 12,
        '--dashboard-cols-xl': 14,
      });
    });

    it('looseCards() overrides h and maxH to cardHeight for loose cards under zFlow', () => {
      const { fixture, component } = setup();

      fixture.componentRef.setInput('config', {
        title: 'T',
        zFlow: { cardHeight: 30 },
      });
      component.cards.set([
        { id: 'loose-1', component: 'mfp-a', h: 50, maxH: 55 },
        { id: 'loose-2', component: 'mfp-b', h: 20 },
      ]);
      fixture.detectChanges();

      const loose = component['looseCards']();
      expect(loose).toHaveLength(2);
      expect(loose[0]).toMatchObject({ id: 'loose-1', h: 30, maxH: 30 });
      expect(loose[1]).toMatchObject({ id: 'loose-2', h: 30, maxH: 30 });
    });

    it('looseCards() passes loose cards through unchanged by default', () => {
      const { fixture, component } = setup();

      fixture.componentRef.setInput('config', { title: 'T' });
      component.cards.set([
        { id: 'loose-1', component: 'mfp-a', h: 50, maxH: 55 },
      ]);
      fixture.detectChanges();

      const loose = component['looseCards']();
      expect(loose[0]).toMatchObject({ id: 'loose-1', h: 50, maxH: 55 });
    });

    it('looseCards() does NOT height-override section cards under zFlow', () => {
      const { fixture, component } = setup();

      fixture.componentRef.setInput('config', {
        title: 'T',
        zFlow: { cardHeight: 30 },
      });
      component.cards.set([
        {
          id: 'section-card',
          component: 'mfp-a',
          sectionId: 'alpha',
          h: 20,
          maxH: 25,
        },
        { id: 'loose-card', component: 'mfp-b', h: 20 },
      ]);
      fixture.detectChanges();

      // looseCards() only contains cards without a sectionId
      const loose = component['looseCards']();
      expect(loose.map((c) => c.id)).not.toContain('section-card');
      expect(loose.find((c) => c.id === 'loose-card')).toMatchObject({
        h: 30,
        maxH: 30,
      });
    });

    it('xlWidthSwap is false by default and true under zFlow', () => {
      const { fixture, component } = setup();

      fixture.componentRef.setInput('config', { title: 'T' });
      fixture.detectChanges();
      expect(component['engineProfile']().xlWidthSwap).toBe(false);

      fixture.componentRef.setInput('config', {
        title: 'T',
        zFlow: { cardHeight: 30 },
      });
      fixture.detectChanges();
      expect(component['engineProfile']().xlWidthSwap).toBe(true);
    });
  });

  describe('XL width swap (changeCardSettingsForXlPage)', () => {
    function stubEmptyGrid(component: Dashboard): void {
      (component as unknown as { gridStack: () => unknown }).gridStack =
        () => ({ gridstackItems: { toArray: () => [] } });
    }

    function swap(component: Dashboard, width: number): void {
      (
        component as unknown as {
          changeCardSettingsForXlPage: (w: number) => void;
        }
      ).changeCardSettingsForXlPage(width);
    }

    it('does nothing under the default profile (xlWidthSwap is false)', () => {
      const { fixture, component } = setup();
      fixture.componentRef.setInput('config', { title: 'T' });
      component.cards.set([{ id: 'c1', component: 'mfp-a', w: 4, maxW: 4 }]);
      stubEmptyGrid(component);
      fixture.detectChanges();

      // Dropping below the XL page would swap 4→? only under zFlow.
      swap(component, 1000);

      expect(component.cards()[0]).toMatchObject({ w: 4, maxW: 4 });
    });

    it('narrows w/maxW from 4 to 3 when growing to an XL-width page under zFlow', () => {
      const { fixture, component } = setup();
      fixture.componentRef.setInput('config', {
        title: 'T',
        zFlow: { cardHeight: 30 },
      });
      component.cards.set([
        { id: 'c1', component: 'mfp-a', w: 4, maxW: 4 },
        { id: 'c2', component: 'mfp-b', w: 2, maxW: 2 },
      ]);
      stubEmptyGrid(component);
      fixture.detectChanges();

      // Start on a sub-XL page, then grow to XL.
      swap(component, 1000);
      swap(component, XL_PAGE);

      expect(component.cards()[0]).toMatchObject({ w: 3, maxW: 3 });
      // Cards that are not exactly 4 wide are left untouched.
      expect(component.cards()[1]).toMatchObject({ w: 2, maxW: 2 });
    });

    it('widens w/maxW from 3 to 4 when shrinking below the XL page under zFlow', () => {
      const { fixture, component } = setup();
      fixture.componentRef.setInput('config', {
        title: 'T',
        zFlow: { cardHeight: 30 },
      });
      component.cards.set([{ id: 'c1', component: 'mfp-a', w: 3, maxW: 3 }]);
      stubEmptyGrid(component);
      fixture.detectChanges();

      // The component starts assuming an XL page, so shrinking triggers 3→4.
      swap(component, XL_PAGE - 1);

      expect(component.cards()[0]).toMatchObject({ w: 4, maxW: 4 });
    });

    it('does not re-run the swap while staying within the same page bracket', () => {
      const { fixture, component } = setup();
      fixture.componentRef.setInput('config', {
        title: 'T',
        zFlow: { cardHeight: 30 },
      });
      // A card already at 3 that a second XL notification must not touch.
      component.cards.set([{ id: 'c1', component: 'mfp-a', w: 3, maxW: 3 }]);
      stubEmptyGrid(component);
      fixture.detectChanges();

      // Two XL-width notifications in a row: the guard keeps isXLPage true, so
      // the 3→4 widening branch never runs and the card stays at 3.
      swap(component, XL_PAGE);
      swap(component, XL_PAGE + 200);

      expect(component.cards()[0]).toMatchObject({ w: 3, maxW: 3 });
    });
  });

  describe('localization (i18n)', () => {
    it('renders English chrome by default', () => {
      const { fixture, component } = setup();

      fixture.componentRef.setInput('config', {
        title: 'Operations',
        editable: true,
      });
      fixture.detectChanges();

      component.enterEditMode();
      fixture.detectChanges();

      const buttons = Array.from(
        root(fixture).querySelectorAll('.mfp-dashboard__edit-bar ui5-button'),
      ) as HTMLElement[];
      const labels = buttons.map((b) => b.textContent?.trim());
      expect(labels).toContain('Save');
      expect(labels).toContain('Cancel');
    });

    it('renders client-supplied chrome translations from the i18n input', () => {
      const { fixture, component } = setup();

      fixture.componentRef.setInput('config', {
        title: 'Operations',
        editable: true,
      });
      fixture.componentRef.setInput('i18n', {
        save: 'Speichern',
        cancel: 'Abbrechen',
      });
      fixture.detectChanges();

      component.enterEditMode();
      fixture.detectChanges();

      const buttons = Array.from(
        root(fixture).querySelectorAll('.mfp-dashboard__edit-bar ui5-button'),
      ) as HTMLElement[];
      const labels = buttons.map((b) => b.textContent?.trim());
      expect(labels).toContain('Speichern');
      expect(labels).toContain('Abbrechen');
    });

    it('falls back to English for keys omitted from the i18n input', () => {
      const { fixture, component } = setup();

      fixture.componentRef.setInput('config', {
        title: 'Operations',
        editable: true,
      });
      fixture.componentRef.setInput('i18n', {
        save: 'Speichern',
      });
      fixture.detectChanges();

      component.enterEditMode();
      fixture.detectChanges();

      const buttons = Array.from(
        root(fixture).querySelectorAll('.mfp-dashboard__edit-bar ui5-button'),
      ) as HTMLElement[];
      const labels = buttons.map((b) => b.textContent?.trim());
      expect(labels).toContain('Speichern');
      expect(labels).toContain('Cancel');
    });
  });

  describe('compact toolbar menu button', () => {
    const menuBtn = (fixture: Fixture) =>
      root(fixture).querySelector('[data-testid="dashboard-toolbar-menu-btn"]');

    it('does not render the menu button when compact with no editable and no custom actions', () => {
      const { fixture, component } = setup();
      fixture.componentRef.setInput('config', { title: 'T' });
      fixture.detectChanges();

      component.compactToolbar.set(true);
      fixture.detectChanges();

      expect(menuBtn(fixture)).toBeNull();
    });

    it('renders the menu button when compact and the dashboard is editable', () => {
      const { fixture, component } = setup();
      fixture.componentRef.setInput('config', { title: 'T', editable: true });
      fixture.detectChanges();

      component.compactToolbar.set(true);
      fixture.detectChanges();

      expect(menuBtn(fixture)).not.toBeNull();
    });

    it('renders the menu button when compact and custom actions are provided', () => {
      const { fixture, component } = setup();
      fixture.componentRef.setInput('config', { title: 'T' });
      fixture.componentRef.setInput('customActions', [
        { action: 'a', text: 'A' },
      ]);
      fixture.detectChanges();

      component.compactToolbar.set(true);
      fixture.detectChanges();

      expect(menuBtn(fixture)).not.toBeNull();
    });
  });

  describe('web-component first render (before inputs are assigned)', () => {
    it('renders without emitting NG0950 when config is not yet set', () => {
      const errorSpy = vi.spyOn(console, 'error');
      const { fixture, component } = setup();

      expect(() => {
        fixture.detectChanges();
      }).not.toThrow();

      const ng0950 = errorSpy.mock.calls
        .flat()
        .some((arg) => String(arg).includes('NG0950'));
      expect(ng0950).toBe(false);
      expect(component.config()).toEqual({});
    });

    it('recovers and reflects config once it is assigned', () => {
      const { fixture, component } = setup();
      fixture.detectChanges();

      fixture.componentRef.setInput('config', { editable: true });
      fixture.detectChanges();

      expect(component.config().editable).toBe(true);
    });
  });

  describe('empty state', () => {
    function emptyState(fixture: Fixture): Element | null {
      return root(fixture).querySelector(
        '[data-testid="dashboard-empty-state"]',
      );
    }

    function editButton(fixture: Fixture): Element | null {
      return root(fixture).querySelector(
        '[data-testid="dashboard-empty-state-edit-btn"]',
      );
    }

    it('renders the illustration, texts and Edit Home button when there are no sections and no cards', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('config', { editable: true });
      fixture.detectChanges();

      expect(emptyState(fixture)).not.toBeNull();
      expect(
        root(fixture).querySelector(
          '[data-testid="dashboard-empty-state-illustration"]',
        ),
      ).not.toBeNull();
      expect(emptyState(fixture)?.textContent).toContain(
        EN_DEFAULTS.emptyStateTitle,
      );
      expect(emptyState(fixture)?.textContent).toContain(
        EN_DEFAULTS.emptyStateDescription,
      );
      expect(editButton(fixture)?.textContent).toContain(
        EN_DEFAULTS.editHomeButton,
      );
    });

    it('exposes the illustration to assistive technology as a labelled image', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('config', { editable: true });
      fixture.detectChanges();

      const illustration = root(fixture).querySelector(
        '[data-testid="dashboard-empty-state-illustration"]',
      );
      expect(illustration?.getAttribute('role')).toBe('img');
      expect(illustration?.getAttribute('aria-label')).toBe(
        EN_DEFAULTS.emptyStateIllustration,
      );
    });

    it('hides the empty state as soon as a loose card exists', () => {
      const { fixture, component } = setup();

      fixture.componentRef.setInput('config', { editable: true });
      fixture.detectChanges();
      expect(emptyState(fixture)).not.toBeNull();

      component.cards.set([{ id: 'card-1', component: 'mfp-a' }]);
      fixture.detectChanges();
      expect(emptyState(fixture)).toBeNull();
    });

    it('keeps the empty state below a populated section, because section cards are not part of the loose grid', () => {
      const { fixture, component } = setup();

      fixture.componentRef.setInput('config', { editable: true });
      component.sections.set([
        { id: 'recent', title: 'Recently accessed services' },
      ]);
      component.cards.set([
        { id: 'ras-1', component: 'mfp-a', sectionId: 'recent' },
        { id: 'ras-2', component: 'mfp-b', sectionId: 'recent' },
      ]);
      fixture.detectChanges();

      expect(
        root(fixture).querySelector('[data-testid="dashboard-section-recent"]'),
      ).not.toBeNull();
      expect(emptyState(fixture)).not.toBeNull();

      // Only a card outside any section fills the grid the empty state covers.
      component.cards.update((cards) => [
        ...cards,
        { id: 'loose-1', component: 'mfp-c' },
      ]);
      fixture.detectChanges();
      expect(emptyState(fixture)).toBeNull();
    });

    it('enters edit mode and opens the Edit Cards dialog from the Edit Home button', () => {
      const { fixture, component } = setup();

      fixture.componentRef.setInput('config', { editable: true });
      fixture.detectChanges();

      editButton(fixture)?.dispatchEvent(new MouseEvent('click'));
      fixture.detectChanges();

      expect(component.editMode()).toBe(true);
      expect(component.cardDialogOpen()).toBe(true);
    });

    it('keeps the empty state but drops its Edit Home button in edit mode', () => {
      const { fixture, component } = setup();

      fixture.componentRef.setInput('config', { editable: true });
      fixture.detectChanges();

      component.enterEditMode();
      fixture.detectChanges();

      expect(emptyState(fixture)).not.toBeNull();
      expect(editButton(fixture)).toBeNull();
    });

    it('omits the Edit Home button when the dashboard is not editable', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('config', { editable: false });
      fixture.detectChanges();

      expect(emptyState(fixture)).not.toBeNull();
      expect(editButton(fixture)).toBeNull();
    });
  });

  it('has no automatically-detectable accessibility violations', async () => {
    const { fixture } = setup();
    fixture.componentRef.setInput('config', { title: 'Operations' });
    fixture.detectChanges();

    // `ui5-title` renders an `<h5>` inside its shadow DOM; axe evaluates those
    // vendored headings and reports `heading-order` for level jumps in UI5's
    // own markup, which this component does not control. Disable that rule; all
    // rules that apply to our authored markup remain enabled.
    const results = await axe(fixture.nativeElement, {
      rules: { 'heading-order': { enabled: false } },
    });

    expect(results).toHaveNoViolations();
  });
});
