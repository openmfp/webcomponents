import { expect } from 'vitest';
import * as matchers from 'vitest-axe/matchers';

expect.extend(matchers);

// jsdom ships no ResizeObserver; components that measure their own layout
// construct one, so provide an inert stand-in that never fires.
if (!('ResizeObserver' in globalThis)) {
  const noop = (): void => undefined;
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
    observe = noop;
    unobserve = noop;
    disconnect = noop;
  };
}
