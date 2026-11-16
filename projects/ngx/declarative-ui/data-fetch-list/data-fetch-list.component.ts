import { DataFetchRowsService } from '../../services/data-fetch-rows.service';
import type {
  AfterRequest,
  BeforeRequest,
  DataFetchLoadError,
  DataFetchRequestData,
} from '../../services/data-fetch.model';
import { DataFetchService } from '../../services/data-fetch.service';
import { DataFetchMetadata } from '../data-fetch-metadata/data-fetch-metadata.component';
import type {
  CardStatus,
  DataFetchLastUpdated,
} from '../data-fetch-metadata/data-fetch-metadata.model';
import { DataFetchState } from '../data-fetch-state/data-fetch-state.component';
import type { ErrorViewConfig } from '../error-view';
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

@Component({
  selector: 'mfp-data-fetch-list-card',
  imports: [DataFetchMetadata, DataFetchState, ResourceField],
  standalone: true,
  templateUrl: './data-fetch-list.component.html',
  styleUrl: './data-fetch-list.component.scss',
  providers: [DataFetchRowsService, DataFetchService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.ShadowDom,
  host: {
    '[class.showing-state]': "state() !== 'ready'",
  },
})
export class DataFetchList {
  readonly data = input<DataFetchRequestData>();
  readonly beforeRequest = input<BeforeRequest>();
  readonly afterRequest = input<AfterRequest>();
  readonly lastUpdated = input<DataFetchLastUpdated>();
  readonly status = input<CardStatus>();
  readonly description = input<string>();
  readonly fieldDefinition = input<FieldDefinition>({ property: 'label' });
  readonly emptyState = input<Omit<ErrorViewConfig, 'illustration'>>();
  readonly errorState = input<Omit<ErrorViewConfig, 'illustration'>>();

  readonly loadError = output<DataFetchLoadError>();

  private readonly rowLoader = inject(DataFetchRowsService);

  protected readonly rows = this.rowLoader.rows;
  protected readonly state = this.rowLoader.state;
  protected readonly snapshot = this.rowLoader.snapshot;
  protected readonly descriptionText = computed(() =>
    this.description()?.trim(),
  );

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
}
