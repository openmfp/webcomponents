import { VisitedServiceCard } from '../ngx/cards/visited-service-card/visited-service-card.component';
import { createCustomElement } from '@angular/elements';
import { createApplication } from '@angular/platform-browser';
import {
  DataFetchList,
  DataFetchTable,
  DeclarativeForm,
  DeclarativeTable,
  DeclarativeTableCard,
  ErrorView,
  GenericResource,
  ResourceFormPatch,
} from '@openmfp/webcomponents/declarative-ui';
import { ignoreCustomElements } from '@ui5/webcomponents-base/dist/IgnoreCustomElements.js';
import '@ui5/webcomponents-fiori/dist/generated/json-imports/Themes.js';
import '@ui5/webcomponents-theming/dist/Assets.js';
import '@ui5/webcomponents/dist/generated/json-imports/Themes.js';

ignoreCustomElements('mfp');

(async () => {
  const app = await createApplication();

  const DeclarativeTableElement = createCustomElement(DeclarativeTable, {
    injector: app.injector,
  });
  customElements.define('mfp-wc-declarative-table', DeclarativeTableElement);

  const DataFetchTableElementBase = createCustomElement(DataFetchTable, {
    injector: app.injector,
  }) as CustomElementConstructor;
  class DataFetchTableElement extends DataFetchTableElementBase {
    onCardAction(key: string): void {
      const strategy = (
        this as unknown as {
          ngElementStrategy: {
            componentRef?: { instance: DataFetchTable };
          };
        }
      ).ngElementStrategy;
      strategy.componentRef?.instance.onCardAction(key);
    }
  }
  customElements.define('mfp-wc-data-fetch-table-card', DataFetchTableElement);

  const DataFetchListElementBase = createCustomElement(DataFetchList, {
    injector: app.injector,
  }) as CustomElementConstructor;
  class DataFetchListElement extends DataFetchListElementBase {
    onCardAction(key: string): void {
      const strategy = (
        this as unknown as {
          ngElementStrategy: {
            componentRef?: { instance: DataFetchList };
          };
        }
      ).ngElementStrategy;
      strategy.componentRef?.instance.onCardAction(key);
    }
  }
  customElements.define('mfp-wc-data-fetch-list-card', DataFetchListElement);

  const DeclarativeFormElementBase = createCustomElement(DeclarativeForm, {
    injector: app.injector,
  }) as CustomElementConstructor;
  class DeclarativeFormElement extends DeclarativeFormElementBase {
    submit(): void {
      const strategy = (
        this as unknown as {
          ngElementStrategy: {
            componentRef?: { instance: DeclarativeForm<GenericResource> };
          };
        }
      ).ngElementStrategy;
      strategy.componentRef?.instance.submit();
    }

    clear(): void {
      const strategy = (
        this as unknown as {
          ngElementStrategy: {
            componentRef?: { instance: DeclarativeForm<GenericResource> };
          };
        }
      ).ngElementStrategy;
      strategy.componentRef?.instance.clear();
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
    applyCreateFormPatch(patch: ResourceFormPatch): void {
      this.componentInstance()?.applyCreateFormPatch(patch);
    }

    applyEditFormPatch(patch: ResourceFormPatch): void {
      this.componentInstance()?.applyEditFormPatch(patch);
    }

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

  const ErrorViewElement = createCustomElement(ErrorView, {
    injector: app.injector,
  });
  customElements.define('mfp-wc-error-view', ErrorViewElement);
})();
