# MfpCardTemplate (`mfp.ui5.card`)

An OpenUI5 control that renders the standard MFP dashboard card chrome — title, optional search, badge, overflow actions and message strip — around any UI5 content. SAP UI5 applications use it as a template to build their dashboard cards so every card looks and behaves the same and follows the active SAP theme.

It is a plain OpenUI5 control (`sap.ui.core.Control`), **not** a custom element and not part of the Angular bundles.

| Item          | Value                                        |
| ------------- | -------------------------------------------- |
| Control class | `mfp.ui5.card.MfpCardTemplate`               |
| Module        | `mfp/ui5/card/MfpCardTemplate`               |
| XML namespace | `xmlns:card="mfp.ui5.card"`                  |
| Source        | `projects/ui5/mfp-card/`                     |
| Package path  | `@openmfp/webcomponents/ui5/mfp-card/`       |
| Required UI5  | OpenUI5 / SAPUI5 ≥ 1.120 with `sap.m` loaded |

---

## Package layout

The files are copied to the package as-is by `scripts/bundle-wc.mjs` (no compilation step):

```
@openmfp/webcomponents/
└── ui5/
    └── mfp-card/
        ├── MfpCardTemplate.js    # sap.ui.define module
        └── MfpCardTemplate.css   # loaded automatically by the control
```

---

## Setup in a UI5 application

### 1. Serve the package

Serve `node_modules/@openmfp/webcomponents` under a URL of your app. With UI5 Tooling and `ui5-middleware-servestatic`:

```yaml
server:
  customMiddleware:
    - name: ui5-middleware-servestatic
      afterMiddleware: compression
      mountPath: /resources/mfp
      configuration:
        rootPath: node_modules/@openmfp/webcomponents
```

`ui5 serve` middleware is not part of `ui5 build`. Copy the folder into your build output as well (for example `dist/resources/mfp/ui5`) with a post-build step.

### 2. Register the resource root

Map the `mfp.ui5.card` namespace to the served folder in the bootstrap:

```html
<script
  id="sap-ui-bootstrap"
  src="resources/sap-ui-core.js"
  data-sap-ui-resource-roots='{
    "my.app": "./",
    "mfp.ui5.card": "./resources/mfp/ui5/mfp-card"
  }'
  data-sap-ui-theme="sap_horizon"
  data-sap-ui-async="true"
></script>
```

or at runtime:

```js
sap.ui.loader.config({
  paths: { 'mfp/ui5/card': './resources/mfp/ui5/mfp-card' },
});
```

### 3. Use it in a view

```xml
<mvc:View
  height="100%"
  xmlns:mvc="sap.ui.core.mvc"
  xmlns:core="sap.ui.core"
  xmlns:card="mfp.ui5.card"
  xmlns="sap.m">
  <card:MfpCardTemplate name="Recent Sales Orders" width="2">
    <Table items="{/orders}" />
  </card:MfpCardTemplate>
</mvc:View>
```

or in code:

```js
sap.ui.require(
  ['mfp/ui5/card/MfpCardTemplate', 'sap/m/Text'],
  (MfpCardTemplate, Text) => {
    new MfpCardTemplate({
      name: 'Card Name',
      content: [new Text({ text: 'Card Content' })],
    }).placeAt('content');
  },
);
```

---

## API

### Properties

| Property            | Type                     | Default   | Description                                                                                        |
| ------------------- | ------------------------ | --------- | -------------------------------------------------------------------------------------------------- |
| `name`              | `string`                 | `""`      | **Mandatory.** Card title. An error is logged when it is empty.                                    |
| `background`        | `solid` \| `transparent` | `solid`   | `solid` renders the tile background and shadow; `transparent` renders no background and no shadow. |
| `height`            | `sap.ui.core.CSSSize`    | `400px`   | Card height. Use `100%` to fill a parent with a definite height (for example a dashboard cell).    |
| `width`             | `int`                    | `4`       | Width in dashboard columns.                                                                        |
| `minWidth`          | `int`                    | —         | Optional lower bound for `width`, in dashboard columns.                                            |
| `maxWidth`          | `int`                    | —         | Optional upper bound for `width`, in dashboard columns.                                            |
| `badge`             | `string`                 | `""`      | Optional badge text shown on the top-right border. Hidden when empty.                              |
| `badgeState`        | `sap.ui.core.ValueState` | `Warning` | Badge colour.                                                                                      |
| `showSearch`        | `boolean`                | `false`   | Shows the search field in the header.                                                              |
| `searchPlaceholder` | `string`                 | `""`      | Search placeholder. When empty, the translated UI5 default ("Search") is used.                     |

### Aggregations

| Aggregation    | Type                  | Multiple | Description                                                                                          |
| -------------- | --------------------- | -------- | ---------------------------------------------------------------------------------------------------- |
| `content`      | `sap.ui.core.Control` | yes      | **Default aggregation.** The card body. It fills the remaining height and scrolls when it overflows. |
| `messageStrip` | `sap.m.MessageStrip`  | no       | Optional message strip below the header. Its space is removed when the strip is closed or hidden.    |
| `actions`      | `sap.ui.core.Item`    | yes      | Optional overflow actions. The "…" button is shown only when at least one action exists.             |

### Events

| Event              | Parameters                                     | Fired when                                                |
| ------------------ | ---------------------------------------------- | --------------------------------------------------------- |
| `search`           | `query: string`, `clearButtonPressed: boolean` | The user submits the search or presses the clear button.  |
| `searchLiveChange` | `newValue: string`                             | The search value changes while typing.                    |
| `actionPress`      | `key: string`, `item: sap.ui.core.Item`        | The user selects an entry from the overflow actions menu. |

### Methods

| Method                | Returns  | Description                                                            |
| --------------------- | -------- | ---------------------------------------------------------------------- |
| `getEffectiveWidth()` | `number` | `width` clamped to `minWidth`/`maxWidth` (values below 1 are ignored). |

---

## Width

Width is expressed in **dashboard columns**, not pixels. The control renders `grid-column: span <effectiveWidth>`, so inside a CSS grid it spans that many columns.

Inside `mfp-wc-dashboard` the dashboard owns the layout, so pass the same values to the dashboard card configuration:

| Card property | Dashboard `CardConfig` field |
| ------------- | ---------------------------- |
| `width`       | `w`                          |
| `minWidth`    | `minW`                       |
| `maxWidth`    | `maxW`                       |

The zFlow dashboard layout has 4 columns, so `4` is the full row there.

## Height inside the dashboard

Dashboard cells of type `sap-ui` give their content the full cell height. To make the card fill the cell instead of using a fixed pixel height:

- pass `height: '100%'` to the card, and
- set `height="100%"` on the root XML view that contains the card.

The card body then scrolls on its own; the dashboard cell never scrolls.

## Search

Search is only UI — the card does not filter anything itself. Handle `search` and/or `searchLiveChange` and filter your content:

```xml
<card:MfpCardTemplate
  name="Orders"
  showSearch="true"
  searchPlaceholder="Search orders"
  searchLiveChange=".onSearch">
  <Table id="orders" items="{/orders}" />
</card:MfpCardTemplate>
```

```js
onSearch(event) {
  const query = event.getParameter('newValue');
  this.byId('orders')
    .getBinding('items')
    .filter(query ? [new Filter('customer', FilterOperator.Contains, query)] : []);
}
```

## Actions

Add `sap.ui.core.Item` entries and handle `actionPress`. Actions can be static or bound:

```xml
<card:MfpCardTemplate
  name="Orders"
  actions="{path: 'card>/actions', templateShareable: false}"
  actionPress=".onAction">
  <card:actions>
    <core:Item key="{card>key}" text="{card>text}" />
  </card:actions>
</card:MfpCardTemplate>
```

```js
onAction(event) {
  MessageBox.information(`You clicked "${event.getParameter('item').getText()}".`);
}
```

## Message strip

```xml
<card:MfpCardTemplate name="Orders">
  <card:messageStrip>
    <MessageStrip text="Showing orders from the last 30 days." type="Information" showIcon="true" showCloseButton="true" />
  </card:messageStrip>
</card:MfpCardTemplate>
```

## Badge

```xml
<card:MfpCardTemplate name="Orders" badge="Action Needed" badgeState="Warning" />
```

---

## Theming

The control uses SAP theming CSS variables only, so it follows the active theme (`sap_horizon`, `sap_horizon_dark`, `sap_horizon_hcw`, `sap_horizon_hcb`, …) and reacts to `sap/ui/core/Theming.setTheme()` at runtime without re-rendering.

| Part                       | Variables                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------- |
| Surface (`solid`)          | `--sapTile_Background`, `--sapContent_Shadow0`                                      |
| Edit frame (`transparent`) | `--mfp_cardEditFrameShadow`                                                         |
| Border                     | `--sapElement_BorderWidth`, `--sapTile_BorderColor`, `--sapTile_BorderCornerRadius` |
| Font                       | `--sapFontFamily`                                                                   |

`--sapTile_BorderColor` is the variable the dashboard overrides for its edit-mode hover/focus highlight, so the highlight appears on the card border automatically.

A `transparent` card has no visible frame outside edit mode: it keeps the shared `--sapElement_BorderWidth` / `--sapTile_BorderColor` border (transparent in Horizon) and draws no shadow. In edit mode the dashboard sets `--mfp_cardEditFrameShadow`, which gives the card the same frame a solid tile has — `--sapContent_Shadow0` over the `--sapTile_BorderColor` border and the `--sapTile_BorderCornerRadius` corners — and the border picks up the highlight colour on hover/focus like every other card. Hosts other than the dashboard can set `--mfp_cardEditFrameShadow` to show the same frame.

CSS classes on the rendered root: `mfpUi5Card` plus `mfpUi5CardSolid` or `mfpUi5CardTransparent`.

---

## Using it as a dashboard card template

A common pattern is a small UI5 component per dashboard card whose root view is the card, wrapping an existing component through a `ComponentContainer`. The dashboard mounts it with `type: 'sap-ui'` and passes `componentInputs` as component settings.

**`Component.ts`** — declare the card inputs as component properties and expose them to the view through a model:

```ts
export default class Component extends UIComponent {
  public static metadata = {
    manifest: 'json',
    properties: {
      name: { type: 'string', defaultValue: '' },
      height: { type: 'sap.ui.core.CSSSize', defaultValue: '400px' },
      width: { type: 'int', defaultValue: 4 },
      showSearch: { type: 'boolean', defaultValue: false },
      actions: { type: 'object[]', defaultValue: [] },
    },
  };

  public init(): void {
    const names = Object.keys(this.getMetadata().getAllProperties());
    this.setModel(
      new JSONModel(
        Object.fromEntries(names.map((n) => [n, this.getProperty(n)])),
      ),
      'card',
    );
    super.init();
  }

  public setProperty(
    name: string,
    value: unknown,
    suppressInvalidate?: boolean,
  ): this {
    super.setProperty(name, value, suppressInvalidate);
    (this.getModel('card') as JSONModel | undefined)?.setProperty(
      `/${name}`,
      this.getProperty(name),
    );
    return this;
  }
}
```

UI5 runs `init()` before it applies constructor settings, and every setting goes through `setProperty`, so the model always reflects the inputs.

**Root view:**

```xml
<mvc:View height="100%" xmlns:mvc="sap.ui.core.mvc" xmlns:core="sap.ui.core" xmlns:card="mfp.ui5.card">
  <card:MfpCardTemplate name="{card>/name}" height="{card>/height}" width="{card>/width}" showSearch="{card>/showSearch}">
    <core:ComponentContainer name="my.app.components.salesOrders" async="true" manifest="true" height="100%" width="100%" />
  </card:MfpCardTemplate>
</mvc:View>
```

**Dashboard card configuration:**

```js
{
  id: 'sales-orders',
  label: 'Recent Sales Orders',
  type: 'sap-ui',
  component: 'my.app.cards.salesOrders',
  w: 4, minW: 1, maxW: 4,
  h: 40, minH: 40, maxH: 40,
  componentInputs: {
    name: 'Recent Sales Orders',
    height: '100%',
    width: 4, minWidth: 1, maxWidth: 4,
    showSearch: true,
    actions: [{ key: 'export', text: 'Export' }],
  },
}
```

> **Do not pass strings containing `{` `}` in `componentInputs`.** UI5 parses string settings with curly braces as binding syntax, so a value like `'You clicked "{0}"'` becomes a binding and never reaches the property. Format such texts before passing them, or pass them inside an object (`object` / `object[]` properties are not parsed).

---

## Storybook

`Cards / MfpCardTemplate (mfp.ui5.card)` renders the real control. The story bootstraps OpenUI5 1.142.0 from `sdk.openui5.org` (network access required) and serves `projects/ui5` at `/ui5`. It covers every input, the widths in a 4-column grid, and the dark and high-contrast themes, and it logs the `search`, `searchLiveChange` and `actionPress` events below the card.

```bash
npm run storybook
```
