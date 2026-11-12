import { ErrorView } from './error-view.component';
import { ErrorViewButton, ErrorViewConfig } from './error-view.model';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import '@ui5/webcomponents-fiori/dist/illustrations/NoEntries.js';
import { axe } from 'vitest-axe';

interface RouteButton extends ErrorViewButton {
  route: string;
}

@Component({
  selector: 'mfp-error-view-projection-host',
  imports: [ErrorView],
  template: `
    <mfp-error-view [config]="config">
      <span data-testid="projected">Select a namespace</span>
    </mfp-error-view>
  `,
})
class ProjectionHost {
  config: ErrorViewConfig = {
    illustration: 'NoEntries',
    buttons: [{ key: 'retry', label: 'Retry' }],
  };
}

describe('ErrorView', () => {
  let fixture: ComponentFixture<ErrorView<RouteButton>>;
  let component: ErrorView<RouteButton>;

  const retry: RouteButton = { key: 'retry', label: 'Retry', route: '/retry' };
  const home: RouteButton = {
    key: 'home',
    label: 'Go home',
    design: 'Emphasized',
    icon: 'home',
    disabled: true,
    route: '/home',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorView, ProjectionHost],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorView<RouteButton>);
    component = fixture.componentInstance;
  });

  function root(): ShadowRoot | HTMLElement {
    return (fixture.nativeElement.shadowRoot ?? fixture.nativeElement) as
      ShadowRoot | HTMLElement;
  }

  function byTestId<E extends HTMLElement>(testId: string): E | null {
    return root().querySelector<E>(`[data-testid="${testId}"]`);
  }

  function render(config: ErrorViewConfig<RouteButton>): void {
    fixture.componentRef.setInput('config', config);
    fixture.detectChanges();
  }

  it('renders nothing until a config is set', () => {
    fixture.detectChanges();

    expect(byTestId('error-view')).toBeNull();
  });

  it('passes the illustration name to the illustrated message', () => {
    render({ illustration: 'NoEntries' });

    expect(
      byTestId<HTMLElement & { name: string }>('error-view-illustration')?.name,
    ).toBe('NoEntries');
  });

  it('announces the illustrated message as a status', () => {
    render({ illustration: 'NoEntries' });

    expect(byTestId('error-view-illustration')?.getAttribute('role')).toBe(
      'status',
    );
  });

  it('renders the title and the subtitle', () => {
    render({
      illustration: 'NoEntries',
      title: 'Content not found',
      subtitle: 'The page you are looking for does not exist.',
    });

    expect(byTestId('error-view-title')?.textContent?.trim()).toBe(
      'Content not found',
    );
    expect(byTestId('error-view-subtitle')?.textContent?.trim()).toBe(
      'The page you are looking for does not exist.',
    );
  });

  it('renders empty texts and no button when only the illustration is set', () => {
    render({ illustration: 'NoEntries' });

    expect(byTestId('error-view-title')?.textContent?.trim()).toBe('');
    expect(byTestId('error-view-subtitle')?.textContent?.trim()).toBe('');
    expect(root().querySelectorAll('ui5-button')).toHaveLength(0);
  });

  it('updates when the config is replaced', () => {
    render({ illustration: 'NoEntries', buttons: [retry] });
    render({
      illustration: 'NoEntries',
      title: 'Still not found',
      buttons: [{ ...retry, disabled: true }],
    });

    expect(byTestId('error-view-title')?.textContent?.trim()).toBe(
      'Still not found',
    );
    expect(
      byTestId<HTMLElement & { disabled: boolean }>('error-view-button-retry')
        ?.disabled,
    ).toBe(true);
  });

  it('renders one button per configured button', () => {
    type ButtonElement = HTMLElement & {
      design: string;
      icon?: string;
      disabled: boolean;
    };
    render({ illustration: 'NoEntries', buttons: [retry, home] });

    const first = byTestId<ButtonElement>('error-view-button-retry');
    const second = byTestId<ButtonElement>('error-view-button-home');

    expect(first?.textContent?.trim()).toBe('Retry');
    expect(first?.design).toBe('Transparent');
    expect(first?.disabled).toBe(false);
    expect(second?.textContent?.trim()).toBe('Go home');
    expect(second?.design).toBe('Emphasized');
    expect(second?.icon).toBe('home');
    expect(second?.disabled).toBe(true);
  });

  it('emits the clicked button', () => {
    const emitted: RouteButton[] = [];
    component.buttonClick.subscribe((button) => emitted.push(button));
    render({ illustration: 'NoEntries', buttons: [retry, home] });

    byTestId('error-view-button-retry')?.dispatchEvent(new Event('click'));

    expect(emitted).toEqual([retry]);
    expect(emitted[0]).toBe(retry);
  });

  it('shows slotted content above the buttons', () => {
    const host = TestBed.createComponent(ProjectionHost);
    host.detectChanges();
    const errorView = host.nativeElement.querySelector(
      'mfp-error-view',
    ) as HTMLElement;
    const slot = errorView.shadowRoot?.querySelector('.error-view-actions')
      ?.firstElementChild as HTMLSlotElement;

    expect(slot.localName).toBe('slot');
    expect(
      slot.assignedElements().map((el) => el.getAttribute('data-testid')),
    ).toEqual(['projected']);
    expect(slot.nextElementSibling?.className).toBe('error-view-buttons');
  });

  it('shows content that is added after the first render', () => {
    const host = TestBed.createComponent(ProjectionHost);
    host.detectChanges();
    const errorView = host.nativeElement.querySelector(
      'mfp-error-view',
    ) as HTMLElement;
    const late = document.createElement('span');
    late.setAttribute('data-testid', 'late');

    errorView.appendChild(late);

    expect(
      errorView.shadowRoot
        ?.querySelector('slot')
        ?.assignedElements()
        .map((el) => el.getAttribute('data-testid')),
    ).toEqual(['projected', 'late']);
  });

  it('does not emit for a disabled button', () => {
    const emitted: RouteButton[] = [];
    component.buttonClick.subscribe((button) => emitted.push(button));
    render({ illustration: 'NoEntries', buttons: [home] });

    byTestId('error-view-button-home')?.dispatchEvent(new Event('click'));
    byTestId('error-view-button-home')?.click();

    expect(emitted).toEqual([]);
  });

  it('has no automatically-detectable accessibility violations', async () => {
    render({
      illustration: 'NoEntries',
      title: 'Content not found',
      subtitle: 'The page you are looking for does not exist.',
      buttons: [retry],
    });

    const results = await axe(fixture.nativeElement);

    expect(results).toHaveNoViolations();
  });
});
