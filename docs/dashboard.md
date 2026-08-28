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
  el.config = {};
  el.i18n = { ...EN_DEFAULTS, title: 'Platform Overview' };
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

> **A SAP Horizon theme must be applied**, or the dashboard's own markup renders with a serif fallback and unthemed colors. See [Theming & CSS variables](#theming--css-variables).

---

## Theming & CSS variables

### Theme setup (required)

The dashboard renders its own markup (title, description, edit bar, card chrome) using SAP Horizon theme variables such as `--sapFontFamily`, `--sapTextColor`, and `--sapContent_*`. These variables only exist once a SAP Horizon theme is **applied to the page**; without it the browser has no `--sapFontFamily` to inherit and text falls back to serif.

**Angular app already running SAP UI5 / Fiori** — the theme parameters are already present at `:root`, so no extra setup is needed. (The `@fundamental-ngx/ui5-webcomponents*` peer dependencies pull in UI5, and the host app applies the theme.)

**Standalone web-component bundle on a non-UI5 page** — apply a theme once, before or right after loading `mfp-wc-dashboard.js`:

```ts
import { setTheme } from '@ui5/webcomponents-base/dist/config/Theme.js';
import '@ui5/webcomponents-theming/dist/Assets.js';

await setTheme('sap_horizon');
```

Available Horizon themes: `sap_horizon`, `sap_horizon_dark`, `sap_horizon_hcb` (high-contrast black), `sap_horizon_hcw` (high-contrast white), and the `sap_horizon_auto` / `sap_horizon_hc_auto` OS-preference variants.

> The bundle auto-syncs to the host theme when it runs **inside an OpenUI5 shell** (it detects `sap.ui.require` and follows the shell's active theme). On a standalone page there is no shell to follow, so the consumer must apply a theme as shown above.

### CSS variable contract

These custom properties form the dashboard's public styling contract. Set them on (or above) the dashboard element.

| Variable                                      | Default                        | Purpose                                                                                                                                                                       |
| --------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--mfp_cardContainerPadding`                  | `10px`                         | Inline padding inside each dashboard card.                                                                                                                                    |
| `--mfp_cardBorder`                            | `none`                         | Border applied to the inner card surface while an editable card is hovered or focused.                                                                                        |
| `--row-height`                                | `10px`                         | Height of each grid row track in a section's card grid.                                                                                                                       |
| `--column-gap`                                | `0px`                          | Horizontal gap between cards in a section grid.                                                                                                                               |
| `--row-gap`                                   | `0px`                          | Vertical gap between cards in a section grid.                                                                                                                                 |
| `--mfp-dashboard-background`                  | `none`                         | Background image used when `config.backgroundImageUrl` is omitted — see [`backgroundImageUrl` — dashboard background image](#backgroundimageurl--dashboard-background-image). |
| `--mfp-dashboard-empty-image`                 | SAP `NoApplications` TNT scene | Artwork shown by the [empty state](#empty-state). Overriding it swaps the illustration from CSS alone.                                                                        |
| `--dashboard-cols-sm` / `-md` / `-lg` / `-xl` | `1` / `8` / `12` / `14`        | Column-track counts at each responsive breakpoint (driven by container queries).                                                                                              |
| `--cols`                                      | _unset_                        | Per-section column-count override. Set through `SectionConfig`; overrides the responsive `--dashboard-cols-*` for that section.                                               |

`--mfp_cardContainerPadding`, `--mfp_cardBorder`, `--row-height`, `--column-gap`, `--row-gap`, `--mfp-dashboard-background`, and `--mfp-dashboard-empty-image` are the intended consumer knobs. The `--dashboard-cols-*` variables are normally set at runtime by the active layout engine profile — override them only when building a custom layout. Other custom properties seen in the markup (e.g. `--gs-item-margin-top`, `--Container-Spacing-Small`) are internal implementation details and are **not** part of this contract.

`--mfp_cardBorder` is applied to the dashboard card's wrapper (`.component-host`), so an explicitly configured edit-mode focus border stays inside the visible card. The GridStack item itself does not intentionally draw a focus border. A registered card may also draw its own border: for example, cards using `border: 1px solid var(--sapTile_BorderColor, transparent)` receive the dashboard's hover/focus `--sapTile_BorderColor` through CSS inheritance. In that case a visible border is expected even when `--mfp_cardBorder` is unset; leave the variable unset to avoid adding a second wrapper border. To provide a wrapper border explicitly:

```css
mfp-dashboard {
  --mfp_cardBorder: 1px solid var(--sapHighlightColor, #0070f2);
}
```

---

## Usage as an Angular component

Register Angular card components once before rendering the dashboard. The dashboard reads each Angular component selector and uses that selector string from `CardConfig.component`.

> If your app already runs SAP UI5 / Fiori, the Horizon theme is applied for you and no extra setup is needed. Otherwise, apply a theme as described in [Theming & CSS variables](#theming--css-variables).

```ts
import {
  CardConfig,
  Dashboard,
  DashboardConfig,
  SectionConfig,
  ServiceStatusCard,
  VisitedServiceCard,
} from '@openmfp/ngx';

Dashboard.registerAngularComponents([VisitedServiceCard, ServiceStatusCard]);

@Component({
  imports: [Dashboard],
  template: `
    <mfp-dashboard
      [config]="config"
      [i18n]="i18n"
      [sections]="sections"
      [cards]="cards"
      [availableCards]="availableCards"
      (saved)="onSaved($event)"
    />
  `,
})
export class DashboardPage {
  config: DashboardConfig = {
    backgroundImageUrl: '/assets/dashboard-bg.png',
  };
  i18n: DashboardTranslations = {
    ...EN_DEFAULTS,
    title: 'Platform Overview',
    description: 'Service health and team activity',
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
      component: 'mfp-service-status-card',
      type: 'angular',
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

| Input            | Type                                         | Required | Default       | Description                                                                                                                                                                                                                             |
| ---------------- | -------------------------------------------- | -------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `config`         | `DashboardConfig`                            | yes      | —             | Optional title/description (overridden by `i18n` when not present), background image (falls back to the `--mfp-dashboard-background` CSS variable), and layout/edit flags                                                               |
| `sections`       | `SectionConfig[]`                            | no       | `[]`          | Named dashboard sections rendered above the loose-card grid                                                                                                                                                                             |
| `cards`          | `CardConfig[]`                               | no       | `[]`          | All cards shown in sections or in the grid                                                                                                                                                                                              |
| `availableCards` | `CardConfig[]`                               | no       | `[]`          | Card templates that can be added in edit mode                                                                                                                                                                                           |
| `customActions`  | `ButtonSettings[]`                           | no       | `[]`          | Extra action buttons rendered in the toolbar alongside the built-in ones. Clicking one emits `actionButtonClick`.                                                                                                                       |
| `i18n`           | `DashboardTranslations \| null \| undefined` | no       | `EN_DEFAULTS` | Full set of dashboard chrome + title/description strings. When `null`, `undefined`, or `{}`, the built-in English defaults are used; when provided, it must be the complete `DashboardTranslations`. See [Localization](#localization). |
| `loading`        | `boolean`                                    | no       | `false`       | Busy flag for the dashboard body. While `true` the whole page is covered by a busy indicator and the empty state is suppressed. See [Initial loading](#initial-loading).                                                                |
| `loadingDelay`   | `number`                                     | no       | `1000`        | Milliseconds to wait after `loading` turns `true` before the spinner paints. A load that finishes inside the window never shows one. See [Initial loading](#initial-loading).                                                           |

### Outputs

| Output                 | Payload                                              | Description                                                                                                                                                                                                                                           |
| ---------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `saved`                | `{ sections: SectionConfig[]; cards: CardConfig[] }` | Emits when the user saves edits                                                                                                                                                                                                                       |
| `actionButtonClick`    | `{ event: MouseEvent; action: ButtonSettings }`      | Emits when a custom action button from the `customActions` input is clicked                                                                                                                                                                           |
| `unsavedChangesChange` | `boolean`                                            | Emits whenever the unsaved-changes state flips — `true` when the user first makes an unsaved edit, `false` after save/discard. Use this to drive your own navigation guard (see [Showing your own dialog instead](#showing-your-own-dialog-instead)). |

### Public methods

| Method                                         | Returns   | Description                                                                                                             |
| ---------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------- |
| `requestNavigation(proceed: () => void)`       | `boolean` | Framework-agnostic navigation guard — see [Unsaved-changes guard](#unsaved-changes-guard).                              |
| `saveEdit()`                                   | `void`    | Persists changes (fires the `saved` event) and exits edit mode.                                                         |
| `cancelEdit()`                                 | `void`    | Requests to leave edit mode. Opens `DiscardChangesDialog` if there are unsaved changes; otherwise discards immediately. |
| `confirmDiscard()`                             | `void`    | Confirms the discard, closes `DiscardChangesDialog`, and reverts to the snapshot taken on entering edit mode.           |
| `onUnsavedNavSave()`                           | `void`    | Save handler for a custom in-app-navigation dialog — closes the popup, saves, then resumes the queued navigation.       |
| `onUnsavedNavDiscard()`                        | `void`    | Discard handler for a custom in-app-navigation dialog — closes the popup, reverts, then resumes the queued navigation.  |
| `onUnsavedNavCancel()`                         | `void`    | Cancel handler for a custom in-app-navigation dialog — closes the popup and drops the queued navigation.                |
| `Dashboard.registerAngularComponents(types[])` | `void`    | Static — registers standalone Angular card components by their element selector name.                                   |

> **Web-component consumers:** `@angular/elements` only proxies inputs and outputs onto the custom element — instance methods are **not** reachable on the DOM node by default. The dashboard's WC bundle (`mfp-wc-dashboard.js`) explicitly forwards all of the methods above onto `<mfp-wc-dashboard>`, so they are callable directly on the DOM element (e.g. `document.querySelector('mfp-wc-dashboard').saveEdit()`). If the Angular component has not been created yet, `requestNavigation()` runs its callback synchronously and returns `true`, and the void handlers are no-ops.

### Reactive state

| Signal                   | Type              | Description                                                                                                                             |
| ------------------------ | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `editMode()`             | `signal<boolean>` | `true` while the user is in the dashboard's edit mode.                                                                                  |
| `unsavedNavDialogOpen()` | `signal<boolean>` | `true` while the unsaved-changes navigation popup is shown. Driven by `requestNavigation()`; consumers normally don't read it directly. |
| `discardDialogOpen()`    | `signal<boolean>` | `true` while the discard-confirmation popup (Cancel button on the edit-bar) is shown.                                                   |

> **Note:** The dashboard also tracks a `hasUnsavedChanges` computed internally (`true` while the user is in edit mode AND has changed sections, cards, or grid positions; resets after save / discard), but it is `protected` and **not** readable from a consumer's dashboard reference. To react to that state from your own code, listen to the [`unsavedChangesChange`](#outputs) output instead.

---

## Localization

The dashboard title, description, chrome (toolbar buttons, dialogs, accessibility labels, the **Unsaved Changes** badge) are rendered from a fixed set of string keys. The library ships **English only** as the built-in default. To render the dashboard in any other language, the client application supplies a **complete** `DashboardTranslations` object through the `i18n` input; to switch language at runtime, bind a new object.

When `i18n` is `null`, `undefined`, or an empty object (`{}`), the dashboard falls back entirely to the built-in English defaults (`EN_DEFAULTS`). When a non-empty object is provided it is treated as authoritative and **must contain all keys** — the type is the full `DashboardTranslations`, not a partial.

For the title and description specifically, `i18n` is not the only source: when `i18n` does not supply them, the dashboard falls back to `config.title` / `config.description` before the English defaults. See [`DashboardConfig`](#dashboardconfig) for the full precedence.

This keeps the library free of a hardcoded language list: the set of supported languages is entirely the client's decision.

The key contract is exported for type-safe usage:

```ts
import {
  DashboardI18nKey,
  // union of the 17 key strings
  DashboardTranslations,
  // Record<DashboardI18nKey, string>
  EN_DEFAULTS, // the built-in English strings
} from '@openmfp/ngx';
```

### Angular usage

```ts
germanStrings: DashboardTranslations = {
  ...EN_DEFAULTS, // start from the English contract, then translate
  title: 'Hallo!',
  description: 'Sie befinden sich im Dashboard',
  save: 'Speichern',
  cancel: 'Abbrechen',
  // …all remaining keys
};
```

```html
<mfp-dashboard [config]="config" [i18n]="germanStrings" />
```

Switch language by binding a new object to `i18n` — the change is forwarded to every nested dashboard component (sections, cards, all three dialogs) via a shared `DashboardI18nService`, so every label re-renders in place.

### Web-component usage

```js
const el = document.querySelector('mfp-wc-dashboard');
el.i18n = germanStrings;
// language change: reassign the i18n property
el.i18n = spanishStrings;
```

### Translated keys

The 20 keys and their built-in English defaults (the exact strings in `EN_DEFAULTS`). A provided `i18n` object must supply all of them:

| Key                      | English default (built-in)                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------ |
| `title`                  | Hi!                                                                                              |
| `description`            | You're on the Dashboard                                                                          |
| `editHomeButton`         | Edit Home                                                                                        |
| `editCardsButton`        | Edit Cards                                                                                       |
| `unsavedChanges`         | Unsaved Changes                                                                                  |
| `editCards`              | Edit Cards                                                                                       |
| `actions`                | Actions                                                                                          |
| `save`                   | Save                                                                                             |
| `cancel`                 | Cancel                                                                                           |
| `discard`                | Discard                                                                                          |
| `discardChanges`         | Discard Changes                                                                                  |
| `discardConfirmBody`     | Discard the changes? This action cannot be undone.                                               |
| `unsavedNavBody`         | You are leaving this page. Save or discard the changes to proceed. This action cannot be undone. |
| `noCardsAvailable`       | No cards available.                                                                              |
| `emptyStateTitle`        | Your home is empty                                                                               |
| `emptyStateDescription`  | Add cards to customize your home page.                                                           |
| `emptyStateIllustration` | No applications                                                                                  |
| `removeSection`          | Remove section                                                                                   |
| `removeCard`             | Remove card                                                                                      |
| `resizable`              | Resizable                                                                                        |

`emptyStateTitle`, `emptyStateDescription` and `emptyStateIllustration` are the [empty state](#empty-state) heading, sub-line and the accessible name of its artwork; they are rendered as plain text, never as HTML.

`title` and `description` accept plain strings or HTML markup. Safe HTML tags (e.g. `<b>`, `<em>`, `<a>`) are rendered; dangerous content such as `<script>` is stripped. The title renders as an `<h3>` heading and the description as an `<h5>` heading (hidden when `description` is empty). `editHomeButton` is the text of the built-in Edit View button and `editCardsButton` is the text of the built-in Edit Cards button (both win over any `buttonsSettings` text).

### What is NOT translated

The dashboard does **not** translate the remaining consumer-supplied strings — those are passed through verbatim because the consumer already controls them:

- `customActions[].text` / `tooltip`
- `config.buttonsSettings` `icon` / `design` (the built-in button **texts** come from `i18n.editHomeButton` and `i18n.editCardsButton`)
- Card `label`s shown in the Edit Cards dialog list

Translate these in your application before passing them to the dashboard — typically alongside the same language switch that swaps the `i18n` input.

---

## Initial loading

A dashboard whose cards are still being fetched has nothing useful to show: the grid is empty, so without a busy state it renders the "your home is empty" message and then rearranges itself the moment the data lands. The `loading` input covers that window.

```html
<mfp-dashboard [cards]="cards()" [loading]="cardsPending()" />
```

While `loading` is `true`:

- the **entire dashboard body** — topbar, sections and the card grid — is wrapped in a `ui5-busy-indicator`, so the page shows one spinner rather than a spinner per card, and the chrome behind it is inert;
- the [empty state](#empty-state) is **suppressed**, because a home that has not finished loading must not claim to be empty. It reappears the moment `loading` clears, if the loose-card grid is still empty.

`loading` is entirely consumer-driven — the dashboard never sets it. Bind it to whatever represents your fetch (`resource().isLoading()`, an RxJS flag, `el.loading = true` from plain JS) and clear it when the data arrives _or_ when it fails; a rejected request that leaves `loading` stuck at `true` leaves a spinner up forever.

### `loadingDelay` — the one-second grace period

Showing a spinner for a request that returns in 80 ms is worse than showing nothing: the user sees a flash. `loadingDelay` (default `1000`) is the grace period between `loading` turning `true` and the busy state becoming visible. The timer starts when `loading` flips and is **cancelled** if it clears first, so a fast load leaves the page completely untouched — which is exactly the "if load takes longer than one second → busy indicator" behaviour.

Be precise about what this knob is, because two neighbouring ideas are often confused with it:

| Concept                  | What it does                                                     | Provided here                                                                                     |
| ------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **Delay before showing** | Waits N ms before painting; cancelled if the load finishes first | **Yes** — this is `loadingDelay`                                                                  |
| Minimum display time     | Once shown, keeps the spinner up for at least N ms               | No. The indicator disappears as soon as `loading` turns `false`                                   |
| Timeout                  | Gives up and shows an error after N ms                           | No. The indicator stays up as long as `loading` is `true`; error handling belongs to the consumer |

`ui5-busy-indicator` ships a `delay` property with the same intent, and the obvious implementation would be to hand `loadingDelay` straight to it. The dashboard deliberately does not: UI5 keys its content dimming (`:host([active]) ::slotted(*) { opacity: … }`) off `active` rather than off the elapsed timer, so delegating would grey the whole dashboard out the instant `loading` flipped — flashing on precisely the fast loads the delay exists to hide. The indicator is therefore given `delay="0"` and the dashboard owns the timing, which is also why the two delays cannot compound.

The consequence worth knowing: **nothing at all changes on screen during the grace period** — no dimming, no reserved space, no spinner. The only immediate effect of `loading` is the empty-state suppression above, which is deliberate, because showing "your home is empty" for half a second is a wrong statement rather than a slow one.

Set `loadingDelay` to `0` to paint immediately (useful in tests and visual regression runs), or raise it if your backend is reliably fast and you want an even quieter UI.

### Web-component consumers

Both inputs accept the attribute forms a non-Angular consumer would reach for, as well as properties:

```html
<mfp-wc-dashboard loading loading-delay="500"></mfp-wc-dashboard>
```

```js
const el = document.querySelector('mfp-wc-dashboard');
el.loading = true;
fetchCards()
  .then((cards) => (el.cards = cards))
  .finally(() => (el.loading = false));
```

### Accessibility

The busy indicator blocks pointer and keyboard interaction with the content it covers and carries UI5's own accessible "Loading" title. That title comes from the UI5 message bundle and follows the UI5 language configuration — it is **not** part of the dashboard's [`DashboardTranslations`](#translated-keys) contract, so there is no `i18n` key to override for it.

---

## Empty state

When the **loose-card grid** holds nothing, the dashboard renders an empty state: an illustration, `i18n.emptyStateTitle`, `i18n.emptyStateDescription`, and an **Edit Home** button.

**Section cards do not count.** Sections are app-provided content that the consumer declares (and frequently marks `editable: false`), while the loose grid is the part of the home the user curates through the Edit Cards dialog. "Your home is empty" is a statement about that grid, so a dashboard with a fully populated section but no loose cards still shows the empty state — rendered below the sections, above the grid it describes.

The button is shown only when `config.editable` is `true` and the dashboard is **not** already in edit mode — in edit mode the toolbar's Edit Cards button already covers the same action. Pressing it enters edit mode **and** opens the [EditCardsDialog](#editcardsdialog) in one step, so a user starting from an empty home lands directly on the card picker instead of an empty grid.

The empty state itself stays visible in edit mode, so the page never renders blank while the user picks their first card. It disappears as soon as the first card lands outside a section; a card added to a section leaves it in place.

### Swapping the illustration

The artwork is applied as a `background-image`, resolved from the `--mfp-dashboard-empty-image` custom property:

```css
.mfp-dashboard__empty-illustration {
  background-image: var(--mfp-dashboard-empty-image, url('<built-in default>'));
}
```

The built-in default is SAP's **NoApplications** TNT scene illustration (from `@ui5/webcomponents-fiori`), inlined as a data URI with the **Horizon light** palette baked in. It is baked rather than referenced because SAP ships those SVGs with `var(--sapContent_Illustrative_*)` fills, and CSS custom properties do not resolve inside an SVG loaded through `url()` — only inside an SVG inlined into the document.

That means the default does not follow the active theme. Consumers running anything other than Horizon light should override the variable, scoped by the host's theme marker — the same pattern as [`--mfp-dashboard-background`](#backgroundimageurl--dashboard-background-image):

```css
html.sapUiTheme-sap_horizon_dark #my-dashboard {
  --mfp-dashboard-empty-image: url('/assets/no-applications-dark.svg');
}
```

Set it to `none` to render the empty state without any artwork.

---

## EditCardsDialog

The `EditCardsDialog` component (`mfp-edit-cards-dialog`) is rendered inside the dashboard when edit mode is active and the user clicks the **Edit Cards** toolbar button. It shows all `availableCards` as a list of toggle switches — cards already on the dashboard start toggled on.

### Inputs

| Input            | Type           | Default     | Description                                |
| ---------------- | -------------- | ----------- | ------------------------------------------ |
| `availableCards` | `CardConfig[]` | `[]`        | Full list of cards the user may add/remove |
| `addedCardsIds`  | `Set<string>`  | `new Set()` | IDs of cards currently on the dashboard    |
| `open`           | `boolean`      | `false`     | Controls dialog visibility                 |

### Outputs

| Output      | Payload                                      | Description                                          |
| ----------- | -------------------------------------------- | ---------------------------------------------------- |
| `confirm`   | `{ added: CardConfig[]; removed: string[] }` | Emits the diff when the user clicks **Save**         |
| `cancelled` | `void`                                       | Emits when the user clicks **Cancel** or presses Esc |

---

## Unsaved-changes guard

When the user enters edit mode and starts changing the layout — toggling cards, dragging tiles, resizing, removing sections — the dashboard surfaces three independent confirmation paths so unsaved work is never lost silently:

1. **Edit-bar Cancel** — clicking the Cancel button on the in-page edit toolbar with unsaved changes opens the [`DiscardChangesDialog`](#discardchangesdialog) (two buttons: Discard / Cancel).
2. **Closing the tab / typing a new URL** — a `beforeunload` listener triggers the browser's native generic confirmation prompt. Browsers do **not** allow custom HTML or button labels here; it's a security boundary, not a design choice.
3. **In-app navigation** — when the host app routes the user to a different page (Angular Router, Luigi, plain `<a href>`, history popstate, anything), the dashboard exposes a public method that opens a custom three-button popup ([`UnsavedChangesDialog`](#unsavedchangesdialog)) and resumes navigation only on Save or Discard.

The first two are wired automatically as soon as `<mfp-dashboard>` is mounted — no consumer code is required. The third needs one line of glue per navigation hook the host app uses.

### `dashboard.requestNavigation(proceed)` — the integration API

The dashboard library is **framework-independent**: it does not import `@angular/router`, `@luigi-project/client`, or any other navigation framework. Instead, the consumer app calls a single method on the dashboard instance from inside whatever navigation hook it has, and lets the dashboard decide whether to allow, queue, or drop the navigation:

```ts
const proceeded: boolean = dashboard.requestNavigation(() => {
  // Your real navigation logic. Anything goes — router.navigateByUrl,
  // LuigiClient.linkManager().navigate, window.location.href = ...
});
```

Behaviour:

| Dashboard state    | What `requestNavigation` does                                                                        | Return value |
| ------------------ | ---------------------------------------------------------------------------------------------------- | ------------ |
| No unsaved changes | Calls `proceed()` synchronously. The host can navigate immediately.                                  | `true`       |
| Unsaved changes    | Opens `UnsavedChangesDialog` and stores `proceed` as a pending callback. Host **must NOT** navigate. | `false`      |

If the user picks…

| Button in `UnsavedChangesDialog` | What the dashboard does                                                                                              |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Save**                         | Persists changes (emits `saved`), exits edit mode, then runs the queued `proceed()` callback.                        |
| **Discard**                      | Reverts to the snapshot taken on entering edit mode, exits edit mode, then runs the queued `proceed()` callback.     |
| **Cancel**                       | Closes the popup and **drops** the pending callback. The user stays on the page in edit mode with their work intact. |

A second `requestNavigation()` call while a request is already pending replaces the older callback — Cancel always means "stay here", so losing the older queued navigation is the right outcome.

### Wiring examples

The same `requestNavigation()` works from any navigation entry point. Typical wirings:

#### Angular Router (`CanDeactivate` guard)

```ts
import { CanDeactivateFn } from '@angular/router';
import { Dashboard } from '@openmfp/ngx';

export const unsavedDashboardChangesGuard: CanDeactivateFn<{
  dashboard: Dashboard;
}> = (component, _current, _snapshot, nextState) => {
  const proceeded = component.dashboard.requestNavigation(() => {
    // The dashboard already decided we may go — just navigate.
    location.assign(nextState.url);
  });
  // Return `true` to allow Angular's own pending navigation through; return
  // `false` to block it (the dashboard's dialog will resume navigation later).
  return proceeded;
};
```

Attach the guard to the route, and expose the dashboard as a `viewChild` on the page component:

```ts
@Component({
  imports: [Dashboard],
  template: `<mfp-dashboard #dashboard ... />`,
})
export class DashboardPage {
  dashboard = viewChild.required(Dashboard);
}
```

#### Luigi navigation listener

```ts
import LuigiClient from '@luigi-project/client';

LuigiClient.addNavigationListener((event) => {
  const proceeded = dashboard.requestNavigation(() => {
    LuigiClient.linkManager().navigate(event.params.path);
  });
  // Block Luigi's default navigation when we've queued the dialog.
  return !proceeded;
});
```

#### Plain link / button click

```ts
linkEl.addEventListener('click', (e) => {
  e.preventDefault();
  dashboard.requestNavigation(() => {
    window.location.href = linkEl.href;
  });
});
```

#### Web-component consumers

Because `<mfp-wc-dashboard>` is the same Angular component wrapped as a custom element, the method is reachable on the DOM node:

```js
const dashboardEl = document.querySelector('mfp-wc-dashboard');
const proceeded = dashboardEl.requestNavigation(() => {
  history.pushState(null, '', '/next');
});
```

### Showing your own dialog instead

The built-in `UnsavedChangesDialog` covers the common case (Save / Discard / Cancel). If the host app needs a different look, copy, or behaviour, the dashboard exposes the primitives so you can replace the popup entirely:

1. Track the unsaved-changes state via the `unsavedChangesChange` output.
2. While it is `true`, suppress the navigation, render your own dialog (any framework, any styling), and based on the user's choice call one of:
   - `dashboard.saveEdit()` — persist (fires the `saved` event) and exit edit mode.
   - The dashboard does not currently expose a public `discardEdit()` method. The simplest way to discard from outside is `dashboard.cancelEdit()` — it opens `DiscardChangesDialog` if there are unsaved changes; you can then drive `confirmDiscard()` programmatically. If you want to discard without any popup at all, prefer skipping the in-app navigation and relying on `requestNavigation()` instead.
3. If you do want to keep the dashboard in charge of the popup but swap the **dialog UI only**, you can hide the default dialog by overriding its CSS in your shadow-DOM-piercing stylesheet and rendering your own component bound to `unsavedNavDialogOpen()`, then calling `onUnsavedNavSave()`, `onUnsavedNavDiscard()`, or `onUnsavedNavCancel()` from your buttons. The handlers are the same ones the built-in dialog uses, so behaviour stays consistent.

In practice the recommended path is option 1 — drive everything through `requestNavigation()` and let the dashboard's built-in popup handle it. Reach for the lower-level signals only when your visual requirements demand it.

### What the user sees

#### Browser-level (closing tab, typing URL)

The browser's native generic prompt — wording is fixed by the browser:

> _Leave site? Changes you made may not be saved._

This fires only while `hasUnsavedChanges()` is true; the listener is removed when the dashboard is destroyed.

#### In-app navigation — `UnsavedChangesDialog`

Three-button popup driven by `requestNavigation()`:

- Header: "Unsaved Changes" (`<ui5-title>`; the dialog uses `state="Critical"` for the accent — there is no icon)
- Body: "You are leaving this page. Save or discard the changes to proceed. This action cannot be undone."
- Buttons: **Save** (Emphasized) / **Discard** (Transparent) / **Cancel** (Transparent)

#### Edit-bar Cancel — `DiscardChangesDialog`

Two-button popup shown when the user clicks the Cancel button on the in-page edit toolbar with unsaved changes:

- Header: "Discard Changes" (`<ui5-title>`; the dialog uses `state="Critical"` for the accent — there is no icon)
- Body: "Discard the changes? This action cannot be undone."
- Buttons: **Discard** (Emphasized) / **Cancel** (Transparent)

---

## DiscardChangesDialog

`<mfp-discard-changes-dialog>` — confirmation popup the dashboard pops when the user clicks Cancel on the edit-bar with unsaved changes. It is rendered automatically by `<mfp-dashboard>` and is not part of the public API — the tag and API below document the dashboard's internal behaviour.

### Inputs

| Input  | Type      | Default | Description                |
| ------ | --------- | ------- | -------------------------- |
| `open` | `boolean` | `false` | Controls dialog visibility |

### Outputs

| Output      | Payload | Description                                                                |
| ----------- | ------- | -------------------------------------------------------------------------- |
| `confirm`   | `void`  | Emits when the user clicks **Discard**                                     |
| `cancelled` | `void`  | Emits when the user clicks **Cancel** or closes the dialog (Esc / overlay) |

---

## UnsavedChangesDialog

`<mfp-unsaved-changes-dialog>` — three-button popup the dashboard pops when an in-app navigation is intercepted via `requestNavigation()`. Like `DiscardChangesDialog`, it is rendered automatically by `<mfp-dashboard>` and is not part of the public API.

### Inputs

| Input  | Type      | Default | Description                |
| ------ | --------- | ------- | -------------------------- |
| `open` | `boolean` | `false` | Controls dialog visibility |

### Outputs

| Output      | Payload | Description                                                                |
| ----------- | ------- | -------------------------------------------------------------------------- |
| `save`      | `void`  | Emits when the user clicks **Save**                                        |
| `discard`   | `void`  | Emits when the user clicks **Discard**                                     |
| `cancelled` | `void`  | Emits when the user clicks **Cancel** or closes the dialog (Esc / overlay) |

---

## Configuration types

### `DashboardConfig`

```ts
interface DashboardConfig {
  /** Optional dashboard title; overridden by `i18n.title` when that is provided. */
  title?: string;
  /** Optional dashboard description; overridden by `i18n.description` when that is provided. */
  description?: string;
  /** Optional; when omitted the host falls back to the CSS variable
   *  `--mfp-dashboard-background` (default `none`). */
  backgroundImageUrl?: string;
  buttonsSettings?: DashboardButtonsSettings;
  editable?: boolean;
  editButtonFirst?: boolean;
  zFlow?: {
    cardHeight: number;
  };
}
```

The dashboard title and description resolve with the following precedence, highest first:

1. **`i18n.title` / `i18n.description`** — when the `i18n` input supplies them (this is what language switching drives; see [Localization](#localization)).
2. **`config.title` / `config.description`** — the optional fields above, used when `i18n` does not supply the corresponding string.
3. **Built-in English defaults** (`EN_DEFAULTS`) — when neither is set.

Use `config.title` / `config.description` for a fixed, non-localized header; use `i18n` when the header must change with the active language (it takes priority over `config`).

#### `backgroundImageUrl` — dashboard background image

The dashboard host element's `background-image` is resolved in this order:

1. **`config.backgroundImageUrl`** — when set, it is applied directly as
   `url(<backgroundImageUrl>)`. Use this for a single, fixed background.
2. **`--mfp-dashboard-background`** — when `backgroundImageUrl` is omitted, the
   host falls back to `background-image: var(--mfp-dashboard-background, none)`.
   This lets the consumer drive the background from CSS instead of TypeScript —
   for example to vary it by theme, or to show no background at all.

Because the fallback is a CSS custom property, a consumer can bind the
background to the active theme without any per-theme JavaScript. Set the
variable on (or above) the dashboard element and scope it by the host's theme
marker; leave it unset (or `none`) for themes that should have no background,
such as the high-contrast themes:

```css
/* light / dark artwork per theme, no background for high-contrast themes */
html.sapUiTheme-sap_horizon #my-dashboard {
  --mfp-dashboard-background: url('/assets/dashboard-bg-light.png');
}
html.sapUiTheme-sap_horizon_dark #my-dashboard {
  --mfp-dashboard-background: url('/assets/dashboard-bg-dark.png');
}
html.sapUiTheme-sap_horizon_hcw #my-dashboard,
html.sapUiTheme-sap_horizon_hcb #my-dashboard {
  --mfp-dashboard-background: none;
}
```

`background-size` is auto-derived from the image's natural height only when
`config.backgroundImageUrl` is set; with the CSS-variable path it defaults to
`100% auto`.

#### `zFlow` — reflow layout mode

Providing `zFlow` switches the loose-card grid from the default free-placement engine to the **z-flow engine**. It changes two things fundamentally: how cards are ordered, and how they can be resized.

**Keyboard navigation.** Keyboard navigation is available only when `zFlow` is configured and the dashboard is in edit mode. The default GridStack engine does **not** support dashboard keyboard navigation. Only loose cards participate; section cards are not keyboard-navigable.

In edit mode, focus stays on the GridStack card item rather than moving into the card content. The card content is inert while editing, while the card's remove button remains available. The focused card uses the same inner-surface border styling as hover; depending on the registered card, that border comes from the card's own SAP tile styles or from [`--mfp_cardBorder`](#css-variable-contract).

| Shortcut                                   | Action                                                                           |
| ------------------------------------------ | -------------------------------------------------------------------------------- |
| `Shift + ArrowRight` / `Shift + ArrowLeft` | Grow / shrink the card by one z-flow width step.                                 |
| `Ctrl + ArrowLeft` / `Ctrl + ArrowRight`   | Move the card left / right within the z-flow order.                              |
| `Ctrl + ArrowUp` / `Ctrl + ArrowDown`      | Move the card to the adjacent row while preserving the closest column.           |
| `Ctrl + Home` / `Ctrl + End`               | Move the card to the start / end of its current row.                             |
| `Meta + ArrowLeft` / `Meta + ArrowRight`   | Move the card to the start / end of its current row (for macOS-style modifiers). |

The shortcuts are exposed through `aria-keyshortcuts` on each keyboard-navigable loose card. Other modifier combinations, including `Alt`, are ignored.

**What z-flow is.** In z-flow the loose cards are a single **linear list**, not a set of free (x, y) coordinates. The grid only _renders_ that list left-to-right, then wraps to the next row and continues left-to-right — the reading path traces a `Z`, hence the name (it has nothing to do with CSS `z-index`). The card's position is its index in the list:

```text
list:  [A, B, C, D, E, F]      4 columns:   [A] [B] [C] [D]
                                            [E] [F]
```

**How drag & drop reorders.** Dragging a card does not drop it at arbitrary pixels — it picks a **new index in the list**. The card is removed from its old index, inserted at the new one, and every card in between shifts by one; the grid then re-packs from the updated list with **no gaps left behind**. Because the source of truth is the order (not coordinates), the same list reflows correctly at any column count — resizing the viewport never changes the saved order, only how many cards fit per row.

```text
drag F between C and D  →  list becomes [A, B, C, F, D, E]

before            after
[A] [B] [C]       [A] [B] [C]
[D] [E] [F]       [F] [D] [E]
```

**Snapped (stepped) resize.** Instead of allowing any column count, the z-flow engine snaps every resize to three fixed fractions of the dashboard width — the drag handle jumps between them rather than moving pixel by pixel:

| Card Size | Width | Fraction of the row                                  |
| --------- | ----- | ---------------------------------------------------- |
| S         | 1     | ¼                                                    |
| M         | 2     | ½                                                    |
| XL        | 3     | ¾ on XL Page (min-width: 1440) / full-width below XL |

The "full" step is screen-width-dependent: on XL-width pages (≥ 1440 px) a full card fills **3 of 4** columns of the row (¾), and below that it fills **4 of 4** (full-width) so it always fills the row. Cards already sized to the old full-width value are re-snapped automatically when the viewport crosses the 1440 px boundary.

**Fixed card height.** Every loose card is forced to a fixed height — `cardHeight` sets `h`, `maxH`, and `minH` on each loose card (section cards keep their own heights).

```ts
const config: DashboardConfig = {
  zFlow: { cardHeight: 30 }, // each loose card is 30 rows (300 px) tall
};
```

### `DashboardButtonSettings`

Controls the appearance of the two built-in toolbar buttons. Both fields accept a `Partial<ButtonSettings>` that is **merged on top of the defaults** — any property you omit keeps its default value.

```ts
interface DashboardButtonsSettings {
  editViewButton?: Partial<ButtonSettings>;
  editCardsButton?: Partial<ButtonSettings>;
}
```

| Button            | Default `icon`    | Default `design` | Default `tooltip` | Default `text`        |
| ----------------- | ----------------- | ---------------- | ----------------- | --------------------- |
| `editViewButton`  | `action-settings` | `Transparent`    | `Edit View`       | _(empty — icon only)_ |
| `editCardsButton` | _(none)_          | `Default`        | _(none)_          | `Edit Cards`          |

**Example — text-only buttons without icons:**

```ts
const config: DashboardConfig = {
  editable: true,
  buttonsSettings: {
    editViewButton: {
      text: 'Edit View',
      icon: '',
      design: 'Default',
      tooltip: '',
    },
    editCardsButton: {
      text: 'Edit Cards',
      icon: '',
      design: 'Emphasized',
      tooltip: '',
    },
  },
};
```

The compact toolbar (viewport width < 726 px) collapses all actions into a burger menu. The Edit View menu item always uses the configured `icon` and falls back to the text `'Edit View'` when no `text` override is set.

#### Toolbar button order — `editButtonFirst`

By default the **Edit View** button is rendered _after_ all `customActions` (in both the normal toolbar and the compact burger menu). Set `editButtonFirst: true` on the `DashboardConfig` to flip that order so Edit View is rendered _before_ the custom actions:

```ts
const config: DashboardConfig = {
  editable: true,
  editButtonFirst: true,
};

// customActions is a separate input, not part of config:
const customActions: ButtonSettings[] = [
  { action: 'export', text: 'Export', icon: 'download' },
  { action: 'share', text: 'Share', icon: 'share' },
];
```

```html
<mfp-dashboard [config]="config" [customActions]="customActions" />
```

| `editButtonFirst` | Resulting toolbar order      |
| ----------------- | ---------------------------- |
| `false` (default) | _custom actions_ → Edit View |
| `true`            | Edit View → _custom actions_ |

The flag has no effect when `editable` is `false` (the Edit View button is not rendered at all). In the compact burger menu, the menu separator between Edit View and the custom actions is only inserted when there is at least one custom action to separate from.

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
For cards, `w` and `h` control the initial rendered grid span. When edit mode is saved, each card's `w` and `h` are persisted in the `saved` event payload. Position (`x`, `y`) is only persisted for **loose** cards (those without a `sectionId`) — section cards are laid out by their section and do not carry `x`/`y`. Note that a loose card's `h` may be recomputed by the grid's `sizeToContent` behaviour. `minH`/`minW` and `maxH`/`maxW` set hard resize bounds enforced by the grid — the user cannot drag a card below the minimum or above the maximum size in edit mode.

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

---

## Test IDs

All interactive elements carry `data-testid` attributes for reliable E2E targeting. See [docs/test-ids.md](./test-ids.md) for the full naming convention.

> **Shadow DOM caveat:** The three dialogs (`EditCardsDialog`, `DiscardChangesDialog`, `UnsavedChangesDialog`) use `ViewEncapsulation.ShadowDom`, so their `data-testid` elements live inside a shadow root. A plain `getByTestId()` / `document.querySelector('[data-testid=…]')` will **not** reach them — you must first query the dialog's host element and then pierce its `shadowRoot` (or use a testing tool that traverses shadow boundaries).

### Main component

| Element                             | `data-testid`                        | Notes                                                       |
| ----------------------------------- | ------------------------------------ | ----------------------------------------------------------- |
| Root container                      | `dashboard`                          |                                                             |
| Busy indicator                      | `dashboard-busy`                     | Always present; active while `loading` is true              |
| Title                               | `dashboard-title`                    | Present when `i18n.title` is non-empty                      |
| Description                         | `dashboard-description`              | Present when `i18n.description` is non-empty                |
| Edit-cards button                   | `dashboard-edit-cards-btn`           | Visible in edit mode                                        |
| Compact menu toggle                 | `dashboard-toolbar-menu-btn`         | Compact toolbar mode only                                   |
| Compact dropdown menu               | `dashboard-toolbar-menu`             |                                                             |
| Edit-view menu item                 | `dashboard-action-edit-view`         | Inside compact menu when `config.editable` is true          |
| Custom action (menu item or button) | `dashboard-action-{action}`          | `action` = `customAction.action`                            |
| Edit-view button                    | `dashboard-edit-view-btn`            | Full toolbar                                                |
| Empty state                         | `dashboard-empty-state`              | Present when the loose-card grid is empty                   |
| Empty-state illustration            | `dashboard-empty-state-illustration` |                                                             |
| Empty-state title                   | `dashboard-empty-state-title`        |                                                             |
| Empty-state description             | `dashboard-empty-state-description`  |                                                             |
| Empty-state Edit Home button        | `dashboard-empty-state-edit-btn`     | Present when `config.editable` is true and not in edit mode |
| Grid                                | `dashboard-grid`                     |                                                             |
| Save button                         | `dashboard-save-btn`                 | Visible in edit mode                                        |
| Cancel button                       | `dashboard-cancel-btn`               | Visible in edit mode                                        |

### DashboardCard

| Element       | `data-testid`                | Notes                |
| ------------- | ---------------------------- | -------------------- |
| Card root     | `dashboard-card-{id}`        | `id` = `card.id`     |
| Remove button | `dashboard-card-{id}-remove` | Visible in edit mode |

### DashboardSection

| Element       | `data-testid`                   | Notes                                   |
| ------------- | ------------------------------- | --------------------------------------- |
| Section root  | `dashboard-section-{id}`        | `id` = `section.id`                     |
| Remove button | `dashboard-section-{id}-remove` | Edit mode, `section.editable !== false` |
| Section title | `dashboard-section-{id}-title`  | Present when `section.title` is set     |

### EditCardsDialog

| Element       | `data-testid`                      | Notes                     |
| ------------- | ---------------------------------- | ------------------------- |
| Dialog        | `dashboard-edit-cards-dialog`      |                           |
| Card row      | `dashboard-edit-cards-row-{id}`    | `id` = `availableCard.id` |
| Toggle switch | `dashboard-edit-cards-switch-{id}` |                           |
| Save button   | `dashboard-edit-cards-save-btn`    |                           |
| Cancel button | `dashboard-edit-cards-cancel-btn`  |                           |

### DiscardChangesDialog

| Element        | `data-testid`                           |
| -------------- | --------------------------------------- |
| Dialog         | `dashboard-discard-changes-dialog`      |
| Confirm button | `dashboard-discard-changes-confirm-btn` |
| Cancel button  | `dashboard-discard-changes-cancel-btn`  |

### UnsavedChangesDialog

| Element        | `data-testid`                           |
| -------------- | --------------------------------------- |
| Dialog         | `dashboard-unsaved-changes-dialog`      |
| Save button    | `dashboard-unsaved-changes-save-btn`    |
| Discard button | `dashboard-unsaved-changes-discard-btn` |
| Cancel button  | `dashboard-unsaved-changes-cancel-btn`  |
