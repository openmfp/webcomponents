import { Component } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';
import { UnsavedChangesDialog } from '../dashboard/unsaved-changes-dialog/unsaved-changes-dialog.component';

@Component({
  selector: 'mfp-unsaved-changes-dialog-story',
  imports: [UnsavedChangesDialog],
  template: `
    <ui5-button design="Emphasized" (click)="open = true">Open Dialog</ui5-button>
    <mfp-unsaved-changes-dialog
      [open]="open"
      (save)="onSave()"
      (discard)="onDiscard()"
      (cancelled)="open = false"
    />
    @if (lastMessage) {
      <ui5-message-strip [design]="lastMessageDesign" style="margin-top: 1rem;">
        {{ lastMessage }}
      </ui5-message-strip>
    }
  `,
})
class UnsavedChangesDialogStory {
  open = false;
  lastMessage = '';
  lastMessageDesign = 'Positive';

  onSave(): void {
    this.open = false;
    this.lastMessageDesign = 'Positive';
    this.lastMessage = 'Changes saved.';
    setTimeout(() => (this.lastMessage = ''), 3000);
  }

  onDiscard(): void {
    this.open = false;
    this.lastMessageDesign = 'Negative';
    this.lastMessage = 'Changes discarded.';
    setTimeout(() => (this.lastMessage = ''), 3000);
  }
}

const meta: Meta<UnsavedChangesDialogStory> = {
  title: 'Declarative UI / UnsavedChangesDialog',
  component: UnsavedChangesDialogStory,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<UnsavedChangesDialogStory>;

export const Default: Story = {};
