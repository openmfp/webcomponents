import {
  ZFLOW_PAGE_SIZES,
  ZFlowPageSizeConfig,
} from '../../../constants/breakpoints';
import { CARD_SIZES, CardSize } from '../../../models';

const ALL_CARD_SIZES: readonly CardSize[] = Object.values(CARD_SIZES);

export function getZFlowPageSizeConfig(
  columns: number,
): ZFlowPageSizeConfig | undefined {
  return ZFLOW_PAGE_SIZES.find((page) => page.columns === columns);
}

export function isCardSize(value: unknown): value is CardSize {
  return ALL_CARD_SIZES.includes(value as CardSize);
}

export function getZFlowCardSpan(
  size: CardSize,
  columns: number,
): number | undefined {
  return getZFlowPageSizeConfig(columns)?.cardSpans[size];
}

export function getZFlowCardSpans(columns: number): number[] {
  const page = getZFlowPageSizeConfig(columns);
  if (!page) return [];

  return [...new Set(ALL_CARD_SIZES.map((size) => page.cardSpans[size]))].sort(
    (a, b) => a - b,
  );
}

export function resolveZFlowCardSize(
  span: number,
  columns: number,
  currentSize?: CardSize,
): CardSize | undefined {
  const page = getZFlowPageSizeConfig(columns);
  if (!page) return currentSize;
  if (currentSize && page.cardSpans[currentSize] === span) return currentSize;

  return (
    ALL_CARD_SIZES.find((size) => page.cardSpans[size] === span) ?? currentSize
  );
}
