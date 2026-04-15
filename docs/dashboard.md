# Dashboard

An Angular dashboard layout component that combines editable sections with draggable loose cards. It is designed for composition with webcomponents exposed through the `component` field of each card.

## Tags

| Usage             | Tag               |
| ----------------- | ----------------- |
| Angular component | `<mfp-dashboard>` |

---

## Usage as an Angular component

```ts
import {
  CardConfig,
  Dashboard,
  DashboardConfig,
  SectionConfig,
} from '@openmfp/webcomponents';

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
    { id: 'runtime', title: 'Runtime', w: 12, h: 2 },
  ];

  cards: CardConfig[] = [
    {
      id: 'favorites-card',
      sectionId: 'favorites',
      component: 'mfp-wc-favorites',
      w: 6,
      h: 2,
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

---

## Configuration types

### `DashboardConfig`

```ts
interface DashboardConfig {
  title: string;
  description?: string;
  backgroundImageUrl?: string;
}
```

### `SectionConfig`

```ts
interface SectionConfig {
  id: string;
  w?: number;
  h?: number;
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

`w` and `h` control the rendered grid span. `x` and `y` persist the loose-card position reported by drag and drop functionality when edit mode is saved.
