import type { JsonValue } from '../../services/data-fetch.model';
import { DataFetchList } from './data-fetch-list.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';

const request = { url: 'https://example.test/subaccounts' };

function shadowRoot(fixture: ComponentFixture<DataFetchList>): ShadowRoot {
  const host: HTMLElement = fixture.nativeElement;
  if (!host.shadowRoot) throw new Error('The list has no shadow root.');
  return host.shadowRoot;
}

function rowFields(root: ShadowRoot) {
  return [...root.querySelectorAll('ul > li > mfp-resource-field')];
}

function stateElement<T extends HTMLElement = HTMLElement>(
  root: ShadowRoot,
  part: string,
): T | null | undefined {
  return root
    .querySelector('mfp-error-view')
    ?.shadowRoot?.querySelector<T>(`[data-testid="error-view-${part}"]`);
}

function deferred<T>() {
  let resolve: (value: T) => void = () => {
    throw new Error('Deferred promise was not initialized.');
  };
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

describe('DataFetchList', () => {
  const fetch = vi.fn<typeof globalThis.fetch>();
  let fixture: ComponentFixture<DataFetchList>;

  beforeEach(() => {
    fetch.mockReset();
    vi.stubGlobal('fetch', fetch);
    fixture = TestBed.createComponent(DataFetchList);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renders full rows as ordered links and updates their presentation without fetching again', async () => {
    const rows = [
      { id: 'b', name: 'Subaccount B' },
      { id: 'a', name: 'Subaccount A' },
    ];
    const beforeRequest = vi.fn<(request: Request) => void>();
    fetch.mockResolvedValueOnce(
      Response.json({ result: { subaccounts: rows } }),
    );
    fixture.componentRef.setInput('beforeRequest', beforeRequest);
    fixture.componentRef.setInput('data', {
      request,
      path: 'result.subaccounts',
    });
    fixture.componentRef.setInput(
      'description',
      '  Review <b>affected</b> subaccounts.  ',
    );
    fixture.componentRef.setInput('fieldDefinition', {
      property: 'name',
      uiSettings: {
        displayAs: 'link',
        linkSettings: {
          link: 'https://example.test/subaccounts/{{id}}/details',
        },
      },
    });

    await fixture.whenStable();
    const root = shadowRoot(fixture);
    await vi.waitFor(() => {
      expect(rowFields(root)).toHaveLength(2);
    });
    const description = root.querySelector('p');
    expect(description?.textContent).toBe(
      'Review <b>affected</b> subaccounts.',
    );
    expect(description?.querySelector('b')).toBeNull();
    expect(description?.compareDocumentPosition(rowFields(root)[0])).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );

    const links = rowFields(root).map((field) =>
      field.shadowRoot?.querySelector('ui5-link'),
    );
    expect(links.map((link) => link?.textContent?.trim())).toEqual([
      'Subaccount B',
      'Subaccount A',
    ]);
    expect(links.map((link) => link?.getAttribute('href'))).toEqual([
      'https://example.test/subaccounts/b/details',
      'https://example.test/subaccounts/a/details',
    ]);

    fixture.componentRef.setInput('description', '   ');
    fixture.componentRef.setInput('fieldDefinition', { property: 'name' });
    await fixture.whenStable();

    expect(root.querySelector('p')).toBeNull();
    expect(
      rowFields(root).map((field) =>
        field.shadowRoot
          ?.querySelector('[data-testid="resource-field-name"]')
          ?.textContent?.trim(),
      ),
    ).toEqual(['Subaccount B', 'Subaccount A']);
    expect(
      rowFields(root).every(
        (field) => !field.shadowRoot?.querySelector('ui5-link'),
      ),
    ).toBe(true);
    expect(beforeRequest).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it.each([
    [503, 'UnableToLoad'],
    [403, 'tnt/UnsuccessfulAuth'],
  ] as const)(
    'shows loading and HTTP %i, then retries once',
    async (status, illustration) => {
      const loadError = vi.fn();
      const beforeRequest = vi.fn<(request: Request) => void>();
      fixture.componentInstance.loadError.subscribe(loadError);
      const pending = deferred<Response>();
      fetch
        .mockReturnValueOnce(pending.promise)
        .mockResolvedValueOnce(Response.json([{ label: 'Recovered' }]));
      fixture.componentRef.setInput('beforeRequest', beforeRequest);
      fixture.componentRef.setInput('data', { request });
      fixture.componentRef.setInput('lastUpdated', {
        label: 'Last updated:',
        text: 'yesterday',
      });
      fixture.componentRef.setInput('status', {
        text: 'Active',
        state: 'Positive',
      });
      fixture.componentRef.setInput('description', 'Affected subaccounts');
      fixture.componentRef.setInput('errorState', {
        title: 'Subaccounts unavailable',
        subtitle: 'Check your <b>connection</b>.',
        illustration: 'NoData',
      });

      await fixture.whenStable();
      const root = shadowRoot(fixture);
      const normalBody = 'mfp-data-fetch-metadata, .description, ul';
      const busy = root.querySelector<
        HTMLElement & { active: boolean; delay: number; text?: string }
      >('ui5-busy-indicator');
      expect(busy).toMatchObject({ active: true, delay: 0 });
      expect(busy?.text ?? '').toBe('');
      expect(busy?.textContent?.trim()).toBe('');
      expect(root.querySelector(`${normalBody}, mfp-error-view`)).toBeNull();

      pending.resolve(new Response(null, { status }));
      await vi.waitFor(() => {
        expect(stateElement(root, 'illustration')).toMatchObject({
          name: illustration,
        });
      });
      expect(stateElement(root, 'illustration')?.getAttribute('role')).toBe(
        'status',
      );
      expect(stateElement(root, 'title')?.textContent?.trim()).toBe(
        'Subaccounts unavailable',
      );
      expect(stateElement(root, 'subtitle')?.textContent?.trim()).toBe(
        'Check your <b>connection</b>.',
      );
      expect(stateElement(root, 'subtitle')?.querySelector('b')).toBeNull();
      expect(
        root.querySelector(`${normalBody}, ui5-busy-indicator`),
      ).toBeNull();
      expect(loadError).toHaveBeenCalledExactlyOnceWith({
        status,
        retryable: true,
      });
      const retry = () =>
        stateElement<
          HTMLElement & { design: string; icon: string; disabled: boolean }
        >(root, 'button-retry');
      expect(retry()?.textContent?.trim()).toBe('Retry');
      expect(retry()?.design).toBe('Emphasized');

      for (const buttons of [[], [{ key: 'details', label: 'Details' }]]) {
        fixture.componentRef.setInput('errorState', { buttons });
        await fixture.whenStable();
        expect(
          stateElement(root, 'illustration')?.querySelector('ui5-button'),
        ).toBeNull();
      }

      const customRetry = { key: 'retry', label: 'Try again', icon: 'refresh' };
      fixture.componentRef.setInput('errorState', {
        title: '',
        buttons: [
          { key: 'details', label: 'Details' },
          { ...customRetry, disabled: true },
          { key: 'retry', label: 'Later action' },
        ],
      });
      await fixture.whenStable();
      expect(stateElement(root, 'title')?.textContent?.trim()).toBe('');
      expect(stateElement(root, 'subtitle')?.textContent?.trim()).toBe(
        'The list data could not be loaded.',
      );
      expect(
        stateElement(root, 'illustration')?.querySelectorAll('ui5-button'),
      ).toHaveLength(1);
      expect(retry()?.textContent?.trim()).toBe('Try again');
      expect(retry()).toMatchObject({
        design: 'Transparent',
        icon: 'refresh',
        disabled: true,
      });
      retry()?.dispatchEvent(new Event('click'));
      await fixture.whenStable();
      expect(beforeRequest).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(loadError).toHaveBeenCalledTimes(1);

      fixture.componentRef.setInput('errorState', { buttons: [customRetry] });
      await fixture.whenStable();
      retry()?.click();
      await vi.waitFor(() => {
        expect(rowFields(root)[0]?.shadowRoot?.textContent).toContain(
          'Recovered',
        );
      });
      expect(
        root.querySelector('mfp-error-view, ui5-busy-indicator'),
      ).toBeNull();
      expect(root.querySelector('.description')?.textContent?.trim()).toBe(
        'Affected subaccounts',
      );
      expect(
        root
          .querySelector('[data-testid="card-template-status"]')
          ?.textContent?.trim(),
      ).toBe('Active');
      expect(beforeRequest).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch.mock.calls[0][0]).not.toBe(fetch.mock.calls[1][0]);
      expect(loadError).toHaveBeenCalledTimes(1);
    },
  );

  it('renders mapped rows and response metadata and updates presentation without fetching again', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-11-13T13:29:00Z'));
    const payload = { total: 42, rows: [{ label: 'Subaccount A' }] };
    const afterRequestHook = vi.fn(async (response: JsonValue) => ({
      result: response,
      updates: [{ at: '2026-11-13T12:59:00Z' }],
    }));
    fetch.mockResolvedValueOnce(Response.json(payload));
    fixture.componentRef.setInput('afterRequestHook', afterRequestHook);
    fixture.componentRef.setInput('data', { request, path: '$.result.rows' });
    fixture.componentRef.setInput('lastUpdated', {
      label: 'Actualizado:',
      path: '$.updates[0].at',
      locale: 'es',
    });
    fixture.componentRef.setInput('status', {
      text: '{{response.result.total}} affected ({{$length}} shown)',
      state: 'Critical',
    });

    const root = shadowRoot(fixture);
    const subtitle = () =>
      root.querySelector('[data-testid="card-template-subtitle"]');
    const status = () =>
      root.querySelector('[data-testid="card-template-status"]');
    await vi.waitFor(() => {
      expect(rowFields(root)[0]?.shadowRoot?.textContent).toContain(
        'Subaccount A',
      );
    });
    expect(afterRequestHook).toHaveBeenCalledExactlyOnceWith(payload);
    expect(subtitle()?.textContent?.trim()).toBe(
      'Actualizado: hace 30 minutos',
    );
    expect(status()?.textContent?.trim()).toBe('42 affected (1 shown)');

    fixture.componentRef.setInput('lastUpdated', {
      label: 'Updated:',
      text: 'just now',
    });
    await fixture.whenStable();
    expect(subtitle()?.textContent?.trim()).toBe('Updated: just now');
    expect(status()?.textContent?.trim()).toBe('42 affected (1 shown)');

    fixture.componentRef.setInput('status', {
      text: '{{$length}} subaccount',
      state: 'Neutral',
    });
    await fixture.whenStable();
    expect(status()?.textContent?.trim()).toBe('1 subaccount');
    expect(subtitle()?.textContent?.trim()).toBe('Updated: just now');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(afterRequestHook).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['an empty array', () => Response.json([]), undefined],
    [
      'a bodyless response',
      () => new Response(null, { status: 204 }),
      'subaccounts',
    ],
  ] as const)('shows the empty state for %s', async (_, response, path) => {
    fixture.componentRef.setInput('lastUpdated', {
      label: 'Last updated:',
      text: 'yesterday',
    });
    fixture.componentRef.setInput('status', {
      text: 'No affected subaccounts',
      state: 'Neutral',
    });
    fixture.componentRef.setInput('description', 'Affected subaccounts');
    await fixture.whenStable();
    const root = shadowRoot(fixture);
    expect(
      root.querySelector('mfp-error-view, ui5-busy-indicator, ul'),
    ).toBeNull();
    expect(
      root
        .querySelector('[data-testid="card-template-subtitle"]')
        ?.textContent?.trim(),
    ).toBe('Last updated: yesterday');
    expect(
      root
        .querySelector('[data-testid="card-template-status"]')
        ?.textContent?.trim(),
    ).toBe('No affected subaccounts');
    expect(root.querySelector('.description')?.textContent?.trim()).toBe(
      'Affected subaccounts',
    );

    fetch.mockResolvedValueOnce(response());
    fixture.componentRef.setInput('data', { request, path });
    await vi.waitFor(() => {
      expect(stateElement(root, 'illustration')).toMatchObject({
        name: 'NoData',
      });
    });
    expect(stateElement(root, 'title')?.textContent?.trim()).toBe(
      'No items to display.',
    );
    expect(stateElement(root, 'subtitle')?.textContent?.trim()).toBe(
      'There are currently no items to show.',
    );
    expect(
      root.querySelector(
        'mfp-data-fetch-metadata, .description, ul, ui5-busy-indicator',
      ),
    ).toBeNull();
    expect(
      stateElement(root, 'illustration')?.querySelector('ui5-button'),
    ).toBeNull();

    fixture.componentRef.setInput('emptyState', {
      title: 'No affected <b>subaccounts</b>',
      illustration: 'UnableToLoad',
      buttons: [{ key: 'retry', label: 'Try again' }],
    });
    await fixture.whenStable();
    expect(stateElement(root, 'illustration')).toMatchObject({
      name: 'NoData',
    });
    expect(stateElement(root, 'title')?.textContent?.trim()).toBe(
      'No affected <b>subaccounts</b>',
    );
    expect(stateElement(root, 'title')?.querySelector('b')).toBeNull();
    expect(stateElement(root, 'subtitle')?.textContent?.trim()).toBe(
      'There are currently no items to show.',
    );
    expect(
      stateElement(root, 'illustration')?.querySelector('ui5-button'),
    ).toBeNull();

    fixture.componentRef.setInput('emptyState', { title: '', subtitle: '' });
    await fixture.whenStable();
    expect(stateElement(root, 'title')?.textContent?.trim()).toBe('');
    expect(stateElement(root, 'subtitle')?.textContent?.trim()).toBe('');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('rejects a fetched string array with a retryable load error', async () => {
    const loadError = vi.fn();
    fixture.componentInstance.loadError.subscribe(loadError);
    fetch.mockResolvedValueOnce(
      Response.json({ subaccounts: ['Subaccount A'] }),
    );
    fixture.componentRef.setInput('data', { request, path: 'subaccounts' });
    await fixture.whenStable();

    const root = shadowRoot(fixture);
    await vi.waitFor(() => {
      expect(stateElement(root, 'title')?.textContent).toContain(
        'Unable to load list',
      );
    });
    expect(root.querySelector('ul')).toBeNull();
    expect(stateElement(root, 'button-retry')?.textContent?.trim()).toBe(
      'Retry',
    );
    expect(loadError).toHaveBeenCalledExactlyOnceWith({
      status: undefined,
      retryable: true,
    });
  });

  it('reports missing request configuration without Retry or a fetch', async () => {
    const loadError = vi.fn();
    fixture.componentInstance.loadError.subscribe(loadError);
    fixture.componentRef.setInput('data', {});
    fixture.componentRef.setInput('errorState', {
      buttons: [{ key: 'retry', label: 'Try again' }],
    });
    await fixture.whenStable();

    const root = shadowRoot(fixture);
    expect(stateElement(root, 'illustration')).toMatchObject({
      name: 'UnableToLoad',
    });
    expect(stateElement(root, 'title')?.textContent).toContain(
      'Unable to load list',
    );
    expect(
      stateElement(root, 'illustration')?.querySelector('ui5-button'),
    ).toBeNull();
    expect(loadError).toHaveBeenCalledExactlyOnceWith({
      status: undefined,
      retryable: false,
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('keeps another list loaded while destroying a list with a pending hook', async () => {
    const pendingHook = deferred<void>();
    const beforeRequest = vi.fn<(request: Request) => Promise<void>>(
      () => pendingHook.promise,
    );
    const loadError = vi.fn();
    fixture.componentInstance.loadError.subscribe(loadError);
    fixture.componentRef.setInput('beforeRequest', beforeRequest);
    fixture.componentRef.setInput('data', { request });
    await fixture.whenStable();
    expect(beforeRequest).toHaveBeenCalledTimes(1);
    expect(fetch).not.toHaveBeenCalled();

    const other = TestBed.createComponent(DataFetchList);
    fetch.mockResolvedValueOnce(Response.json([{ label: 'Other list' }]));
    other.componentRef.setInput('data', { request });
    await other.whenStable();
    const otherRoot = shadowRoot(other);
    await vi.waitFor(() => {
      expect(rowFields(otherRoot)[0]?.shadowRoot?.textContent).toContain(
        'Other list',
      );
    });
    expect(
      shadowRoot(fixture).querySelector('ui5-busy-indicator'),
    ).toMatchObject({
      active: true,
      delay: 0,
    });
    expect(shadowRoot(fixture).querySelector('ul, mfp-error-view')).toBeNull();

    fixture.destroy();
    expect(beforeRequest.mock.calls[0][0].signal.aborted).toBe(true);
    pendingHook.resolve();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    await other.whenStable();

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(loadError).not.toHaveBeenCalled();
    expect(rowFields(otherRoot)[0]?.shadowRoot?.textContent).toContain(
      'Other list',
    );
  });
});
