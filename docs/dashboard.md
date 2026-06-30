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
| `language`       | `'en' \| 'de'`    | no       | `'en'`  | Language for the dashboard chrome (toolbar buttons, dialogs, a11y labels). See [Localization](#localization). |

### Outputs

| Output               | Payload                                              | Description                                                      |
| -------------------- | ---------------------------------------------------- | ---------------------------------------------------------------- |
| `saved`              | `{ sections: SectionConfig[]; cards: CardConfig[] }` | Emits when the user saves edits                                  |
| `actionButtonClick`  | `{ event: MouseEvent; action: ButtonSettings }`      | Emits when a custom action button from `config.customActions` is clicked |

### Public methods

| Method                                            | Returns   | Description                                                                                                  |
| ------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------ |
| `requestNavigation(proceed: () => void)`          | `boolean` | Framework-agnostic navigation guard — see [Unsaved-changes guard](#unsaved-changes-guard).                  |
| `Dashboard.registerAngularComponents(types[])`    | `void`    | Static — registers standalone Angular card components by their element selector name.                       |

### Reactive state

| Signal                  | Type                  | Description                                                                                                                                |
| ----------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `hasUnsavedChanges()`   | `computed<boolean>`   | `true` while the user is in edit mode AND has changed sections, cards, or grid positions. Resets after save / discard.                     |
| `editMode()`            | `signal<boolean>`     | `true` while the user is in the dashboard's edit mode.                                                                                     |
| `unsavedNavDialogOpen()`| `signal<boolean>`     | `true` while the unsaved-changes navigation popup is shown. Driven by `requestNavigation()`; consumers normally don't read it directly.    |
| `discardDialogOpen()`   | `signal<boolean>`     | `true` while the discard-confirmation popup (Cancel button on the edit-bar) is shown.                                                      |

---

## Localization

The dashboard chrome (toolbar buttons, dialogs, accessibility labels, the **Unsaved Changes** badge) is translated by the dashboard itself. Supported languages: `en` (default) and `de`.

### Angular usage

```html
<mfp-dashboard [config]="config" [language]="lang" />
```

### Web-component usage

```js
const el = document.querySelector('mfp-wc-dashboard');
el.language = 'de';
```

The `language` value is forwarded to every nested dashboard component (sections, cards, all three dialogs) via a shared `DashboardI18nService`, so changing it on the dashboard re-renders every chrome label in place.

### Translated keys

| Key                  | English                                                                                                       | German                                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `unsavedChanges`     | Unsaved Changes                                                                                               | Nicht gespeicherte Änderungen                                                                                                     |
| `editCards`          | Edit Cards                                                                                                    | Karten bearbeiten                                                                                                                 |
| `editView`           | Edit View                                                                                                     | Ansicht bearbeiten                                                                                                                |
| `actions`            | Actions                                                                                                       | Aktionen                                                                                                                          |
| `save`               | Save                                                                                                          | Speichern                                                                                                                         |
| `cancel`             | Cancel                                                                                                        | Abbrechen                                                                                                                         |
| `discard`            | Discard                                                                                                       | Verwerfen                                                                                                                         |
| `discardChanges`     | Discard Changes                                                                                               | Änderungen verwerfen                                                                                                              |
| `discardConfirmBody` | Discard the changes? This action cannot be undone.                                                            | Änderungen verwerfen? Diese Aktion kann nicht rückgängig gemacht werden.                                                          |
| `unsavedNavBody`     | You are leaving this page. Save or discard the changes to proceed. This action cannot be undone.              | Sie verlassen diese Seite. Speichern oder verwerfen Sie die Änderungen, um fortzufahren. Diese Aktion kann nicht rückgängig gemacht werden. |
| `noCardsAvailable`   | No cards available.                                                                                           | Keine Karten verfügbar.                                                                                                           |
| `removeSection`      | Remove section                                                                                                | Bereich entfernen                                                                                                                 |
| `removeCard`         | Remove card                                                                                                   | Karte entfernen                                                                                                                   |
| `resizable`          | Resizable                                                                                                     | Größenveränderbar                                                                                                                 |

### What is NOT translated

The dashboard does **not** translate consumer-supplied strings — those are passed through verbatim because the consumer already controls them:

- `config.title` and `config.description`
- `config.customActions[].text` / `tooltip`
- `config.buttonsSettings.editViewButton.text` / `tooltip` and the Edit Cards equivalents (overrides win over the translated defaults)
- Card `label`s shown in the Edit Cards dialog list

Translate these in your application before passing them to the dashboard.

### Standalone dialog reuse

`<mfp-discard-changes-dialog>`, `<mfp-unsaved-changes-dialog>`, and `<mfp-edit-cards-dialog>` are exported on the public API for reuse outside the dashboard. When mounted standalone, each dialog accepts its own `language` input (default falls back to `'en'`); when nested inside `<mfp-dashboard>`, the input is ignored and the dashboard's shared language wins.

---

## EditCardsDialog

The `EditCardsDialog` component (`mfp-edit-cards-dialog`) is rendered inside the dashboard when edit mode is active and the user clicks the **Edit Cards** toolbar button. It shows all `availableCards` as a list of toggle switches — cards already on the dashboard start toggled on.

### Inputs

| Input            | Type           | Default      | Description                              |
| ---------------- | -------------- | ------------ | ---------------------------------------- |
| `availableCards` | `CardConfig[]` | `[]`         | Full list of cards the user may add/remove |
| `addedCardsIds`  | `Set<string>`  | `new Set()`  | IDs of cards currently on the dashboard  |
| `open`           | `boolean`      | `false`      | Controls dialog visibility               |
| `language`       | `'en' \| 'de' \| null` | `null` | Optional standalone-only override; ignored when nested in `<mfp-dashboard>`. |

### Outputs

| Output      | Payload                                         | Description                                           |
| ----------- | ----------------------------------------------- | ----------------------------------------------------- |
| `confirm`   | `{ added: CardConfig[]; removed: string[] }`    | Emits the diff when the user clicks **Save**          |
| `cancelled` | `void`                                          | Emits when the user clicks **Cancel** or presses Esc  |

### Static methods

| Method                        | Description                                                                 |
| ----------------------------- | --------------------------------------------------------------------------- |
| `registerAngularComponents()` | Registers standalone Angular card components by their element selector name |

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

| Dashboard state              | What `requestNavigation` does                                                  | Return value |
| ---------------------------- | ------------------------------------------------------------------------------ | ------------ |
| No unsaved changes           | Calls `proceed()` synchronously. The host can navigate immediately.            | `true`       |
| Unsaved changes              | Opens `UnsavedChangesDialog` and stores `proceed` as a pending callback. Host **must NOT** navigate. | `false`      |

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

1. Read the `hasUnsavedChanges()` computed signal in your own navigation interceptor.
2. If it is `true`, suppress the navigation, render your own dialog (any framework, any styling), and based on the user's choice call one of:
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

- Header: warning icon + "Unsaved Changes"
- Body: "You are leaving this page. Save or discard the changes to proceed. This action cannot be undone."
- Buttons: **Save** (Emphasized) / **Discard** (Transparent) / **Cancel** (Transparent)

#### Edit-bar Cancel — `DiscardChangesDialog`

Two-button popup shown when the user clicks the Cancel button on the in-page edit toolbar with unsaved changes:

- Header: warning icon + "Discard Changes"
- Body: "Discard the changes? This action cannot be undone."
- Buttons: **Discard** (Emphasized) / **Cancel** (Transparent)

---

## DiscardChangesDialog

`<mfp-discard-changes-dialog>` — confirmation popup the dashboard pops when the user clicks Cancel on the edit-bar with unsaved changes. It is rendered automatically by `<mfp-dashboard>`; the standalone component is exported so it can be reused outside the dashboard if you need the same confirmation pattern elsewhere.

### Inputs

| Input      | Type                    | Default | Description                                                                  |
| ---------- | ----------------------- | ------- | ---------------------------------------------------------------------------- |
| `open`     | `boolean`               | `false` | Controls dialog visibility                                                   |
| `language` | `'en' \| 'de' \| null`  | `null`  | Optional standalone-only override; ignored when nested in `<mfp-dashboard>`. |

### Outputs

| Output      | Payload | Description                                                                |
| ----------- | ------- | -------------------------------------------------------------------------- |
| `confirm`   | `void`  | Emits when the user clicks **Discard**                                     |
| `cancelled` | `void`  | Emits when the user clicks **Cancel** or closes the dialog (Esc / overlay) |

---

## UnsavedChangesDialog

`<mfp-unsaved-changes-dialog>` — three-button popup the dashboard pops when an in-app navigation is intercepted via `requestNavigation()`. Like `DiscardChangesDialog`, the component is exported standalone and can be reused.

### Inputs

| Input      | Type                    | Default | Description                                                                  |
| ---------- | ----------------------- | ------- | ---------------------------------------------------------------------------- |
| `open`     | `boolean`               | `false` | Controls dialog visibility                                                   |
| `language` | `'en' \| 'de' \| null`  | `null`  | Optional standalone-only override; ignored when nested in `<mfp-dashboard>`. |

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
  title: string;
  description?: string;
  backgroundImageUrl?: string;
  buttonsSettings?: DashboardButtonsSettings;
  customActions?: ButtonSettings[];
  editable?: boolean;
  editButtonFirst?: boolean;
}
```

`title` and `description` accept plain strings or HTML markup. Safe HTML tags (e.g. `<b>`, `<em>`, `<a>`) are rendered; dangerous content such as `<script>` tags is stripped automatically. The title is rendered as an `<h3>` heading and the description as an `<h5>` heading.

### `DashboardButtonSettings`

Controls the appearance of the two built-in toolbar buttons. Both fields accept a `Partial<ButtonSettings>` that is **merged on top of the defaults** — any property you omit keeps its default value.

```ts
interface DashboardButtonsSettings {
  editViewButton?: Partial<ButtonSettings>;
  editCardsButton?: Partial<ButtonSettings>;
}
```

| Button            | Default `icon`    | Default `design` | Default `tooltip` | Default `text`  |
| ----------------- | ----------------- | ---------------- | ----------------- | --------------- |
| `editViewButton`  | `action-settings` | `Transparent`    | `Edit View`       | _(empty — icon only)_ |
| `editCardsButton` | _(none)_          | `Default`        | _(none)_          | `Edit Cards`    |

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
  title: 'Platform Overview',
  editable: true,
  editButtonFirst: true,
  customActions: [
    { action: 'export', text: 'Export', icon: 'download' },
    { action: 'share',  text: 'Share',  icon: 'share' },
  ],
};
```

| `editButtonFirst` | Resulting toolbar order                          |
| ----------------- | ------------------------------------------------ |
| `false` (default) | _custom actions_ → Edit View                     |
| `true`            | Edit View → _custom actions_                     |

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
For cards, `w` and `h` control the initial rendered grid span. When edit mode is saved, `x`, `y`, `w`, and `h` are all persisted in the `saved` event payload — resizing a card updates its dimensions and dragging updates its position. `minH`/`minW` and `maxH`/`maxW` set hard resize bounds enforced by the grid — the user cannot drag a card below the minimum or above the maximum size in edit mode.

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

### Main component

| Element | `data-testid` | Notes |
|---|---|---|
| Root container | `dashboard` | |
| Title | `dashboard-title` | Present when `config.title` is set |
| Description | `dashboard-description` | Present when `config.description` is set |
| Edit-cards button | `dashboard-edit-cards-btn` | Visible in edit mode |
| Compact menu toggle | `dashboard-toolbar-menu-btn` | Compact toolbar mode only |
| Compact dropdown menu | `dashboard-toolbar-menu` | |
| Edit-view menu item | `dashboard-action-edit-view` | Inside compact menu when `config.editable` is true |
| Custom action (menu item or button) | `dashboard-action-{action}` | `action` = `customAction.action` |
| Edit-view button | `dashboard-edit-view-btn` | Full toolbar |
| Grid | `dashboard-grid` | |
| Save button | `dashboard-save-btn` | Visible in edit mode |
| Cancel button | `dashboard-cancel-btn` | Visible in edit mode |

### DashboardCard

| Element | `data-testid` | Notes |
|---|---|---|
| Card root | `dashboard-card-{id}` | `id` = `card.id` |
| Remove button | `dashboard-card-{id}-remove` | Visible in edit mode |

### DashboardSection

| Element | `data-testid` | Notes |
|---|---|---|
| Section root | `dashboard-section-{id}` | `id` = `section.id` |
| Remove button | `dashboard-section-{id}-remove` | Edit mode, `section.editable !== false` |
| Section title | `dashboard-section-{id}-title` | Present when `section.title` is set |

### EditCardsDialog

| Element | `data-testid` | Notes |
|---|---|---|
| Dialog | `dashboard-edit-cards-dialog` | |
| Card row | `dashboard-edit-cards-row-{id}` | `id` = `availableCard.id` |
| Toggle switch | `dashboard-edit-cards-switch-{id}` | |
| Save button | `dashboard-edit-cards-save-btn` | |
| Cancel button | `dashboard-edit-cards-cancel-btn` | |

### DiscardChangesDialog

| Element | `data-testid` |
|---|---|
| Dialog | `dashboard-discard-changes-dialog` |
| Confirm button | `dashboard-discard-changes-confirm-btn` |
| Cancel button | `dashboard-discard-changes-cancel-btn` |

### UnsavedChangesDialog

| Element | `data-testid` |
|---|---|
| Dialog | `dashboard-unsaved-changes-dialog` |
| Save button | `dashboard-unsaved-changes-save-btn` |
| Discard button | `dashboard-unsaved-changes-discard-btn` |
| Cancel button | `dashboard-unsaved-changes-cancel-btn` |
