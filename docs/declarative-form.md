# DeclarativeForm

A dynamic form web component that renders fields from a declarative field definition. Supports text inputs and selects from already retrieved string values. Emits the form value as a nested object whenever the form is valid.

## Tags

| Usage | Tag |
|---|---|
| Angular component | `<mfp-declarative-form>` |
| Web Component (framework-agnostic) | `<mfp-wc-declarative-form>` |

---

## Usage as a web component

Include the bundle and set properties via JavaScript. Because the component uses Shadow DOM, no extra CSS setup is needed.

```html
<!DOCTYPE html>
<html>
  <head>
    <script type="module" src="declarative-form.js"/>
  </head>
  <body>
    <mfp-wc-declarative-form id="form"></mfp-wc-declarative-form>

    <script type="module">
      const form = document.getElementById('form');

      form.fields = [
        { name: 'metadata.name',      label: 'Name',      required: true },
        { name: 'metadata.namespace', label: 'Namespace' },
      ];

      form.addEventListener('formValue', (e) => {
        console.log('Form value:', e.detail);
        // { metadata: { name: 'my-app', namespace: 'default' } }
      });

      form.addEventListener('formValidChange', (e) => {
        console.log('Form valid:', e.detail);
      });
    </script>
  </body>
</html>
```

> `fields` and `initialValues` are JavaScript properties, not HTML attributes. They must be set programmatically after the element is available in the DOM.

---

## Usage as an Angular component

```ts
import { DeclarativeForm } from '@openmfp/webcomponents';
import { FormFieldDefinition } from '@openmfp/webcomponents';

@Component({
  imports: [DeclarativeForm],
  template: `
    <mfp-declarative-form
      [fields]="fields"
      [initialValues]="initialValues"
      [editMode]="editMode"
      (formValue)="onFormValue($event)"
      (formValidChange)="onValidChange($event)"
    />
  `,
})
export class MyComponent {
  fields: FormFieldDefinition[] = [
    { name: 'metadata.name',      label: 'Name',      required: true },
    { name: 'metadata.namespace', label: 'Namespace' },
  ];
  initialValues = {
    'metadata.name': 'my-app',
    'metadata.namespace': 'default',
  };
  editMode = false;

  onFormValue(value: Record<string, unknown>) {
    // value is a nested object: { metadata: { name: 'my-app', namespace: 'default' } }
  }

  onValidChange(valid: boolean) {}
}
```

---

## API

### Inputs

| Input | Type | Required | Default | Description |
|---|---|---|---|---|
| `fields` | `FormFieldDefinition[]` | yes | — | Field definitions to render |
| `initialValues` | `Record<string, unknown>` | no | `{}` | Initial values keyed by `field.name` (flat, exact match) |
| `editMode` | `boolean` | no | `false` | Signals edit mode to consumers; does not change component behavior on its own |

### Outputs / Events

| Event | Detail payload | Description |
|---|---|---|
| `formValue` | `Record<string, unknown>` | Fires on every valid form state change; value is a nested object |
| `formValidChange` | `boolean` | Fires whenever the overall validity changes |

**Listening to events from a web component:**

```js
form.addEventListener('formValue', (e) => console.log(e.detail));
form.addEventListener('formValidChange', (e) => console.log('valid:', e.detail));
```

---

## `FormFieldDefinition`

```ts
interface FormFieldDefinition {
  name: string;          // Field name — used as form control key; dots create nested output paths
  label?: string;        // Display label shown above the field
  required?: boolean;    // Adds a required validator and shows a visual indicator
  values?: string[];     // Static select options; renders a <ui5-select> when present
  validators?: ValidatorFn[];  // Additional Angular validators (e.g. Validators.email)
  disabled?: boolean;    // Disables the field (read-only in edit dialogs)
}
```

---

## Field rendering priority

For each field, the component renders in this order:

1. **Static select** — if `field.values` is a non-empty array
2. **Text input** — default fallback

---

## Dot-notation path convention

Field `name` values use dots to represent nested object paths. The component uses the name directly as a path when building the output:

| Field `name` | Output path |
|---|---|
| `metadata.name` | `metadata.name` → `{ metadata: { name: '...' } }` |
| `spec.replicas` | `spec.replicas` → `{ spec: { replicas: '...' } }` |
| `title` | flat key → `{ title: '...' }` |

**Example:**

```js
form.fields = [
  { name: 'metadata.name',  required: true },
  { name: 'spec.replicas' },
];

form.addEventListener('formValue', (e) => {
  // e.detail = { metadata: { name: 'my-app' }, spec: { replicas: '3' } }
});
```

`initialValues` keys must match `field.name` exactly (flat, including dots):

```js
form.initialValues = {
  'metadata.name': 'my-app',
  'spec.replicas': '3',
};
```

> **Note:** Underscores in field names are treated as literal characters, not path separators.

---

## Validation

- Required fields show a red `Negative` value state after the field is touched (blurred) and left empty.
- Custom validators can be passed via `field.validators` (Angular `ValidatorFn[]`).
- `formValue` is only emitted when the entire form is valid.
- `formValidChange` emits `false` immediately when any required field becomes empty.
