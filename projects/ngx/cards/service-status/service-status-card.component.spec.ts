import { ServiceStatusCard } from './service-status-card.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { getIconDataSync } from '@ui5/webcomponents-base/dist/asset-registries/Icons.js';
import type IconElement from '@ui5/webcomponents/dist/Icon.js';
import { axe } from 'vitest-axe';

describe('ServiceStatusCard', () => {
  let fixture: ComponentFixture<ServiceStatusCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceStatusCard],
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceStatusCard);
    fixture.detectChanges();
  });

  it('renders registered icons for all service states', () => {
    const host: HTMLElement = fixture.nativeElement;
    const icons =
      host.shadowRoot?.querySelectorAll<IconElement>(
        '.service-status__status-icon',
      ) ?? [];
    const names = new Set(Array.from(icons, (icon) => icon.name));
    expect(names).toEqual(
      new Set([
        'status-positive',
        'status-critical',
        'status-inactive',
        'status-negative',
      ]),
    );
    for (const name of names) {
      expect(getIconDataSync(name ?? '')).toBeDefined();
    }
  });

  it('has no automatically-detectable accessibility violations', async () => {
    expect(await axe(fixture.nativeElement)).toHaveNoViolations();
  });
});
