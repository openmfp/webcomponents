import { DataFetchTable } from './data-fetch-table.component';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

const request = { url: 'https://example.test/rows' };
const localRows = [{ id: 'local' }];
const nestedRows = {
  groups: [{ rows: localRows }, { rows: [{ id: 'other' }] }],
};
const iteratorMaskedRows: object[] = new Array(1);
iteratorMaskedRows[Symbol.iterator] = () => [{ id: 'masked' }].values();

function deferred<T>() {
  let resolve: (value: T) => void = () => {
    throw new Error('Deferred promise was not initialized.');
  };
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

describe('DataFetchTable', () => {
  let fixture: ComponentFixture<DataFetchTable>;
  const fetch = vi.fn<typeof globalThis.fetch>();
  const hook = vi.fn<(request: Request) => void>();

  function root(): ShadowRoot | null {
    const host: HTMLElement = fixture.nativeElement;
    return host.shadowRoot;
  }

  function table(): Element | null | undefined {
    return root()?.querySelector('mfp-declarative-table');
  }

  function stateElement<T extends HTMLElement = HTMLElement>(
    part: string,
  ): T | null | undefined {
    return root()
      ?.querySelector('mfp-error-view')
      ?.shadowRoot?.querySelector<T>(`[data-testid="error-view-${part}"]`);
  }

  function rowText(): string | null | undefined {
    return table()?.shadowRoot?.querySelector(
      '[data-testid="generic-table-row-0"] mfp-resource-field',
    )?.shadowRoot?.textContent;
  }

  function metadataText(testId: 'subtitle' | 'status'): string | undefined {
    return root()
      ?.querySelector(`[data-testid="card-template-${testId}"]`)
      ?.textContent?.trim();
  }

  async function setData(data: unknown): Promise<void> {
    fixture.componentRef.setInput('data', data);
    await fixture.whenStable();
  }

  beforeEach(() => {
    fetch.mockReset();
    hook.mockReset();
    vi.stubGlobal('fetch', fetch);
    fixture = TestBed.createComponent(DataFetchTable);
    fixture.componentRef.setInput('columns', [{ label: 'ID', property: 'id' }]);
    fixture.componentRef.setInput('beforeRequest', hook);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders local root and nested first-match rows without running a request', async () => {
    const afterRequestHook = vi.fn();
    fixture.componentRef.setInput('afterRequestHook', afterRequestHook);
    fixture.componentRef.setInput('lastUpdated', {
      label: 'Last updated:',
      text: '30 minutes ago',
    });
    fixture.componentRef.setInput('status', {
      text: '{{$length}} destinations',
      state: 'Critical',
    });
    await fixture.whenStable();
    expect(stateElement('illustration')).toMatchObject({ name: 'NoData' });
    expect(stateElement('title')?.textContent?.trim()).toBe('No Resources');
    expect(stateElement('subtitle')?.textContent?.trim()).toBe(
      'There are currently no items to show.',
    );
    expect(
      root()?.querySelector(
        'mfp-declarative-table, mfp-data-fetch-metadata, ui5-busy-indicator',
      ),
    ).toBeNull();

    await setData({ resource: localRows });
    expect(rowText()).toContain('local');
    expect(metadataText('subtitle')).toBe('Last updated: 30 minutes ago');
    expect(metadataText('status')).toBe('1 destinations');

    for (const path of ['groups[*].rows', '$.groups[0].rows']) {
      await setData({ request: undefined, resource: nestedRows, path });
      expect(rowText()).toContain('local');
    }

    fixture.componentRef.setInput('beforeRequest', vi.fn());
    await fixture.whenStable();
    expect(rowText()).toContain('local');

    await setData(undefined);
    expect(table()).toBeNull();
    expect(stateElement('illustration')).toMatchObject({ name: 'NoData' });
    expect(hook).not.toHaveBeenCalled();
    expect(afterRequestHook).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    ['null data', null],
    ['missing source', {}],
    ['invalid resource', { resource: null }],
    ['path on a null resource', { resource: null, path: 'rows' }],
    ['missing match', { resource: nestedRows, path: 'missing' }],
    ['JSON Pointer', { resource: nestedRows, path: '/groups' }],
    [
      'JSONPath filter',
      { resource: nestedRows, path: 'groups[?(@.rows)].rows' },
    ],
    ['invalid row', { resource: [[]] }],
    ['null row', { resource: [null] }],
    ['sparse rows', { resource: new Array(1) }],
    ['iterator-masked sparse rows', { resource: iteratorMaskedRows }],
  ])('clears rows and shows an error without Retry for %s', async (_, data) => {
    await setData({ resource: localRows });
    await setData(data);

    expect(table()).toBeNull();
    expect(stateElement('illustration')).toMatchObject({
      name: 'UnableToLoad',
    });
    expect(
      stateElement('illustration')?.querySelector('ui5-button'),
    ).toBeNull();
    expect(hook).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('shows loading and resolves the response path when both sources are supplied', async () => {
    const pending = deferred<Response>();
    fetch.mockReturnValueOnce(pending.promise);
    const readResource = vi.fn(() => nestedRows);
    const afterRequestHook = vi.fn(async () => ({
      groups: [{ rows: [{ id: 'mapped' }] }],
      total: 42,
    }));
    fixture.componentRef.setInput('afterRequestHook', afterRequestHook);
    fixture.componentRef.setInput('status', {
      text: 'Active',
      state: 'Neutral',
    });
    fixture.componentRef.setInput('lastUpdated', {
      label: 'Last updated:',
      text: 'just now',
    });

    await setData({
      request,
      get resource() {
        return readResource();
      },
      path: 'groups[0].rows',
    });
    const busy = root()?.querySelector<
      HTMLElement & { active: boolean; delay: number; text?: string }
    >('ui5-busy-indicator');
    expect(busy).toMatchObject({ active: true, delay: 0 });
    expect(busy?.text ?? '').toBe('');
    expect(busy?.textContent?.trim()).toBe('');
    expect(
      root()?.querySelector(
        'mfp-declarative-table, mfp-data-fetch-metadata, mfp-error-view',
      ),
    ).toBeNull();

    pending.resolve(Response.json({ groups: [{ rows: [{ id: 'remote' }] }] }));
    await vi.waitFor(() => {
      expect(rowText()).toContain('mapped');
    });
    expect(metadataText('status')).toBe('Active');

    fixture.componentRef.setInput('status', {
      text: '{{response.total}} destinations',
      state: 'Neutral',
    });
    await fixture.whenStable();
    expect(metadataText('status')).toBe('42 destinations');

    fixture.componentRef.setInput('lastUpdated', {
      label: 'Last updated:',
      text: 'yesterday',
    });
    await fixture.whenStable();
    expect(metadataText('subtitle')).toBe('Last updated: yesterday');
    expect(metadataText('status')).toBe('42 destinations');
    expect(afterRequestHook).toHaveBeenCalledExactlyOnceWith({
      groups: [{ rows: [{ id: 'remote' }] }],
    });
    expect(readResource).not.toHaveBeenCalled();
    expect(hook).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it.each([
    [429, 'UnableToLoad'],
    [503, 'UnableToLoad'],
    [403, 'tnt/UnsuccessfulAuth'],
  ] as const)(
    'uses a fresh request only when Retry is clicked after %i',
    async (status, illustration) => {
      const loadError = vi.fn();
      fixture.componentInstance.loadError.subscribe(loadError);
      fixture.componentRef.setInput('status', {
        text: 'Active',
        state: 'Positive',
      });
      fixture.componentRef.setInput('lastUpdated', {
        label: 'Last updated:',
        text: 'yesterday',
      });
      fetch
        .mockResolvedValueOnce(new Response(null, { status }))
        .mockResolvedValueOnce(Response.json([{ id: 'retried' }]));
      await setData({ request, resource: localRows });

      await vi.waitFor(() => {
        expect(stateElement('illustration')).toMatchObject({
          name: illustration,
        });
      });
      expect(stateElement('illustration')?.getAttribute('role')).toBe('status');
      expect(stateElement('title')?.textContent?.trim()).toBe(
        'Unable to load data',
      );
      expect(stateElement('subtitle')?.textContent?.trim()).toBe(
        'The table data could not be loaded.',
      );
      const retry = stateElement<HTMLElement & { design: string }>(
        'button-retry',
      );
      expect(retry?.textContent?.trim()).toBe('Retry');
      expect(retry?.design).toBe('Emphasized');
      expect(
        root()?.querySelector(
          'mfp-declarative-table, mfp-data-fetch-metadata, ui5-busy-indicator',
        ),
      ).toBeNull();
      expect(loadError).toHaveBeenCalledExactlyOnceWith({
        status,
        retryable: true,
      });
      expect(hook).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledTimes(1);

      retry?.click();
      await vi.waitFor(() => {
        expect(rowText()).toContain('retried');
      });
      expect(hook).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch.mock.calls[0][0]).not.toBe(fetch.mock.calls[1][0]);
      expect(loadError).toHaveBeenCalledTimes(1);
      expect(
        root()?.querySelector('mfp-error-view, ui5-busy-indicator'),
      ).toBeNull();
      expect(metadataText('status')).toBe('Active');
    },
  );

  it.each([
    ['malformed request', null, '', 0, false],
    ['invalid request path', request, '/groups', 0, false],
    ['relative request URL', { url: '/rows' }, '', 0, false],
    ['GET with a body', { ...request, body: 'invalid' }, '', 0, false],
    ['invalid response selection', request, 'missing', 1, true],
  ] as const)(
    'does not fall back to local rows for %s',
    async (_, source, path, calls, retryable) => {
      const loadError = vi.fn();
      fixture.componentInstance.loadError.subscribe(loadError);
      fetch.mockResolvedValueOnce(Response.json({ groups: [] }));
      fixture.componentRef.setInput('errorState', {
        buttons: [{ key: 'retry', label: 'Try again' }],
      });
      await setData({ request: source, resource: localRows, path });

      await vi.waitFor(() => {
        expect(stateElement('illustration')).toMatchObject({
          name: 'UnableToLoad',
        });
      });
      expect(Boolean(stateElement('button-retry'))).toBe(retryable);
      expect(table()).toBeNull();
      expect(loadError).toHaveBeenCalledExactlyOnceWith({
        status: undefined,
        retryable,
      });
      expect(hook).toHaveBeenCalledTimes(calls);
      expect(fetch).toHaveBeenCalledTimes(calls);
    },
  );

  it('does not repeat a POST when signals read by data getters change', async () => {
    const body = signal('initial');
    const path = signal('items');
    const readRequest = vi.fn(() => ({
      ...request,
      method: 'POST' as const,
      body: body(),
    }));
    fetch.mockResolvedValueOnce(Response.json({ items: [{ id: 'remote' }] }));
    await setData({
      get request() {
        return readRequest();
      },
      get path() {
        return path();
      },
    });
    await vi.waitFor(() => {
      expect(rowText()).toContain('remote');
    });

    body.set('updated');
    path.set('otherItems');
    await fixture.whenStable();

    expect(readRequest).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('updates error copy and Retry without repeating the failed request or event', async () => {
    const loadError = vi.fn();
    fixture.componentInstance.loadError.subscribe(loadError);
    fetch.mockRejectedValueOnce(new TypeError('Network unavailable'));

    await setData({ request });
    await vi.waitFor(() => {
      expect(stateElement('button-retry')).toBeTruthy();
    });
    expect(loadError).toHaveBeenCalledWith({ retryable: true });

    for (const buttons of [[], [{ key: 'details', label: 'Details' }]]) {
      fixture.componentRef.setInput('errorState', { buttons });
      await fixture.whenStable();
      expect(
        stateElement('illustration')?.querySelector('ui5-button'),
      ).toBeNull();
    }

    fixture.componentRef.setInput('errorState', {
      illustration: 'NoData',
      title: 'Network <b>issue</b>',
      subtitle: '',
      buttons: [
        { key: 'details', label: 'Details' },
        { key: 'retry', label: 'Try again', icon: 'refresh', disabled: true },
        { key: 'retry', label: 'Later action' },
      ],
    });
    await fixture.whenStable();

    expect(stateElement('illustration')).toMatchObject({
      name: 'UnableToLoad',
    });
    expect(stateElement('title')?.textContent?.trim()).toBe(
      'Network <b>issue</b>',
    );
    expect(stateElement('title')?.querySelector('b')).toBeNull();
    expect(stateElement('subtitle')?.textContent?.trim()).toBe('');
    expect(
      stateElement('illustration')?.querySelectorAll('ui5-button'),
    ).toHaveLength(1);
    const retry = stateElement<
      HTMLElement & { design: string; icon: string; disabled: boolean }
    >('button-retry');
    expect(retry?.textContent?.trim()).toBe('Try again');
    expect(retry).toMatchObject({
      design: 'Transparent',
      icon: 'refresh',
      disabled: true,
    });
    retry?.dispatchEvent(new Event('click'));
    await fixture.whenStable();
    expect(hook).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(loadError).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['a local empty resource', { resource: [] }, 0],
    ['a bodyless response', { request, path: 'items' }, 1],
  ] as const)(
    'shows and updates the empty state for %s',
    async (_, data, calls) => {
      fetch.mockResolvedValueOnce(new Response(null, { status: 204 }));
      fixture.componentRef.setInput('status', {
        text: 'Active',
        state: 'Positive',
      });
      fixture.componentRef.setInput('lastUpdated', {
        label: 'Last updated:',
        text: 'yesterday',
      });
      await setData(data);

      await vi.waitFor(() => {
        expect(stateElement('illustration')).toMatchObject({ name: 'NoData' });
      });
      expect(
        root()?.querySelector(
          'mfp-declarative-table, mfp-data-fetch-metadata, ui5-busy-indicator',
        ),
      ).toBeNull();
      expect(
        stateElement('illustration')?.querySelector('ui5-button'),
      ).toBeNull();

      fixture.componentRef.setInput('emptyState', {
        subtitle: 'Select another destination.',
        illustration: 'UnableToLoad',
        buttons: [{ key: 'retry', label: 'Try again' }],
      });
      await fixture.whenStable();
      expect(stateElement('illustration')).toMatchObject({ name: 'NoData' });
      expect(stateElement('title')?.textContent?.trim()).toBe('No Resources');
      expect(stateElement('subtitle')?.textContent?.trim()).toBe(
        'Select another destination.',
      );
      expect(
        stateElement('illustration')?.querySelector('ui5-button'),
      ).toBeNull();

      fixture.componentRef.setInput('emptyState', { title: '', subtitle: '' });
      await fixture.whenStable();
      expect(stateElement('title')?.textContent?.trim()).toBe('');
      expect(stateElement('subtitle')?.textContent?.trim()).toBe('');
      expect(fetch).toHaveBeenCalledTimes(calls);
    },
  );

  it('skips an obsolete send when resource replaces a request with a pending hook', async () => {
    const pending = deferred<void>();
    const beforeRequest = vi.fn(() => pending.promise);
    fixture.componentRef.setInput('beforeRequest', beforeRequest);
    await setData({ request });
    expect(beforeRequest).toHaveBeenCalledTimes(1);
    expect(root()?.querySelector('ui5-busy-indicator')).toMatchObject({
      active: true,
      delay: 0,
    });
    expect(
      root()?.querySelector('mfp-declarative-table, mfp-error-view'),
    ).toBeNull();

    pending.resolve();
    await setData({ resource: localRows });

    expect(rowText()).toContain('local');
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    ['success', () => Response.json([{ id: 'stale' }])],
    ['failure', () => new Response(null, { status: 503 })],
  ] as const)(
    'ignores a stale request %s after aborting it',
    async (_, response) => {
      const pending = deferred<Response>();
      const loadError = vi.fn();
      fixture.componentInstance.loadError.subscribe(loadError);
      fetch.mockReturnValueOnce(pending.promise);
      await setData({ request });
      await vi.waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });
      const signal = fetch.mock.calls[0][1]?.signal;

      await setData({ resource: localRows });
      expect(signal?.aborted).toBe(true);
      pending.resolve(response());
      // Let the service and component promise continuations run before checking the view.
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 0);
      });
      await fixture.whenStable();

      expect(rowText()).toContain('local');
      expect(root()?.querySelector('mfp-error-view')).toBeNull();
      expect(loadError).not.toHaveBeenCalled();
    },
  );
});
