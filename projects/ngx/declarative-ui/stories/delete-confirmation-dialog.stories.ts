import { DeleteConfirmationDialog } from '../dialogs/delete-confirmation-dialog/delete-confirmation-dialog.component';
import type { DeleteResourceConfirmationConfig } from '../table-card/models/configs';
import { Component, Input } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

@Component({
  selector: 'mfp-delete-confirmation-dialog-story',
  imports: [DeleteConfirmationDialog],
  template: `
    <ui5-button design="Negative" (click)="open = true">Open Dialog</ui5-button>
    <mfp-delete-confirmation-dialog
      [config]="config"
      [open]="open"
      (cancelled)="open = false"
      (confirmed)="onConfirmed()"
    />
    @if (lastMessage) {
      <ui5-message-strip style="margin-top: 1rem;" [design]="lastMessageDesign">
        {{ lastMessage }}
      </ui5-message-strip>
    }
  `,
})
class DeleteConfirmationDialogStory {
  @Input() config: DeleteResourceConfirmationConfig = {};

  open = false;
  lastMessage = '';
  lastMessageDesign = 'Positive';

  onConfirmed(): void {
    this.open = false;
    this.lastMessageDesign = 'Positive';
    this.lastMessage = 'Resource deleted.';
    setTimeout(() => (this.lastMessage = ''), 3000);
  }
}

const meta: Meta<DeleteConfirmationDialogStory> = {
  title: 'Declarative UI / DeleteConfirmationDialog',
  component: DeleteConfirmationDialogStory,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    config: { control: 'object' },
  },
};

export default meta;
type Story = StoryObj<DeleteConfirmationDialogStory>;

/** Simple confirmation without a typed-phrase requirement. */
export const Default: Story = {
  args: {
    config: {
      title: 'Delete Resource',
      message:
        'Are you sure you want to delete this resource? This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    } satisfies DeleteResourceConfirmationConfig,
  },
};

/**
 * Requires the user to type the resource name before deletion is allowed.
 * The confirm button stays disabled until the input matches (case-insensitive).
 */
export const WithConfirmationPhrase: Story = {
  args: {
    config: {
      title: 'Delete <strong>my-resource</strong>',
      message: 'To confirm deletion, type the resource name below.',
      confirmationText: 'my-resource',
      confirmationPlaceholder: 'Type resource name to confirm',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    } satisfies DeleteResourceConfirmationConfig,
  },
};

/** Minimal config — title and buttons fall back to their built-in defaults. */
export const MinimalConfig: Story = {
  args: {
    config: {} satisfies DeleteResourceConfirmationConfig,
  },
};
