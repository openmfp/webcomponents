import { DeclarativeTable } from '../ngx/declarative-ui/table/declarative-table/declarative-table.component';
import { createCustomElement } from '@angular/elements';
import { createApplication } from '@angular/platform-browser';

(async () => {
  const app = await createApplication();
  const DeclarativeTableElement = createCustomElement(DeclarativeTable, {
    injector: app.injector,
  });
  customElements.define('mfp-declarative-table', DeclarativeTableElement);
})();
