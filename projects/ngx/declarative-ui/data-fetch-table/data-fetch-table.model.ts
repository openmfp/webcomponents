import type { DataFetchRequestData } from '../../services/data-fetch.model';

export type { BeforeRequest } from '../../services/data-fetch.model';

export type DataFetchTableData =
  | (DataFetchRequestData & { resource?: object })
  | { resource: object; path?: string; request?: undefined };
