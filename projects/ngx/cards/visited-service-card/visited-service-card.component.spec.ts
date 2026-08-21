import { VisitedServiceCard } from './visited-service-card.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe } from 'vitest-axe';

describe('VisitedServiceCard', () => {
  let fixture: ComponentFixture<VisitedServiceCard>;
  let component: VisitedServiceCard;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitedServiceCard],
    }).compileComponents();

    fixture = TestBed.createComponent(VisitedServiceCard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('serviceType', 'SAP HANA Cloud');
    fixture.componentRef.setInput('serviceName', 'orders-db');
    fixture.componentRef.setInput('serviceDescription', 'Production / europe');
    fixture.componentRef.setInput('serviceIcon', 'database');
    fixture.componentRef.setInput('path', '/hana/orders-db');
    fixture.detectChanges();
  });

  function wrapper(): HTMLElement {
    const rootEl = (fixture.nativeElement.shadowRoot ??
      fixture.nativeElement) as ShadowRoot | HTMLElement;
    return rootEl.querySelector('.visited-card-wrapper') as HTMLElement;
  }

  it('exposes the card as a focusable button', () => {
    const el = wrapper();

    expect(el.getAttribute('role')).toBe('button');
    expect(el.getAttribute('tabindex')).toBe('0');
  });

  it('emits cardClick on Enter', () => {
    const emitted: string[] = [];
    component.cardClick.subscribe((p) => emitted.push(p));

    wrapper().dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );

    expect(emitted).toEqual(['/hana/orders-db']);
  });

  it('emits cardClick on Space', () => {
    const emitted: string[] = [];
    component.cardClick.subscribe((p) => emitted.push(p));

    wrapper().dispatchEvent(
      new KeyboardEvent('keydown', { key: ' ', bubbles: true }),
    );

    expect(emitted).toEqual(['/hana/orders-db']);
  });

  it('emits cardClick on click', () => {
    const emitted: string[] = [];
    component.cardClick.subscribe((p) => emitted.push(p));

    wrapper().dispatchEvent(new Event('click'));

    expect(emitted).toEqual(['/hana/orders-db']);
  });

  it('has no automatically-detectable accessibility violations', async () => {
    // axe-core traverses into the vendored `ui5-card` / `ui5-card-header`
    // shadow DOM and flags UI5's own internal markup (e.g. an avatar wrapper
    // with `aria-label` but no role — `aria-prohibited-attr`). Those elements
    // are owned by the UI5 library, not this component, so the rule that only
    // trips on them is disabled. The rules that apply to our own markup — the
    // `role="button"` wrapper, focus order, name — remain enabled.
    const results = await axe(fixture.nativeElement, {
      rules: { 'aria-prohibited-attr': { enabled: false } },
    });

    expect(results).toHaveNoViolations();
  });
});
