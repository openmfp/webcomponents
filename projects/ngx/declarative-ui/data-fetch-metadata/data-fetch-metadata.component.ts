import type { DataFetchRowsSnapshot } from '../../services/data-fetch-rows.service';
import { getResourceValueByJsonPath } from '../table/utils/resource-field-by-path';
import type {
  CardStatus,
  CardStatusState,
  DataFetchLastUpdated,
} from './data-fetch-metadata.model';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { Icon } from '@fundamental-ngx/ui5-webcomponents/icon';
import { getLanguage } from '@ui5/webcomponents-base/dist/config/Language.js';
import '@ui5/webcomponents-icons/dist/message-information.js';
import '@ui5/webcomponents-icons/dist/status-critical.js';
import '@ui5/webcomponents-icons/dist/status-inactive.js';
import '@ui5/webcomponents-icons/dist/status-negative.js';
import '@ui5/webcomponents-icons/dist/status-positive.js';

const STATUS_ICONS: Record<CardStatusState, string> = {
  Neutral: 'status-inactive',
  Information: 'message-information',
  Positive: 'status-positive',
  Negative: 'status-negative',
  Critical: 'status-critical',
};

const MINUTES_PER_DAY = 24 * 60;
const ELAPSED_UNITS = [
  { unit: 'year', minutes: 365 * MINUTES_PER_DAY },
  { unit: 'month', minutes: 30 * MINUTES_PER_DAY },
  { unit: 'week', minutes: 7 * MINUTES_PER_DAY },
  { unit: 'day', minutes: MINUTES_PER_DAY },
  { unit: 'hour', minutes: 60 },
  { unit: 'minute', minutes: 1 },
] as const;

@Component({
  selector: 'mfp-data-fetch-metadata',
  imports: [Icon],
  standalone: true,
  templateUrl: './data-fetch-metadata.component.html',
  styleUrl: './data-fetch-metadata.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[hidden]': '!metadata()' },
})
export class DataFetchMetadata {
  readonly lastUpdated = input<DataFetchLastUpdated>();
  readonly status = input<CardStatus>();
  readonly snapshot = input<DataFetchRowsSnapshot>();

  protected readonly statusIcons = STATUS_ICONS;

  protected readonly metadata = computed(() => {
    const snapshot = this.snapshot();
    const updatedText = this.resolveLastUpdated(
      this.lastUpdated(),
      snapshot?.response,
    );
    const status = this.resolveStatus(this.status(), snapshot);
    if (!updatedText && !status) return undefined;

    return { updatedText, status };
  });

  private resolveLastUpdated(
    lastUpdated: DataFetchLastUpdated | undefined,
    response: unknown,
  ): string | undefined {
    if (typeof lastUpdated?.label !== 'string') return undefined;

    const value =
      typeof lastUpdated.text === 'string'
        ? lastUpdated.text.trim()
        : this.formatElapsedTime(
            this.readResponsePath(response, lastUpdated.path),
            lastUpdated.locale,
          );
    if (!value) return undefined;

    const label = lastUpdated.label.trim();
    return label ? `${label} ${value}` : value;
  }

  private resolveStatus(
    status: CardStatus | undefined,
    snapshot: DataFetchRowsSnapshot | undefined,
  ): CardStatus | undefined {
    if (typeof status?.text !== 'string' || !status.text.trim())
      return undefined;

    let hasUnresolvedToken = false;
    const text = status.text.replace(
      /{{(.*?)}}/gs,
      (_match, placeholder: string) => {
        const token = placeholder.trim();
        let value: unknown;
        if (token === '$length') {
          value = snapshot?.rows.length;
        } else if (token.startsWith('response.')) {
          value = this.readResponsePath(
            snapshot?.response,
            token.slice('response.'.length),
          );
        }

        if (typeof value === 'number' || typeof value === 'boolean') {
          return String(value);
        }
        if (typeof value === 'string' && value.trim()) return value;

        hasUnresolvedToken = true;
        return '';
      },
    );

    return hasUnresolvedToken ? undefined : { text, state: status.state };
  }

  private readResponsePath(
    response: unknown,
    path: string | undefined,
  ): unknown {
    if (
      response === null ||
      typeof response !== 'object' ||
      typeof path !== 'string' ||
      !path.trim()
    ) {
      return undefined;
    }

    try {
      return getResourceValueByJsonPath(
        response,
        { property: path },
        { eval: false },
      );
    } catch {
      return undefined;
    }
  }

  private formatElapsedTime(
    value: unknown,
    locale: string | undefined,
  ): string | undefined {
    if (typeof value !== 'string') return undefined;
    const timestampMs = Date.parse(value);
    if (Number.isNaN(timestampMs)) return undefined;

    const elapsedMinutes = (Date.now() - timestampMs) / 60_000;
    const duration = ELAPSED_UNITS.find(
      ({ minutes }) => elapsedMinutes >= minutes,
    );
    const formatter = this.createRelativeTimeFormatter(locale);
    return duration
      ? formatter.format(
          -Math.floor(elapsedMinutes / duration.minutes),
          duration.unit,
        )
      : formatter.format(0, 'second');
  }

  private createRelativeTimeFormatter(
    locale: string | undefined,
  ): Intl.RelativeTimeFormat {
    for (const language of [
      locale,
      getLanguage(),
      globalThis.navigator?.language,
    ]) {
      if (!language) continue;
      try {
        const [supported] =
          Intl.RelativeTimeFormat.supportedLocalesOf(language);
        if (supported)
          return new Intl.RelativeTimeFormat(supported, { numeric: 'auto' });
      } catch {
        continue;
      }
    }
    return new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  }
}
