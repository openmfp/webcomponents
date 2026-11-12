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

  it('announces loading and HTTP failure, then retries once with a fresh request', async () => {
    const loadError = vi.fn();
    const beforeRequest = vi.fn<(request: Request) => void>();
    fixture.componentInstance.loadError.subscribe(loadError);
    const pending = deferred<Response>();
    fetch
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce(Response.json([{ label: 'Recovered' }]));
    fixture.componentRef.setInput('beforeRequest', beforeRequest);
    fixture.componentRef.setInput('data', { request });
    fixture.componentRef.setInput('errorTitle', 'Subaccounts unavailable');
    fixture.componentRef.setInput('errorMessage', 'Check your connection.');
    fixture.componentRef.setInput('retryButtonText', 'Try again');

    await fixture.whenStable();
    const root = shadowRoot(fixture);
    expect(root.querySelector('[role="status"]')?.textContent).toContain(
      'Loading list items',
    );
    expect(root.querySelector('[role="alert"]')?.textContent?.trim()).toBe('');
    expect(root.querySelector('ul')).toBeNull();

    pending.resolve(new Response(null, { status: 503 }));
    await vi.waitFor(() => {
      expect(root.querySelector('ui5-button')).not.toBeNull();
    });
    expect(root.querySelector('[role="alert"]')?.textContent).toContain(
      'Subaccounts unavailable',
    );
    expect(root.querySelector('[role="alert"]')?.textContent).toContain(
      'Check your connection.',
    );
    expect(loadError).toHaveBeenCalledExactlyOnceWith({
      status: 503,
      retryable: true,
    });
    expect(fetch).toHaveBeenCalledTimes(1);

    const retry = root.querySelector<HTMLElement>('ui5-button');
    expect(retry?.textContent?.trim()).toBe('Try again');
    retry?.click();
    await vi.waitFor(() => {
      expect(rowFields(root)[0]?.shadowRoot?.textContent).toContain(
        'Recovered',
      );
    });
    expect(root.querySelector('[role="alert"]')?.textContent?.trim()).toBe('');
    expect(root.querySelector('ui5-button')).toBeNull();
    expect(beforeRequest).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls[0][0]).not.toBe(fetch.mock.calls[1][0]);
    expect(loadError).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['an empty array', () => Response.json([]), undefined],
    [
      'a bodyless response',
      () => new Response(null, { status: 204 }),
      'subaccounts',
    ],
  ] as const)('shows the empty state for %s', async (_, response, path) => {
    await fixture.whenStable();
    const root = shadowRoot(fixture);
    expect(root.querySelector('[role="status"]')?.textContent?.trim()).toBe('');

    fetch.mockResolvedValueOnce(response());
    fixture.componentRef.setInput('data', { request, path });
    await vi.waitFor(() => {
      expect(root.querySelector('[role="status"]')?.textContent).toContain(
        'No items to display.',
      );
    });
    expect(root.querySelector('[role="alert"]')?.textContent?.trim()).toBe('');
    expect(root.querySelector('ul')).toBeNull();
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
      expect(root.querySelector('[role="alert"]')?.textContent).toContain(
        'Unable to load list',
      );
    });
    expect(root.querySelector('ul')).toBeNull();
    expect(root.querySelector('ui5-button')?.textContent?.trim()).toBe('Retry');
    expect(loadError).toHaveBeenCalledExactlyOnceWith({
      status: undefined,
      retryable: true,
    });
  });

  it('reports missing request configuration without Retry or a fetch', async () => {
    const loadError = vi.fn();
    fixture.componentInstance.loadError.subscribe(loadError);
    fixture.componentRef.setInput('data', {});
    await fixture.whenStable();

    const root = shadowRoot(fixture);
    expect(root.querySelector('[role="alert"]')?.textContent).toContain(
      'Unable to load list',
    );
    expect(root.querySelector('ui5-button')).toBeNull();
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
      shadowRoot(fixture).querySelector('[role="status"]')?.textContent,
    ).toContain('Loading list items');
    expect(shadowRoot(fixture).querySelector('ul')).toBeNull();

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
