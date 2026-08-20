import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const createApplication = vi.fn();
const createCustomElement = vi.fn();
const ignoreCustomElements = vi.fn();
const setTheme = vi.fn();

vi.mock('@angular/platform-browser', () => ({ createApplication }));
vi.mock('@angular/elements', () => ({ createCustomElement }));
vi.mock('@ui5/webcomponents-base/dist/IgnoreCustomElements.js', () => ({
  ignoreCustomElements,
}));
vi.mock('@ui5/webcomponents-base/dist/config/Theme.js', () => ({ setTheme }));
vi.mock('@ui5/webcomponents-theming/dist/Assets.js', () => ({}));

// The real declarative-ui barrel (which main.ts imports) pulls in the dashboard
// component, which imports gridstack; gridstack fails to resolve under jsdom.
// Stub it so the barrel — and the REAL defineDashboardElementMethods that
// main.ts wires up — can load, letting us assert its effect on the element.
vi.mock('gridstack', () => ({}));
vi.mock('gridstack/dist/angular', async () => {
  const { Component } = await import('@angular/core');
  @Component({ selector: 'gridstack', template: '' })
  class GridstackComponent {}
  @Component({ selector: 'gridstack-item', template: '' })
  class GridstackItemComponent {}
  return {
    GridstackComponent,
    GridstackItemComponent,
    gsCreateNgComponents: vi.fn(),
  };
});

// The public methods defineDashboardElementMethods forwards onto the element.
const PROXIED_METHODS = [
  'requestNavigation',
  'saveEdit',
  'cancelEdit',
  'confirmDiscard',
  'onUnsavedNavSave',
  'onUnsavedNavDiscard',
  'onUnsavedNavCancel',
] as const;

let registrationSalt = 0;

async function importMain(): Promise<Map<string, CustomElementConstructor>> {
  const defined = new Map<string, CustomElementConstructor>();
  registrationSalt += 1;
  const realDefine = customElements.define.bind(customElements);
  vi.spyOn(customElements, 'define').mockImplementation(
    (
      name: string,
      ctor: CustomElementConstructor,
      options?: ElementDefinitionOptions,
    ) => {
      defined.set(name, ctor);
      realDefine(`${name}-${registrationSalt}`, ctor, options);
    },
  );

  createApplication.mockResolvedValue({ injector: {} });
  createCustomElement.mockImplementation(
    () => class extends HTMLElement {} as unknown as CustomElementConstructor,
  );

  await import('./main');
  await vi.waitFor(() => expect(defined.size).toBeGreaterThan(0));
  await Promise.resolve();

  return defined;
}

describe('webcomponents-dashboard/main.ts', () => {
  beforeEach(() => {
    vi.resetModules();
    createApplication.mockReset();
    createCustomElement.mockReset();
    ignoreCustomElements.mockReset();
    setTheme.mockReset();
    delete (globalThis as { sap?: unknown }).sap;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (globalThis as { sap?: unknown }).sap;
  });

  describe('registration', () => {
    it('ignores mfp custom elements for UI5 before bootstrapping', async () => {
      await importMain();

      expect(ignoreCustomElements).toHaveBeenCalledWith('mfp');
    });

    it('registers exactly the mfp-wc-dashboard element from the shared injector', async () => {
      const defined = await importMain();

      expect([...defined.keys()]).toEqual(['mfp-wc-dashboard']);
      expect(createApplication).toHaveBeenCalledTimes(1);
      expect(createCustomElement).toHaveBeenCalledTimes(1);
      expect(createCustomElement.mock.calls[0][1]).toEqual({ injector: {} });
    });

    it('forwards the dashboard public methods onto the element before defining it', async () => {
      const defined = await importMain();
      const ctor = defined.get('mfp-wc-dashboard')!;
      const proto = ctor.prototype as unknown as Record<string, unknown>;

      // defineDashboardElementMethods (the real one) installs these on the
      // element prototype so non-Angular consumers can drive the dashboard.
      for (const method of PROXIED_METHODS) {
        expect(typeof proto[method]).toBe('function');
      }
    });
  });

  describe('theme sync with OpenUI5', () => {
    it('does nothing when sap.ui.require is unavailable', async () => {
      await importMain();

      expect(setTheme).not.toHaveBeenCalled();
    });

    it('applies the current OpenUI5 theme and subscribes to future changes', async () => {
      let appliedHandler: (() => void) | undefined;
      const Theming = {
        getTheme: vi.fn(() => 'sap_horizon_dark'),
        attachApplied: vi.fn((handler: () => void) => {
          appliedHandler = handler;
        }),
      };
      const require = vi.fn((_deps: string[], cb: (m: unknown) => void) =>
        cb(Theming),
      );
      (globalThis as { sap?: unknown }).sap = { ui: { require } };

      await importMain();

      expect(require).toHaveBeenCalledWith(
        ['sap/ui/core/Theming'],
        expect.any(Function),
      );
      // Initial apply.
      expect(setTheme).toHaveBeenCalledWith('sap_horizon_dark');
      expect(Theming.attachApplied).toHaveBeenCalledTimes(1);

      // Subsequent theme change re-applies.
      Theming.getTheme.mockReturnValue('sap_horizon_hcb');
      appliedHandler?.();
      expect(setTheme).toHaveBeenLastCalledWith('sap_horizon_hcb');
    });
  });
});
