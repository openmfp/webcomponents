export function setPropertyByPath<T extends Record<string, any>>(
  object: T,
  path: string,
  value: unknown,
): T {
  const segments = path.split('.').filter(Boolean);
  if (segments.length === 0) {
    return object;
  }

  let current: Record<string, any> = object;

  for (let i = 0; i < segments.length; i += 1) {
    const key = segments[i];
    if (i === segments.length - 1) {
      current[key] = value;
      break;
    }

    const existing = current[key];

    if (existing === undefined || existing === null || typeof existing !== 'object') {
      current[key] = {};
    }

    current = current[key];
  }

  return object;
}
