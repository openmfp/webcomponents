import { createCustomElement } from '@angular/elements';
import { createApplication } from '@angular/platform-browser';
import {
  Dashboard,
  defineDashboardElementMethods,
} from '@openmfp/webcomponents/declarative-ui';
import { ignoreCustomElements } from '@ui5/webcomponents-base/dist/IgnoreCustomElements.js';
import { setTheme } from '@ui5/webcomponents-base/dist/config/Theme.js';
import '@ui5/webcomponents-theming/dist/Assets.js';

ignoreCustomElements('mfp');

type OpenUI5Theming = {
  getTheme: () => string;
  attachApplied: (handler: () => void) => void;
};

function syncThemeWithOpenUI5(): void {
  const sapRequire = (globalThis as { sap?: { ui?: { require?: unknown } } })
    .sap?.ui?.require as
    | ((deps: string[], cb: (m: OpenUI5Theming) => void) => void)
    | undefined;
  if (!sapRequire) return;

  sapRequire(['sap/ui/core/Theming'], (Theming) => {
    const apply = () => void setTheme(Theming.getTheme());
    apply();
    Theming.attachApplied(apply);
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
})();
