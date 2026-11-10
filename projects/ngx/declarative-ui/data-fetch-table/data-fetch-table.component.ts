import {
  DataFetchHttpError,
  DataFetchService,
} from '../../services/data-fetch.service';
import { GenericResource, TableErrorConfig } from '../models';
import { DeclarativeTable, TableFieldDefinition } from '../table';
import { getResourceValueByJsonPath } from '../table/utils/resource-field-by-path';
import { BeforeRequest, DataFetchTableData } from './data-fetch-table.model';
import {
  ChangeDetectionStrategy,
  Component,
  EffectCleanupRegisterFn,
  ViewEncapsulation,
  effect,
  inject,
  input,
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

  protected readonly rows = signal<GenericResource[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<TableErrorConfig | null>(null);

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
    const beforeRequest = this.beforeRequest();
    const retryCount = this.retryCount();

    this.rows.set([]);
    this.error.set(null);
    this.loading.set(data !== undefined);
    if (data === undefined) return;

    const load: DataFetchLoad = {
      data,
      beforeRequest,
      retryCount,
      controller: new AbortController(),
    };
    onCleanup(() => {
      load.controller.abort();
    });

    untracked(() => {
      void this.load(load);
    });
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

  private async load(load: DataFetchLoad): Promise<void> {
    const { data, beforeRequest, controller } = load;
    try {
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new TypeError('The table data must be a configuration object.');
      }
      const { path = '', request } = data;
      if (typeof path !== 'string' || path.startsWith('/')) {
        throw new TypeError('The response path must be a JSONPath expression.');
      }

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
      if (this.isCurrent(load)) this.showError(error);
    }
  }

  private showError(error: unknown): void {
    this.error.set({
      status: error instanceof DataFetchHttpError ? error.status : undefined,
      title: 'Unable to load data',
      message: 'The table data could not be loaded. Try again.',
      withRetryButton: true,
    });
    this.loading.set(false);
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
    if (
      !Array.isArray(value) ||
      !value.every(
        (row: unknown): row is Record<string, unknown> =>
          row !== null && typeof row === 'object' && !Array.isArray(row),
      )
    ) {
      throw new TypeError('The response must contain an array of row objects.');
    }
    return value;
  }
}
