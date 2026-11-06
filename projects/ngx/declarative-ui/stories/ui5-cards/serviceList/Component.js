sap.ui.define(
  [
    'sap/m/List',
    'sap/m/MessageToast',
    'sap/m/StandardListItem',
    'sap/ui/core/UIComponent',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/json/JSONModel',
  ],
  (
    List,
    MessageToast,
    StandardListItem,
    UIComponent,
    Filter,
    FilterOperator,
    JSONModel,
  ) => {
    'use strict';

    const SERVICES = [
      { title: 'olc-hana-db', description: 'SAP HANA Cloud' },
      {
        title: 'Cloud Identity Service',
        description: 'Identity Authentication',
      },
      { title: 'olc-hana-db-test', description: 'SAP HANA Cloud' },
      { title: 'applicationtest', description: 'Application Autoscaler' },
      { title: 'auditlog-name', description: 'Audit Log Service' },
      { title: 'checkout-api', description: 'Cloud Foundry App' },
      { title: 'internal-portal', description: 'HTML5 Application' },
    ];

    return UIComponent.extend('mfp.story.cards.serviceList.Component', {
      metadata: {
        manifest: 'json',
      },

      createContent() {
        this.list = new List({
          noDataText: 'No services found',
          items: {
            path: '/services',
            template: new StandardListItem({
              title: '{title}',
              description: '{description}',
            }),
          },
        });
        this.list.setModel(new JSONModel({ services: SERVICES }));
        return this.list;
      },

      onCardSearch(query) {
        this.list
          .getBinding('items')
          .filter(
            query ? [new Filter('title', FilterOperator.Contains, query)] : [],
          );
      },

      onCardAction(key) {
        MessageToast.show(`Action "${key}" handled by the UI5 Component.`);
      },
    });
  },
);
