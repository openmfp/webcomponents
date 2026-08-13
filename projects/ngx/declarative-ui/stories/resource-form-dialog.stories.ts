import { ResourceFormDialog } from '../dialogs/resource-form-dialog/resource-form-dialog.component';
import type {
  FormFieldChangeEvent,
  FormFieldDefinition,
  FormFieldErrors,
} from '../form/models';
import type { ResourceFormConfig } from '../table-card/models/configs';
import { Component, Input } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

@Component({
  selector: 'mfp-resource-form-dialog-story',
  imports: [ResourceFormDialog],
  template: `
    <ui5-button design="Emphasized" (click)="open = true"
      >Open Dialog</ui5-button
    >
    <mfp-resource-form-dialog
      [config]="config"
      [fieldErrors]="fieldErrors"
      [fields]="fields"
      [initialValues]="initialValues"
      [open]="open"
      (cancelled)="open = false"
      (fieldChange)="onFieldChange($event)"
      (submitted)="onSubmitted($event)"
    />
    @if (lastMessage) {
      <ui5-message-strip style="margin-top: 1rem;" [design]="lastMessageDesign">
        {{ lastMessage }}
      </ui5-message-strip>
    }
  `,
})
class ResourceFormDialogStory {
  @Input() config: ResourceFormConfig | undefined = undefined;
  @Input() fields: FormFieldDefinition[] = [];
  @Input() initialValues: Record<string, unknown> = {};

  open = false;
  fieldErrors: FormFieldErrors = {};
  lastMessage = '';
  lastMessageDesign = 'Positive';

  onFieldChange(event: FormFieldChangeEvent): void {
    const nextErrors = { ...this.fieldErrors };
    const field = this.fields.find((f) => f.name === event.fieldProperty);
    if (field?.required) {
      nextErrors[event.fieldProperty] = event.value
        ? null
        : `${field.label ?? event.fieldProperty} is required`;
    } else {
      nextErrors[event.fieldProperty] = null;
    }
    this.fieldErrors = nextErrors;
  }

  onSubmitted(values: Record<string, unknown>): void {
    this.open = false;
    this.lastMessageDesign = 'Positive';
    this.lastMessage = `Submitted: ${JSON.stringify(values)}`;
    setTimeout(() => (this.lastMessage = ''), 5000);
  }
}

const BASIC_FIELDS: FormFieldDefinition[] = [
  { name: 'metadata_name', label: 'Name', required: true },
  { name: 'metadata_namespace', label: 'Namespace' },
];

const meta: Meta<ResourceFormDialogStory> = {
  title: 'Declarative UI / ResourceFormDialog',
  component: ResourceFormDialogStory,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    config: { control: 'object' },
    fields: { control: 'object' },
    initialValues: { control: 'object' },
  },
};

export default meta;
type Story = StoryObj<ResourceFormDialogStory>;

/** Create dialog — empty form, confirm button labeled "Save". */
export const Create: Story = {
  args: {
    config: {
      fields: BASIC_FIELDS,
      title: 'Create Resource',
      confirmLabel: 'Save',
      cancelLabel: 'Cancel',
    } satisfies ResourceFormConfig,
    fields: BASIC_FIELDS,
    initialValues: {},
  },
};

/** Edit dialog — form pre-populated with existing values. */
export const Edit: Story = {
  args: {
    config: {
      fields: BASIC_FIELDS,
      title: 'Edit Resource',
      confirmLabel: 'Update',
      cancelLabel: 'Cancel',
    } satisfies ResourceFormConfig,
    fields: BASIC_FIELDS,
    initialValues: {
      metadata_name: 'my-resource',
      metadata_namespace: 'default',
    },
  },
};

/** Minimal config — title and button labels fall back to built-in defaults. */
export const MinimalConfig: Story = {
  args: {
    config: {
      fields: BASIC_FIELDS,
    } satisfies ResourceFormConfig,
    fields: BASIC_FIELDS,
    initialValues: {},
  },
};
