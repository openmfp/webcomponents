# DeclarativeForm

A dynamic form web component that renders fields from a declarative field definition. The component does not execute validation logic. It emits per-field change events based on each field's `validation` strategy, accepts host-owned field errors, and emits a nested value only when the host triggers submit.

## Tags

| Usage                              | Tag                         |
| ---------------------------------- | --------------------------- |
| Angular component                  | `<mfp-declarative-form>`    |
| Web Component (framework-agnostic) | `<mfp-wc-declarative-form>` |

---

## Usage as a web component

```html
<mfp-wc-declarative-form id="form"></mfp-wc-declarative-form>

<script type="module">
  const form = document.getElementById('form');

  form.fields = [
    { name: 'metadata.name', label: 'Name', required: true, validation: 'onChange' },
    { name: 'metadata.namespace', label: 'Namespace', validation: 'onBlur' },
  ];

  form.addEventListener('fieldChange', (event) => {
    const { controlName, value } = event.detail;
    const fieldErrors = { ...form.fieldErrors }

    if (controlName === 'metadata.name' && !value) {
      fieldError[conrolName] = 'metadata.name': 'Name is required';
    } else {
      fieldError[controlName] = null;
    }

    form.fieldError = fieldError
  });

  form.addEventListener('formSubmit', (event) => {
    console.log(event.detail);
    // { metadata: { name: 'my-app', namespace: 'default' } }
  });

  // Trigger when the surrounding page decides the form should submit.
  form.submit();
</script>
```

> `fields`, `initialValues`, and `fieldErrors` are JavaScript properties, not HTML attributes.

---

## Usage as an Angular component

```ts
import {
  DeclarativeForm,
  FormFieldChangeEvent,
  FormFieldDefinition,
  FormFieldErrors,
} from '@openmfp/webcomponents';

@Component({
  imports: [DeclarativeForm],
  template: `
    <mfp-declarative-form
      #form
      [fields]="fields"
      [initialValues]="initialValues"
      [fieldErrors]="fieldErrors"
      (fieldChange)="onFieldChange($event)"
      (formSubmit)="onSubmit($event)"
    />

    <button type="button" (click)="form.submit()">Save</button>
  `,
})
export class MyComponent {
  fields: FormFieldDefinition[] = [
    { name: 'metadata.name', label: 'Name', required: true, validation: 'onChange' },
    { name: 'metadata.namespace', label: 'Namespace', validation: 'onBlur' },
  ];

  initialValues = {
    'metadata.name': 'my-app',
    'metadata.namespace': 'default',
  };

  fieldErrors: FormFieldErrors = {};

  onFieldChange(event: FormFieldChangeEvent): void {
    const { controlName, value } = event;
    this.fieldErrors = {
      ...this.fieldErrors,
      [controlName]: !value ? 'Field is required' : null,
    };
  }

  onSubmit(value: Record<string, unknown>): void {
    // value is nested: { metadata: { name: 'my-app', namespace: 'default' } }
  }
}
```

---

## API

### Inputs

| Input           | Type                      | Required | Default | Description                                                                   |
| --------------- | ------------------------- | -------- | ------- | ----------------------------------------------------------------------------- |
| `fields`        | `FormFieldDefinition[]`   | yes      | -       | Field definitions to render                                                   |
| `initialValues` | `Record<string, unknown>` | no       | `{}`    | Initial values keyed by exact `field.name`                                    |
| `fieldErrors`   | `FormFieldErrors`         | no       | `{}`    | Host-owned errors keyed by exact `field.name`                                 |
| `editMode`      | `boolean`                 | no       | `false` | Signals edit mode to consumers; does not change component behavior on its own |

### Outputs / Events

| Event        | Detail payload              | Description                                                        |
| ------------ | --------------------------- | ------------------------------------------------------------------ |
| `fieldChange` | `FormFieldChangeEvent`      | Fires per-field based on the field's `validation` strategy         |
| `formSubmit` | `Record<string, unknown>`   | Fires when `submit()` is called; value is nested                   |

---

## Types

```ts
interface FormFieldDefinition {
  name: string;                          // Field key; dots create nested submit output paths
  label?: string;                        // Display label shown above the field
  required?: boolean;                    // Visual required marker only
  values?: string[];                     // Static select options
  disabled?: boolean;                    // Disables the field
  validation?: 'onBlur' | 'onChange';    // When to emit fieldChange for this field
}

interface FormFieldChangeEvent {
  controlName: string;  // The form control name (matches field.name)
  value: unknown;       // Current value of the control
}

type FormFieldErrors = Record<string, string | null>;
```

`fieldChange` emits a single field at a time:

```ts
{ controlName: 'metadata.name', value: 'my-app' }
```

`formSubmit` emits a nested object:

```ts
{
  metadata: {
    name: 'my-app',
    namespace: 'default',
  },
}
```

---

## Validation

- The component never executes validators.
- `required` only renders the required marker on the label/input.
- The `validation` property on each field controls when `fieldChange` fires:
  - `'onChange'` — fires on every value change.
  - `'onBlur'` — fires when the field loses focus.
  - Not set — no `fieldChange` event is emitted for that field.
- On initialization (and when `initialValues` changes), the component emits `fieldChange` for every field that has a `validation` strategy. This lets the host run validation immediately and disable the submit button before the user interacts.
- The host validates the received `FormFieldChangeEvent` and updates `fieldErrors`.
- A field shows `Negative` value state and the error message only when it is dirty or touched and `fieldErrors[field.name]` is a non-empty string.
- Empty, missing, or `null` errors render as no error.
