import { createCustomElement } from '@angular/elements';
import { createApplication } from '@angular/platform-browser';
import {
  Dashboard,
  defineDashboardElementMethods,
} from '@openmfp/webcomponents/declarative-ui';
import { ignoreCustomElements } from '@ui5/webcomponents-base/dist/IgnoreCustomElements.js';

ignoreCustomElements('mfp');

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
})();
