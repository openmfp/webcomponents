# MFP Cards

## DataFetchTable

DataFetchTable displays rows from a local resource or an HTTP response. In a Dashboard card, `componentTemplate` adds the frame; metadata is configured on the table.

| Usage             | Tag                         |
| ----------------- | --------------------------- |
| Angular component | `<mfp-data-fetch-table>`    |
| Web component     | `<mfp-wc-data-fetch-table>` |

---

### Usage in Dashboard

`mfp-wc-dashboard.js` registers the Dashboard, and `mfp-webcomponents.js` registers the table. Load both for this web-component setup. Each bundle is self-contained, so loading both includes overlapping Angular and UI5 runtime code. Pass table inputs through `componentInputs` and use `label` for the card title.

```js
dashboard.cards = [
  {
    id: 'destinations',
    label: 'Destinations',
    component: 'mfp-wc-data-fetch-table',
    componentTemplate: {
      contentScrollable: true,
    },
    componentInputs: {
      status: { text: 'Review required', state: 'Critical' },
      columns: [{ label: 'Name', property: 'name' }],
      data: {
        request: { url: 'https://api.example.com/destinations' },
        path: 'data.rows',
      },
    },
  },
];
```

In Angular, import `Dashboard` and `DataFetchTable` from `@openmfp/ngx` and call `Dashboard.registerAngularComponents([DataFetchTable])`. Set `type: 'angular'` and `component: 'mfp-data-fetch-table'` in the card configuration.

---

### Usage with local data

Set `data.resource` when the host already has the rows. This standalone web component uses an array directly.

```html
<script type="module" src="/mfp-webcomponents.js"></script>
<mfp-wc-data-fetch-table id="destinations-table"></mfp-wc-data-fetch-table>

<script type="module">
  await customElements.whenDefined('mfp-wc-data-fetch-table');
  const table = document.getElementById('destinations-table');
  table.columns = [
    { label: 'Name', property: 'name' },
    { label: 'Authentication', property: 'authentication' },
  ];
  table.data = {
    resource: [
      { id: '1', name: 'C4C', authentication: 'Basic Authentication' },
      { id: '2', name: 'S4HANA', authentication: 'OAuth2Password' },
    ],
  };
</script>
```

In Angular, import `DataFetchTable` from `@openmfp/ngx` and bind the same values with `[data]` and `[columns]`.

### Columns and row identity

`columns` takes the same `TableFieldDefinition[]` as DeclarativeTable. For nested properties, widths, alignment, and cell types, see [Column definition](./declarative-table.md#column-definition-tablefielddefinition). To show several fields in one cell, see [Grouped columns](./declarative-table.md#grouped-columns).

Set `trackByPath` to a stable row identifier such as `metadata.uid`. The default is `id`.

---

## DataFetchList

DataFetchList fetches a JSON response and displays an array of objects as a list. Each item is rendered with the same `FieldDefinition` using [ResourceField](./resource-field.md).

| Usage             | Tag                        |
| ----------------- | -------------------------- |
| Angular component | `<mfp-data-fetch-list>`    |
| Web component     | `<mfp-wc-data-fetch-list>` |

---

### Usage as a web component

Load the web components bundle and assign properties after the element is registered:

```html
<script type="module" src="/mfp-webcomponents.js"></script>
<mfp-wc-data-fetch-list id="subaccounts"></mfp-wc-data-fetch-list>

<script type="module">
  await customElements.whenDefined('mfp-wc-data-fetch-list');
  const list = document.getElementById('subaccounts');
  list.data = {
    request: { url: 'https://api.example.com/subaccounts' },
    path: 'data.items',
  };
  list.fieldDefinition = { property: 'name' };
  list.description = 'Review the affected subaccounts.';
  list.addEventListener('loadError', (event) => console.error(event.detail));
</script>
```

See [HTTP requests](#http-requests) for request options and response paths.

---

### Usage as an Angular component

```ts
import { DataFetchList } from '@openmfp/ngx';

@Component({
  imports: [DataFetchList],
  template: `
    <mfp-data-fetch-list
      [data]="data"
      [fieldDefinition]="fieldDefinition"
      (loadError)="onLoadError($event)"
    />
  `,
})
export class MyComponent {
  data = {
    request: { url: 'https://api.example.com/subaccounts' },
    path: 'data.items',
  };
  fieldDefinition = { property: 'name' };

  onLoadError(error: { status?: number; retryable: boolean }): void {
    console.error(error);
  }
}
```

### Usage in Dashboard

Load both `mfp-wc-dashboard.js` and `mfp-webcomponents.js`, then pass the list inputs in the card configuration:

```js
dashboard.cards = [
  {
    id: 'subaccounts',
    label: 'Affected Subaccounts',
    component: 'mfp-wc-data-fetch-list',
    componentTemplate: {},
    componentInputs: {
      data: {
        request: { url: 'https://api.example.com/subaccounts' },
        path: 'data.items',
      },
      fieldDefinition: { property: 'name' },
      status: { text: '{{$length}} Subaccounts', state: 'Critical' },
    },
  },
];
```

For Angular cards, import `Dashboard` and `DataFetchList` from `@openmfp/ngx`, call `Dashboard.registerAngularComponents([DataFetchList])`, and set `type: 'angular'` and `component: 'mfp-data-fetch-list'`.

---

### API

#### Inputs

| Input              | Type                                    | Default                 | Description                                                                   |
| ------------------ | --------------------------------------- | ----------------------- | ----------------------------------------------------------------------------- |
| `data`             | `DataFetchListData`                     | —                       | `{ request: CardRequest, path?: string }`. The list supports HTTP data only.  |
| `fieldDefinition`  | `FieldDefinition`                       | `{ property: 'label' }` | Defines how each item is displayed. See [ResourceField](./resource-field.md). |
| `description`      | `string`                                | —                       | Text shown above the list.                                                    |
| `beforeRequest`    | `BeforeRequest`                         | —                       | Changes or replaces the request before it is sent.                            |
| `afterRequestHook` | `AfterRequestHook`                      | —                       | Transforms parsed JSON before the path is selected.                           |
| `lastUpdated`      | `DataFetchLastUpdated`                  | —                       | Text or response timestamp displayed above the list.                          |
| `status`           | `CardStatus`                            | —                       | Status text and state displayed above the list.                               |
| `emptyState`       | `Omit<ErrorViewConfig, 'illustration'>` | —                       | Custom empty-state title and subtitle.                                        |
| `errorState`       | `Omit<ErrorViewConfig, 'illustration'>` | —                       | Custom error title, subtitle and retry button.                                |

#### Outputs / Events

| Event       | Detail payload                            | Description                                                         |
| ----------- | ----------------------------------------- | ------------------------------------------------------------------- |
| `loadError` | `{ status?: number; retryable: boolean }` | Emitted for each failed load; `status` is included for HTTP errors. |

---

## HTTP requests

Both cards use `data.request` to fetch a JSON response. The URL must be absolute and the default method is `GET`. This example sends query parameters and an `Accept` header, then selects rows from the response's `data.rows` property.

```js
table.data = {
  request: {
    url: 'https://api.example.com/destinations/search',
    method: 'GET',
    query: { region: ['eu', 'us'] },
    headers: { Accept: 'application/json' },
  },
  path: 'data.rows',
};
```

| Request option        | Description                                                                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `method`              | `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, or `OPTIONS`.                                                                               |
| `query`               | String, number, or boolean values. Arrays repeat the key. A supplied key replaces any values for that key already in the URL.                |
| `headers`             | A record of header names and string values.                                                                                                  |
| `body`                | JSON-serializable data. Defaults the content type to `application/json` when a body is present. Use bodyless requests with `GET` and `HEAD`. |
| `credentials`, `mode` | Optional settings passed to Fetch.                                                                                                           |

`data.path` works with HTTP responses and table local resources and accepts JSONPath, such as `data.rows` or `$.data.rows`. The first match must be an array of row objects. Omit the path when the source is already an array. Script evaluation is disabled. When both table sources are set, the request takes precedence.

### Request hooks

Use `beforeCardRequest(request, cardId)` on Dashboard to customize a request per card. Standalone list and table components expose `beforeRequest(request)`. Both hooks may modify the request's headers or return a replacement `Request`, and both can be asynchronous.

```js
dashboard.beforeCardRequest = async (request, cardId) => {
  const authToken = await AuthService.getTokens();
  request.headers.set('Authorization', `Bearer ${authToken}`);
};
```

`afterCardRequest(response, cardId)` on Dashboard and `afterRequestHook(response)` on standalone components can transform parsed JSON before `data.path` is applied. They may return a replacement JSON value or `void` to keep the original, synchronously or asynchronously. The hook runs for HTTP JSON responses, not local resources or empty HTTP responses.

## Empty and error states

Both cards display a loading indicator during requests, an empty state for an empty array, and an error state for failed loads. Before `data` is assigned, the table displays its empty state; the list does not. The default texts are:

| Card  | State | Title                  | Subtitle                                |
| ----- | ----- | ---------------------- | --------------------------------------- |
| List  | Empty | `No items to display.` | `There are currently no items to show.` |
| List  | Error | `Unable to load list`  | `The list data could not be loaded.`    |
| Table | Empty | `No Resources`         | `There are currently no items to show.` |
| Table | Error | `Unable to load data`  | `The table data could not be loaded.`   |

Set `emptyState` and `errorState` on either element or in a Dashboard card's `componentInputs`, for example:

```js
list.emptyState = {
  title: 'No subaccounts found',
  subtitle: 'There are no affected subaccounts.',
};
list.errorState = {
  title: 'Unable to load subaccounts',
  subtitle: 'Please try again.',
  buttons: [{ key: 'retry', label: 'Try again', design: 'Emphasized' }],
};
```

Omitted titles or subtitles use the defaults; an empty string clears the corresponding text. The empty state always uses the `NoData` illustration and does not render buttons. Errors use `tnt/UnsuccessfulAuth` for HTTP 403 and `UnableToLoad` otherwise; illustrations cannot be customized through these inputs.

For retryable failures, the default button is `Retry` with `Emphasized` design. Clicking it repeats the request and its hooks. Invalid request configuration is not retryable; invalid local data in DataFetchTable is not retryable either. HTTP failures and invalid fetched responses are retryable. If `errorState.buttons` is supplied, only its first button with `key: 'retry'` is rendered; an empty array or an array without that key hides the button. The button supports `label`, `design`, `icon`, and `disabled`; see [ErrorView buttons](./error-view.md) for the available options. Other buttons are ignored. The `loadError` event reports `retryable` and the HTTP `status`, when available.

## Metadata

Both cards share these metadata inputs, displayed above non-empty results:

```js
list.lastUpdated = { label: 'Last updated:', path: 'updatedAt', locale: 'en' };
list.status = {
  text: '{{$length}} items, {{response.total}} total',
  state: 'Information',
};
```

### Last updated

Use `{ label, text }` to display a ready-made string, or `{ label, path, locale? }` to calculate relative time from the response. Both forms work for list and table; use static text for local table resources. For example:

```js
// Response: { "metadata": { "updatedAt": "2026-11-13T13:00:00Z" }, "items": [...] }
list.lastUpdated = {
  label: 'Last updated:',
  path: 'metadata.updatedAt',
  locale: 'en',
};
// At 13:30 UTC: "Last updated: 30 minutes ago"
```

The path must resolve to a date string accepted by JavaScript `Date.parse`. Use an ISO 8601 timestamp with a timezone, such as `2026-11-13T13:00:00Z`, to avoid ambiguity. Numeric timestamps, missing paths, invalid dates, and empty static text are not displayed. `label` and static `text` are trimmed; an empty label displays only the value.

The component selects the largest elapsed unit: minutes, hours, days, weeks, months (30 days), or years (365 days), rounding down. Times less than one minute ago and future timestamps display the locale's equivalent of “now”. Formatting uses `Intl.RelativeTimeFormat` with `numeric: 'auto'`, so wording depends on the locale. It tries the supplied `locale`, the UI5 language, the browser language, and finally the runtime default. The value is recalculated when the relevant inputs or response change; it does not update on a timer.

### Status

`status.state` is `Neutral`, `Information`, `Positive`, `Negative`, or `Critical`. Status text supports `{{$length}}` for the selected row count and `{{response.path}}` for a value in the response. A status with an unresolved placeholder is hidden. Metadata paths refer to the response after `afterRequestHook` runs; response paths are unavailable for local table resources.
