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

export type BeforeRequest = (
  request: Request,
  cardId?: string,
) => Request | void | Promise<Request | void>;

export interface FetchAttempt {
  signal: AbortSignal;
  beforeRequest?: BeforeRequest;
  beforeSend?: () => void;
}
