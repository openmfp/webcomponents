import { CardConfig, SectionConfig } from '../models';
import { Dashboard } from './dashboard.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';

vi.mock('gridstack', () => ({}));

vi.mock('gridstack/dist/angular', async () => {
  const { Component, EventEmitter, Input, Output } =
    await import('@angular/core');

  @Component({
    selector: 'gridstack',
    standalone: true,
    template: '<ng-content />',
  })
  class GridstackComponent {
    @Input() options?: unknown;
    @Output() changeCB = new EventEmitter<unknown>();

    gridstackItems = {
      toArray: () => [],
    };
  }

  @Component({
    selector: 'gridstack-item',
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
      root(fixture).querySelector('.dashboard__toolbar ui5-button'),
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
      '.dashboard__toolbar ui5-button',
    );

    editButton?.dispatchEvent(new Event('click'));
    fixture.detectChanges();

    const addCardButton = root(fixture).querySelector('#add-card-btn');

    expect(component.editMode()).toBe(true);
    expect(addCardButton).not.toBeNull();
    expect(
      root(fixture).querySelectorAll('.dashboard__edit-bar ui5-button'),
    ).toHaveLength(2);

    addCardButton?.dispatchEvent(new Event('click'));
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

    expect(component.addedComponents()).toEqual(
      new Set(['mfp-a', 'mfp-b', 'mfp-c']),
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
            { options: { id: 'card-1', x: 4, y: 2 } },
            { options: { id: 'card-2', x: 1, y: 3 } },
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
    expect(component.cardsPosition.get('card-1')).toEqual({ x: 4, y: 2 });
    expect(component.cardsPosition.get('card-2')).toEqual({ x: 1, y: 3 });
  });

  it('emits the saved payload and persists the latest order on save', () => {
    const { component } = setup();
    const sections: SectionConfig[] = [{ id: 'alpha', title: 'Alpha' }];
    const cards: CardConfig[] = [{ id: 'card-1', component: 'mfp-a' }];
    const emitted: Array<{ sections: SectionConfig[]; cards: CardConfig[] }> =
      [];

    component.sections.set(sections);
    component.cards.set(cards);
    component.editMode.set(true);
    component.saved.subscribe((value) => emitted.push(value));
    component.onOrderChange({
      nodes: [{ id: 'card-1', x: 7, y: 5 }],
    } as never);

    component.saveEdit();

    expect(emitted).toEqual([
      {
        sections,
        cards: [{ id: 'card-1', component: 'mfp-a', x: 7, y: 5 }],
      },
    ]);
    expect(component.cardsPosition.get('card-1')).toEqual({ x: 7, y: 5 });
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

    expect(component.sections()).toEqual(sections);
    expect(component.cards()).toEqual([
      { id: 'card-1', component: 'mfp-a', x: 3, y: 6 },
      { id: 'card-2', component: 'mfp-b', sectionId: 'alpha', x: 8, y: 1 },
    ]);
    expect(component.cardDialogOpen()).toBe(false);
    expect(component.editMode()).toBe(false);
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

  it('adds new cards with generated ids and closes the panel', () => {
    const { component } = setup();

    vi.spyOn(Date, 'now').mockReturnValue(1700);
    component.cards.set([{ id: 'card-1', component: 'mfp-a' }]);
    component.cardDialogOpen.set(true);

    component.onCardsAdded([
      {
        id: 'template-card',
        component: 'mfp-b',
        label: 'Table',
        componentInputs: { size: 'L' },
      },
    ]);

    expect(component.cards()).toEqual([
      { id: 'card-1', component: 'mfp-a' },
      {
        id: 'card-mfp-b-1700',
        component: 'mfp-b',
        label: 'Table',
        componentInputs: { size: 'L' },
      },
    ]);
    expect(component.cardDialogOpen()).toBe(false);
  });

  it('still closes the add-card dialog when no cards were selected', () => {
    const { component } = setup();

    component.cardDialogOpen.set(true);
    component.cards.set([{ id: 'card-1', component: 'mfp-a' }]);

    component.onCardsAdded([]);

    expect(component.cards()).toEqual([{ id: 'card-1', component: 'mfp-a' }]);
    expect(component.cardDialogOpen()).toBe(false);
  });
});
