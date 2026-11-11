import type {
  BeforeRequest,
  CardRequest,
} from '../../services/data-fetch.model';
import {
  DataFetchConfigurationError,
  DataFetchHttpError,
  DataFetchService,
} from '../../services/data-fetch.service';
import { GenericResource, TableErrorConfig } from '../models';
import { DeclarativeTable, TableFieldDefinition } from '../table';
import { getResourceValueByJsonPath } from '../table/utils/resource-field-by-path';
import type {
  DataFetchTableData,
  DataFetchTableLoadError,
} from './data-fetch-table.model';
import {
  ChangeDetectionStrategy,
  Component,
  EffectCleanupRegisterFn,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';

interface DataFetchLoad {
  data: DataFetchTableData;
  beforeRequest: BeforeRequest | undefined;
  retryCount: number;
  controller: AbortController;
}

@Component({
  selector: 'mfp-data-fetch-table',
  imports: [DeclarativeTable],
  standalone: true,
  templateUrl: './data-fetch-table.component.html',
  styleUrl: './data-fetch-table.component.scss',
  providers: [DataFetchService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class DataFetchTable {
  readonly data = input<DataFetchTableData>();
  readonly columns = input<TableFieldDefinition[]>([]);
  readonly trackByPath = input<string>();
  readonly beforeRequest = input<BeforeRequest>();
  readonly errorTitle = input('Unable to load data');
  readonly errorMessage = input('The table data could not be loaded.');
  readonly retryButtonText = input('Retry');

  readonly loadError = output<DataFetchTableLoadError>();

  protected readonly rows = signal<GenericResource[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = computed<TableErrorConfig | null>(() => {
    const failure = this.failure();
    if (failure === null) return null;

    return {
      status: failure.status,
      title: this.errorTitle(),
      message: this.errorMessage(),
      withRetryButton: failure.retryable,
      retryButtonText: this.retryButtonText(),
    };
  });

  private readonly failure = signal<DataFetchTableLoadError | null>(null);
  private readonly retryCount = signal(0);
  private readonly fetchService = inject(DataFetchService);

  constructor() {
    effect((onCleanup) => {
      this.startLoad(onCleanup);
    });
  }

  protected retry(): void {
    this.retryCount.update((count) => count + 1);
  }

  private startLoad(onCleanup: EffectCleanupRegisterFn): void {
    const data = this.data();

    this.rows.set([]);
    this.failure.set(null);
    this.loading.set(false);

    if (data === undefined) return;

    try {
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new TypeError('The table data must be a configuration object.');
      }

      const request = untracked(() => data.request);
      if (request === undefined) {
        untracked(() => {
          const { resource, path } = data;
          if (resource === undefined) {
            throw new TypeError('The table data must specify a source.');
          }
          this.rows.set(this.readRows(resource, this.readPath(path)));
        });
        return;
      }

      const path = untracked(() => this.readPath(data.path));
      this.loading.set(true);
      const load: DataFetchLoad = {
        data,
        beforeRequest: this.beforeRequest(),
        retryCount: this.retryCount(),
        controller: new AbortController(),
      };
      onCleanup(() => {
        load.controller.abort();
      });

      untracked(() => {
        void this.load(load, request, path);
      });
    } catch {
      this.showError(false);
    }
  }

  private isCurrent(load: DataFetchLoad): boolean {
    return untracked(
      () =>
        !load.controller.signal.aborted &&
        this.data() === load.data &&
        this.beforeRequest() === load.beforeRequest &&
        this.retryCount() === load.retryCount,
    );
  }

  private async load(
    load: DataFetchLoad,
    request: CardRequest,
    path: string,
  ): Promise<void> {
    const { beforeRequest, controller } = load;
    try {
      const payload = await this.fetchService.fetchData(request, {
        signal: controller.signal,
        beforeRequest,
        beforeSend: () => {
          if (!this.isCurrent(load)) controller.abort();
        },
      });

      const rows = payload === undefined ? [] : this.readRows(payload, path);
      if (!this.isCurrent(load)) return;
      this.rows.set(rows);
      this.loading.set(false);
    } catch (error) {
      if (this.isCurrent(load)) {
        this.showError(!(error instanceof DataFetchConfigurationError), error);
      }
    }
  }

  private showError(retryable: boolean, error?: unknown): void {
    const failure: DataFetchTableLoadError = {
      status: error instanceof DataFetchHttpError ? error.status : undefined,
      retryable,
    };
    this.loading.set(false);
    this.failure.set(failure);
    this.loadError.emit({ ...failure });
  }

  private readPath(path: unknown = ''): string {
    if (typeof path !== 'string' || path.startsWith('/')) {
      throw new TypeError('The table data path must be a JSONPath expression.');
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
      throw new TypeError(
        'The table data must contain an array of row objects.',
      );
    }
    for (let index = 0; index < value.length; index++) {
      const row: unknown = value[index];
      if (
        !Object.hasOwn(value, index) ||
        row === null ||
        typeof row !== 'object' ||
        Array.isArray(row)
      ) {
        throw new TypeError('Each table row must be an object.');
      }
    }
    return value;
  }
}
