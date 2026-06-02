import { createCustomElement } from '@angular/elements';
import { createApplication } from '@angular/platform-browser';
import { Dashboard } from '@openmfp/webcomponents/declarative-ui';
import { ignoreCustomElements } from '@ui5/webcomponents-base/dist/IgnoreCustomElements.js';

ignoreCustomElements('mfp');

(async () => {
  const app = await createApplication();

  const DashboardElement = createCustomElement(Dashboard, {
    injector: app.injector,
  });

  // `createCustomElement` only proxies @Input()/output() — public methods on the
  // component class are NOT reachable from the DOM. Forward `requestNavigation`
  // explicitly so non-Angular consumers (UI5, plain JS, Luigi, etc.) can route
  // their navigation hooks through the dashboard's unsaved-changes guard.
  Object.defineProperty(DashboardElement.prototype, 'requestNavigation', {
    value(proceed: () => void): boolean {
      const strategy = (this as unknown as {
        ngElementStrategy?: { componentRef?: { instance?: Dashboard } };
      }).ngElementStrategy;
      const instance = strategy?.componentRef?.instance;
      if (!instance) {
        // Element not yet connected / Angular component not yet created.
        // Falling back to running the navigation immediately preserves the
        // original (pre-guard) behaviour rather than silently blocking the user.
        proceed();
        return true;
      }
      return instance.requestNavigation(proceed);
    },
    configurable: true,
    writable: true,
  });

  customElements.define('mfp-wc-dashboard', DashboardElement);
})();
