import { DeclarativeForm } from '../form/declarative-form/declarative-form.component';
import type { FormFieldDefinition, SelectOption } from '../form/models';
import type { Meta, StoryObj } from '@storybook/angular';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<DeclarativeForm> = {
  title: 'Declarative UI / DeclarativeForm',
  component: DeclarativeForm,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    fields: { control: 'object' },
    initialValues: { control: 'object' },
    editMode: { control: 'boolean' },
    formValue: { control: false },
    formValidChange: { control: false },
  },
  args: {
    fields: [],
    initialValues: {},
    editMode: false,
  },
  render: (args) => ({
    props: args,
    template: `<mfp-declarative-form
      [fields]="fields"
      [initialValues]="initialValues"
      [editMode]="editMode"
    />`,
  }),
};

export default meta;
type Story = StoryObj<DeclarativeForm>;

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

/**
 * Dynamic select — options loaded asynchronously via a `loadValues` function.
 * Simulates a 400 ms network delay.
 */
export const DynamicSelect: Story = {
  args: {
    fields: [
      { name: 'metadata_name', label: 'Name', required: true },
      {
        name: 'metadata_namespace',
        label: 'Namespace',
        required: true,
        loadValues: (): Promise<SelectOption[]> =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve([
                  { value: 'default', label: 'default' },
                  { value: 'kube-system', label: 'kube-system' },
                  { value: 'production', label: 'production' },
                ]),
              400,
            ),
          ),
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

/** All field types combined: text input, static select, and dynamic select. */
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
        loadValues: (): Promise<SelectOption[]> =>
          Promise.resolve([
            { value: 'default', label: 'default' },
            { value: 'kube-system', label: 'kube-system' },
          ]),
      },
    ] satisfies FormFieldDefinition[],
  },
};
