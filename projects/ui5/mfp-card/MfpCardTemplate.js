sap.ui.define(
  [
    'sap/base/Log',
    'sap/m/Button',
    'sap/m/Menu',
    'sap/m/MenuItem',
    'sap/m/ObjectStatus',
    'sap/m/SearchField',
    'sap/m/Title',
    'sap/ui/base/DataType',
    'sap/ui/core/Control',
    'sap/ui/core/Lib',
    'sap/ui/dom/includeStylesheet',
  ],
  (
    Log,
    Button,
    Menu,
    MenuItem,
    ObjectStatus,
    SearchField,
    Title,
    DataType,
    Control,
    Lib,
    includeStylesheet,
  ) => {
    'use strict';

    includeStylesheet(sap.ui.require.toUrl('mfp/ui5/card/MfpCardTemplate.css'));

    DataType.registerEnum('mfp.ui5.card.CardBackground', {
      solid: 'solid',
      transparent: 'transparent',
    });

    const clampWidth = (width, min, max) => {
      const lower = min >= 1 ? min : 1;
      const upper = max >= lower ? max : Number.POSITIVE_INFINITY;
      return Math.min(Math.max(width, lower), upper);
    };

    return Control.extend('mfp.ui5.card.MfpCardTemplate', {
      metadata: {
        properties: {
          name: { type: 'string', defaultValue: '' },
          background: {
            type: 'mfp.ui5.card.CardBackground',
            defaultValue: 'solid',
          },
          height: { type: 'sap.ui.core.CSSSize', defaultValue: '400px' },
          width: { type: 'int', defaultValue: 4 },
          minWidth: { type: 'int', defaultValue: null },
          maxWidth: { type: 'int', defaultValue: null },
          badge: { type: 'string', defaultValue: '' },
          badgeState: {
            type: 'sap.ui.core.ValueState',
            defaultValue: 'Warning',
          },
          showSearch: { type: 'boolean', defaultValue: false },
          searchPlaceholder: { type: 'string', defaultValue: '' },
        },
        defaultAggregation: 'content',
        aggregations: {
          content: { type: 'sap.ui.core.Control', multiple: true },
          messageStrip: { type: 'sap.m.MessageStrip', multiple: false },
          actions: { type: 'sap.ui.core.Item', multiple: true },
          _title: {
            type: 'sap.m.Title',
            multiple: false,
            visibility: 'hidden',
          },
          _search: {
            type: 'sap.m.SearchField',
            multiple: false,
            visibility: 'hidden',
          },
          _badge: {
            type: 'sap.m.ObjectStatus',
            multiple: false,
            visibility: 'hidden',
          },
          _actionsButton: {
            type: 'sap.m.Button',
            multiple: false,
            visibility: 'hidden',
          },
        },
        events: {
          search: {
            parameters: {
              query: { type: 'string' },
              clearButtonPressed: { type: 'boolean' },
            },
          },
          searchLiveChange: {
            parameters: { newValue: { type: 'string' } },
          },
          actionPress: {
            parameters: {
              key: { type: 'string' },
              item: { type: 'sap.ui.core.Item' },
            },
          },
        },
      },

      init() {
        this.setAggregation(
          '_title',
          new Title({ titleStyle: 'H5', wrapping: false }),
        );
        this.setAggregation(
          '_search',
          new SearchField({
            width: '100%',
            search: (event) =>
              this.fireSearch({
                query: event.getParameter('query'),
                clearButtonPressed: !!event.getParameter('clearButtonPressed'),
              }),
            liveChange: (event) =>
              this.fireSearchLiveChange({
                newValue: event.getParameter('newValue'),
              }),
          }),
        );
        this.setAggregation('_badge', new ObjectStatus({ inverted: true }));
        this.setAggregation(
          '_actionsButton',
          new Button({
            icon: 'sap-icon://overflow',
            type: 'Transparent',
            tooltip: Lib.getResourceBundleFor('sap.m').getText(
              'GENERICTILE_MORE_ACTIONBUTTON_TEXT',
            ),
            press: (event) => this.openActionsMenu(event.getSource()),
          }),
        );
      },

      onBeforeRendering() {
        if (!this.getName()) {
          Log.error(
            'Property "name" is mandatory',
            this.getId(),
            'mfp.ui5.card.MfpCardTemplate',
          );
        }
      },

      setName(name) {
        this.setProperty('name', name);
        this.getAggregation('_title').setText(this.getName());
        return this;
      },

      setSearchPlaceholder(placeholder) {
        this.setProperty('searchPlaceholder', placeholder);
        this.getAggregation('_search').setPlaceholder(
          this.getSearchPlaceholder(),
        );
        return this;
      },

      setBadge(badge) {
        this.setProperty('badge', badge);
        this.getAggregation('_badge').setText(this.getBadge());
        return this;
      },

      setBadgeState(state) {
        this.setProperty('badgeState', state);
        this.getAggregation('_badge').setState(this.getBadgeState());
        return this;
      },

      exit() {
        this.actionsMenu?.destroy();
      },

      getEffectiveWidth() {
        return clampWidth(
          this.getWidth(),
          this.getMinWidth(),
          this.getMaxWidth(),
        );
      },

      openActionsMenu(opener) {
        this.actionsMenu?.destroy();
        const actions = this.getActions();
        this.actionsMenu = new Menu({
          items: actions.map(
            (action) => new MenuItem({ text: action.getText() }),
          ),
          itemSelected: (event) => {
            const index = event
              .getSource()
              .indexOfItem(event.getParameter('item'));
            const action = actions[index];
            if (action) {
              this.fireActionPress({ key: action.getKey(), item: action });
            }
          },
        });
        this.actionsMenu.openBy(opener);
      },

      renderer: {
        apiVersion: 2,
        render(rm, card) {
          const title = card.getAggregation('_title');

          rm.openStart('section', card)
            .class('mfpUi5Card')
            .class(
              card.getBackground() === 'transparent'
                ? 'mfpUi5CardTransparent'
                : 'mfpUi5CardSolid',
            )
            .style('height', card.getHeight())
            .style('grid-column', `span ${card.getEffectiveWidth()}`)
            .attr('aria-labelledby', title.getId())
            .openEnd();

          if (card.getBadge()) {
            rm.openStart('div').class('mfpUi5CardBadge').openEnd();
            rm.renderControl(card.getAggregation('_badge'));
            rm.close('div');
          }

          rm.openStart('header').class('mfpUi5CardHeader').openEnd();

          rm.openStart('div').class('mfpUi5CardTitle').openEnd();
          rm.renderControl(title);
          rm.close('div');

          const hasActions = card.getActions().length > 0;
          if (card.getShowSearch() || hasActions) {
            rm.openStart('div').class('mfpUi5CardToolbar').openEnd();
            if (card.getShowSearch()) {
              rm.openStart('div').class('mfpUi5CardSearch').openEnd();
              rm.renderControl(card.getAggregation('_search'));
              rm.close('div');
            }
            if (hasActions) {
              rm.renderControl(card.getAggregation('_actionsButton'));
            }
            rm.close('div');
          }

          rm.close('header');

          const messageStrip = card.getMessageStrip();
          if (messageStrip) {
            rm.openStart('div').class('mfpUi5CardMessageStrip').openEnd();
            rm.renderControl(messageStrip);
            rm.close('div');
          }

          rm.openStart('div').class('mfpUi5CardContent').openEnd();
          rm.openStart('div').class('mfpUi5CardContentScroll').openEnd();
          card.getContent().forEach((control) => rm.renderControl(control));
          rm.close('div');
          rm.close('div');

          rm.close('section');
        },
      },
    });
  },
);
