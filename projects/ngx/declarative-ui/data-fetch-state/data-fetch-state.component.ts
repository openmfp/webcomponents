import { DataFetchRowsService } from '../../services/data-fetch-rows.service';
import {
  ErrorView,
  type ErrorViewButton,
  type ErrorViewConfig,
} from '../error-view';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { BusyIndicator } from '@fundamental-ngx/ui5-webcomponents/busy-indicator';
import '@ui5/webcomponents-fiori/dist/illustrations/NoData.js';
import '@ui5/webcomponents-fiori/dist/illustrations/UnableToLoad.js';
import '@ui5/webcomponents-fiori/dist/illustrations/tnt/UnsuccessfulAuth.js';

const STATE_TEXT = {
  list: {
    emptyTitle: 'No items to display.',
    errorTitle: 'Unable to load list',
    errorSubtitle: 'The list data could not be loaded.',
  },
  table: {
    emptyTitle: 'No Resources',
    errorTitle: 'Unable to load data',
    errorSubtitle: 'The table data could not be loaded.',
  },
};

const DEFAULT_BUTTONS: ErrorViewButton[] = [
  { key: 'retry', label: 'Retry', design: 'Emphasized' },
];

@Component({
  selector: 'mfp-data-fetch-state',
  imports: [BusyIndicator, ErrorView],
  standalone: true,
  templateUrl: './data-fetch-state.component.html',
  styleUrl: './data-fetch-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataFetchState {
  readonly kind = input.required<'list' | 'table'>();
  readonly emptyState = input<Omit<ErrorViewConfig, 'illustration'>>();
  readonly errorState = input<Omit<ErrorViewConfig, 'illustration'>>();

  private readonly rowLoader = inject(DataFetchRowsService);

  protected readonly state = this.rowLoader.state;
  protected readonly config = computed<ErrorViewConfig | undefined>(() => {
    const text = STATE_TEXT[this.kind()];
    if (this.state() === 'empty') {
      const overrides = this.emptyState();
      return {
        illustration: 'NoData',
        title: overrides?.title ?? text.emptyTitle,
        subtitle:
          overrides?.subtitle ?? 'There are currently no items to show.',
      };
    }

    const failure = this.rowLoader.failure();
    if (!failure) return undefined;

    const overrides = this.errorState();
    const retryButton = failure.retryable
      ? (overrides?.buttons ?? DEFAULT_BUTTONS).find(
          (button) => button.key === 'retry',
        )
      : undefined;

    return {
      illustration:
        failure.status === 403 ? 'tnt/UnsuccessfulAuth' : 'UnableToLoad',
      title: overrides?.title ?? text.errorTitle,
      subtitle: overrides?.subtitle ?? text.errorSubtitle,
      buttons: retryButton ? [retryButton] : undefined,
    };
  });

  protected retry(key: string): void {
    if (key === 'retry') {
      this.rowLoader.retry();
    }
  }
}
