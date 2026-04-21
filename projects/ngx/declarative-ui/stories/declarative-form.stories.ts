import type { FormFieldDefinition } from '../form/models';
import { CUSTOM_ELEMENTS_SCHEMA, Component, Input } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

@Component({
  selector: 'mfp-declarative-form-story',
  template: `
    <mfp-wc-declarative-form
      [editMode]="editMode"
      [fields]="fields"
      [initialValues]="initialValues"
    />
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DeclarativeFormStory {
  @Input() fields: FormFieldDefinition[] = [];
  @Input() initialValues: Record<string, unknown> = {};
  @Input() editMode = false;
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
    initialValues: { control: 'object' },
    editMode: { control: 'boolean' },
  },
  args: {
    fields: [
      { name: 'metadata_name', label: 'Name' },
      { name: 'metadata_namespace', label: 'Namespace' },
    ],
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
 * Required field demonstrates the Negative value state when left empty and
 * blurred. Fill in the Name field to see the form become valid.
 */
export const WithValidation: Story = {
  args: {
    fields: [
      { name: 'metadata_name', label: 'Name', required: true },
      { name: 'metadata_namespace', label: 'Namespace' },
    ] satisfies FormFieldDefinition[],
  },
};

/** Static select — options provided as a plain string array via `values`. */
export const StaticSelect: Story = {
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

/** Select populated from already retrieved values. */
export const PrefetchedSelect: Story = {
  args: {
    fields: [
      { name: 'metadata_name', label: 'Name', required: true },
      {
        name: 'metadata_namespace',
        label: 'Namespace',
        required: true,
        values: ['default', 'kube-system', 'production'],
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
      {
        name: 'metadata_namespace',
        label: 'Namespace',
        values: ['default', 'kube-system'],
      },
    ] satisfies FormFieldDefinition[],
  },
};
