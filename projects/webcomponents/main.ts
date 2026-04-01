import { DeclarativeTable } from '../ngx/declarative-ui/table/declarative-table/declarative-table.component';
import { Favorites } from '../ngx/favorites/favorites.component';
import { VisitedServiceCard } from '../ngx/visited-service-card/visited-service-card.component';
import { WhatsNew } from '../ngx/whats-new/whats-new.component';
import { createCustomElement } from '@angular/elements';
import { createApplication } from '@angular/platform-browser';

(async () => {
  const app = await createApplication();

  const DeclarativeTableElement = createCustomElement(DeclarativeTable, { injector: app.injector });
  customElements.define('mfp-declarative-table', DeclarativeTableElement);

  const VisitedServiceCardElement = createCustomElement(VisitedServiceCard, { injector: app.injector });
  customElements.define('mfp-visited-service-card', VisitedServiceCardElement);

  const WhatsNewElement = createCustomElement(WhatsNew, { injector: app.injector });
  customElements.define('mfp-whats-new', WhatsNewElement);

  const FavoritesElement = createCustomElement(Favorites, { injector: app.injector });
  customElements.define('mfp-favorites', FavoritesElement);
})();
