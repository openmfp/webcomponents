import { createCustomElement } from '@angular/elements';
import { createApplication } from '@angular/platform-browser';
import {
  Dashboard,
  defineDashboardElementMethods,
} from '@openmfp/webcomponents/declarative-ui';
import { ignoreCustomElements } from '@ui5/webcomponents-base/dist/IgnoreCustomElements.js';
import { setLanguage } from '@ui5/webcomponents-base/dist/config/Language.js';
import { setTheme } from '@ui5/webcomponents-base/dist/config/Theme.js';
import '@ui5/webcomponents-theming/dist/Assets.js';

ignoreCustomElements('mfp');

type OpenUI5Localization = {
  getLanguageTag: () => { toString: () => string };
  attachChange: (handler: () => void) => void;
};

type OpenUI5Theming = {
  getTheme: () => string;
  attachApplied: (handler: () => void) => void;
};

function syncThemeWithOpenUI5(): void {
  const sapRequire = (globalThis as { sap?: { ui?: { require?: unknown } } })
    .sap?.ui?.require as
    ((deps: string[], cb: (m: OpenUI5Theming) => void) => void) | undefined;
  if (!sapRequire) return;

  sapRequire(['sap/ui/core/Theming'], (Theming) => {
    const apply = () => void setTheme(Theming.getTheme());
    apply();
    Theming.attachApplied(apply);
  });
}

function syncLanguageWithOpenUI5(): void {
  const sapRequire = (globalThis as { sap?: { ui?: { require?: unknown } } })
    .sap?.ui?.require as
    | ((deps: string[], cb: (m: OpenUI5Localization) => void) => void)
    | undefined;
  if (!sapRequire) return;

  sapRequire(['sap/base/i18n/Localization'], (Localization) => {
    const apply = () =>
      void setLanguage(Localization.getLanguageTag().toString());
    apply();
    Localization.attachChange(apply);
  });
}

(async () => {
  const app = await createApplication();

  const DashboardElement = createCustomElement(Dashboard, {
    injector: app.injector,
  });

  // `createCustomElement` only proxies @Input()/output() — public methods on
  // the component class are NOT reachable from the DOM. Forward them explicitly
  // so non-Angular consumers (UI5, plain JS, Luigi, etc.) can drive the
  // dashboard's edit-mode / unsaved-changes flow through the DOM node.
  defineDashboardElementMethods(DashboardElement);

  customElements.define('mfp-wc-dashboard', DashboardElement);

  syncThemeWithOpenUI5();
  syncLanguageWithOpenUI5();
})();
