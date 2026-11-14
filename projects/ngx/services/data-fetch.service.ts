import type { CardRequest, FetchAttempt, JsonValue } from './data-fetch.model';
import { Injectable, untracked } from '@angular/core';

export class DataFetchConfigurationError extends TypeError {
  constructor(cause: unknown) {
    super('The request configuration is invalid.', { cause });
  }
}

export class DataFetchHttpError extends Error {
  constructor(readonly status: number) {
    super('The data request failed.');
  }
}

@Injectable()
export class DataFetchService {
  async fetchData(
    config: CardRequest,
    attempt: FetchAttempt,
  ): Promise<unknown> {
    const { signal, beforeRequest } = attempt;
    signal.throwIfAborted();

    const request = this.createRequest(config, signal);
    const replacement = await untracked(() => beforeRequest?.(request));
    const effectiveRequest = replacement === undefined ? request : replacement;

    if (!(effectiveRequest instanceof Request)) {
      throw new TypeError('The request hook must supply a Request.');
    }

    return this.sendRequest(effectiveRequest, attempt);
  }

  private async sendRequest(
    request: Request,
    { signal, beforeSend, afterRequestHook }: FetchAttempt,
  ): Promise<unknown> {
    const transport = new AbortController();
    const combinedSignal = AbortSignal.any([
      signal,
      request.signal,
      transport.signal,
    ]);

    beforeSend?.();
    combinedSignal.throwIfAborted();

    const response = await fetch(request, {
      signal: combinedSignal,
      referrer: request.referrer,
      referrerPolicy: request.referrerPolicy,
    });
    combinedSignal.throwIfAborted();

    if (!response.ok) {
      transport.abort();
      throw new DataFetchHttpError(response.status);
    }

    if (
      request.method === 'HEAD' ||
      response.status === 204 ||
      response.status === 205
    ) {
      return undefined;
    }

    const payload: JsonValue = await response.json();
    combinedSignal.throwIfAborted();
    if (!afterRequestHook) return payload;

    const mapping = (async () => untracked(() => afterRequestHook(payload)))();
    const mappedPayload = await this.waitForMapping(mapping, combinedSignal);
    combinedSignal.throwIfAborted();
    return mappedPayload === undefined ? payload : mappedPayload;
  }

  private waitForMapping(
    mapping: Promise<JsonValue | void>,
    signal: AbortSignal,
  ): Promise<JsonValue | void> {
    return new Promise((resolve, reject) => {
      const onAbort = () => {
        reject(signal.reason);
      };
      if (signal.aborted) {
        onAbort();
      } else {
        signal.addEventListener('abort', onAbort, { once: true });
      }

      void mapping
        .finally(() => {
          signal.removeEventListener('abort', onAbort);
        })
        .then(resolve, reject);
    });
  }

  private createRequest(config: CardRequest, signal: AbortSignal): Request {
    try {
      const { method, query, headers, body, credentials, mode } = config;
      const url = new URL(config.url);
      this.applyQueryParams(url, query);

      const requestHeaders = new Headers(headers);
      const requestBody = this.encodeBody(body, requestHeaders);

      return new Request(url, {
        method,
        headers: requestHeaders,
        body: requestBody,
        credentials,
        mode,
        signal,
      });
    } catch (error) {
      throw new DataFetchConfigurationError(error);
    }
  }

  private applyQueryParams(url: URL, query?: Record<string, unknown>): void {
    for (const [key, value] of Object.entries(query ?? {})) {
      url.searchParams.delete(key);

      const values = Array.isArray(value) ? value : [value];

      for (const entry of values) {
        url.searchParams.append(key, String(entry));
      }
    }
  }

  private encodeBody(
    body: CardRequest['body'],
    headers: Headers,
  ): string | undefined {
    if (body === undefined) return undefined;

    const json = JSON.stringify(body);
    if (json === undefined) {
      throw new TypeError('The request body must be JSON serializable.');
    }

    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    return json;
  }
}
