import { VisitedServiceCard } from '../ngx/cards/visited-service-card/visited-service-card.component';
import { createCustomElement } from '@angular/elements';
import { createApplication } from '@angular/platform-browser';
import {
  DeclarativeForm,
  DeclarativeTable,
  DeclarativeTableCard,
} from '@openmfp/webcomponents/declarative-ui';
import { ignoreCustomElements } from '@ui5/webcomponents-base/dist/IgnoreCustomElements.js';

ignoreCustomElements('mfp');

(async () => {
  const app = await createApplication();

  const DeclarativeTableElement = createCustomElement(DeclarativeTable, {
    injector: app.injector,
  });
  customElements.define('mfp-wc-declarative-table', DeclarativeTableElement);

  const DeclarativeFormElementBase = createCustomElement(DeclarativeForm, {
    injector: app.injector,
  }) as CustomElementConstructor;
  class DeclarativeFormElement extends DeclarativeFormElementBase {
    submit(): void {
      const strategy = (
        this as unknown as {
          ngElementStrategy: {
            componentRef?: { instance: DeclarativeForm };
          };
        }
      ).ngElementStrategy;
      strategy.componentRef?.instance.submit();
    }
  }
  customElements.define('mfp-wc-declarative-form', DeclarativeFormElement);

  const DeclarativeTableCardElementBase = createCustomElement(
    DeclarativeTableCard,
    {
      injector: app.injector,
    },
  ) as CustomElementConstructor;
  class DeclarativeTableCardElement extends DeclarativeTableCardElementBase {
    closeCreateDialog(): void {
      this.componentInstance()?.closeCreateDialog();
    }

    closeEditDialog(): void {
      this.componentInstance()?.closeEditDialog();
    }

    closeDeleteDialog(): void {
      this.componentInstance()?.closeDeleteDialog();
    }

    private componentInstance(): DeclarativeTableCard<never> | undefined {
      const strategy = (
        this as unknown as {
          ngElementStrategy: {
            componentRef?: { instance: DeclarativeTableCard<never> };
          };
        }
      ).ngElementStrategy;

      return strategy.componentRef?.instance;
    }
  }
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
})();
