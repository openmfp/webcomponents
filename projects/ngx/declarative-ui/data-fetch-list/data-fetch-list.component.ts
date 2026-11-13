import type { CardStatus } from '../../models/card-status.model';
import { DataFetchRowsService } from '../../services/data-fetch-rows.service';
import type {
  AfterRequestHook,
  BeforeRequest,
  DataFetchLoadError,
  DataFetchRequestData,
} from '../../services/data-fetch.model';
import { DataFetchService } from '../../services/data-fetch.service';
import { DataFetchMetadata } from '../data-fetch-metadata/data-fetch-metadata.component';
import type { DataFetchLastUpdated } from '../data-fetch-metadata/data-fetch-metadata.model';
import type { FieldDefinition } from '../models';
import { ResourceField } from '../resource-field';
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
import { Button } from '@fundamental-ngx/ui5-webcomponents/button';

@Component({
  selector: 'mfp-data-fetch-list',
  imports: [BusyIndicator, Button, DataFetchMetadata, ResourceField],
  standalone: true,
  templateUrl: './data-fetch-list.component.html',
  styleUrl: './data-fetch-list.component.scss',
  providers: [DataFetchRowsService, DataFetchService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class DataFetchList {
  readonly data = input<DataFetchRequestData>();
  readonly beforeRequest = input<BeforeRequest>();
  readonly afterRequestHook = input<AfterRequestHook>();
  readonly lastUpdated = input<DataFetchLastUpdated>();
  readonly status = input<CardStatus>();
  readonly description = input<string>();
  readonly fieldDefinition = input<FieldDefinition>({ property: 'label' });
  readonly errorTitle = input('Unable to load list');
  readonly errorMessage = input('The list data could not be loaded.');
  readonly retryButtonText = input('Retry');

  readonly loadError = output<DataFetchLoadError>();

  private readonly rowLoader = inject(DataFetchRowsService);

  protected readonly rows = this.rowLoader.rows;
  protected readonly loading = this.rowLoader.loading;
  protected readonly failure = this.rowLoader.failure;
  protected readonly snapshot = this.rowLoader.snapshot;
  protected readonly descriptionText = computed(() =>
    this.description()?.trim(),
  );

  constructor() {
    this.rowLoader.initialize(
      this.data,
      this.beforeRequest,
      (failure) => {
        this.loadError.emit(failure);
      },
      { afterRequestHook: this.afterRequestHook },
    );
  }

  protected retry(): void {
    this.rowLoader.retry();
  }
}
