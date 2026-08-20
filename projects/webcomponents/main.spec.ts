import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const createApplication = vi.fn();
const createCustomElement = vi.fn();
const ignoreCustomElements = vi.fn();

vi.mock('@angular/platform-browser', () => ({
  createApplication,
}));

vi.mock('@angular/elements', () => ({
  createCustomElement,
}));

vi.mock('@ui5/webcomponents-base/dist/IgnoreCustomElements.js', () => ({
  ignoreCustomElements,
}));

// gridstack fails to resolve under jsdom; the real declarative-ui barrel pulls
// it in transitively via the dashboard component. Stub it as the dashboard
// spec does so the barrel can load.
vi.mock('gridstack', () => ({}));
vi.mock('gridstack/dist/angular', async () => {
  const { Component } = await import('@angular/core');
  @Component({ selector: 'gridstack', template: '' })
  class GridstackComponent {}
  @Component({ selector: 'gridstack-item', template: '' })
  class GridstackItemComponent {}
  return { GridstackComponent, GridstackItemComponent, gsCreateNgComponents: vi.fn() };
});

type StrategyHost = {
  ngElementStrategy?: { componentRef?: { instance: unknown } };
};

function makeBaseElement(): CustomElementConstructor {
  return class extends HTMLElement {} as unknown as CustomElementConstructor;
}

/**
 * Imports `main.ts` (a top-level async IIFE) with all of its side-effecting
 * dependencies stubbed, then waits for the async bootstrap to settle. Returns
 * the map of every `customElements.define(name, ctor)` call the module made.
 */
async function importMain(): Promise<Map<string, CustomElementConstructor>> {
  const defined = new Map<string, CustomElementConstructor>();
  registrationSalt += 1;
  const realDefine = customElements.define.bind(customElements);
  vi.spyOn(customElements, 'define').mockImplementation(
    (name: string, ctor: CustomElementConstructor, options?: ElementDefinitionOptions) => {
      defined.set(name, ctor);
      // Actually register so the element is constructable in jsdom (instances
      // are needed to exercise the method proxies). Use a unique tag per run to
      // avoid "already defined" across resetModules().
      const uniqueTag = `${name}-${defined.size}-${registrationSalt}`;
      realDefine(uniqueTag, ctor, options);
    },
  );

  createApplication.mockResolvedValue({ injector: {} });
  // Each createCustomElement call returns a fresh HTMLElement subclass so the
  // `class X extends Base` proxy declarations in main.ts are constructable.
  createCustomElement.mockImplementation(() => makeBaseElement());

  await import('./main');
  // Let the IIFE's awaited createApplication().then(...) body run.
  await vi.waitFor(() => expect(defined.size).toBeGreaterThan(0));
  await Promise.resolve();

  return defined;
}

let registrationSalt = 0;

describe('webcomponents/main.ts', () => {
  beforeEach(() => {
    vi.resetModules();
    createApplication.mockReset();
    createCustomElement.mockReset();
    ignoreCustomElements.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('custom element registration', () => {
    it('ignores mfp custom elements for UI5 before bootstrapping', async () => {
      await importMain();

      expect(ignoreCustomElements).toHaveBeenCalledWith('mfp');
    });

    it('registers all four web-component elements under their mfp-wc-* tags', async () => {
      const defined = await importMain();

      expect([...defined.keys()].sort()).toEqual([
        'mfp-wc-declarative-form',
        'mfp-wc-declarative-table',
        'mfp-wc-declarative-table-card',
        'mfp-wc-visited-service-card',
      ]);
    });

    it('creates every element from the shared application injector', async () => {
      await importMain();

      expect(createApplication).toHaveBeenCalledTimes(1);
      expect(createCustomElement).toHaveBeenCalledTimes(4);
      for (const call of createCustomElement.mock.calls) {
        expect(call[1]).toEqual({ injector: {} });
      }
    });
  });

  describe('DeclarativeForm method proxies', () => {
    async function formElement() {
      const defined = await importMain();
      const Ctor = defined.get('mfp-wc-declarative-form')!;
      const el = new Ctor() as HTMLElement &
        StrategyHost &
        Record<string, () => void>;
      return el;
    }

    it('forwards submit() to the backing component instance', async () => {
      const el = await formElement();
      const instance = { submit: vi.fn(), clear: vi.fn() };
      el.ngElementStrategy = { componentRef: { instance } };

      el['submit']();

      expect(instance.submit).toHaveBeenCalledTimes(1);
    });

    it('forwards clear() to the backing component instance', async () => {
      const el = await formElement();
      const instance = { submit: vi.fn(), clear: vi.fn() };
      el.ngElementStrategy = { componentRef: { instance } };

      el['clear']();

      expect(instance.clear).toHaveBeenCalledTimes(1);
    });

    it('throws when submit()/clear() are called before a component instance exists', async () => {
      const el = await formElement();

      // main.ts dereferences `ngElementStrategy` directly (`strategy.componentRef?...`)
      // before the Angular component is created, so `strategy` is undefined here.
      // Documenting the observed contract: these proxies are not null-safe until
      // the element is upgraded. See issue #239 (NG0950 / first-render errors).
      expect(() => el['submit']()).toThrow(TypeError);
      expect(() => el['clear']()).toThrow(TypeError);
    });

    it('no-ops when the strategy exists but componentRef is missing', async () => {
      const el = await formElement();
      el.ngElementStrategy = {};

      expect(() => el['submit']()).not.toThrow();
      expect(() => el['clear']()).not.toThrow();
    });
  });

  describe('DeclarativeTableCard method proxies', () => {
    async function tableCardElement() {
      const defined = await importMain();
      const Ctor = defined.get('mfp-wc-declarative-table-card')!;
      const el = new Ctor() as HTMLElement &
        StrategyHost &
        Record<string, () => void>;
      return el;
    }

    const DIALOG_METHODS = [
      'closeCreateDialog',
      'closeEditDialog',
      'closeDeleteDialog',
    ] as const;

    it.each(DIALOG_METHODS)(
      'forwards %s() to the backing component instance',
      async (method) => {
        const el = await tableCardElement();
        const instance = {
          closeCreateDialog: vi.fn(),
          closeEditDialog: vi.fn(),
          closeDeleteDialog: vi.fn(),
        };
        el.ngElementStrategy = { componentRef: { instance } };

        el[method]();

        expect(instance[method]).toHaveBeenCalledTimes(1);
      },
    );

    it.each(DIALOG_METHODS)(
      'throws when %s() is called before a component instance exists',
      async (method) => {
        const el = await tableCardElement();

        // Same as the form proxies: componentInstance() dereferences
        // `ngElementStrategy` directly, which is undefined before the element is
        // upgraded. Documenting the observed contract (see issue #239).
        expect(() => el[method]()).toThrow(TypeError);
      },
    );

    it.each(DIALOG_METHODS)(
      'no-ops %s() when the strategy exists but componentRef is missing',
      async (method) => {
        const el = await tableCardElement();
        el.ngElementStrategy = {};

        expect(() => el[method]()).not.toThrow();
      },
    );
  });
});
