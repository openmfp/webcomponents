# Dashboard

An Angular dashboard layout component that combines editable sections with draggable loose cards. Cards can render either registered Angular components or pre-registered web components through the same `component` field.

## Tags

| Usage             | Tag                  |
| ----------------- | -------------------- |
| Angular component | `<mfp-dashboard>`    |
| Web component     | `<mfp-wc-dashboard>` |

---

## Usage as a web component

The dashboard is shipped as a **dedicated standalone bundle** `mfp-wc-dashboard.js`, separate from the main `mfp-webcomponents.js`. Load it independently — it does not depend on the main bundle.

```html
<script type="module" src="/mfp-wc-dashboard.js"></script>

<mfp-wc-dashboard id="dashboard"></mfp-wc-dashboard>

<script type="module">
  const el = document.getElementById('dashboard');
  el.config = { title: 'Platform Overview' };
  el.sections = [{ id: 'runtime', title: 'Runtime', w: 12 }];
  el.cards = [
    {
      id: 'pods-card',
      component: 'mfp-wc-declarative-table-card',
      w: 12,
      h: 5,
      componentInputs: { header: 'Pods' },
    },
  ];
</script>
```

All inputs (`config`, `sections`, `cards`, `availableCards`) and the `saved` event work the same as the Angular component.

---

## Usage as an Angular component

Register Angular card components once before rendering the dashboard. The dashboard reads each Angular component selector and uses that selector string from `CardConfig.component`.

```ts
import {
  CardConfig,
  Dashboard,
  DashboardConfig,
  SectionConfig,
  VisitedServiceCard,
} from '@openmfp/webcomponents';

Dashboard.registerAngularComponents([VisitedServiceCard]);

@Component({
  imports: [Dashboard],
  template: `
    <mfp-dashboard
      [config]="config"
      [sections]="sections"
      [cards]="cards"
      [availableCards]="availableCards"
      (saved)="onSaved($event)"
    />
  `,
})
export class DashboardPage {
  config: DashboardConfig = {
    title: 'Platform Overview',
    description: 'Service health and team activity',
    backgroundImageUrl: '/assets/dashboard-bg.png',
  };

  sections: SectionConfig[] = [
    { id: 'favorites', title: 'Favorites', editable: false },
    { id: 'runtime', title: 'Runtime', w: 12 },
  ];

  cards: CardConfig[] = [
    {
      id: 'recent-service-card',
      sectionId: 'favorites',
      component: 'mfp-visited-service-card',
      type: 'angular',
      w: 6,
      h: 2,
      componentInputs: {
        serviceType: 'SAP HANA Cloud',
        serviceName: 'orders-db',
        serviceDescription: 'Production / europe',
        serviceIcon: 'database',
        path: '/hana/orders-db',
      },
    },
    {
      id: 'pods-card',
      component: 'mfp-wc-declarative-table-card',
      type: 'wc',
      w: 12,
      h: 5,
      x: 0,
      y: 0,
      componentInputs: {
        header: 'Pods',
      },
    },
  ];

  availableCards: CardConfig[] = [
    {
      id: 'service-status-template',
      component: 'mfp-wc-service-status-card',
      type: 'wc',
      label: 'Service Status',
      w: 4,
      h: 2,
    },
  ];

  onSaved(event: { sections: SectionConfig[]; cards: CardConfig[] }) {
    console.log(event.cards);
  }
}
```

`componentInputs` behaviour depends on `type`:

- For `type: 'angular'`, values are applied with Angular `setInput(...)`.
- For Angular input aliases, both the class property name and the public alias are accepted.
- Unknown Angular input names are ignored and logged as a development warning.
- For `type: 'wc'` (or when `type` is omitted), values are set as DOM properties.
- For `type: 'sap-ui'`, values are forwarded as `settings` to `ComponentContainer`.

Example with an aliased Angular input:

```ts
@Component({
  selector: 'app-card',
  template: '{{ title() }}',
})
export class AppCard {
  title = input('', { alias: 'cardTitle' });
}

Dashboard.registerAngularComponents([AppCard]);

const card: CardConfig = {
  id: 'app-card',
  component: 'app-card',
  type: 'angular',
  componentInputs: {
    // Class property name works.
    title: 'Runtime',
  },
};

const sameCardUsingAlias: CardConfig = {
  id: 'app-card-alias',
  component: 'app-card',
  type: 'angular',
  componentInputs: {
    // Public alias works too.
    cardTitle: 'Runtime',
  },
};
```

## Usage with web components

Custom elements are still supported. They must be registered in the browser before the dashboard renders them.

```ts
const cards: CardConfig[] = [
  {
    id: 'pods-card',
    component: 'mfp-wc-declarative-table-card',
    componentInputs: {
      header: 'Pods',
    },
  },
];
```

---

## API

### Inputs

| Input            | Type              | Required | Default | Description                                                 |
| ---------------- | ----------------- | -------- | ------- | ----------------------------------------------------------- |
| `config`         | `DashboardConfig` | yes      | —       | Header text and optional background image                   |
| `sections`       | `SectionConfig[]` | no       | `[]`    | Named dashboard sections rendered above the loose-card grid |
| `cards`          | `CardConfig[]`    | no       | `[]`    | All cards shown in sections or in the grid                  |
| `availableCards` | `CardConfig[]`    | no       | `[]`    | Card templates that can be added in edit mode               |

### Outputs

| Output               | Payload                                              | Description                                                      |
| -------------------- | ---------------------------------------------------- | ---------------------------------------------------------------- |
| `saved`              | `{ sections: SectionConfig[]; cards: CardConfig[] }` | Emits when the user saves edits                                  |
| `actionButtonClick`  | `{ event: MouseEvent; action: ButtonSettings }`      | Emits when a custom action button from `config.customActions` is clicked |

### Static methods

| Method                        | Description                                                                 |
| ----------------------------- | --------------------------------------------------------------------------- |
| `registerAngularComponents()` | Registers standalone Angular card components by their element selector name |

---

## Configuration types

### `DashboardConfig`

```ts
interface DashboardConfig {
  title: string;
  description?: string;
  backgroundImageUrl?: string;
  buttonsSettings?: DashboardButtonsSettings;
  customActions?: ButtonSettings[];
  editable?: boolean;
}
```

### `DashboardButtonSettings`

Controls the appearance of the two built-in toolbar buttons. Both fields accept a `Partial<ButtonSettings>` that is **merged on top of the defaults** — any property you omit keeps its default value.

```ts
interface DashboardButtonsSettings {
  editViewButton?: Partial<ButtonSettings>;
  addCardButton?: Partial<ButtonSettings>;
}
```

| Button           | Default `icon`    | Default `design` | Default `tooltip` | Default `text`        |
| ---------------- | ----------------- | ---------------- | ----------------- | --------------------- |
| `editViewButton` | `action-settings` | `Transparent`    | `Edit View`       | _(empty — icon only)_ |
| `addCardButton`  | _(none)_          | `Default`        | _(none)_          | `+ Add Card`          |

**Example — text-only buttons without icons:**

```ts
const config: DashboardConfig = {
  title: 'Platform Overview',
  editable: true,
  buttonsSettings: {
    editViewButton: {
      text: 'Edit View',
      icon: '',
      design: 'Default',
      tooltip: '',
    },
    addCardButton: {
      text: 'Add Card',
      icon: '',
      design: 'Emphasized',
      tooltip: '',
    },
  },
};
```

The compact toolbar (viewport width < 726 px) collapses all actions into a burger menu. The Edit View menu item always uses the configured `icon` and falls back to the text `'Edit View'` when no `text` override is set.

### `ButtonSettings`

Used both for `customActions` entries and as the override type for `DashboardButtonSettings`.

```ts
interface ButtonSettings {
  text?: string;
  icon?: string;
  endIcon?: string;
  design?:
    | 'Default'
    | 'Positive'
    | 'Negative'
    | 'Transparent'
    | 'Emphasized'
    | 'Attention';
  tooltip?: string;
  action: 'openInModal' | 'navigate' | 'edit' | 'delete' | string;
}
```

### `SectionConfig`

```ts
interface SectionConfig {
  id: string;
  w?: number;
  title?: string;
  editable?: boolean;
}
```

### `CardConfig`

```ts
interface CardConfig {
  id: string;
  w?: number; // expressed in number of columns up to 12
  h?: number; // expressed in hypothetical number of rows, where a row is 10px high, so the value of 27 translates to 270px
  x?: number;
  y?: number;
  maxH?: number;
  maxW?: number;
  minH?: number;
  minW?: number;
  sectionId?: string;
  component: string;
  type?: 'wc' | 'angular' | 'sap-ui';
  componentInputs?: Record<string, unknown>;
  label?: string;
}
```

For sections, `w` controls the column span while height is determined by the section content.
For cards, `w` and `h` control the initial rendered grid span. `x` and `y` persist the loose-card position reported by drag and drop when edit mode is saved. `minH`/`minW` and `maxH`/`maxW` set hard resize bounds enforced by the grid — the user cannot drag a card below the minimum or above the maximum size in edit mode.

`component` and `type` work together to determine how the card is rendered:

| `type`      | Render strategy                                                        |
| ----------- | ---------------------------------------------------------------------- |
| `'wc'`      | Creates a custom element tag; sets `componentInputs` as DOM properties |
| omitted     | Same as `'wc'`                                                         |
| `'angular'` | Looks up the Angular registry; warns and renders nothing if not found  |
| `'sap-ui'`  | Mounts via `window.sap.ui.require` + `ComponentContainer`              |

Angular registry support intentionally accepts only single element selectors such as `mfp-visited-service-card`. Attribute selectors like `[my-card]`, class selectors like `.my-card`, and comma-separated selectors are rejected because dashboard card configs use `component` as a tag-like persisted key.

## Usage with SAP UI5 components

Cards with `type: 'sap-ui'` are rendered using the SAP UI5 `ComponentContainer` API. `window.sap.ui.require` must be available on the page (loaded via the SAP UI5 bootstrap script) before the dashboard renders.

`component` must be the SAP UI5 component name passed as `name` to `ComponentContainer`. `componentInputs` are forwarded as `settings` to the container constructor.

```ts
const cards: CardConfig[] = [
  {
    id: 'sap-component-card',
    component: 'my.namespace.Component',
    type: 'sap-ui',
    w: 6,
    h: 20,
    componentInputs: {
      env: 'production',
    },
  },
];
```

If `window.sap` is not available when the card is rendered, an error is logged and the card host element is left empty.
