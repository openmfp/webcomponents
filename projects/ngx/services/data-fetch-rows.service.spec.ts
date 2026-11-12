import { DataFetchRowsService } from './data-fetch-rows.service';
import type { BeforeRequest, CardRequest } from './data-fetch.model';
import { DataFetchHttpError, DataFetchService } from './data-fetch.service';
import { type WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

const request = { url: 'https://example.test/rows' };
const rows = [{ label: 'Current row' }];

describe('DataFetchRowsService', () => {
  let service: DataFetchRowsService;
  let data: WritableSignal<{ request: CardRequest } | undefined>;
  const fetchData = vi.fn<DataFetchService['fetchData']>();
  const onFailure = vi.fn();

  beforeEach(() => {
    fetchData.mockReset();
    onFailure.mockReset();
    data = signal(undefined);
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
});
