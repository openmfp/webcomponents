import { DataFetchMetadata } from './data-fetch-metadata.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import * as ui5Language from '@ui5/webcomponents-base/dist/config/Language.js';
import type IconElement from '@ui5/webcomponents/dist/Icon.js';

vi.mock('@ui5/webcomponents-base/dist/config/Language.js', { spy: true });

describe('DataFetchMetadata', () => {
  let fixture: ComponentFixture<DataFetchMetadata>;

  function element(testId: 'subtitle' | 'status'): HTMLElement | null {
    const host: HTMLElement = fixture.nativeElement;
    return host.querySelector(`[data-testid="card-template-${testId}"]`);
  }

  beforeEach(() => {
    fixture = TestBed.createComponent(DataFetchMetadata);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders literal metadata and a decorative state icon without a snapshot', () => {
    fixture.componentRef.setInput('lastUpdated', {
      label: '  Last updated:  ',
      text: '  30 minutes ago  ',
    });
    fixture.componentRef.setInput('status', {
      text: 'Up to date',
      state: 'Positive',
    });
    fixture.detectChanges();

    expect(element('subtitle')?.textContent?.trim()).toBe(
      'Last updated: 30 minutes ago',
    );
    const status = element('status');
    expect(status?.textContent?.trim()).toBe('Up to date');
    expect(status?.getAttribute('data-state')).toBe('Positive');
    const icon = status?.querySelector<IconElement>('ui5-icon');
    expect(icon?.name).toBe('status-positive');
    expect(icon?.getAttribute('aria-hidden')).toBe('true');

    fixture.componentRef.setInput('lastUpdated', {
      label: 'Last updated:',
      text: ' ',
    });
    fixture.componentRef.setInput('status', { text: '', state: 'Positive' });
    fixture.detectChanges();

    expect(element('subtitle')).toBeNull();
    expect(element('status')).toBeNull();
    expect(fixture.nativeElement.hidden).toBe(true);
  });

  it('uses the UI5 locale when the configured locale is invalid and formats recent values as now', () => {
    vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-11-13T13:29:00Z'));
    vi.spyOn(ui5Language, 'getLanguage').mockReturnValue('de');
    fixture.componentRef.setInput('lastUpdated', {
      label: 'Aktualisiert:',
      path: '$.updates[0].at',
      locale: 'invalid_locale',
    });
    fixture.componentRef.setInput('snapshot', {
      rows: [],
      response: { updates: [{ at: '2026-11-13T13:28:30Z' }] },
    });
    fixture.detectChanges();

    expect(element('subtitle')?.textContent?.trim()).toBe(
      'Aktualisiert: jetzt',
    );
  });

  it.each(['updates[0].at', 'updates[?(@.at)].at'])(
    'omits an unresolvable date at %s while displaying scalar status values',
    (path) => {
      fixture.componentRef.setInput('lastUpdated', { label: 'Updated:', path });
      fixture.componentRef.setInput('status', {
        text: '{{ response.count }} remaining ({{response.active}})',
        state: 'Information',
      });
      fixture.componentRef.setInput('snapshot', {
        rows: [],
        response: {
          updates: [{ at: 'bad date' }, { at: '2026-11-13T13:00:00Z' }],
          count: 0,
          active: false,
        },
      });
      fixture.detectChanges();

      expect(element('subtitle')).toBeNull();
      expect(element('status')?.textContent?.trim()).toBe(
        '0 remaining (false)',
      );
    },
  );

  it.each(['missing', 'updates[0]', 'updates[?(@.at)].at'])(
    'omits status with an unresolved or non-scalar response token at %s',
    (path) => {
      fixture.componentRef.setInput('status', {
        text: `State {{response.${path}}}`,
        state: 'Neutral',
      });
      fixture.componentRef.setInput('snapshot', {
        rows: [],
        response: { updates: [{ at: '2026-11-13T13:00:00Z' }] },
      });
      fixture.detectChanges();

      expect(element('status')).toBeNull();
    },
  );
});
