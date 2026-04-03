import { createApplication } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';
import { DeclarativeTable } from '../ngx/declarative-ui/table/declarative-table/declarative-table.component';
import { DeclarativeForm } from '../ngx/declarative-ui/form/declarative-form/declarative-form.component';

(async () => {
  const app = await createApplication();
  const DeclarativeTableElement = createCustomElement(DeclarativeTable, {
    injector: app.injector,
  });
  customElements.define('mfp-declarative-table', DeclarativeTableElement);

  const DeclarativeFormElement = createCustomElement(DeclarativeForm, {
    injector: app.injector,
  });
  customElements.define('mfp-declarative-form', DeclarativeFormElement);
})();
