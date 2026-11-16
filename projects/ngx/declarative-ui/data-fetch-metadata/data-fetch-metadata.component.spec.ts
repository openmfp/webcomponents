import { DataFetchMetadata } from './data-fetch-metadata.component';
import { NgZone } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import * as ui5Language from '@ui5/webcomponents-base/dist/config/Language.js';
import type IconElement from '@ui5/webcomponents/dist/Icon.js';

vi.mock('@ui5/webcomponents-base/dist/config/Language.js', { spy: true });

describe('DataFetchMetadata', () => {
  let fixture: ComponentFixture<DataFetchMetadata>;

  function element(testId: 'last-updated' | 'status'): HTMLElement | null {
    const host: HTMLElement = fixture.nativeElement;
    return host.querySelector(`[data-testid="data-fetch-metadata-${testId}"]`);
  }

  beforeEach(() => {
    fixture = TestBed.createComponent(DataFetchMetadata);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
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

    expect(element('last-updated')?.textContent?.trim()).toBe(
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

    expect(element('last-updated')).toBeNull();
    expect(element('status')).toBeNull();
    expect(fixture.nativeElement.hidden).toBe(true);
  });

  it('refreshes relative time without restarting its clock or rebuilding the formatter', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    vi.setSystemTime(new Date('2026-11-13T13:29:00Z'));
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');
    const zone = fixture.debugElement.injector.get(NgZone);
    const runOutsideAngular = vi.spyOn(zone, 'runOutsideAngular');
    const getLanguage = vi
      .spyOn(ui5Language, 'getLanguage')
      .mockReturnValue('de');
    const RelativeTimeFormat = Intl.RelativeTimeFormat;
    const createFormatter = vi
      .spyOn(Intl, 'RelativeTimeFormat')
      .mockImplementation(function (...args) {
        return new RelativeTimeFormat(...args);
      });
    const minuteTimers = () =>
      setIntervalSpy.mock.results.filter(
        (_, index) => setIntervalSpy.mock.calls[index][1] === 60_000,
      );
    const setTimestamp = (at: string) => {
      fixture.componentRef.setInput('snapshot', {
        rows: [],
        response: { updates: [{ at }] },
      });
      fixture.detectChanges();
    };
    const relative = {
      label: 'Updated:',
      path: '$.updates[0].at',
      locale: 'invalid_locale',
    };
    fixture.componentRef.setInput('lastUpdated', relative);
    setTimestamp('bad date');
    expect(minuteTimers()).toHaveLength(0);

    setTimestamp('2026-11-13T13:28:30Z');
    expect(element('last-updated')?.textContent?.trim()).toBe('Updated: jetzt');
    expect(minuteTimers()).toHaveLength(1);
    const timer = minuteTimers()[0].value;
    expect(runOutsideAngular.mock.results.map(({ value }) => value)).toContain(
      timer,
    );
    expect(createFormatter).toHaveBeenCalledExactlyOnceWith('de', {
      numeric: 'auto',
    });

    vi.advanceTimersByTime(30_000);
    setTimestamp('2026-11-13T13:28:40Z');
    vi.advanceTimersByTime(30_000);
    fixture.detectChanges();
    expect(element('last-updated')?.textContent?.trim()).toBe(
      'Updated: vor 1 Minute',
    );
    expect(minuteTimers()).toHaveLength(1);
    expect(createFormatter).toHaveBeenCalledTimes(1);

    getLanguage.mockReturnValue('en');
    vi.advanceTimersByTime(60_000);
    fixture.detectChanges();
    expect(element('last-updated')?.textContent?.trim()).toBe(
      'Updated: 2 minutes ago',
    );

    fixture.componentRef.setInput('lastUpdated', {
      label: 'Updated:',
      text: 'yesterday',
    });
    fixture.detectChanges();
    expect(element('last-updated')?.textContent?.trim()).toBe(
      'Updated: yesterday',
    );
    expect(clearIntervalSpy).toHaveBeenCalledWith(timer);

    fixture.componentRef.setInput('lastUpdated', relative);
    fixture.detectChanges();
    expect(minuteTimers()).toHaveLength(2);
    const activeTimer = minuteTimers()[1].value;

    fixture.destroy();
    expect(clearIntervalSpy).toHaveBeenLastCalledWith(activeTimer);
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

      expect(element('last-updated')).toBeNull();
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
