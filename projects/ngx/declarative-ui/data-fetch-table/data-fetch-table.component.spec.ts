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

  function element(testId: string): HTMLElement | null {
    const host: HTMLElement = fixture.nativeElement;
    const table = host.shadowRoot?.querySelector('mfp-declarative-table');
    return (
      table?.shadowRoot?.querySelector<HTMLElement>(
        `[data-testid="generic-table-${testId}"]`,
      ) ?? null
    );
  }

  function rowText(): string | null | undefined {
    return element('row-0')?.querySelector('mfp-resource-field')?.shadowRoot
      ?.textContent;
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
    await fixture.whenStable();
    expect(element('view-nodata')).not.toBeNull();
    expect(element('view-error')).toBeNull();

    await setData({ resource: localRows });
    expect(rowText()).toContain('local');

    for (const path of ['groups[*].rows', '$.groups[0].rows']) {
      await setData({ request: undefined, resource: nestedRows, path });
      expect(rowText()).toContain('local');
    }

    fixture.componentRef.setInput('beforeRequest', vi.fn());
    await fixture.whenStable();
    expect(rowText()).toContain('local');

    await setData(undefined);
    expect(element('row-0')).toBeNull();
    expect(element('view-nodata')).not.toBeNull();
    expect(element('view-error')).toBeNull();
    expect(hook).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    ['null data', null],
    ['missing source', {}],
    ['invalid resource', { resource: null }],
    ['missing match', { resource: nestedRows, path: 'missing' }],
    ['JSON Pointer', { resource: nestedRows, path: '/groups' }],
    [
      'JSONPath filter',
      { resource: nestedRows, path: 'groups[?(@.rows)].rows' },
    ],
    ['invalid row', { resource: [[]] }],
    ['sparse rows', { resource: new Array(1) }],
    ['iterator-masked sparse rows', { resource: iteratorMaskedRows }],
  ])('clears rows and shows an error without Retry for %s', async (_, data) => {
    await setData({ resource: localRows });
    await setData(data);

    expect(element('row-0')).toBeNull();
    expect(element('view-error')).not.toBeNull();
    expect(element('retry')).toBeNull();
    expect(hook).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('shows loading and resolves the response path when both sources are supplied', async () => {
    const pending = deferred<Response>();
    fetch.mockReturnValueOnce(pending.promise);
    const readResource = vi.fn(() => nestedRows);

    await setData({
      request,
      get resource() {
        return readResource();
      },
      path: 'groups[0].rows',
    });
    expect(element('view-loading')).not.toBeNull();

    pending.resolve(Response.json({ groups: [{ rows: [{ id: 'remote' }] }] }));
    await vi.waitFor(() => {
      expect(rowText()).toContain('remote');
    });
    expect(readResource).not.toHaveBeenCalled();
    expect(hook).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it.each([429, 503])(
    'uses a fresh request only when Retry is clicked after %i',
    async (status) => {
      const loadError = vi.fn();
      fixture.componentInstance.loadError.subscribe(loadError);
      fetch
        .mockResolvedValueOnce(new Response(null, { status }))
        .mockResolvedValueOnce(Response.json([{ id: 'retried' }]));
      await setData({ request, resource: localRows });

      await vi.waitFor(() => {
        expect(element('retry')).not.toBeNull();
      });
      expect(element('view-error')?.textContent).toContain(
        'The table data could not be loaded.',
      );
      expect(element('row-0')).toBeNull();
      expect(loadError).toHaveBeenCalledExactlyOnceWith({
        status,
        retryable: true,
      });
      expect(hook).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledTimes(1);

      element('retry')?.click();
      await vi.waitFor(() => {
        expect(rowText()).toContain('retried');
      });
      expect(hook).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch.mock.calls[0][0]).not.toBe(fetch.mock.calls[1][0]);
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
      fetch.mockResolvedValueOnce(Response.json({ groups: [] }));
      await setData({ request: source, resource: localRows, path });

      await vi.waitFor(() => {
        expect(element('view-error')).not.toBeNull();
      });
      expect(Boolean(element('retry'))).toBe(retryable);
      expect(element('row-0')).toBeNull();
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

  it('updates the error labels without repeating the failed request or event', async () => {
    const loadError = vi.fn();
    fixture.componentInstance.loadError.subscribe(loadError);
    fetch.mockRejectedValueOnce(new TypeError('Network unavailable'));

    await setData({ request });
    await vi.waitFor(() => {
      expect(element('retry')).not.toBeNull();
    });
    expect(loadError).toHaveBeenCalledWith({ retryable: true });

    fixture.componentRef.setInput('errorTitle', 'Network issue');
    fixture.componentRef.setInput('errorMessage', 'Please reconnect.');
    fixture.componentRef.setInput('retryButtonText', 'Try again');
    await fixture.whenStable();

    expect(element('error-title')?.textContent?.trim()).toBe('Network issue');
    expect(element('view-error')?.textContent).toContain('Please reconnect.');
    expect(element('retry')?.textContent?.trim()).toBe('Try again');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(loadError).toHaveBeenCalledTimes(1);
  });

  it('treats a bodyless response as empty even when a path is supplied', async () => {
    fetch.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await setData({ request, path: 'items' });

    await vi.waitFor(() => {
      expect(element('view-nodata')).not.toBeNull();
    });
    expect(element('view-error')).toBeNull();
  });

  it('skips an obsolete send when resource replaces a request with a pending hook', async () => {
    const pending = deferred<void>();
    const beforeRequest = vi.fn(() => pending.promise);
    fixture.componentRef.setInput('beforeRequest', beforeRequest);
    await setData({ request });
    expect(beforeRequest).toHaveBeenCalledTimes(1);

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
      expect(element('view-error')).toBeNull();
      expect(loadError).not.toHaveBeenCalled();
    },
  );
});
