export function coerceBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.trim().toLowerCase() === 'true';
  }
  return false;
}
