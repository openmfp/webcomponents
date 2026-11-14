import { DataFetchRowsService } from './data-fetch-rows.service';
import type {
  AfterRequestHook,
  BeforeRequest,
  CardRequest,
  JsonValue,
} from './data-fetch.model';
import { DataFetchHttpError, DataFetchService } from './data-fetch.service';
import { type WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

const request = { url: 'https://example.test/rows' };
const rows = [{ label: 'Current row' }];

describe('DataFetchRowsService', () => {
  let service: DataFetchRowsService;
  let data: WritableSignal<{ request: CardRequest } | undefined>;
  let mapper: WritableSignal<AfterRequestHook | undefined>;
  const fetchData = vi.fn<DataFetchService['fetchData']>();
  const onFailure = vi.fn();

  beforeEach(() => {
    fetchData.mockReset();
    onFailure.mockReset();
    data = signal(undefined);
    mapper = signal(undefined);
    TestBed.configureTestingModule({
      providers: [
        DataFetchRowsService,
        { provide: DataFetchService, useValue: { fetchData } },
      ],
    });
    service = TestBed.inject(DataFetchRowsService);
    TestBed.runInInjectionContext(() => {
      service.initialize(
        data,
        signal<BeforeRequest | undefined>(undefined),
        onFailure,
        { afterRequestHook: mapper },
      );
    });
  });

  it('clears failure and loads rows on a fresh retry attempt', async () => {
    fetchData
      .mockRejectedValueOnce(new DataFetchHttpError(503))
      .mockResolvedValueOnce(rows);
    data.set({ request });
    TestBed.tick();

    expect(service.loading()).toBe(true);
    expect(service.rows()).toEqual([]);
    await vi.waitFor(() => {
      expect(service.failure()).toEqual({ status: 503, retryable: true });
    });
    expect(service.loading()).toBe(false);
    expect(onFailure).toHaveBeenCalledExactlyOnceWith(service.failure());

    service.retry();
    TestBed.tick();
    expect(service.failure()).toBeNull();
    expect(service.loading()).toBe(true);
    expect(fetchData).toHaveBeenCalledTimes(2);
    expect(fetchData.mock.calls[0][1].signal).not.toBe(
      fetchData.mock.calls[1][1].signal,
    );
    await vi.waitFor(() => {
      expect(service.rows()).toEqual(rows);
    });
    expect(service.loading()).toBe(false);
  });

  it('keeps the current rows when an obsolete transport resolves successfully', async () => {
    let resolveObsolete: (payload: unknown) => void = () => {
      throw new Error('Deferred promise was not initialized.');
    };
    const obsolete = new Promise((resolve) => {
      resolveObsolete = resolve;
    });
    fetchData.mockReturnValueOnce(obsolete).mockResolvedValueOnce(rows);

    data.set({ request });
    TestBed.tick();
    expect(fetchData).toHaveBeenCalledTimes(1);

    data.set({ request: { url: 'https://example.test/other-rows' } });
    TestBed.tick();
    await vi.waitFor(() => {
      expect(service.rows()).toEqual(rows);
    });
    expect(fetchData.mock.calls[0][1].signal.aborted).toBe(true);

    resolveObsolete([{ label: 'Obsolete row' }]);
    await obsolete;

    expect(service.rows()).toEqual(rows);
    expect(service.failure()).toBeNull();
    expect(service.loading()).toBe(false);
    expect(onFailure).not.toHaveBeenCalled();
  });

  it('publishes the mapped snapshot on retry after a mapper error', async () => {
    const raw = [{ label: 'Unmapped row' }];
    const afterRequestHook = vi
      .fn<AfterRequestHook>()
      .mockRejectedValueOnce(new Error('Mapper failed'))
      .mockResolvedValueOnce(rows);
    mapper.set(afterRequestHook);
    fetchData.mockImplementation(async (_request, attempt) =>
      attempt.afterRequestHook?.(raw),
    );
    data.set({ request });
    TestBed.tick();

    await vi.waitFor(() => {
      expect(onFailure).toHaveBeenCalledExactlyOnceWith({
        status: undefined,
        retryable: true,
      });
    });
    expect(service.snapshot()).toBeUndefined();

    service.retry();
    TestBed.tick();
    await vi.waitFor(() => {
      expect(service.snapshot()).toEqual({ rows, response: rows });
    });
    expect(afterRequestHook).toHaveBeenNthCalledWith(1, raw);
    expect(afterRequestHook).toHaveBeenNthCalledWith(2, raw);
    expect(service.failure()).toBeNull();
  });

  it('skips a mapper if its input changes before cleanup and ignores its stale completion', async () => {
    const raw = [{ label: 'Unmapped row' }];
    let resolveMapping: (result: JsonValue) => void = () => {
      throw new Error('Deferred promise was not initialized.');
    };
    const pending = new Promise<JsonValue>((resolve) => {
      resolveMapping = resolve;
    });
    const firstHook = vi.fn<AfterRequestHook>(() => pending);
    const nextHook = vi.fn<AfterRequestHook>(() => rows);
    mapper.set(firstHook);
    fetchData.mockImplementation(async (_request, attempt) =>
      attempt.afterRequestHook?.(raw),
    );
    data.set({ request });
    TestBed.tick();
    expect(firstHook).toHaveBeenCalledExactlyOnceWith(raw);

    mapper.set(nextHook);
    const obsoleteAttempt = fetchData.mock.calls[0][1];
    expect(obsoleteAttempt.afterRequestHook?.(raw)).toBeUndefined();
    TestBed.tick();
    await vi.waitFor(() => {
      expect(service.snapshot()).toEqual({ rows, response: rows });
    });
    expect(obsoleteAttempt.signal.aborted).toBe(true);

    resolveMapping([{ label: 'Stale row' }]);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    expect(firstHook).toHaveBeenCalledTimes(1);
    expect(nextHook).toHaveBeenCalledExactlyOnceWith(raw);
    expect(service.snapshot()).toEqual({ rows, response: rows });
    expect(onFailure).not.toHaveBeenCalled();
  });
});
