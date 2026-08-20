import type { NoViolationsMatcherResult } from 'vitest-axe/matchers';

// vitest-axe@0.1 augments the legacy `Vi.Assertion` namespace, which vitest 4
// no longer uses for custom matchers. Augment the current `Matchers` interface
// so `toHaveNoViolations` is typed on `expect(...)`.
declare module 'vitest' {
  interface Matchers<T = unknown> {
    toHaveNoViolations(): T;
  }
}

export type { NoViolationsMatcherResult };
