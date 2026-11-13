import type { CardStatus } from '../../models/card-status.model';
import { DataFetchRowsService } from '../../services/data-fetch-rows.service';
import type {
  AfterRequestHook,
  BeforeRequest,
  DataFetchLoadError,
} from '../../services/data-fetch.model';
import { DataFetchService } from '../../services/data-fetch.service';
import { DataFetchMetadata } from '../data-fetch-metadata/data-fetch-metadata.component';
import type { DataFetchLastUpdated } from '../data-fetch-metadata/data-fetch-metadata.model';
import { TableErrorConfig } from '../models';
import { DeclarativeTable, TableFieldDefinition } from '../table';
import type { DataFetchTableData } from './data-fetch-table.model';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  input,
  output,
} from '@angular/core';

@Component({
  selector: 'mfp-data-fetch-table',
  imports: [DataFetchMetadata, DeclarativeTable],
  standalone: true,
  templateUrl: './data-fetch-table.component.html',
  styleUrl: './data-fetch-table.component.scss',
  providers: [DataFetchRowsService, DataFetchService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class DataFetchTable {
  readonly data = input<DataFetchTableData>();
  readonly columns = input<TableFieldDefinition[]>([]);
  readonly trackByPath = input<string>();
  readonly beforeRequest = input<BeforeRequest>();
  readonly afterRequestHook = input<AfterRequestHook>();
  readonly lastUpdated = input<DataFetchLastUpdated>();
  readonly status = input<CardStatus>();
  readonly errorTitle = input('Unable to load data');
  readonly errorMessage = input('The table data could not be loaded.');
  readonly retryButtonText = input('Retry');

  readonly loadError = output<DataFetchLoadError>();

  private readonly rowLoader = inject(DataFetchRowsService);

  protected readonly rows = this.rowLoader.rows;
  protected readonly loading = this.rowLoader.loading;
  protected readonly snapshot = this.rowLoader.snapshot;
  protected readonly error = computed<TableErrorConfig | null>(() => {
    const failure = this.rowLoader.failure();
    if (failure === null) return null;

    return {
      status: failure.status,
      title: this.errorTitle(),
      message: this.errorMessage(),
      withRetryButton: failure.retryable,
      retryButtonText: this.retryButtonText(),
    };
  });

  constructor() {
    this.rowLoader.initialize(
      this.data,
      this.beforeRequest,
      (failure) => {
        this.loadError.emit(failure);
      },
      {
        afterRequestHook: this.afterRequestHook,
        readResource: (data) => data.resource,
      },
    );
  }

  protected retry(): void {
    this.rowLoader.retry();
  }
}
