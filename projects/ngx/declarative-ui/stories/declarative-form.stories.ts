import type {
  FormFieldChangeEvent,
  FormFieldDefinition,
  FormFieldErrors,
} from '../form/models';
import { CUSTOM_ELEMENTS_SCHEMA, Component, Input } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

@Component({
  selector: 'mfp-declarative-form-story',
  template: `
    <mfp-wc-declarative-form
      [editMode]="editMode"
      [fieldErrors]="fieldErrors"
      [fields]="fields"
      [initialValues]="initialValues"
      (fieldChange)="handleFormChange($event)"
    />
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DeclarativeFormStory {
  @Input() fields: FormFieldDefinition[] = [];
  @Input() initialValues: Record<string, unknown> = {};
  @Input() fieldErrors: FormFieldErrors = {};
  @Input() editMode = false;

  handleFormChange(event: CustomEvent<FormFieldChangeEvent>): void {
    const { controlName, value } = event.detail;
    const field = this.fields.find((f) => f.name === controlName);
    const nextErrors = { ...this.fieldErrors };
    nextErrors[controlName] =
      field?.required && !value
        ? `${field.label ?? controlName} is required`
        : null;
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
