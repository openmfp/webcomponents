import { UnsavedChangesDialog } from './unsaved-changes-dialog.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';

type Fixture = ComponentFixture<UnsavedChangesDialog>;

function setup(): { fixture: Fixture; component: UnsavedChangesDialog } {
  const fixture = TestBed.createComponent(UnsavedChangesDialog);
  const component = fixture.componentInstance;
  return { fixture, component };
}

function root(fixture: Fixture): ShadowRoot | HTMLElement {
  return fixture.nativeElement.shadowRoot ?? fixture.nativeElement;
}

describe('UnsavedChangesDialog', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnsavedChangesDialog],
    }).compileComponents();
  });

  describe('template', () => {
    it('renders the title, body and three buttons in the right order', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();

      const r = root(fixture);
      expect(r.querySelector('ui5-icon')).toBeNull();
      expect(r.querySelector('ui5-dialog')?.getAttribute('state')).toBe('Critical');
      expect(r.querySelector('ui5-title')?.textContent?.trim()).toBe(
        'Unsaved Changes',
      );
      expect(r.textContent).toContain(
        'You are leaving this page. Save or discard the changes to proceed.',
      );

      const buttons = r.querySelectorAll('ui5-button');
      expect(buttons).toHaveLength(3);
      expect(buttons[0].textContent?.trim()).toBe('Save');
      expect(buttons[1].textContent?.trim()).toBe('Discard');
      expect(buttons[2].textContent?.trim()).toBe('Cancel');
    });

    it('reflects the open input on the underlying ui5-dialog', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();

      const dialog = root(fixture).querySelector<
        HTMLElement & { open?: boolean }
      >('ui5-dialog');
      expect(dialog?.open).toBe(true);
    });
  });

  describe('events', () => {
    it('emits save when the Save button is clicked', () => {
      const { fixture, component } = setup();
      let emitted = 0;

      component.save.subscribe(() => emitted++);
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();

      root(fixture)
        .querySelectorAll('ui5-button')[0]
        ?.dispatchEvent(new Event('click'));

      expect(emitted).toBe(1);
    });

    it('emits discard when the Discard button is clicked', () => {
      const { fixture, component } = setup();
      let emitted = 0;

      component.discard.subscribe(() => emitted++);
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();

      root(fixture)
        .querySelectorAll('ui5-button')[1]
        ?.dispatchEvent(new Event('click'));

      expect(emitted).toBe(1);
    });

    it('emits cancelled when the Cancel button is clicked', () => {
      const { fixture, component } = setup();
      let emitted = 0;

      component.cancelled.subscribe(() => emitted++);
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();

      root(fixture)
        .querySelectorAll('ui5-button')[2]
        ?.dispatchEvent(new Event('click'));

      expect(emitted).toBe(1);
    });

    it('emits cancelled when the dialog fires ui5BeforeClose', () => {
      const { fixture, component } = setup();
      let emitted = 0;

      component.cancelled.subscribe(() => emitted++);
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();

      const dialog = root(fixture).querySelector('ui5-dialog');
      dialog?.dispatchEvent(new Event('ui5BeforeClose'));

      expect(emitted).toBe(1);
    });
  });
});
