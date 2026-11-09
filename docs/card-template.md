# CardTemplate

An Angular component that draws the MFP card frame and header — title, badge, search, overflow actions and message strip — around any content. The dashboard uses it for every card that sets [`componentTemplate`](./dashboard.md#card-template--componenttemplate); Angular applications can use it directly to build cards with their own content.

| Item     | Value                               |
| -------- | ----------------------------------- |
| Selector | `<mfp-card-template>`               |
| Class    | `CardTemplate`                      |
| Import   | `@openmfp/ngx`                      |
| Source   | `projects/ngx/cards/card-template/` |

---

## Usage

```ts
import { CardTemplate } from '@openmfp/ngx';

@Component({
  selector: 'app-orders-card',
  imports: [CardTemplate, OrdersTable],
  template: `
    <mfp-card-template
      name="Recent Orders"
      [badge]="{ text: 'Action Needed', state: 'Critical' }"
      [search]="{ placeholder: 'Search orders' }"
      [actions]="[{ key: 'export', text: 'Export to Spreadsheet' }]"
      [(searchValue)]="query"
      (actionPress)="onAction($event)"
    >
      <app-orders-table [filter]="query()" />
    </mfp-card-template>
  `,
})
export class OrdersCard {
  protected readonly query = signal('');

  protected onAction(key: string): void {
    // handle the action
  }
}
```

The card fills the height of its container. Give the host element a definite height (for example `block-size: 25rem`, or `height: 100%` inside a grid cell); the content below the header fills the rest and scrolls when it overflows. The space for the vertical scrollbar is always reserved, so the content keeps its width when a scrollbar appears.

---

## API

### Inputs

| Input          | Type                       | Default          | Description                                                                                                                                                                                                    |
| -------------- | -------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`         | `string`                   | — (required)     | Card title, and the accessible name of the card.                                                                                                                                                               |
| `header`       | `boolean`                  | `true`           | `false` draws only the frame: no title, badge, search, actions or message strip. The card keeps `name` as its accessible name.                                                                                 |
| `background`   | `'solid' \| 'transparent'` | `'solid'`        | `solid` draws the tile background and shadow; `transparent` draws neither.                                                                                                                                     |
| `badge`        | `CardTemplateBadge`        | —                | `{ text, state? }` shown on the top-right border as text, without a state icon. At most half the card's width; longer text ends with "…" and the full text is shown as a tooltip. Hidden when `text` is empty. |
| `search`       | `CardTemplateSearch`       | —                | `{ placeholder }` shows a search field in the header. The placeholder is also the field's accessible name.                                                                                                     |
| `actions`      | `CardTemplateAction[]`     | `[]`             | `{ key, text }[]` shown in an overflow menu. The "…" button is shown only when at least one action exists.                                                                                                     |
| `actionsLabel` | `string`                   | `'More actions'` | Accessible name and tooltip of the "…" button. Pass a translated text.                                                                                                                                         |
| `messageStrip` | `CardTemplateMessageStrip` | —                | `{ text, type? }` shown below the header. The user can close it; it is shown again when `messageStrip` changes.                                                                                                |
| `searchValue`  | `string` (model)           | `''`             | The search text. Two-way bindable with `[(searchValue)]`; it changes on every keystroke and is `''` after the user clears the field.                                                                           |

`badge.state` is one of `Neutral`, `Information`, `Positive`, `Negative` or `Critical` (default `Critical`). `messageStrip.type` is one of `Information`, `Positive`, `Negative` or `Critical` (default `Information`). These are the names UI5 Web Components use for `ui5-tag` and `ui5-message-strip`.

### Outputs

| Output        | Payload  | Description                                        |
| ------------- | -------- | -------------------------------------------------- |
| `actionPress` | `string` | The `key` of the action the user chose in the menu |

---

## Theming

The card uses SAP theming CSS variables only, so it follows the active theme (`sap_horizon`, `sap_horizon_dark`, `sap_horizon_hcw`, `sap_horizon_hcb`) without theme-specific CSS:

| Part                   | Variables                                                                           |
| ---------------------- | ----------------------------------------------------------------------------------- |
| Background (`solid`)   | `--sapTile_Background`                                                              |
| Shadow (`solid`)       | `--sapContent_Shadow0`                                                              |
| Shadow (`transparent`) | `--mfp_cardEditFrameShadow` (unset: no shadow)                                      |
| Border                 | `--sapElement_BorderWidth`, `--sapTile_BorderColor`, `--sapTile_BorderCornerRadius` |
| Font                   | `--sapFontFamily`                                                                   |

The high-contrast themes get their `0.25rem` corners and contrast outline from these variables, so content placed in the card must not draw its own background, border, corner radius or shadow.

`--sapTile_BorderColor` is the variable the dashboard overrides for its edit-mode hover and focus highlight, so the highlight appears on the card border automatically. In edit mode the dashboard also sets `--mfp_cardEditFrameShadow`, which gives a `transparent` card the same frame a `solid` one has. Hosts other than the dashboard can set `--mfp_cardEditFrameShadow` to show that frame.

---

## Test IDs

| Element        | `data-testid`                 | Notes                               |
| -------------- | ----------------------------- | ----------------------------------- |
| Card frame     | `card-template`               | Carries `aria-label` = `name`       |
| Title          | `card-template-title`         | Present when `header` is `true`     |
| Badge          | `card-template-badge`         | Present when `badge.text` is set    |
| Search field   | `card-template-search`        | Present when `search` is set        |
| Actions button | `card-template-actions`       | Present when `actions` is not empty |
| Actions menu   | `card-template-actions-menu`  |                                     |
| Action         | `card-template-action-{key}`  | `key` = `action.key`                |
| Message strip  | `card-template-message-strip` | Present until the user closes it    |

---

## Storybook

`Cards / CardTemplate` covers every input, the frame without header, the badge states and the four Horizon themes. `Declarative UI / Dashboard / Card Template` shows the template on dashboard cards of all three types.

```bash
npm run storybook
```
