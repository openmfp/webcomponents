export type JsonValue =
  | string
  | number
  | boolean
  | null
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

type RequestParam = string | number | boolean;

export interface CardRequest {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  query?: Record<string, RequestParam | readonly RequestParam[]>;
  headers?: Record<string, string>;
  body?: JsonValue;
  credentials?: RequestCredentials;
  mode?: 'cors' | 'same-origin';
}

export interface DataFetchRequestData {
  request: CardRequest;
  path?: string;
}

export type BeforeRequest = (
  request: Request,
  cardId?: string,
) => Request | void | Promise<Request | void>;

export type AfterRequestHook = (
  response: JsonValue,
) => JsonValue | void | Promise<JsonValue | void>;

export type BeforeCardRequest = (
  request: Request,
  cardId: string,
) => ReturnType<BeforeRequest>;

export type AfterCardRequest = (
  response: JsonValue,
  cardId: string,
) => ReturnType<AfterRequestHook>;

export interface DataFetchLoadError {
  status?: number;
  retryable: boolean;
}

export interface FetchAttempt {
  signal: AbortSignal;
  beforeRequest?: BeforeRequest;
  afterRequestHook?: AfterRequestHook;
  beforeSend?: () => void;
}
