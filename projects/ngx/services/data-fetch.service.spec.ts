import { DataFetchHttpError, DataFetchService } from './data-fetch.service';

const url = 'https://example.test/rows';

describe('DataFetchService', () => {
  const service = new DataFetchService();
  const fetch = vi.fn<typeof globalThis.fetch>();

  beforeEach(() => {
    fetch.mockReset();
    vi.stubGlobal('fetch', fetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('replaces configured query parameters and prepares a JSON request for the hook', async () => {
    fetch.mockResolvedValueOnce(Response.json([{ id: 'remote' }]));
    const beforeRequest = vi.fn((request: Request) => {
      request.headers.set('x-hook', 'added');
    });

    await expect(
      service.fetchData(
        {
          url: `${url}?tag=old&tag=older&keep=yes&remove=1`,
          method: 'POST',
          query: { tag: ['a b', 2, false], remove: [] },
          headers: { 'x-custom': 'value' },
          body: { active: true },
          credentials: 'include',
          mode: 'same-origin',
        },
        { signal: new AbortController().signal, beforeRequest },
      ),
    ).resolves.toEqual([{ id: 'remote' }]);

    const request = beforeRequest.mock.calls[0][0];
    expect(fetch.mock.calls[0][0]).toBe(request);
    expect([...new URL(request.url).searchParams]).toEqual([
      ['keep', 'yes'],
      ['tag', 'a b'],
      ['tag', '2'],
      ['tag', 'false'],
    ]);
    expect(request.method).toBe('POST');
    expect(request.credentials).toBe('include');
    expect(request.mode).toBe('same-origin');
    expect(request.headers.get('content-type')).toBe('application/json');
    expect(request.headers.get('x-custom')).toBe('value');
    expect(request.headers.get('x-hook')).toBe('added');
    expect(await request.json()).toEqual({ active: true });
  });

  it.each([
    [null, 'null'],
    ['plain text', '"plain text"'],
  ])(
    'serializes %s as JSON and preserves explicit Content-Type',
    async (body, encoded) => {
      fetch.mockResolvedValueOnce(Response.json([]));
      const beforeRequest = vi.fn<(request: Request) => void>();

      await service.fetchData(
        {
          url,
          method: 'POST',
          body,
          headers: { 'Content-Type': 'application/custom+json' },
        },
        { signal: new AbortController().signal, beforeRequest },
      );

      const request = beforeRequest.mock.calls[0][0];
      expect(request.headers.get('content-type')).toBe(
        'application/custom+json',
      );
      expect(await request.text()).toBe(encoded);
    },
  );

  it.each([
    { url: '/rows' },
    { url, body: null },
    { url, headers: { 'invalid name': 'value' } },
  ])(
    'rejects an invalid native Request before the hook and Fetch',
    async (config) => {
      const beforeRequest = vi.fn();

      await expect(
        service.fetchData(config, {
          signal: new AbortController().signal,
          beforeRequest,
        }),
      ).rejects.toBeInstanceOf(TypeError);
      expect(beforeRequest).not.toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalled();
    },
  );

  it('uses an async replacement Request and respects its signal', async () => {
    const replacementController = new AbortController();
    const failure = new Error('replacement canceled');
    const replacement = new Request(url + '/replacement', {
      signal: replacementController.signal,
      method: 'PATCH',
      body: 'replacement body',
      referrer: 'https://example.test/source',
      referrerPolicy: 'origin',
    });
    fetch.mockImplementationOnce(async () => {
      replacementController.abort(failure);
      return Response.json([]);
    });

    await expect(
      service.fetchData(
        { url },
        {
          signal: new AbortController().signal,
          beforeRequest: async () => replacement,
        },
      ),
    ).rejects.toBe(failure);

    expect(fetch).toHaveBeenCalledWith(
      replacement,
      expect.objectContaining({
        referrer: replacement.referrer,
        referrerPolicy: replacement.referrerPolicy,
      }),
    );
    expect(fetch.mock.calls[0][1]?.signal?.aborted).toBe(true);
    expect(await replacement.text()).toBe('replacement body');
  });

  it('rejects a failed HTTP response with its status and aborts its transport', async () => {
    fetch.mockResolvedValueOnce(new Response(null, { status: 503 }));
    const afterRequestHook = vi.fn();

    await expect(
      service.fetchData(
        { url },
        { signal: new AbortController().signal, afterRequestHook },
      ),
    ).rejects.toMatchObject({ constructor: DataFetchHttpError, status: 503 });
    expect(fetch.mock.calls[0][1]?.signal?.aborted).toBe(true);
    expect(afterRequestHook).not.toHaveBeenCalled();
  });

  it('does not return data if the card aborts while reading the response', async () => {
    const controller = new AbortController();
    const failure = new Error('card canceled');
    const response = Response.json([]);
    vi.spyOn(response, 'json').mockImplementationOnce(async () => {
      controller.abort(failure);
      return [{ id: 'stale' }];
    });
    fetch.mockResolvedValueOnce(response);
    const afterRequestHook = vi.fn();

    await expect(
      service.fetchData(
        { url },
        { signal: controller.signal, afterRequestHook },
      ),
    ).rejects.toBe(failure);
    expect(fetch.mock.calls[0][1]?.signal?.aborted).toBe(true);
    expect(afterRequestHook).not.toHaveBeenCalled();
  });

  it.each([204, 205])(
    'skips parsing and mapping for a %i response',
    async (status) => {
      const response = new Response(null, { status });
      const json = vi.spyOn(response, 'json');
      const afterRequestHook = vi.fn();
      fetch.mockResolvedValueOnce(response);

      await expect(
        service.fetchData(
          { url },
          { signal: new AbortController().signal, afterRequestHook },
        ),
      ).resolves.toBeUndefined();
      expect(json).not.toHaveBeenCalled();
      expect(afterRequestHook).not.toHaveBeenCalled();
    },
  );

  it('skips parsing and mapping for an effective HEAD request', async () => {
    const response = new Response('not JSON');
    const json = vi.spyOn(response, 'json');
    const afterRequestHook = vi.fn();
    fetch.mockResolvedValueOnce(response);

    await expect(
      service.fetchData(
        { url },
        {
          signal: new AbortController().signal,
          beforeRequest: () => new Request(url, { method: 'HEAD' }),
          afterRequestHook,
        },
      ),
    ).resolves.toBeUndefined();
    expect(json).not.toHaveBeenCalled();
    expect(afterRequestHook).not.toHaveBeenCalled();
  });

  it.each([undefined, null, 0, false])(
    'passes parsed JSON to the mapper and respects its %s return',
    async (mapped) => {
      const payload = { items: [{ id: 'remote' }] };
      fetch.mockResolvedValueOnce(Response.json(payload));
      const afterRequestHook = vi.fn(() => mapped);

      await expect(
        service.fetchData(
          { url },
          { signal: new AbortController().signal, afterRequestHook },
        ),
      ).resolves.toEqual(mapped === undefined ? payload : mapped);
      expect(afterRequestHook).toHaveBeenCalledExactlyOnceWith(payload);
    },
  );

  it('skips the mapper if JSON parsing fails', async () => {
    fetch.mockResolvedValueOnce(new Response('not JSON'));
    const afterRequestHook = vi.fn();

    await expect(
      service.fetchData(
        { url },
        { signal: new AbortController().signal, afterRequestHook },
      ),
    ).rejects.toBeInstanceOf(SyntaxError);
    expect(afterRequestHook).not.toHaveBeenCalled();
  });

  it('rejects a pending mapper on effective Request abort and consumes its late rejection', async () => {
    const replacementController = new AbortController();
    const failure = new Error('replacement canceled');
    let rejectMapping: (reason: Error) => void = () => {
      throw new Error('Deferred promise was not initialized.');
    };
    const mapping = new Promise<never>((_resolve, reject) => {
      rejectMapping = reject;
    });
    const afterRequestHook = vi.fn(() => mapping);
    fetch.mockResolvedValueOnce(Response.json([]));

    const result = service.fetchData(
      { url },
      {
        signal: new AbortController().signal,
        beforeRequest: () =>
          new Request(url, { signal: replacementController.signal }),
        afterRequestHook,
      },
    );
    await vi.waitFor(() => {
      expect(afterRequestHook).toHaveBeenCalledExactlyOnceWith([]);
    });
    replacementController.abort(failure);
    await expect(result).rejects.toBe(failure);

    rejectMapping(new Error('late mapper error'));
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  });
});
