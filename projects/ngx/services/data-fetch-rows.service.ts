import type { GenericResource } from '../declarative-ui/models/resource';
import { getResourceValueByJsonPath } from '../declarative-ui/table/utils/resource-field-by-path';
import type {
  AfterRequestHook,
  BeforeRequest,
  CardRequest,
  DataFetchLoadError,
  DataFetchRequestData,
} from './data-fetch.model';
import {
  DataFetchConfigurationError,
  DataFetchHttpError,
  DataFetchService,
} from './data-fetch.service';
import {
  type EffectCleanupRegisterFn,
  Injectable,
  type Signal,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';

type DataFetchRowsConfig = Partial<DataFetchRequestData>;

interface DataFetchLoad {
  data: DataFetchRowsConfig;
  beforeRequest: BeforeRequest | undefined;
  afterRequestHook: AfterRequestHook | undefined;
  retryCount: number;
  controller: AbortController;
}

export interface DataFetchRowsSnapshot {
  rows: GenericResource[];
  response: unknown;
}

@Injectable()
export class DataFetchRowsService {
  private readonly fetchService = inject(DataFetchService);
  private readonly snapshotState = signal<DataFetchRowsSnapshot | undefined>(
    undefined,
  );
  private readonly loadingState = signal(false);
  private readonly failureState = signal<DataFetchLoadError | null>(null);
  private readonly retryCount = signal(0);

  private data: Signal<DataFetchRowsConfig | undefined>;
  private beforeRequest: Signal<BeforeRequest | undefined>;
  private afterRequestHook?: Signal<AfterRequestHook | undefined>;
  private onFailure: (failure: DataFetchLoadError) => void;

  readonly snapshot = this.snapshotState.asReadonly();
  readonly rows = computed(() => this.snapshot()?.rows ?? []);
  readonly loading = this.loadingState.asReadonly();
  readonly failure = this.failureState.asReadonly();

  initialize<T extends DataFetchRowsConfig>(
    data: Signal<T | undefined>,
    beforeRequest: Signal<BeforeRequest | undefined>,
    onFailure: (failure: DataFetchLoadError) => void,
    {
      afterRequestHook,
      readResource,
    }: {
      afterRequestHook?: Signal<AfterRequestHook | undefined>;
      readResource?: (config: T) => object | undefined;
    } = {},
  ): void {
    this.data = data;
    this.beforeRequest = beforeRequest;
    this.afterRequestHook = afterRequestHook;
    this.onFailure = onFailure;

    effect((onCleanup) => {
      this.refreshRows(data(), onCleanup, readResource);
    });
  }

  retry(): void {
    this.retryCount.update((count) => count + 1);
  }

  private refreshRows<T extends DataFetchRowsConfig>(
    config: T | undefined,
    onCleanup: EffectCleanupRegisterFn,
    readResource?: (config: T) => object | undefined,
  ): void {
    this.snapshotState.set(undefined);
    this.failureState.set(null);
    this.loadingState.set(false);

    if (config === undefined) return;

    try {
      if (!config || typeof config !== 'object' || Array.isArray(config)) {
        throw new TypeError('The data must be a configuration object.');
      }

      const request = untracked(() => config.request);
      if (request === undefined) {
        untracked(() => {
          const resource = readResource?.(config);
          const { path } = config;
          if (resource === undefined) {
            throw new TypeError('The data must specify a source.');
          }
          this.snapshotState.set({
            rows: this.readRows(resource, this.readPath(path)),
            response: undefined,
          });
        });
        return;
      }

      const path = untracked(() => this.readPath(config.path));
      this.loadingState.set(true);
      const load: DataFetchLoad = {
        data: config,
        beforeRequest: this.beforeRequest(),
        afterRequestHook: this.afterRequestHook?.(),
        retryCount: this.retryCount(),
        controller: new AbortController(),
      };
      onCleanup(() => {
        load.controller.abort();
      });

      untracked(() => {
        void this.loadRows(load, request, path);
      });
    } catch {
      this.showError(false);
    }
  }

  private async loadRows(
    load: DataFetchLoad,
    request: CardRequest,
    path: string,
  ): Promise<void> {
    const { beforeRequest, afterRequestHook, controller } = load;
    try {
      const response = await this.fetchService.fetchData(request, {
        signal: controller.signal,
        beforeRequest,
        afterRequestHook: afterRequestHook
          ? (response) =>
              untracked(() =>
                this.isCurrent(load) ? afterRequestHook(response) : undefined,
              )
          : undefined,
        beforeSend: () => {
          if (!this.isCurrent(load)) controller.abort();
        },
      });

      if (!this.isCurrent(load)) return;
      const rows = response === undefined ? [] : this.readRows(response, path);
      if (!this.isCurrent(load)) return;
      this.snapshotState.set({ rows, response });
      this.loadingState.set(false);
    } catch (error) {
      if (this.isCurrent(load)) {
        this.showError(!(error instanceof DataFetchConfigurationError), error);
      }
    }
  }

  private isCurrent(load: DataFetchLoad): boolean {
    return untracked(
      () =>
        !load.controller.signal.aborted &&
        this.data() === load.data &&
        this.beforeRequest() === load.beforeRequest &&
        this.afterRequestHook?.() === load.afterRequestHook &&
        this.retryCount() === load.retryCount,
    );
  }

  private showError(retryable: boolean, error?: unknown): void {
    const loadError: DataFetchLoadError = {
      status: error instanceof DataFetchHttpError ? error.status : undefined,
      retryable,
    };
    this.loadingState.set(false);
    this.failureState.set(loadError);
    untracked(() => {
      this.onFailure({ ...loadError });
    });
  }

  private readPath(path: unknown = ''): string {
    if (typeof path !== 'string' || path.startsWith('/')) {
      throw new TypeError('The data path must be a JSONPath expression.');
    }
    return path;
  }

  private readRows(payload: unknown, path: string): GenericResource[] {
    let value = payload;
    if (path !== '') {
      if (payload === null || typeof payload !== 'object') {
        throw new TypeError('The response path does not exist.');
      }
      value = getResourceValueByJsonPath(
        payload,
        { property: path },
        { eval: false },
      );
    }
    if (!Array.isArray(value)) {
      throw new TypeError('The data must contain an array of row objects.');
    }
    for (let index = 0; index < value.length; index++) {
      const row: unknown = value[index];
      if (
        !Object.hasOwn(value, index) ||
        row === null ||
        typeof row !== 'object' ||
        Array.isArray(row)
      ) {
        throw new TypeError('Each row must be an object.');
      }
    }
    return value;
  }
}
