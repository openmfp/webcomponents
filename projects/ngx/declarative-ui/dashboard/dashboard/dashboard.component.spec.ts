import { resetDashboardCardRegistry } from '../card/utils/dashboard-card-registry';
import { CardConfig, SectionConfig } from '../models';
import { Dashboard } from './dashboard.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';

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

describe('Dashboard', () => {
  beforeEach(async () => {
    resetDashboardCardRegistry();
    await TestBed.configureTestingModule({
      imports: [Dashboard],
    }).compileComponents();
  });

  it('creates and applies the configured background image', () => {
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

    fixture.componentRef.setInput('config', {
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
    const { component } = setup();
    const cards: CardConfig[] = [
      { id: 'card-1', component: 'mfp-a', sectionId: 'alpha' },
      { id: 'card-2', component: 'mfp-b' },
      { id: 'card-3', component: 'mfp-c' },
    ];
    const gridOptions = (
      component as unknown as { gridOptions: () => { disableDrag: boolean } }
    ).gridOptions;

    component.cards.set(cards);

    expect(component.addedCardsIds()).toEqual(
      new Set(['card-1', 'card-2', 'card-3']),
    );
    expect(component.sectionCards()('alpha')).toEqual([cards[0]]);
    expect(component.looseCards()).toEqual([cards[1], cards[2]]);
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
    (component as unknown as { gridStackItems: () => unknown }).gridStackItems =
      () => ({
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
    expect(component.cardsPosition.get('card-1')).toEqual({ x: 4, y: 2, w: 6, h: 20 });
    expect(component.cardsPosition.get('card-2')).toEqual({ x: 1, y: 3, w: 4, h: 10 });
  });

  it('emits the saved payload and persists the latest order on save', () => {
    const { component } = setup();
    const sections: SectionConfig[] = [{ id: 'alpha', title: 'Alpha' }];
    const cards: CardConfig[] = [{ id: 'card-1', component: 'mfp-a' }];
    const emitted: { sections: SectionConfig[]; cards: CardConfig[] }[] = [];

    component.sections.set(sections);
    component.cards.set(cards);
    component.editMode.set(true);
    component.saved.subscribe((value) => emitted.push(value));
    component.onGridChange({
      nodes: [{ id: 'card-1', x: 7, y: 5, w: 8, h: 30 }],
    } as never);

    component.saveEdit();

    expect(emitted).toEqual([
      {
        sections,
        cards: [{ id: 'card-1', component: 'mfp-a', x: 7, y: 5, w: 8, h: 30 }],
      },
    ]);
    expect(component.cardsPosition.get('card-1')).toEqual({ x: 7, y: 5, w: 8, h: 30 });
    expect(component.editMode()).toBe(false);
  });

  it('emits updated w and h in the saved payload when a card is resized', () => {
    const { component } = setup();
    const cards: CardConfig[] = [{ id: 'card-1', component: 'mfp-a', w: 6, h: 20 }];
    const emitted: { sections: SectionConfig[]; cards: CardConfig[] }[] = [];

    component.cards.set(cards);
    component.editMode.set(true);
    component.saved.subscribe((value) => emitted.push(value));
    component.onGridChange({
      nodes: [{ id: 'card-1', x: 0, y: 0, w: 3, h: 10 }],
    } as never);

    component.saveEdit();

    expect(emitted[0].cards[0]).toMatchObject({ id: 'card-1', w: 3, h: 10 });
    expect(component.editMode()).toBe(false);
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
    (component as unknown as { gridStackItems: () => unknown }).gridStackItems =
      () => ({
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
      (component as unknown as { gridStackItems: () => unknown }).gridStackItems =
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
      (component as unknown as { gridStackItems: () => unknown }).gridStackItems =
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
      (component as unknown as { gridStackItems: () => unknown }).gridStackItems =
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
      (component as unknown as { gridStackItems: () => unknown }).gridStackItems =
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
    const { component } = setup();

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
    const { component } = setup();

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
    component.editMode.set(true);
    component.saved.subscribe(() => false);
    component.onGridChange({
      nodes: [{ id: 'card-1', x: 1, y: 2 }],
    } as never);

    component.saveEdit();

    expect(component.cards()[0]).toMatchObject({
      maxH: 4,
      maxW: 6,
      minH: 1,
      minW: 2,
    });
  });

  it('still closes the panel when no changes are made', () => {
    const { component } = setup();

    component.cardDialogOpen.set(true);
    component.cards.set([{ id: 'card-1', component: 'mfp-a' }]);

    component.onCardsEdited({ added: [], removed: [] });

    expect(component.cards()).toEqual([{ id: 'card-1', component: 'mfp-a' }]);
    expect(component.cardDialogOpen()).toBe(false);
  });

  it('removes cards by id and closes the panel when onCardsEdited receives removed ids', () => {
    const { component } = setup();

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

      fixture.componentRef.setInput('config', { title: 'My Dashboard' });
      fixture.detectChanges();

      const titleEl = root(fixture).querySelector('ui5-title[level="H3"]');
      expect(titleEl).not.toBeNull();
      expect(titleEl?.textContent?.trim()).toBe('My Dashboard');
    });

    it('renders description inside a ui5-title with level H5', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('config', {
        title: 'T',
        description: 'Platform status',
      });
      fixture.detectChanges();

      const descEl = root(fixture).querySelector('ui5-title[level="H5"]');
      expect(descEl).not.toBeNull();
      expect(descEl?.textContent?.trim()).toBe('Platform status');
    });

    it('renders safe HTML markup in the title', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('config', { title: 'Hello <b>World</b>' });
      fixture.detectChanges();

      const span = root(fixture).querySelector('ui5-title[level="H3"] span');
      expect(span?.querySelector('b')).not.toBeNull();
      expect(span?.querySelector('b')?.textContent).toBe('World');
    });

    it('renders safe HTML markup in the description', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('config', {
        title: 'T',
        description: 'Status in <b>real time</b>.',
      });
      fixture.detectChanges();

      const span = root(fixture).querySelector('ui5-title[level="H5"] span');
      expect(span?.querySelector('b')).not.toBeNull();
      expect(span?.querySelector('b')?.textContent).toBe('real time');
    });

    it('strips dangerous script tags from the title', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('config', {
        title: 'Safe<script>alert(1)</script>',
      });
      fixture.detectChanges();

      const span = root(fixture).querySelector('ui5-title[level="H3"] span');
      expect(span?.querySelector('script')).toBeNull();
      expect(span?.textContent).toContain('Safe');
    });

    it('strips dangerous script tags from the description', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('config', {
        title: 'T',
        description: 'Info<script>alert(1)</script>',
      });
      fixture.detectChanges();

      const span = root(fixture).querySelector('ui5-title[level="H5"] span');
      expect(span?.querySelector('script')).toBeNull();
      expect(span?.textContent).toContain('Info');
    });

    it('does not render the description block when description is absent', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('config', { title: 'T' });
      fixture.detectChanges();

      expect(root(fixture).querySelector('ui5-title[level="H5"]')).toBeNull();
    });
  });

  describe('editCardsButton', () => {
    it('uses buttonsSettings.editCardsButton overrides', () => {
      const { fixture, component } = setup();

      fixture.componentRef.setInput('config', {
        title: 'T',
        buttonsSettings: {
          editCardsButton: { text: 'Add Card', design: 'Emphasized' },
        },
      });

      expect(component.editCardsButton().text).toBe('Add Card');
      expect(component.editCardsButton().design).toBe('Emphasized');
    });
  });

  describe('hasUnsavedChanges indicator', () => {
    function configureFor(component: Dashboard) {
      (
        component as unknown as { gridStackItems: () => unknown }
      ).gridStackItems = () => ({
        gridstackItems: { toArray: () => [] },
      });
    }

    it('is false when not in edit mode', () => {
      const { fixture, component } = setup();
      fixture.componentRef.setInput('config', { title: 'Operations' });
      configureFor(component);
      fixture.detectChanges();

      expect(component.hasUnsavedChanges()).toBe(false);
    });

    it('is false right after entering edit mode without any modifications', () => {
      const { fixture, component } = setup();
      fixture.componentRef.setInput('config', { title: 'Operations' });
      configureFor(component);
      fixture.detectChanges();

      component.enterEditMode();

      expect(component.editMode()).toBe(true);
      expect(component.hasUnsavedChanges()).toBe(false);
    });

    it('flips to true when sections change while in edit mode', () => {
      const { fixture, component } = setup();
      fixture.componentRef.setInput('config', { title: 'Operations' });
      component.sections.set([{ id: 'alpha', title: 'Alpha' }]);
      configureFor(component);
      fixture.detectChanges();

      component.enterEditMode();
      expect(component.hasUnsavedChanges()).toBe(false);

      component.sections.set([{ id: 'beta', title: 'Beta' }]);
      expect(component.hasUnsavedChanges()).toBe(true);
    });

    it('flips to true when cards change while in edit mode', () => {
      const { fixture, component } = setup();
      fixture.componentRef.setInput('config', { title: 'Operations' });
      component.cards.set([{ id: 'c1', component: 'mfp-a' }]);
      configureFor(component);
      fixture.detectChanges();

      component.enterEditMode();
      expect(component.hasUnsavedChanges()).toBe(false);

      component.removeCard('c1');
      expect(component.hasUnsavedChanges()).toBe(true);
    });

    it('flips to true when the gridstack reports a change while in edit mode', () => {
      const { fixture, component } = setup();
      fixture.componentRef.setInput('config', { title: 'Operations' });
      configureFor(component);
      fixture.detectChanges();

      component.enterEditMode();
      expect(component.hasUnsavedChanges()).toBe(false);

      component.onGridChange({ nodes: [{ id: 'c1', x: 1, y: 1 }] } as any);
      expect(component.hasUnsavedChanges()).toBe(true);
    });

    it('ignores grid change events fired outside edit mode', () => {
      const { fixture, component } = setup();
      fixture.componentRef.setInput('config', { title: 'Operations' });
      configureFor(component);
      fixture.detectChanges();

      component.onGridChange({ nodes: [{ id: 'c1', x: 1, y: 1 }] } as any);

      expect(component.hasUnsavedChanges()).toBe(false);
    });

    it('resets to false after saveEdit', () => {
      const { fixture, component } = setup();
      fixture.componentRef.setInput('config', { title: 'Operations' });
      configureFor(component);
      fixture.detectChanges();

      component.enterEditMode();
      component.sections.set([{ id: 'new', title: 'New' }]);
      expect(component.hasUnsavedChanges()).toBe(true);

      component.saveEdit();

      expect(component.editMode()).toBe(false);
      expect(component.hasUnsavedChanges()).toBe(false);
    });

    it('resets to false after cancelEdit', () => {
      const { fixture, component } = setup();
      fixture.componentRef.setInput('config', { title: 'Operations' });
      component.sections.set([{ id: 'alpha', title: 'Alpha' }]);
      configureFor(component);
      fixture.detectChanges();

      component.enterEditMode();
      component.sections.set([{ id: 'beta', title: 'Beta' }]);
      expect(component.hasUnsavedChanges()).toBe(true);

      component.cancelEdit();
      // cancelEdit now defers the revert behind the discard popup when there
      // are unsaved changes; confirming finishes the cancel.
      component.confirmDiscard();

      expect(component.editMode()).toBe(false);
      expect(component.hasUnsavedChanges()).toBe(false);
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
});