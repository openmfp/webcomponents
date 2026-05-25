# ValueCell

A standalone cell renderer that displays a single field value from a resource object. Supports eight display modes (plain text, secret, boolean icon, link, tooltip, alert, image, button, tag), conditional CSS rules, static CSS overrides, a copy-to-clipboard button, and a label badge mode. Used internally by `DeclarativeTable` and available for direct use in custom layouts.

## Tags

| Usage             | Tag               |
| ----------------- | ----------------- |
| Angular component | `<mfp-value-cell>` |

> `ValueCell` is an Angular-only component. It is not shipped as a standalone web component bundle.

---

## Usage as an Angular component

```ts
import { ValueCell } from '@openmfp/webcomponents';
import { FieldDefinition } from '@openmfp/webcomponents';

@Component({
  imports: [ValueCell],
  template: `
    <mfp-value-cell
      [fieldDefinition]="field"
      [resource]="resource"
      (buttonClick)="onButtonClick($event)"
    />
  `,
})
export class MyComponent {
  field: FieldDefinition = { property: 'status.phase' };
  resource = { status: { phase: 'Running' } };

  onButtonClick(event: ValueCellButtonClickEvent<typeof this.resource>) {
    console.log(event.field, event.resource);
  }
}
```

---

## API

### Inputs

| Input             | Type              | Required | Default | Description                                            |
| ----------------- | ----------------- | -------- | ------- | ------------------------------------------------------ |
| `fieldDefinition` | `FieldDefinition` | yes      | —       | Describes how to resolve and display the cell value    |
| `resource`        | `GenericResource` | no       | —       | The data object from which the cell value is resolved  |

### Outputs / Events

| Event         | Payload                         | Description                                              |
| ------------- | ------------------------------- | -------------------------------------------------------- |
| `buttonClick` | `ValueCellButtonClickEvent<T>`  | Fires when the cell is rendered as a button and clicked  |

```ts
interface ValueCellButtonClickEvent<T extends GenericResource> {
  event:    MouseEvent;
  field:    FieldDefinition;
  resource: T | undefined;
}
```

---

## Field definition (`FieldDefinition`)

```ts
interface FieldDefinition {
  label?:              string;
  property?:           string | string[];   // dot-notation path into the resource
  propertyField?:      PropertyField;       // access a sub-key with optional transforms
  jsonPathExpression?: string;              // explicit JSONPath expression
  value?:              string;              // static fallback value
  uiSettings?:         UiSettings;
}
```

### Resolving the cell value

Values are resolved in this order:

1. `jsonPathExpression` — evaluated as a JSONPath query against the resource (e.g. `$.spec.containers[0].image`)
2. `property` — dot-notation path; a `$.` prefix is added automatically if missing
3. `propertyField` — accesses `resource[property][propertyField.key]` with optional transforms
4. `value` — static string, used when the resource yields no value

**Examples:**

```ts
// Simple dot-notation
{ property: 'metadata.name' }

// Explicit JSONPath
{ jsonPathExpression: '$.spec.containers[0].image' }

// Sub-key with transform
{ property: 'metadata', propertyField: { key: 'creationTimestamp', transform: ['uppercase'] } }

// Static fallback
{ property: 'status.message', value: 'N/A' }
```

### `PropertyField` transforms

Transforms are applied left to right.

| Transform    | Effect                    |
| ------------ | ------------------------- |
| `uppercase`  | `hello` → `HELLO`         |
| `lowercase`  | `HELLO` → `hello`         |
| `capitalize` | `hello` → `Hello`         |
| `encode`     | Base64-encodes the value  |
| `decode`     | Base64-decodes the value  |

```ts
{ property: 'metadata', propertyField: { key: 'name', transform: ['capitalize'] } }
```

---

## Display modes (`uiSettings.displayAs`)

By default the cell renders its value as plain text. Use `uiSettings.displayAs` to change the rendering:

| `displayAs`  | Renders as                                                     |
| ------------ | -------------------------------------------------------------- |
| _(unset)_    | Plain text                                                     |
| `'secret'`   | Masked value (`*` repeated) with a toggle-visibility icon      |
| `'boolIcon'` | Check / X icon for `"true"` / `"false"` string values         |
| `'link'`     | Clickable anchor (the value must be a valid URL)               |
| `'tooltip'`  | Info icon; the full value appears as a tooltip on hover        |
| `'alert'`    | Critical alert icon when the value is falsy; empty otherwise   |
| `'img'`      | `<img>` element using the value as `src`                       |
| `'button'`   | Action button (requires `buttonSettings`)                      |
| `'tag'`      | One `<ui5-tag>` chip per value (split by `tagSettings.separator`, default `','`); also accepts an array of values |

### Secret

Renders the value as asterisks with a show/hide toggle icon.

```ts
{ property: 'spec.token', uiSettings: { displayAs: 'secret' } }
```

### Boolean icon

Renders a positive (check) or negative (X) SAP UI5 icon when the string value is `"true"` or `"false"`. Falls through to plain text when the value is neither.

```ts
{ property: 'status.ready', uiSettings: { displayAs: 'boolIcon' } }
```

### Link

Renders the value as a clickable `<ui5-link>` when the value is a valid URL. Falls through to plain text when the value is not a URL.

```ts
{ property: 'spec.url', uiSettings: { displayAs: 'link' } }
```

### Tooltip

Renders a SAP UI5 info icon whose tooltip text is the cell value. The icon defaults to `hint`; override it with `tooltipIcon`.

```ts
{
  property: 'status.message',
  uiSettings: {
    displayAs: 'tooltip',
    tooltipIcon: 'information',
  },
}
```

### Alert

Renders a Critical-design `alert` icon when the value is falsy. Renders nothing when the value is truthy.

```ts
{ property: 'status.error', uiSettings: { displayAs: 'alert' } }
```

### Image

Renders an `<img>` element with the value as its `src`. Nothing is rendered when the value is absent.

```ts
{ property: 'spec.iconUrl', uiSettings: { displayAs: 'img' } }
```

### Button

Renders a `<ui5-button>`. A `buttonClick` event fires with `{ event, field, resource }` when clicked.

```ts
{
  property: 'metadata.name',
  uiSettings: {
    displayAs: 'button',
    buttonSettings: {
      text: 'Open',
      icon: 'action',
      design: 'Emphasized',  // 'Default' | 'Positive' | 'Negative' | 'Transparent' | 'Emphasized' | 'Attention'
      action: 'navigate',    // 'navigate' | 'openInModal' | any string
    },
  },
}
```

### Tags

Renders each value as a `<ui5-tag>` chip. String values are split by `tagSettings.separator` (default `','`); array values each become a separate chip. Empty segments are filtered out automatically.

```ts
// Comma-separated string → three chips
{
  property: 'labels',
  uiSettings: { displayAs: 'tag' },
  // resource value: 'api,backend,v2'
}

// Custom separator
{
  property: 'environments',
  uiSettings: {
    displayAs: 'tag',
    tagSettings: { design: 'Information', separator: '|' },
  },
  // resource value: 'prod|staging'
}

// Array value
{
  property: 'tags',
  uiSettings: { displayAs: 'tag' },
  // resource value: ['prod', 'staging']
}
```

---

## Copy button

Add a copy-to-clipboard icon to any cell regardless of `displayAs`:

```ts
{ property: 'metadata.uid', uiSettings: { withCopyButton: true } }
```

The icon appears beside the rendered value. Clicking it writes the resolved value to the clipboard without propagating the event to parent elements.

---

## Conditional cell styling (`cssRules`)

Apply inline styles to the cell when its value meets a condition:

```ts
{
  property: 'status.phase',
  uiSettings: {
    cssRules: [
      { if: { condition: 'equals',   value: 'Running' }, styles: { color: 'green' } },
      { if: { condition: 'equals',   value: 'Failed' },  styles: { color: 'red', fontWeight: 'bold' } },
      { if: { condition: 'contains', value: 'Pending' }, styles: { color: 'orange' } },
    ],
  },
}
```

Available conditions: `equals`, `notEquals`, `greaterThan`, `greaterThanOrEqual`, `lessThan`, `lessThanOrEqual`, `contains`.

`cssCustomization` applies static styles unconditionally and is merged on top of any matching `cssRules`:

```ts
uiSettings: { cssCustomization: { fontStyle: 'italic' } }
```

---

## Sub-components

`ValueCell` composes four internal components that are also exported from the public API and can be used independently.

### `BooleanValue`

Renders a positive or negative SAP UI5 icon for a boolean value.

```ts
import { BooleanValue } from '@openmfp/webcomponents';
```

| Input       | Type      | Required | Description                     |
| ----------- | --------- | -------- | ------------------------------- |
| `boolValue` | `boolean` | yes      | `true` → check icon, `false` → X icon |
| `testId`    | `string`  | no       | `test-id` attribute on the icon element |

### `LinkValue`

Renders a URL string as a `<ui5-link>` that stops click propagation.

```ts
import { LinkValue } from '@openmfp/webcomponents';
```

| Input      | Type     | Required | Description                             |
| ---------- | -------- | -------- | --------------------------------------- |
| `urlValue` | `string` | yes      | The URL rendered as the link `href`     |
| `testId`   | `string` | no       | `test-id` attribute on the link element |

### `SecretValue`

Renders a value as masked asterisks or as plain text, controlled by `isVisible`.

```ts
import { SecretValue } from '@openmfp/webcomponents';
```

| Input       | Type      | Required | Description                                                       |
| ----------- | --------- | -------- | ----------------------------------------------------------------- |
| `value`     | `string`  | yes      | The string to mask or reveal                                      |
| `isVisible` | `boolean` | no       | `false` (default) shows asterisks; `true` reveals the plain text  |
| `testId`    | `string`  | no       | `test-id` attribute on the wrapper element                        |

The masked form renders `*` repeated to the same length as `value` (minimum 8 characters when the value is empty).

### `TagListValue`

Renders an array of strings as `<ui5-tag>` chips in a wrapping flex container.

```ts
import { TagListValue } from '@openmfp/webcomponents';
```

| Input        | Type          | Required | Description                                               |
| ------------ | ------------- | -------- | --------------------------------------------------------- |
| `tags`       | `string[]`    | yes      | Each string becomes one chip                              |
| `tagSettings`| `TagSettings` | no       | Controls chip `design` and `colorScheme`                  |
| `testId`     | `string`      | no       | `test-id` attribute on the wrapper element (default `'tag-list-value'`) |

---

## Types

```ts
interface UiSettings {
  displayAs?:       'secret' | 'boolIcon' | 'link' | 'tooltip' | 'alert' | 'img' | 'button' | 'tag';
  buttonSettings?:  ButtonSettings;
  tagSettings?:     TagSettings;
  tooltipIcon?:     string;
  withCopyButton?:  boolean;
  cssCustomization?: Partial<CSSStyleDeclaration>;
  cssRules?:        CssRule[];
  columnWidth?:     string;
  align?:           'start' | 'center' | 'end';
}

interface TagSettings {
  design?:      'Neutral' | 'Positive' | 'Critical' | 'Negative' | 'Information' | 'Set1' | 'Set2';
  colorScheme?: string;  // '1'–'10'
  separator?:   string;  // default ','
}

interface ButtonSettings {
  text?:    string;
  icon?:    string;
  endIcon?: string;
  design?:  'Default' | 'Positive' | 'Negative' | 'Transparent' | 'Emphasized' | 'Attention';
  tooltip?: string;
  action:   'openInModal' | 'navigate' | 'edit' | 'delete' | string;
}

interface CssRule {
  if:     { condition: CssRuleCondition; value: string };
  styles: Partial<CSSStyleDeclaration>;
}

type CssRuleCondition =
  | 'equals' | 'notEquals'
  | 'greaterThan' | 'greaterThanOrEqual'
  | 'lessThan' | 'lessThanOrEqual'
  | 'contains';
```
