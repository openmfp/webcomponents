# Dashboard

An Angular dashboard layout component that combines editable sections with draggable loose cards. Cards can render either registered Angular components or pre-registered web components through the same `component` field.

## Tags

| Usage             | Tag               |
| ----------------- | ----------------- |
| Angular component | `<mfp-dashboard>` |

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

`componentInputs` is shared by both render modes:

- For Angular components, values are applied with Angular `setInput(...)`.
- For Angular input aliases, both the class property name and the public alias are accepted.
- Unknown Angular input names are ignored and logged as a development warning.
- For web components, values are set as DOM properties, matching the previous behavior.

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
  componentInputs: {
    // Class property name works.
    title: 'Runtime',
  },
};

const sameCardUsingAlias: CardConfig = {
  id: 'app-card-alias',
  component: 'app-card',
  componentInputs: {
    // Public alias works too.
    cardTitle: 'Runtime',
  },
};
```

## Usage with web components

Custom elements are still supported. They must be registered in the browser before the dashboard renders them.

```ts
cards: CardConfig[] = [
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
| `cards`          | `CardConfig[]`    | no       | `[]`    | All cards shown in sections or in the grid                |
| `availableCards` | `CardConfig[]`    | no       | `[]`    | Card templates that can be added in edit mode               |

### Outputs

| Output  | Payload                                              | Description                     |
| ------- | ---------------------------------------------------- | ------------------------------- |
| `saved` | `{ sections: SectionConfig[]; cards: CardConfig[] }` | Emits when the user saves edits |

### Static methods

| Method                       | Description                                                                 |
| ---------------------------- | --------------------------------------------------------------------------- |
| `registerAngularComponents()` | Registers standalone Angular card components by their element selector name |

---

## Configuration types

### `DashboardConfig`

```ts
interface DashboardConfig {
  title: string;
  description?: string;
  backgroundImageUrl?: string;
  customActions?: DashboardButtonSettings[];
  editable?: boolean;
}
```

### `DashboardButtonSettings`

```ts
interface DashboardButtonSettings {
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
  w?: number;
  h?: number;
  x?: number;
  y?: number;
  sectionId?: string;
  component: string;
  componentInputs?: Record<string, unknown>;
  label?: string;
}
```

For sections, `w` controls the column span while height is determined by the section content. For cards, `w` and `h` control the rendered grid span. `x` and `y` persist the loose-card position reported by drag and drop functionality when edit mode is saved.

`component` accepts either:

- an element selector for a component registered with `Dashboard.registerAngularComponents(...)`
- a custom element tag that has already been registered with `customElements.define(...)`

Angular registry support intentionally accepts only single element selectors such as `mfp-visited-service-card`. Attribute selectors like `[my-card]`, class selectors like `.my-card`, and comma-separated selectors are rejected because dashboard card configs use `component` as a tag-like persisted key.
