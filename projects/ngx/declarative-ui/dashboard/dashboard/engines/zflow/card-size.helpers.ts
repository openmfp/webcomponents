import {
  ZFLOW_PAGE_SIZES,
  ZFlowPageSizeConfig,
} from '../../../constants/breakpoints';
import { CARD_SIZES, CardSize } from '../../../models';

const ALL_CARD_SIZES: readonly CardSize[] = Object.values(CARD_SIZES);

export function getZFlowPageSizeConfig(
  columns: number,
  width: number,
): ZFlowPageSizeConfig | undefined {
  const pages = ZFLOW_PAGE_SIZES.filter((page) => page.columns === columns);
  return (
    pages.find(
      (page) => page.maxWidth === undefined || width <= page.maxWidth,
    ) ?? pages.at(-1)
  );
}

function getZFlowCardSpansByColumns(
  columns: number,
): Readonly<Record<CardSize, number>> | undefined {
  return ZFLOW_PAGE_SIZES.find((page) => page.columns === columns)?.cardSpans;
}

export function isCardSize(value: unknown): value is CardSize {
  return ALL_CARD_SIZES.includes(value as CardSize);
}

export function getZFlowCardSpan(
  size: CardSize,
  columns: number,
): number | undefined {
  return getZFlowCardSpansByColumns(columns)?.[size];
}

export function getZFlowCardSpans(columns: number): number[] {
  const cardSpans = getZFlowCardSpansByColumns(columns);
  if (!cardSpans) return [];

  return [...new Set(ALL_CARD_SIZES.map((size) => cardSpans[size]))].sort(
    (a, b) => a - b,
  );
}

export function resolveZFlowCardSize(
  span: number,
  columns: number,
  currentSize?: CardSize,
): CardSize | undefined {
  const cardSpans = getZFlowCardSpansByColumns(columns);
  if (!cardSpans) return currentSize;
  if (currentSize && cardSpans[currentSize] === span) return currentSize;

  return ALL_CARD_SIZES.find((size) => cardSpans[size] === span) ?? currentSize;
}
