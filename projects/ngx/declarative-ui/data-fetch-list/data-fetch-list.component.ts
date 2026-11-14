import { DataFetchRowsService } from '../../services/data-fetch-rows.service';
import type {
  AfterRequestHook,
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
import {
  ErrorView,
  type ErrorViewButton,
  type ErrorViewConfig,
} from '../error-view';
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
import '@ui5/webcomponents-fiori/dist/illustrations/NoData.js';
import '@ui5/webcomponents-fiori/dist/illustrations/UnableToLoad.js';
import '@ui5/webcomponents-fiori/dist/illustrations/tnt/UnsuccessfulAuth.js';

@Component({
  selector: 'mfp-data-fetch-list',
  imports: [BusyIndicator, DataFetchMetadata, ErrorView, ResourceField],
  standalone: true,
  templateUrl: './data-fetch-list.component.html',
  styleUrl: './data-fetch-list.component.scss',
  providers: [DataFetchRowsService, DataFetchService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.ShadowDom,
  host: {
    '[class.showing-state]':
      'loading() || errorConfig() !== undefined || isEmpty()',
  },
})
export class DataFetchList {
  readonly data = input<DataFetchRequestData>();
  readonly beforeRequest = input<BeforeRequest>();
  readonly afterRequestHook = input<AfterRequestHook>();
  readonly lastUpdated = input<DataFetchLastUpdated>();
  readonly status = input<CardStatus>();
  readonly description = input<string>();
  readonly fieldDefinition = input<FieldDefinition>({ property: 'label' });
  readonly emptyState = input<Omit<ErrorViewConfig, 'illustration'>>();
  readonly errorState = input<Omit<ErrorViewConfig, 'illustration'>>();

  readonly loadError = output<DataFetchLoadError>();

  private readonly rowLoader = inject(DataFetchRowsService);

  protected readonly rows = this.rowLoader.rows;
  protected readonly loading = this.rowLoader.loading;
  protected readonly snapshot = this.rowLoader.snapshot;
  protected readonly isEmpty = computed(
    () => this.snapshot()?.rows.length === 0,
  );
  protected readonly descriptionText = computed(() =>
    this.description()?.trim(),
  );
  protected readonly emptyConfig = computed<ErrorViewConfig>(() => {
    const state = this.emptyState();
    return {
      illustration: 'NoData',
      title: state?.title ?? 'No items to display.',
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
      title: state?.title ?? 'Unable to load list',
      subtitle: state?.subtitle ?? 'The list data could not be loaded.',
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
      { afterRequestHook: this.afterRequestHook },
    );
  }

  protected retry(key: string): void {
    if (key === 'retry') {
      this.rowLoader.retry();
    }
  }
}
