import { CardConfig } from '../models';
import { DashboardI18nService } from '../i18n';
import { EditCardsDialog } from './edit-cards-dialog.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';

type Fixture = ComponentFixture<EditCardsDialog>;

function setup(): { fixture: Fixture; component: EditCardsDialog } {
  const fixture = TestBed.createComponent(EditCardsDialog);
  const component = fixture.componentInstance;
  return { fixture, component };
}

function root(fixture: Fixture): ShadowRoot | HTMLElement {
  return fixture.nativeElement.shadowRoot ?? fixture.nativeElement;
}

const CARD_A: CardConfig = { id: 'card-1', component: 'mfp-a', label: 'Card A' };
const CARD_B: CardConfig = { id: 'card-2', component: 'mfp-b', label: 'Card B' };
const SECTION_CARD: CardConfig = { id: 'section-card-1', component: 'mfp-section', sectionId: 'section-1' };

describe('EditCardsDialog', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditCardsDialog],
      providers: [DashboardI18nService],
    }).compileComponents();
  });

  describe('empty state', () => {
    it('shows the no-data text when there are no available cards', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('open', true);
      fixture.componentRef.setInput('availableCards', []);
      fixture.detectChanges();

      const list = root(fixture).querySelector(
        'ui5-list',
      ) as (HTMLElement & { noDataText?: string }) | null;
      expect(list?.noDataText).toBe('No cards available.');
    });
  });

  describe('initialisation on open', () => {
    it('initialises selectedIds from addedCardsIds when the dialog opens', () => {
      const { fixture, component } = setup();

      fixture.componentRef.setInput('availableCards', [CARD_A, CARD_B]);
      fixture.componentRef.setInput('addedCardsIds', new Set(['card-1']));
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();

      expect(component.selectedIds().has('card-1')).toBe(true);
      expect(component.selectedIds().has('card-2')).toBe(false);
    });

    it('resets selectedIds to the current addedCardsIds each time the dialog opens', () => {
      const { fixture, component } = setup();

      fixture.componentRef.setInput('availableCards', [CARD_A, CARD_B]);
      fixture.componentRef.setInput('addedCardsIds', new Set(['card-1']));
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();

      component.toggle('card-2');
      expect(component.selectedIds().has('card-2')).toBe(true);

      fixture.componentRef.setInput('open', false);
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();

      expect(component.selectedIds().has('card-1')).toBe(true);
      expect(component.selectedIds().has('card-2')).toBe(false);
    });

    it('initialises to an empty set when no cards are already added', () => {
      const { fixture, component } = setup();

      fixture.componentRef.setInput('availableCards', [CARD_A, CARD_B]);
      fixture.componentRef.setInput('addedCardsIds', new Set<string>());
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();

      expect(component.selectedIds().size).toBe(0);
    });
  });

  describe('toggle()', () => {
    it('adds an id to selectedIds when it is not present', () => {
      const { component } = setup();

      component.toggle('card-1');

      expect(component.selectedIds().has('card-1')).toBe(true);
    });

    it('removes an id from selectedIds when it is already present', () => {
      const { component } = setup();

      component.toggle('card-1');
      component.toggle('card-1');

      expect(component.selectedIds().has('card-1')).toBe(false);
    });
  });

  describe('confirmSave()', () => {
    it('emits newly toggled-on cards in added and nothing in removed when no existing cards are deselected', () => {
      const { fixture, component } = setup();
      const emitted: { added: CardConfig[]; removed: string[] }[] = [];

      component.confirm.subscribe((v) => emitted.push(v));
      fixture.componentRef.setInput('availableCards', [CARD_A, CARD_B]);
      fixture.componentRef.setInput('addedCardsIds', new Set<string>());
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();

      component.toggle('card-1');
      component.confirmSave();

      expect(emitted).toHaveLength(1);
      expect(emitted[0].added).toEqual([CARD_A]);
      expect(emitted[0].removed).toEqual([]);
    });

    it('emits deselected already-added cards in removed and nothing in added when no new cards are toggled', () => {
      const { fixture, component } = setup();
      const emitted: { added: CardConfig[]; removed: string[] }[] = [];

      component.confirm.subscribe((v) => emitted.push(v));
      fixture.componentRef.setInput('availableCards', [CARD_A, CARD_B]);
      fixture.componentRef.setInput('addedCardsIds', new Set(['card-1', 'card-2']));
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();

      component.toggle('card-1');
      component.confirmSave();

      expect(emitted[0].added).toEqual([]);
      expect(emitted[0].removed).toEqual(['card-1']);
    });

    it('emits both added and removed when cards are toggled in both directions', () => {
      const { fixture, component } = setup();
      const emitted: { added: CardConfig[]; removed: string[] }[] = [];

      component.confirm.subscribe((v) => emitted.push(v));
      fixture.componentRef.setInput('availableCards', [CARD_A, CARD_B]);
      fixture.componentRef.setInput('addedCardsIds', new Set(['card-1']));
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();

      component.toggle('card-1');
      component.toggle('card-2');
      component.confirmSave();

      expect(emitted[0].added).toEqual([CARD_B]);
      expect(emitted[0].removed).toEqual(['card-1']);
    });

    it('emits empty added and removed when no changes are made', () => {
      const { fixture, component } = setup();
      const emitted: { added: CardConfig[]; removed: string[] }[] = [];

      component.confirm.subscribe((v) => emitted.push(v));
      fixture.componentRef.setInput('availableCards', [CARD_A, CARD_B]);
      fixture.componentRef.setInput('addedCardsIds', new Set(['card-1']));
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();

      component.confirmSave();

      expect(emitted[0].added).toEqual([]);
      expect(emitted[0].removed).toEqual([]);
    });

    it('does not include cards outside availableCards (e.g. section cards) in removed', () => {
      const { fixture, component } = setup();
      const emitted: { added: CardConfig[]; removed: string[] }[] = [];

      component.confirm.subscribe((v) => emitted.push(v));
      fixture.componentRef.setInput('availableCards', [CARD_A, CARD_B]);
      fixture.componentRef.setInput('addedCardsIds', new Set(['card-1', SECTION_CARD.id]));
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();

      component.toggle('card-1');
      component.confirmSave();

      expect(emitted[0].removed).toEqual(['card-1']);
      expect(emitted[0].removed).not.toContain(SECTION_CARD.id);
    });

    it('does not include already-added cards in the added list when they remain selected', () => {
      const { fixture, component } = setup();
      const emitted: { added: CardConfig[]; removed: string[] }[] = [];

      component.confirm.subscribe((v) => emitted.push(v));
      fixture.componentRef.setInput('availableCards', [CARD_A, CARD_B]);
      fixture.componentRef.setInput('addedCardsIds', new Set(['card-1']));
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();

      component.toggle('card-2');
      component.confirmSave();

      expect(emitted[0].added).toEqual([CARD_B]);
      expect(emitted[0].removed).toEqual([]);
    });
  });

  describe('cancel', () => {
    it('emits cancelled when the cancel button is clicked', () => {
      const { fixture, component } = setup();
      let emitted = 0;

      component.cancelled.subscribe(() => emitted++);
      fixture.componentRef.setInput('open', true);
      fixture.componentRef.setInput('availableCards', []);
      fixture.detectChanges();

      const buttons = root(fixture).querySelectorAll('ui5-button');
      buttons[1]?.dispatchEvent(new Event('click'));

      expect(emitted).toBe(1);
    });

    it('emits cancelled when the dialog fires ui5BeforeClose', () => {
      const { fixture, component } = setup();
      let emitted = 0;

      component.cancelled.subscribe(() => emitted++);
      fixture.componentRef.setInput('open', true);
      fixture.componentRef.setInput('availableCards', []);
      fixture.detectChanges();

      const dialog = root(fixture).querySelector('ui5-dialog');
      dialog?.dispatchEvent(new Event('ui5BeforeClose'));

      expect(emitted).toBe(1);
    });
  });

  describe('template', () => {
    it('renders one list item per available card', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('availableCards', [CARD_A, CARD_B]);
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();

      expect(root(fixture).querySelectorAll('ui5-li-custom')).toHaveLength(2);
    });

    it('renders the card label as the item text', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('availableCards', [CARD_A]);
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();

      expect(root(fixture).textContent).toContain('Card A');
    });

    it('falls back to component name when label is absent', () => {
      const { fixture } = setup();
      const card: CardConfig = { id: 'c1', component: 'mfp-fallback' };

      fixture.componentRef.setInput('availableCards', [card]);
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();

      expect(root(fixture).textContent).toContain('mfp-fallback');
    });

    it('shows the Save and Cancel buttons', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('availableCards', []);
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();

      const buttons = root(fixture).querySelectorAll('ui5-button');
      expect(buttons).toHaveLength(2);
      expect(buttons[0].textContent?.trim()).toBe('Save');
      expect(buttons[1].textContent?.trim()).toBe('Cancel');
    });
  });

  describe('keyboard tab traversal', () => {
    function tabEvent(target: HTMLElement, shiftKey = false): KeyboardEvent {
      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey,
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(event, 'currentTarget', { value: target });
      return event;
    }

    it('moves focus from one switch to the next on Tab', () => {
      const { fixture, component } = setup();

      fixture.componentRef.setInput('availableCards', [CARD_A, CARD_B]);
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();

      const switches =
        root(fixture).querySelectorAll<HTMLElement>('ui5-switch');
      const focusSpy = vi.spyOn(switches[1], 'focus');

      const event = tabEvent(switches[0]);
      component.onSwitchKeydown(event, CARD_A.id);

      expect(event.defaultPrevented).toBe(true);
      expect(focusSpy).toHaveBeenCalled();
    });

    it('hands focus from the last switch to the first footer button on Tab', () => {
      const { fixture, component } = setup();

      fixture.componentRef.setInput('availableCards', [CARD_A, CARD_B]);
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();

      const switches =
        root(fixture).querySelectorAll<HTMLElement>('ui5-switch');
      const buttons = root(fixture).querySelectorAll<HTMLElement>('ui5-button');
      const focusSpy = vi.spyOn(buttons[0], 'focus');

      const event = tabEvent(switches[1]);
      component.onSwitchKeydown(event, CARD_B.id);

      expect(event.defaultPrevented).toBe(true);
      expect(focusSpy).toHaveBeenCalled();
    });

    it('moves focus to the previous switch on Shift+Tab', () => {
      const { fixture, component } = setup();

      fixture.componentRef.setInput('availableCards', [CARD_A, CARD_B]);
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();

      const switches =
        root(fixture).querySelectorAll<HTMLElement>('ui5-switch');
      const focusSpy = vi.spyOn(switches[0], 'focus');

      const event = tabEvent(switches[1], true);
      component.onSwitchKeydown(event, CARD_B.id);

      expect(event.defaultPrevented).toBe(true);
      expect(focusSpy).toHaveBeenCalled();
    });

    it('lets Shift+Tab fall through on the first switch so the dialog focus trap can wrap', () => {
      const { fixture, component } = setup();

      fixture.componentRef.setInput('availableCards', [CARD_A, CARD_B]);
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();

      const switches =
        root(fixture).querySelectorAll<HTMLElement>('ui5-switch');

      const event = tabEvent(switches[0], true);
      component.onSwitchKeydown(event, CARD_A.id);

      expect(event.defaultPrevented).toBe(false);
    });
  });
});
