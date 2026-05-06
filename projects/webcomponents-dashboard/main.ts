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
  customElements.define('mfp-wc-dashboard', DashboardElement);
})();
