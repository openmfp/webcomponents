import type { Dashboard } from './dashboard.component';

/**
 * Public no-argument, `void`-returning handlers on {@link Dashboard} that we
 * forward onto the custom element so non-Angular consumers can drive the
 * edit-mode / unsaved-changes flow directly on the DOM node.
 */
const VOID_METHODS = [
  'saveEdit',
  'cancelEdit',
  'confirmDiscard',
  'onUnsavedNavSave',
  'onUnsavedNavDiscard',
  'onUnsavedNavCancel',
] as const satisfies readonly (keyof Dashboard)[];

/** Reads the live Angular component instance backing an `@angular/elements` custom element. */
function getInstance(element: unknown): Dashboard | undefined {
  return (
    element as {
      ngElementStrategy?: { componentRef?: { instance?: Dashboard } };
    }
  ).ngElementStrategy?.componentRef?.instance;
}

/**
 * `createCustomElement` only proxies `@Input()`/`output()` — public methods on
 * the component class are NOT reachable from the DOM. This forwards the
 * dashboard's public methods onto the custom-element prototype so that
 * non-Angular consumers (UI5, plain JS, Luigi, etc.) can call them directly on
 * the `<mfp-wc-dashboard>` DOM node.
 *
 * `requestNavigation` needs a synchronous fallback when the Angular component
 * isn't created yet: run the navigation immediately (returning `true`) rather
 * than silently blocking the user — this preserves the original, pre-guard
 * behaviour. The remaining handlers no-op until the component exists.
 */
export function defineDashboardElementMethods(
  elementCtor: CustomElementConstructor,
): void {
  const proto = elementCtor.prototype;

  Object.defineProperty(proto, 'requestNavigation', {
    value(proceed: () => void): boolean {
      const instance = getInstance(this);
      if (!instance) {
        proceed();
        return true;
      }
      return instance.requestNavigation(proceed);
    },
    configurable: true,
    writable: true,
  });

  for (const name of VOID_METHODS) {
    Object.defineProperty(proto, name, {
      value(): void {
        getInstance(this)?.[name]();
      },
      configurable: true,
      writable: true,
    });
  }
}
