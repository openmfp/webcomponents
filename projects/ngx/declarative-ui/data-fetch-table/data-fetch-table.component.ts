import { DataFetchRowsService } from '../../services/data-fetch-rows.service';
import type {
  ActionsHook,
  AfterRequest,
  BeforeRequest,
  DataFetchData,
  DataFetchLoadError,
} from '../../services/data-fetch.model';
import { DataFetchService } from '../../services/data-fetch.service';
import { runActionsHook } from '../../services/run-actions-hook';
import { DataFetchMetadata } from '../data-fetch-metadata/data-fetch-metadata.component';
import type {
  CardStatus,
  DataFetchLastUpdated,
} from '../data-fetch-metadata/data-fetch-metadata.model';
import { DataFetchState } from '../data-fetch-state/data-fetch-state.component';
import type { ErrorViewConfig } from '../error-view';
import { DeclarativeTable, TableFieldDefinition } from '../table';
import {
  ChangeDetectionStrategy,
  Component,
  ErrorHandler,
  ViewEncapsulation,
  inject,
  input,
  output,
} from '@angular/core';

@Component({
  selector: 'mfp-data-fetch-table-card',
  imports: [DataFetchMetadata, DataFetchState, DeclarativeTable],
  standalone: true,
  templateUrl: './data-fetch-table.component.html',
  styleUrl: './data-fetch-table.component.scss',
  providers: [DataFetchRowsService, DataFetchService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class DataFetchTable {
  readonly data = input<DataFetchData>();
  readonly columns = input<TableFieldDefinition[]>([]);
  readonly trackByPath = input<string>();
  readonly beforeRequest = input<BeforeRequest>();
  readonly afterRequest = input<AfterRequest>();
  readonly actionsHook = input<ActionsHook>();
  readonly lastUpdated = input<DataFetchLastUpdated>();
  readonly status = input<CardStatus>();
  readonly emptyState = input<Omit<ErrorViewConfig, 'illustration'>>();
  readonly errorState = input<Omit<ErrorViewConfig, 'illustration'>>();

  readonly loadError = output<DataFetchLoadError>();

  private readonly rowLoader = inject(DataFetchRowsService);
  private readonly errorHandler = inject(ErrorHandler);

  protected readonly rows = this.rowLoader.rows;
  protected readonly state = this.rowLoader.state;
  protected readonly snapshot = this.rowLoader.snapshot;

  constructor() {
    this.rowLoader.initialize({
      data: this.data,
      beforeRequest: this.beforeRequest,
      afterRequest: this.afterRequest,
      onFailure: (failure) => {
        this.loadError.emit(failure);
      },
    });
  }

  onCardAction(key: string): void {
    runActionsHook(this.actionsHook(), key, this.errorHandler);
  }
}
