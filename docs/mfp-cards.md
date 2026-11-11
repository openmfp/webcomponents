# MFP Cards

## DataFetchTable

DataFetchTable displays rows from a local resource or an HTTP response. In a Dashboard card, `componentTemplate` adds the frame, subtitle, and optional critical status with a warning icon.

| Usage             | Tag                         |
| ----------------- | --------------------------- |
| Angular component | `<mfp-data-fetch-table>`    |
| Web component     | `<mfp-wc-data-fetch-table>` |

---

## Usage in Dashboard

Load `mfp-webcomponents.js` for the table and `mfp-wc-dashboard.js` for the Dashboard. Pass the table inputs through `componentInputs`. The card's `label` becomes its title. Use `componentTemplate` for the subtitle and critical status.

```js
dashboard.cards = [
  {
    id: 'destinations',
    label: 'Destinations',
    component: 'mfp-wc-data-fetch-table',
    componentTemplate: {
      subtitle: 'Authentication overview',
      criticalStatus: 'Review required',
    },
    componentInputs: {
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

## Usage with local data

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

## HTTP requests

Use `data.request` to fetch a JSON response. The URL must be absolute and the default method is `GET`. This example sends a JSON body and selects rows from the response's `data.rows` property.

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

`data.path` works with either source and accepts JSONPath, such as `data.rows` or `$.data.rows`. The first match must be an array of row objects. Omit the path when the source is already an array. Script evaluation is disabled. When both sources are set, the request takes precedence.

The table displays a loading state while a request is pending. A failed request shows **Retry**, which runs the request and its hook again. Invalid local data displays an error without Retry.

### Request hooks

Use `beforeCardRequest(request, cardId)` on Dashboard to customize a request per card. The standalone table exposes `beforeRequest(request)`. Both hooks may modify the request's headers or return a replacement `Request`, and both can be asynchronous.

```js
dashboard.beforeCardRequest = async (request, cardId) => {
  const authToken = await AuthService.getTokens();
  request.headers.set('Authorization', `Bearer ${authToken}`);
};
```

## Columns and row identity

`columns` takes the same `TableFieldDefinition[]` as DeclarativeTable. For nested properties, widths, alignment, and cell types, see [Column definition](./declarative-table.md#column-definition-tablefielddefinition). To show several fields in one cell, see [Grouped columns](./declarative-table.md#grouped-columns).

Set `trackByPath` to a stable row identifier such as `metadata.uid`. The default is `id`.
