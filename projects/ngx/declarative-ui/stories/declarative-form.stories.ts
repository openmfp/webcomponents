import { DeclarativeForm } from '../form/declarative-form/declarative-form.component';
import type {
  FormFieldChangeEvent,
  FormFieldDefinition,
  FormFieldErrors,
} from '../form/models';
import { Component, Input } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

@Component({
  selector: 'mfp-declarative-form-story',
  // Renders the Angular component directly rather than the packaged web-
  // component wrapper (`<mfp-wc-declarative-form>`). The wrapper is a
  // pre-built bundle loaded via `<script src="/mfp-webcomponents.js">` and
  // does NOT reflect in-tree source changes until it's rebuilt — using the
  // Angular selector keeps the dev loop fast and picks up new field kinds
  // (like `propertyCollection`) automatically.
  imports: [DeclarativeForm],
  template: `
    <mfp-declarative-form
      [fieldErrors]="fieldErrors"
      [fields]="fields"
      [initialValues]="initialValues"
      (fieldChange)="handleFormChange($event)"
    />
  `,
})
class DeclarativeFormStory {
  @Input() fields: FormFieldDefinition[] = [];
  @Input() initialValues: Record<string, unknown> = {};
  @Input() fieldErrors: FormFieldErrors = {};
  @Input() editMode = false;

  handleFormChange(event: FormFieldChangeEvent): void {
    const { fieldProperty, value } = event;
    const field = this.fields.find((f) => f.name === fieldProperty);
    const nextErrors = { ...this.fieldErrors };
    if (!field?.required) {
      nextErrors[fieldProperty] = null;
    } else if (field.propertyCollection?.length) {
      // Required collection = at least one committed object entry.
      const arr = Array.isArray(value) ? (value as unknown[]) : [];
      nextErrors[fieldProperty] = arr.length
        ? null
        : `${field.label ?? fieldProperty} requires at least one entry`;
    } else {
      nextErrors[fieldProperty] = !value
        ? `${field.label ?? fieldProperty} is required`
        : null;
    }
    this.fieldErrors = nextErrors;
  }
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<DeclarativeFormStory> = {
  title: 'Declarative UI / DeclarativeForm',
  component: DeclarativeFormStory,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    fields: { control: 'object' },
    fieldErrors: { control: 'object' },
    initialValues: { control: 'object' },
    editMode: { control: 'boolean' },
  },
  args: {
    fields: [
      { name: 'metadata_name', label: 'Name' },
      { name: 'metadata_namespace', label: 'Namespace' },
    ],
    fieldErrors: {},
    initialValues: {},
    editMode: false,
  },
};

export default meta;
type Story = StoryObj<DeclarativeFormStory>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/** Minimal setup: two plain text fields. */
export const Basic: Story = {
  args: {
    fields: [
      { name: 'metadata_name', label: 'Name' },
      { name: 'metadata_namespace', label: 'Namespace' },
    ] satisfies FormFieldDefinition[],
  },
};

/**
 * Required markers are visual. This story validates in the host wrapper and
 * passes a string error back after the field is dirty.
 */
export const WithHostValidation: Story = {
  args: {
    fields: [
      {
        name: 'metadata_name',
        label: 'Name',
        required: true,
        validation: 'onChange',
      },
      { name: 'metadata_namespace', label: 'Namespace' },
    ] satisfies FormFieldDefinition[],
  },
};

/** Static select — options provided as a plain string array via `values`. */
export const WithSelect: Story = {
  args: {
    fields: [
      { name: 'metadata_name', label: 'Name', required: true },
      {
        name: 'spec_scope',
        label: 'Scope',
        required: true,
        values: ['ClusterScoped', 'Namespaced'],
      },
    ] satisfies FormFieldDefinition[],
  },
};

/**
 * Edit mode — form pre-populated with `initialValues`.
 * The `editMode` flag is available for consumers to conditionally
 * disable fields or adjust layout.
 */
export const EditMode: Story = {
  args: {
    editMode: true,
    initialValues: {
      metadata_name: 'my-resource',
      metadata_namespace: 'default',
    },
    fields: [
      { name: 'metadata_name', label: 'Name', required: true },
      { name: 'metadata_namespace', label: 'Namespace' },
    ] satisfies FormFieldDefinition[],
  },
};

/** All field types combined: text input and select. */
export const AllFieldTypes: Story = {
  args: {
    fields: [
      { name: 'metadata_name', label: 'Name', required: true },
      {
        name: 'spec_scope',
        label: 'Scope',
        values: ['ClusterScoped', 'Namespaced'],
      },
    ] satisfies FormFieldDefinition[],
  },
};

/**
 * Collection field — repeatable object entries. Each card is a collapsible
 * `<mfp-declarative-form>` nested inside the outer form; every keystroke
 * inside a sub-field flows into the outer payload in real time. The header
 * carries a trash button; an **Add** button below the stack appends a new
 * empty entry (which opens expanded so the user can start typing right
 * away).
 *
 * The submitted value at `spec_artifacts` is `Array<Record<string, unknown>>`.
 */
export const WithCollection: Story = {
  args: {
    fields: [
      { name: 'metadata_name', label: 'Name', required: true },
      {
        name: 'spec_artifacts',
        label: 'Artifacts',
        propertyCollection: [
          {
            name: 'name',
            label: 'Name',
            required: true,
            validation: 'onChange',
          },
          { name: 'url', label: 'URL' },
          {
            name: 'type',
            label: 'Type',
            values: ['image', 'chart', 'file'],
          },
        ],
      },
      {
        name: 'spec_priority',
        label: 'Priority',
        values: ['low', 'normal', 'high'],
      },
      { name: 'metadata_owner', label: 'Owner' },
    ] satisfies FormFieldDefinition[],
  },
};

/**
 * Collection field pre-populated with committed entries via `initialValues`.
 * Cards are collapsed on first render — the header shows a preview line
 * derived from the first non-empty sub-field value. Click the header to
 * expand and edit the entry in place.
 */
export const WithCollectionEditMode: Story = {
  args: {
    editMode: true,
    initialValues: {
      metadata_name: 'my-order',
      spec_artifacts: [
        {
          name: 'nginx',
          url: 'oci://registry.local/nginx:1.25',
          type: 'image',
        },
        {
          name: 'app-chart very long one',
          url: 'oci://registry.local/app:1.0',
          type: 'chart',
        },
      ],
      spec_priority: 'high',
      metadata_owner: 'platform-team',
    },
    fields: [
      { name: 'metadata_name', label: 'Name', required: true },
      {
        name: 'spec_artifacts',
        label: 'Artifacts',
        propertyCollection: [
          { name: 'name', label: 'Name', required: true },
          { name: 'url', label: 'URL' },
          {
            name: 'type',
            label: 'Type',
            values: ['image', 'chart', 'file'],
          },
        ],
      },
      {
        name: 'spec_priority',
        label: 'Priority',
        values: ['low', 'normal', 'high'],
      },
      { name: 'metadata_owner', label: 'Owner' },
    ] satisfies FormFieldDefinition[],
  },
};

/**
 * Required collection — hosts validate `value.length >= 1`. The wrapper
 * component in this story sets an error while the array is empty. Click
 * **Add** to append an entry and the error clears (each entry counts as
 * one committed row; editing happens live inside the card).
 */
export const WithRequiredCollection: Story = {
  args: {
    fields: [
      { name: 'metadata_name', label: 'Name', required: true },
      {
        name: 'spec_artifacts',
        label: 'Artifacts',
        required: true,
        validation: 'onChange',
        propertyCollection: [
          { name: 'name', label: 'Name', required: true },
          { name: 'url', label: 'URL' },
        ],
      },
      {
        name: 'spec_priority',
        label: 'Priority',
        values: ['low', 'normal', 'high'],
      },
      { name: 'metadata_owner', label: 'Owner' },
    ] satisfies FormFieldDefinition[],
  },
};
