import { CardConfig } from '../models';
import { AddCardDialog } from './add-card-dialog.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';

type Fixture = ComponentFixture<AddCardDialog>;

function setup(): { fixture: Fixture; component: AddCardDialog } {
  const fixture = TestBed.createComponent(AddCardDialog);
  const component = fixture.componentInstance;
  return { fixture, component };
}

function root(fixture: Fixture): ShadowRoot | HTMLElement {
  return fixture.nativeElement.shadowRoot ?? fixture.nativeElement;
}

describe('AddCardDialog', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddCardDialog],
    }).compileComponents();
  });

  it('renders the empty state when there are no available cards', () => {
    const { fixture } = setup();

    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('availableCards', []);
    fixture.detectChanges();

    expect(root(fixture).textContent).toContain('No cards available.');
  });

  it('resets selected cards whenever the dialog is opened', () => {
    const { fixture, component } = setup();

    fixture.componentRef.setInput('availableCards', [
      { id: 'card-1', component: 'mfp-a' },
    ]);
    fixture.detectChanges();

    component.toggle('card-1');
    expect(component.selectedIds().has('card-1')).toBe(true);

    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    expect(component.selectedIds().size).toBe(0);
  });

  it('emits only selected cards that have not already been added', () => {
    const { fixture, component } = setup();
    const availableCards: CardConfig[] = [
      { id: 'card-1', component: 'mfp-a', label: 'Card A' },
      { id: 'card-2', component: 'mfp-b', label: 'Card B' },
    ];
    const emitted: CardConfig[][] = [];

    component.confirm.subscribe((cards) => emitted.push(cards));
    fixture.componentRef.setInput('availableCards', availableCards);
    fixture.componentRef.setInput('addedCardsIds', new Set(['card-2']));
    fixture.detectChanges();

    component.toggle('card-1');
    component.toggle('card-2');
    component.confirmAdd();

    expect(emitted).toEqual([[availableCards[0]]]);
  });

  it('emits cancel when the cancel button is clicked', () => {
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
});
