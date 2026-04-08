# DeclarativeForm

A dynamic form web component that renders fields from a declarative field definition. Supports text inputs, static selects (from a string array), and dynamic selects (loaded asynchronously). Emits the form value as a nested object whenever the form is valid.

## Custom element tag

```html
<mfp-declarative-form></mfp-declarative-form>
```

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
    <mfp-declarative-form id="form"/>

    <script type="module">
      const form = document.getElementById('form');

      form.fields = [
        { name: 'metadata_name', label: 'Name', required: true },
        { name: 'metadata_namespace', label: 'Namespace' },
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
    { name: 'metadata_name', label: 'Name', required: true },
    { name: 'metadata_namespace', label: 'Namespace' },
  ];
  initialValues = {};
  editMode = false;

  onFormValue(value: Record<string, any>) {
    // value is a nested object: { metadata: { name: '...', namespace: '...' } }
  }

  onValidChange(valid: boolean) {}
}
```

---

## API

### Inputs

| Input | Type | Required | Default | Description |
|---|---|---|---|---|
| `fields` | `FormFieldDefinition[]` | no | `[]` | Field definitions to render |
| `initialValues` | `Record<string, any>` | no | `{}` | Initial values keyed by field name (flat, using underscore notation) |
| `editMode` | `boolean` | no | `false` | Signals edit mode to consumers; does not change component behavior on its own |

### Outputs / Events

| Event | Detail payload | Description |
|---|---|---|
| `formValue` | `Record<string, any>` | Fires on every valid form state change; value is a nested object |
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
  name: string;           // Field name — used as form control key (use underscores for nested paths)
  label?: string;         // Display label shown above the field
  required?: boolean;     // Adds a required validator and shows a visual indicator
  values?: string[];      // Static select options; renders a <ui5-select> when present
  loadValues?: () => Promise<SelectOption[]>;  // Async select; takes priority over `values` when both absent
  validators?: ValidatorFn[];  // Additional Angular validators (e.g. Validators.email)
  disabled?: boolean;     // Disables the field
}
```

## `SelectOption`

```ts
interface SelectOption {
  value: string;   // The option value submitted with the form
  label: string;   // The text displayed in the dropdown
}
```

---

## Field rendering priority

For each field, the component renders in this order:

1. **Static select** — if `field.values` is a non-empty array
2. **Dynamic select** — if `field.loadValues` is defined
3. **Text input** — default fallback

---

## Underscore-to-dot path convention

Field names use underscores to represent nested object paths. The component converts them back to dot-notation when building the output value:

| Field `name` | Output path |
|---|---|
| `metadata_name` | `metadata.name` |
| `spec_replicas` | `spec.replicas` |
| `metadata_namespace` | `metadata.namespace` |

**Example:**

```js
form.fields = [
  { name: 'metadata_name', required: true },
  { name: 'spec_replicas' },
];

form.addEventListener('formValue', (e) => {
  // e.detail = { metadata: { name: 'my-app' }, spec: { replicas: '3' } }
});
```

---

## Validation

- Required fields show a red `Negative` value state after the field is touched (blurred) and left empty.
- Custom validators can be passed via `field.validators` (Angular `ValidatorFn[]`).
- `formValue` is only emitted when the entire form is valid.
- `formValidChange` emits `false` immediately when any required field becomes empty.
