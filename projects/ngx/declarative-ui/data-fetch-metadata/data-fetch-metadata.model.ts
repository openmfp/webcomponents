export type DataFetchLastUpdated = { label: string } & (
  | { text: string; path?: never; locale?: never }
  | { path: string; text?: never; locale?: string }
);
