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
  NgZone,
  computed,
  effect,
  inject,
  input,
  signal,
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

const MINUTE_MS = 60_000;
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

  private readonly relativeTimestamp = computed(() => {
    const config = this.lastUpdated();
    if (typeof config?.label !== 'string' || typeof config.text === 'string') {
      return undefined;
    }

    const value = this.readResponsePath(this.snapshot()?.response, config.path);
    if (typeof value !== 'string') return undefined;

    const timestampMs = Date.parse(value);
    return Number.isNaN(timestampMs) ? undefined : timestampMs;
  });
  private readonly hasRelativeTimestamp = computed(
    () => this.relativeTimestamp() !== undefined,
  );
  private readonly clockTick = signal(0);
  private formatterCache?: {
    locales: readonly (string | undefined)[];
    formatter: Intl.RelativeTimeFormat;
  };

  private readonly updatedText = computed(() => {
    const config = this.lastUpdated();
    if (typeof config?.label !== 'string') return undefined;

    const text =
      typeof config.text === 'string'
        ? config.text.trim()
        : this.formatElapsedTime(config.locale);
    if (!text) return undefined;

    const label = config.label.trim();
    return label ? `${label} ${text}` : text;
  });
  private readonly resolvedStatus = computed(() =>
    this.resolveStatus(this.status(), this.snapshot()),
  );

  protected readonly metadata = computed(() => {
    const updatedText = this.updatedText();
    const status = this.resolvedStatus();
    if (!updatedText && !status) return undefined;

    return { updatedText, status };
  });

  constructor() {
    const zone = inject(NgZone);
    effect((onCleanup) => {
      if (!this.hasRelativeTimestamp()) return;

      const timer = zone.runOutsideAngular(() =>
        setInterval(() => {
          this.clockTick.update((tick) => tick + 1);
        }, MINUTE_MS),
      );
      onCleanup(() => {
        clearInterval(timer);
      });
    });
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

  private formatElapsedTime(locale: string | undefined): string | undefined {
    const timestampMs = this.relativeTimestamp();
    if (timestampMs === undefined) return undefined;

    this.clockTick();
    const elapsedMinutes = (Date.now() - timestampMs) / MINUTE_MS;
    const duration = ELAPSED_UNITS.find(
      ({ minutes }) => elapsedMinutes >= minutes,
    );
    const formatter = this.getRelativeTimeFormatter(locale);
    return duration
      ? formatter.format(
          -Math.floor(elapsedMinutes / duration.minutes),
          duration.unit,
        )
      : formatter.format(0, 'second');
  }

  private getRelativeTimeFormatter(
    locale: string | undefined,
  ): Intl.RelativeTimeFormat {
    const locales = [locale, getLanguage(), globalThis.navigator?.language];
    const cached = this.formatterCache;
    if (
      cached &&
      locales.every((candidate, index) => candidate === cached.locales[index])
    ) {
      return cached.formatter;
    }

    let supportedLocale: string | undefined;
    for (const candidate of locales) {
      if (!candidate) continue;
      try {
        supportedLocale =
          Intl.RelativeTimeFormat.supportedLocalesOf(candidate)[0];
        if (supportedLocale) break;
      } catch {
        continue;
      }
    }
    const formatter = new Intl.RelativeTimeFormat(supportedLocale, {
      numeric: 'auto',
    });
    this.formatterCache = { locales, formatter };
    return formatter;
  }
}
