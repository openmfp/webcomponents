import { DeclarativeForm } from '../ngx/declarative-ui/form/declarative-form/declarative-form.component';
import { DeclarativeTableCard } from '../ngx/declarative-ui/table-card/declarative-table-card.component';
import { DeclarativeTable } from '../ngx/declarative-ui/table/declarative-table/declarative-table.component';
import { Favorites } from '../ngx/favorites/favorites.component';
import { ServiceStatusCard } from '../ngx/service-status/service-status-card.component';
import { VisitedServiceCard } from '../ngx/visited-service-card/visited-service-card.component';
import { WhatsNew } from '../ngx/whats-new/whats-new.component';
import { createCustomElement } from '@angular/elements';
import { createApplication } from '@angular/platform-browser';

(async () => {
  const app = await createApplication();

  const DeclarativeTableElement = createCustomElement(DeclarativeTable, {
    injector: app.injector,
  });
  customElements.define('mfp-wc-declarative-table', DeclarativeTableElement);

  const DeclarativeFormElement = createCustomElement(DeclarativeForm, {
    injector: app.injector,
  });
  customElements.define('mfp-wc-declarative-form', DeclarativeFormElement);

  const DeclarativeTableCardElement = createCustomElement(
    DeclarativeTableCard,
    {
      injector: app.injector,
    },
  );
  customElements.define(
    'mfp-wc-declarative-table-card',
    DeclarativeTableCardElement,
  );

  const VisitedServiceCardElement = createCustomElement(VisitedServiceCard, {
    injector: app.injector,
  });
  customElements.define(
    'mfp-wc-visited-service-card',
    VisitedServiceCardElement,
  );

  const WhatsNewElement = createCustomElement(WhatsNew, {
    injector: app.injector,
  });
  customElements.define('mfp-wc-whats-new', WhatsNewElement);

  const FavoritesElement = createCustomElement(Favorites, {
    injector: app.injector,
  });
  customElements.define('mfp-wc-favorites', FavoritesElement);

  const ServiceStatusCardElement = createCustomElement(ServiceStatusCard, {
    injector: app.injector,
  });
  customElements.define('mfp-wc-service-status-card', ServiceStatusCardElement);
})();
