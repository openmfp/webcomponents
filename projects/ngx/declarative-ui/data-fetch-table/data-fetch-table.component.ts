import { DataFetchRowsService } from '../../services/data-fetch-rows.service';
import type {
  AfterRequestHook,
  BeforeRequest,
  DataFetchLoadError,
} from '../../services/data-fetch.model';
import { DataFetchService } from '../../services/data-fetch.service';
import { DataFetchMetadata } from '../data-fetch-metadata/data-fetch-metadata.component';
import type {
  CardStatus,
  DataFetchLastUpdated,
} from '../data-fetch-metadata/data-fetch-metadata.model';
import {
  ErrorView,
  type ErrorViewButton,
  type ErrorViewConfig,
} from '../error-view';
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
import { BusyIndicator } from '@fundamental-ngx/ui5-webcomponents/busy-indicator';
import '@ui5/webcomponents-fiori/dist/illustrations/NoData.js';
import '@ui5/webcomponents-fiori/dist/illustrations/UnableToLoad.js';
import '@ui5/webcomponents-fiori/dist/illustrations/tnt/UnsuccessfulAuth.js';

@Component({
  selector: 'mfp-data-fetch-table',
  imports: [BusyIndicator, DataFetchMetadata, DeclarativeTable, ErrorView],
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
  readonly emptyState = input<Omit<ErrorViewConfig, 'illustration'>>();
  readonly errorState = input<Omit<ErrorViewConfig, 'illustration'>>();

  readonly loadError = output<DataFetchLoadError>();

  private readonly rowLoader = inject(DataFetchRowsService);

  protected readonly rows = this.rowLoader.rows;
  protected readonly loading = this.rowLoader.loading;
  protected readonly snapshot = this.rowLoader.snapshot;
  protected readonly emptyConfig = computed<ErrorViewConfig>(() => {
    const state = this.emptyState();
    return {
      illustration: 'NoData',
      title: state?.title ?? 'No Resources',
      subtitle: state?.subtitle ?? 'There are currently no items to show.',
    };
  });
  protected readonly errorConfig = computed<ErrorViewConfig | undefined>(() => {
    const failure = this.rowLoader.failure();
    if (!failure) return undefined;

    const state = this.errorState();
    const buttons: ErrorViewButton[] = state?.buttons ?? [
      { key: 'retry', label: 'Retry', design: 'Emphasized' },
    ];
    const retryButton = failure.retryable
      ? buttons.find((button) => button.key === 'retry')
      : undefined;

    return {
      illustration:
        failure.status === 403 ? 'tnt/UnsuccessfulAuth' : 'UnableToLoad',
      title: state?.title ?? 'Unable to load data',
      subtitle: state?.subtitle ?? 'The table data could not be loaded.',
      buttons: retryButton ? [retryButton] : undefined,
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

  protected retry(key: string): void {
    if (key === 'retry') {
      this.rowLoader.retry();
    }
  }
}
