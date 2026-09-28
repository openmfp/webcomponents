export function getAllowedResizeWidths(
  spans: readonly number[],
  effectiveMax: number,
): number[] {
  return spans.filter((span) => span <= effectiveMax);
}

export function resolveResizeWidthStep(
  rawWidth: number,
  spans: readonly number[],
  effectiveMax: number,
): number {
  const allowed = getAllowedResizeWidths(spans, effectiveMax);

  if (!allowed.length) {
    return spans[0];
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
  spans: readonly number[],
  hardMax: number,
): number | null {
  const allowed = getAllowedResizeWidths(spans, hardMax);

  if (direction === 'grow') {
    return allowed.find((width) => width > currentWidth) ?? null;
  }

  return [...allowed].reverse().find((width) => width < currentWidth) ?? null;
}
