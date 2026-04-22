import { Favorites } from '../ngx/cards/favorites/favorites.component';
import { ServiceStatusCard } from '../ngx/cards/service-status/service-status-card.component';
import { VisitedServiceCard } from '../ngx/cards/visited-service-card/visited-service-card.component';
import { WhatsNew } from '../ngx/cards/whats-new/whats-new.component';
import { createCustomElement } from '@angular/elements';
import { createApplication } from '@angular/platform-browser';
import {
  Dashboard,
  DeclarativeForm,
  DeclarativeTable,
  DeclarativeTableCard,
} from '@openmfp/webcomponents/declarative-ui';

(async () => {
  const app = await createApplication();

  const DashboardElement = createCustomElement(Dashboard, {
    injector: app.injector,
  });
  customElements.define('mfp-wc-dashboard', DashboardElement);

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
