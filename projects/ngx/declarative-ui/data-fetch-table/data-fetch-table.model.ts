import type {
  BeforeRequest,
  CardRequest,
} from '../../services/data-fetch.model';

export type {
  BeforeRequest,
  CardRequest,
  JsonValue,
} from '../../services/data-fetch.model';

export type DataFetchTableData = { path?: string } & (
  | { request: CardRequest; resource?: object }
  | { resource: object; request?: undefined }
);

export type BeforeCardRequest = (
  request: Request,
  cardId: string,
) => ReturnType<BeforeRequest>;

export interface DataFetchTableLoadError {
  status?: number;
  retryable: boolean;
}
