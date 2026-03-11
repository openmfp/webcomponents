import { createApplication } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';
import { DeclarativeTable } from '../ngx/declarative-ui/table/declarative-table/declarative-table.component';

(async () => {
  const app = await createApplication();
  const DeclarativeTableElement = createCustomElement(DeclarativeTable, {
    injector: app.injector,
  });
  customElements.define('mfp-declarative-table', DeclarativeTableElement);
})();
