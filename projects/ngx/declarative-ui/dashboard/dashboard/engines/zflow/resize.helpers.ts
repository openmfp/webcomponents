export function getAllowedResizeWidths(
  maxWidth: number,
  columnCount: number,
  minWidth = 1,
  effectiveMax = columnCount,
): number[] {
  return [1, 2, maxWidth]
    .map((w) => Math.min(Math.max(w, minWidth), columnCount))
    .filter((w, i, list) => list.indexOf(w) === i && w <= effectiveMax)
    .sort((a, b) => a - b);
}

export function resolveResizeWidthStep(
  rawWidth: number,
  maxWidth: number,
  columnCount: number,
  minWidth = 1,
  effectiveMax = columnCount,
): number {
  const allowed = getAllowedResizeWidths(
    maxWidth,
    columnCount,
    minWidth,
    effectiveMax,
  );

  if (!allowed.length) {
    return effectiveMax;
  }

  return allowed.reduce((best, candidate) => {
    return Math.abs(candidate - rawWidth) <= Math.abs(best - rawWidth)
      ? candidate
      : best;
  }, allowed[0]);
}

export type ResizeDirection = 'grow' | 'shrink';

export function resolveDirectionalResizeWidthStep(
  currentWidth: number,
  direction: ResizeDirection,
  maxWidth: number,
  columnCount: number,
  minWidth = 1,
  hardMax = columnCount,
): number | null {
  const allowed = getAllowedResizeWidths(
    maxWidth,
    columnCount,
    minWidth,
    hardMax,
  );

  if (direction === 'grow') {
    return allowed.find((width) => width > currentWidth) ?? null;
  }

  return [...allowed].reverse().find((width) => width < currentWidth) ?? null;
}
