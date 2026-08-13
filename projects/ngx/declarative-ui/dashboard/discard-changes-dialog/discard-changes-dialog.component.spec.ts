import { DashboardI18nService } from '../i18n';
import { DiscardChangesDialog } from './discard-changes-dialog.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';

type Fixture = ComponentFixture<DiscardChangesDialog>;

function setup(): { fixture: Fixture; component: DiscardChangesDialog } {
  const fixture = TestBed.createComponent(DiscardChangesDialog);
  const component = fixture.componentInstance;
  return { fixture, component };
}

function root(fixture: Fixture): ShadowRoot | HTMLElement {
  return fixture.nativeElement.shadowRoot ?? fixture.nativeElement;
}

describe('DiscardChangesDialog', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiscardChangesDialog],
      providers: [DashboardI18nService],
    }).compileComponents();
  });

  describe('template', () => {
    it('renders the title, body and both buttons', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();

      const r = root(fixture);
      expect(r.querySelector('ui5-icon')).toBeNull();
      expect(r.querySelector('ui5-dialog')?.getAttribute('state')).toBe(
        'Critical',
      );
      expect(r.querySelector('ui5-title')?.textContent?.trim()).toBe(
        'Discard Changes',
      );
      expect(r.textContent).toContain(
        'Discard the changes? This action cannot be undone.',
      );

      const buttons = r.querySelectorAll('ui5-button');
      expect(buttons).toHaveLength(2);
      expect(buttons[0].textContent?.trim()).toBe('Discard');
      expect(buttons[1].textContent?.trim()).toBe('Cancel');
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
    it('emits confirm when the Discard button is clicked', () => {
      const { fixture, component } = setup();
      let confirmed = 0;

      component.confirm.subscribe(() => confirmed++);
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();

      const buttons = root(fixture).querySelectorAll('ui5-button');
      buttons[0]?.dispatchEvent(new Event('click'));

      expect(confirmed).toBe(1);
    });

    it('emits cancelled when the Cancel button is clicked', () => {
      const { fixture, component } = setup();
      let cancelled = 0;

      component.cancelled.subscribe(() => cancelled++);
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();

      const buttons = root(fixture).querySelectorAll('ui5-button');
      buttons[1]?.dispatchEvent(new Event('click'));

      expect(cancelled).toBe(1);
    });

    it('emits cancelled when the dialog fires ui5BeforeClose', () => {
      const { fixture, component } = setup();
      let cancelled = 0;

      component.cancelled.subscribe(() => cancelled++);
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();

      const dialog = root(fixture).querySelector('ui5-dialog');
      dialog?.dispatchEvent(new Event('ui5BeforeClose'));

      expect(cancelled).toBe(1);
    });
  });
});
