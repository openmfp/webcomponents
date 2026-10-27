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
    {
      name: 'metadata.name',
      label: 'Name',
      required: true,
      validation: 'onChange',
    },
    { name: 'metadata.namespace', label: 'Namespace', validation: 'onBlur' },
  ];

  form.addEventListener('fieldChange', (event) => {
    const { fieldProperty, value, source } = event.detail;
    // Ignore seed echoes if the host should react only to real user edits.
    if (source === 'seed') return;

    const fieldErrors = { ...form.fieldErrors };

    if (fieldProperty === 'metadata.name' && !value) {
      fieldErrors[fieldProperty] = 'Name is required';
    } else {
      fieldErrors[fieldProperty] = null;
    }

    form.fieldErrors = fieldErrors;
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
} from '@openmfp/ngx';

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
    {
      name: 'metadata.name',
      label: 'Name',
      required: true,
      validation: 'onChange',
    },
    { name: 'metadata.namespace', label: 'Namespace', validation: 'onBlur' },
  ];

  initialValues = {
    'metadata.name': 'my-app',
    'metadata.namespace': 'default',
  };

  fieldErrors: FormFieldErrors = {};

  onFieldChange(event: FormFieldChangeEvent): void {
    const { fieldProperty, value } = event;
    this.fieldErrors = {
      ...this.fieldErrors,
      [fieldProperty]: !value ? 'Field is required' : null,
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

| Input           | Type                      | Required | Default | Description                                   |
| --------------- | ------------------------- | -------- | ------- | --------------------------------------------- |
| `fields`        | `FormFieldDefinition[]`   | yes      | -       | Field definitions to render                   |
| `initialValues` | `Record<string, unknown>` | no       | `{}`    | Initial values keyed by exact `field.name`    |
| `fieldErrors`   | `FormFieldErrors`         | no       | `{}`    | Host-owned errors keyed by exact `field.name` |

### Outputs / Events

| Event             | Detail payload            | Description                                                                                                                                                                                                                                                                                |
| ----------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `fieldChange`     | `FormFieldChangeEvent`    | Fires per-field based on the field's `validation` strategy                                                                                                                                                                                                                                 |
| `formValueChange` | `Record<string, unknown>` | Fires on every user-driven change with the flat `form.value` map (all fields keyed by their `name`). Emitted only from user input events — programmatic seeding via `initialValues` does NOT trigger it, so consumers can echo the value back into `initialValues` without creating a loop |
| `formSubmit`      | `Record<string, unknown>` | Fires when `submit()` is called; value is nested                                                                                                                                                                                                                                           |

---

## Types

```ts
interface FormFieldDefinition {
  name: string; // Field key; dots create nested submit output paths
  label: string; // Display label shown above the field
  required?: boolean; // Visual required marker only
  values?: string[]; // Options rendered as a select; an empty array keeps the select visible with just the blank placeholder
  disabled?: boolean; // Disables the field
  inputType?: 'Text' | 'Password' | 'Switch'; // Control type; defaults to Text
  showPasswordToggle?: boolean; // Password fields only; defaults to true
  placeholder?: string; // UI5 input placeholder (functional, not example values)
  hint?: string; // Persistent help text below the control; never submitted
  writeOnly?: boolean; // Host metadata only — the form does not act on this; hosts use it to omit fields from read queries and skip empty values on edit submit
  validation?: 'onBlur' | 'onChange'; // When to emit fieldChange for this field
  propertyCollection?: FormFieldDefinition[]; // Sub-fields for an array-of-objects field; see "Collection fields" below
}

interface FormFieldChangeEvent {
  fieldProperty: string; // The field property name (matches field.name)
  value: unknown; // Current value of the control; for a `propertyCollection` field this is the full `Array<Record<string, unknown>>`
  source?: 'seed' | 'user'; // Origin of the emit; see "Seed vs user emits" below. Absence is treated as 'user' for backward compatibility.
  formValues?: Readonly<Record<string, unknown>>; // Flat values of all controls after this change (keyed by `field.name`), including disabled controls
}

type FormFieldErrors = Record<string, string | null>;
```

`fieldChange` emits a single field at a time:

```ts
{
  fieldProperty: 'metadata.name',
  value: 'my-app',
  source: 'user',
  formValues: { 'metadata.name': 'my-app', 'metadata.namespace': 'default' },
}
```

For a `propertyCollection` field the payload carries the whole array:

```ts
{
  fieldProperty: 'spec.artifacts',
  value: [
    { name: 'nginx', url: 'oci://…', type: 'image' },
    { name: 'app',   url: 'oci://…', type: 'chart' },
  ],
}
```

`formSubmit` emits a nested object built from every field's `name`:

```ts
{
  metadata: { name: 'my-app', namespace: 'default' },
  spec: {
    artifacts: [
      { name: 'nginx', url: 'oci://…', type: 'image' },
    ],
  },
}
```

---

## Input types (`inputType`)

Set `inputType` to change how a plain (non-select, non-collection) field renders:

| `inputType` | Renders        | Default value | Notes                                                                               |
| ----------- | -------------- | ------------- | ----------------------------------------------------------------------------------- |
| `Text`      | `<ui5-input>`  | `''`          | Default when omitted                                                                |
| `Password`  | `<ui5-input>`  | `''`          | `type="Password"`; show/hide icon by default (`showPasswordToggle`, default `true`) |
| `Switch`    | `<ui5-switch>` | `false`       | Boolean control; string `"true"` / `"false"` in `initialValues` is coerced          |

`placeholder` applies to text-like inputs (`Text`, `Password`). The same text is also set as the input's `title` attribute so the full message is readable via tooltip when the field is too narrow to show the placeholder. `hint` renders persistent help text below any non-collection control (input, select, or switch) and is never included in the submit payload.

`writeOnly` is **not** enforced by the form component. Pass it through from your field schema so the host can skip the field in read queries and omit empty values on edit submit (typical for secrets).

### Example

```ts
const fields: FormFieldDefinition[] = [
  {
    name: 'spec.oidc.clientSecret',
    label: 'Client secret',
    inputType: 'Password',
    placeholder: 'Leave empty to keep unchanged',
    writeOnly: true,
    showPasswordToggle: true,
  },
  {
    name: 'spec.oidc.discoveryUrl',
    label: 'Discovery URL',
    hint: 'e.g. https://issuer.example.com/.well-known/openid-configuration',
  },
  {
    name: 'spec.enabled',
    label: 'Enabled',
    inputType: 'Switch',
    validation: 'onChange',
  },
];
```

---

## Collection fields (`propertyCollection`)

Set `propertyCollection` on a `FormFieldDefinition` to declare that the value at this field's `name` is an **array of objects**. The form renders it as a stack of expandable/collapsible cards, one per array entry.

### UX

- Each card header shows a preview line auto-derived from the first non-empty sub-field value; if all sub-fields are still blank, the fallback is `"<label> N"` (e.g. `Artifacts 1`, `Artifacts 2`).
- Every card carries a **trash** button to remove the entry.
- An inline **Add** button below the stack appends a new empty entry, opened expanded so the user can start typing immediately.
- Editing is live — every keystroke inside a sub-field flows into the outer form's value. There is no per-card Save/Cancel step.

### Sub-field definitions

`propertyCollection` is a full `FormFieldDefinition[]`. Each sub-field carries the same options as a top-level field (`label`, `values`, `required`, `validation`, `disabled`, and even nested `propertyCollection` for array-of-arrays). Sub-field `name` values are used verbatim as keys on each entry object — whatever you write becomes the shape of the emitted payload.

### Change events for collection fields

- `formValueChange` fires (from the sub-field's own input events) with the outer flat value — the array is under `field.name`.
- `fieldChange` fires (once per Add / Remove / Save) when the collection field itself declares `validation: 'onChange'` or `'onBlur'`, with the full array as the payload.

### Example

```ts
const fields: FormFieldDefinition[] = [
  {
    name: 'metadata.name',
    label: 'Name',
    required: true,
    validation: 'onChange',
  },
  {
    name: 'spec.artifacts',
    label: 'Artifacts',
    propertyCollection: [
      { name: 'name', label: 'Name', required: true },
      { name: 'url', label: 'URL' },
      { name: 'type', label: 'Type', values: ['image', 'chart', 'file'] },
    ],
  },
];

// initialValues shape mirrors the top-level output — the collection is an array
const initialValues = {
  'metadata.name': 'my-order',
  'spec.artifacts': [
    { name: 'nginx', url: 'oci://registry.local/nginx:1.25', type: 'image' },
  ],
};
```

---

## Validation

- The component never executes validators.
- `required` only renders the required marker on the label/input.
- The `validation` property on each field controls when `fieldChange` fires:
  - `'onChange'` — fires on every value change (toggle for switches, keystroke for text).
  - `'onBlur'` — fires when the field loses focus (including switches).
  - Not set — no `fieldChange` event is emitted for that field.
- On initialization (and when `initialValues` changes), the component emits `fieldChange` for every field that has a `validation` strategy. This lets the host run validation immediately and disable the submit button before the user interacts.
- The host validates the received `FormFieldChangeEvent` and updates `fieldErrors`.
- A field shows `Negative` value state and the error message only when it is dirty or touched and `fieldErrors[field.name]` is a non-empty string. Text inputs and selects show errors inline via UI5 `valueState`; switches and collection fields render the message in a `.field-error` / `.collection-error` element below the control.
- Empty, missing, or `null` errors render as no error.

---

## Seed vs user emits

`FormFieldChangeEvent.source` distinguishes **user interactions** from **programmatic seeds**:

| `source`    | Fired by                                                                                                                           |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `'user'`    | Keystrokes / change / blur on text and select, switch toggle, collection add / remove / edit                                       |
| `'seed'`    | Every validation field on an `[initialValues]` input identity push (including first mount) and on `patchForm({ emitEvent: true })` |
| `undefined` | Treated as `'user'` for backward compatibility with external consumers that construct `FormFieldChangeEvent` manually              |

Alongside `source`, every emit carries `formValues` — the flat value of **every** control after the change (keyed by exact `field.name`, disabled controls included). Dependent-field resolvers can read sibling values without a separate `formValueChange` subscription.

Updating `fields` alone (including select options) does not emit `fieldChange`. New controls are also added silently; a subsequent `initialValues` identity change emits seeds for the current validation fields.

`formValues` is a snapshot attached to the field event, including on blur and collection changes. `formValueChange` is a separate output and uses `form.value`, which excludes controls disabled through the Angular forms API. Field events use `getRawValue()`, which includes them. A field definition's `disabled` flag currently disables the rendered UI5 input; it does not disable the Angular control.

Hosts that run validation on every emit can treat `'seed'` the same as `'user'`. Hosts that drive dependent fields (where a parent change should clear or re-resolve dependents) typically gate on `source === 'user'` and ignore seeds — otherwise the dialog's own prefill on edit-open would be interpreted as the user editing the parent and would wipe prefilled dependents.

The input binding is the **emit** path; `patchForm({ emitEvent: false })` is the **silent** path.

---

## `patchForm()` — programmatic value seeding

The component exposes a `patchForm` method for hosts that need to seed values **without** pushing a new `[initialValues]` identity (for example, from a dependent-field resolver reacting to a `fieldChange`). It mirrors Angular's `AbstractControl.setValue(v, { emitEvent })` convention:

```ts
form.patchForm(
  { 'metadata.namespace': 'default' },
  { emitEvent: false, markAsDirty: true },
);
```

| Option        | Default | Effect                                                                                                                                                 |
| ------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `emitEvent`   | `true`  | When `true` (or omitted), re-fires `fieldChange` with `source: 'seed'` for every validation field (same as an input push). When `false`, stays silent. |
| `markAsDirty` | `false` | When `true`, marks each patched control as dirty so `fieldErrors` for those fields begin to render immediately.                                        |

Use `emitEvent: false` when the host already knows the write is **not** a user change — e.g. when applying resolver output into dependent fields — so dependent resolvers don't interpret the write as a user edit and self-clear.

Keys absent from the partial are left untouched (switch fields keep their current value, collections keep their current entries).

---

## Test IDs

All interactive elements carry `data-testid` attributes for reliable E2E targeting. See [docs/test-ids.md](./test-ids.md) for the full naming convention.

| Element                | `data-testid`                               | Notes                                                        |
| ---------------------- | ------------------------------------------- | ------------------------------------------------------------ |
| Form element           | `generic-form`                              |                                                              |
| Field container        | `generic-form-field-container-{name}`       | `name` = `field.name` (dot notation)                         |
| Field label            | `generic-form-field-label-{name}`           |                                                              |
| Input, select, switch  | `generic-form-field-{name}`                 | `<ui5-input>`, `<ui5-select>`, or `<ui5-switch>`             |
| Password show/hide     | `generic-form-field-{name}-password-toggle` | `<ui5-input-icon>` inside password fields                    |
| Field hint             | `generic-form-field-hint-{name}`            | Help text below the control; omitted for collection fields   |
| Select option          | `generic-form-field-{name}-option-{value}`  | `value` = option string or `empty` for the blank placeholder |
| Collection container   | `collection-field`                          | Rendered inside a `propertyCollection` field                 |
| Collection item        | `collection-item-{index}`                   | Zero-based array index                                       |
| Collection item toggle | `collection-item-{index}-toggle`            | Expand / collapse header                                     |
| Collection item remove | `collection-item-{index}-remove`            | Trash icon                                                   |
| Collection item form   | `collection-item-{index}-form`              | Nested `<mfp-declarative-form>` for the expanded card        |
| Collection Add button  | `collection-add`                            | Appends a new empty entry                                    |

**Example** — a field `{ name: 'metadata.name', label: 'Name' }` renders:

```html
<div data-testid="generic-form-field-container-metadata.name">
  <ui5-label data-testid="generic-form-field-label-metadata.name"
    >Name</ui5-label
  >
  <ui5-input data-testid="generic-form-field-metadata.name" />
</div>
```
