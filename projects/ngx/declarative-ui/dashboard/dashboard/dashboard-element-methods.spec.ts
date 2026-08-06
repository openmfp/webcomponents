import { defineDashboardElementMethods } from './dashboard-element-methods';
import type { Dashboard } from './dashboard.component';

/**
 * Builds a fake custom-element class plus a stub {@link Dashboard} instance, and
 * wires the two together the way `@angular/elements` does (`ngElementStrategy.
 * componentRef.instance`). `connectInstance` lets a test decide whether the
 * element already has a live component behind it.
 */
function setup() {
  class FakeElement {
    ngElementStrategy?: { componentRef?: { instance?: Dashboard } };
  }
  defineDashboardElementMethods(FakeElement as unknown as CustomElementConstructor);

  const instance = {
    // Mimic the "unsaved changes → dialog opened, do not navigate" path.
    requestNavigation: vi.fn(() => false),
    saveEdit: vi.fn(),
    cancelEdit: vi.fn(),
    confirmDiscard: vi.fn(),
    onUnsavedNavSave: vi.fn(),
    onUnsavedNavDiscard: vi.fn(),
    onUnsavedNavCancel: vi.fn(),
  } as unknown as Dashboard;

  const element = new FakeElement() as FakeElement &
    Record<string, (...args: unknown[]) => unknown>;

  const connectInstance = () => {
    element.ngElementStrategy = { componentRef: { instance } };
  };

  return { element, instance, connectInstance };
}

const VOID_METHODS = [
  'saveEdit',
  'cancelEdit',
  'confirmDiscard',
  'onUnsavedNavSave',
  'onUnsavedNavDiscard',
  'onUnsavedNavCancel',
] as const;

describe('defineDashboardElementMethods', () => {
  it('defines requestNavigation and every void handler on the prototype', () => {
    const { element } = setup();

    expect(typeof element['requestNavigation']).toBe('function');
    for (const name of VOID_METHODS) {
      expect(typeof element[name]).toBe('function');
    }
  });

  describe('when the Angular component instance exists', () => {
    it('delegates requestNavigation to the instance and returns its result', () => {
      const { element, instance, connectInstance } = setup();
      connectInstance();
      const proceed = vi.fn();

      const result = element['requestNavigation'](proceed);

      expect(instance.requestNavigation).toHaveBeenCalledWith(proceed);
      // The stub reports "dialog opened", so the DOM call must NOT navigate.
      expect(result).toBe(false);
      expect(proceed).not.toHaveBeenCalled();
    });

    it.each(VOID_METHODS)('delegates %s to the instance', (name) => {
      const { element, instance, connectInstance } = setup();
      connectInstance();

      element[name]();

      expect(instance[name]).toHaveBeenCalledTimes(1);
    });
  });

  describe('when the Angular component instance is not yet created', () => {
    it('runs the requestNavigation callback synchronously and returns true', () => {
      const { element } = setup();
      const proceed = vi.fn();

      const result = element['requestNavigation'](proceed);

      expect(proceed).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
    });

    it.each(VOID_METHODS)('no-ops %s without throwing', (name) => {
      const { element } = setup();

      expect(() => element[name]()).not.toThrow();
    });
  });
});
