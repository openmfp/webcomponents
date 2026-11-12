import { DataFetchRowsService } from '../../services/data-fetch-rows.service';
import type { BeforeRequest } from '../../services/data-fetch.model';
import { DataFetchService } from '../../services/data-fetch.service';
import type { FieldDefinition } from '../models';
import { ResourceField } from '../resource-field';
import type {
  DataFetchListData,
  DataFetchListLoadError,
} from './data-fetch-list.model';
import {
  ChangeDetectionStrategy,
  Component,
  type Signal,
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
  imports: [BusyIndicator, Button, ResourceField],
  standalone: true,
  templateUrl: './data-fetch-list.component.html',
  styleUrl: './data-fetch-list.component.scss',
  providers: [DataFetchRowsService, DataFetchService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class DataFetchList {
  readonly data = input<DataFetchListData>();
  readonly beforeRequest = input<BeforeRequest>();
  readonly description = input<string>();
  readonly fieldDefinition = input<FieldDefinition>({ property: 'label' });
  readonly errorTitle = input('Unable to load list');
  readonly errorMessage = input('The list data could not be loaded.');
  readonly retryButtonText = input('Retry');

  readonly loadError = output<DataFetchListLoadError>();

  private readonly rowLoader = inject(DataFetchRowsService);

  protected readonly rows = this.rowLoader.rows;
  protected readonly loading = this.rowLoader.loading;
  protected readonly failure: Signal<DataFetchListLoadError | null> =
    this.rowLoader.failure;
  protected readonly descriptionText = computed(() =>
    this.description()?.trim(),
  );

  constructor() {
    this.rowLoader.initialize(this.data, this.beforeRequest, (failure) => {
      this.loadError.emit(failure);
    });
  }

  protected retry(): void {
    this.rowLoader.retry();
  }
}
