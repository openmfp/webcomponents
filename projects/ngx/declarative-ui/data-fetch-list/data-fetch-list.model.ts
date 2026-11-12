import type { CardRequest } from '../../services/data-fetch.model';

export interface DataFetchListData {
  request: CardRequest;
  path?: string;
}

export interface DataFetchListLoadError {
  status?: number;
  retryable: boolean;
}
