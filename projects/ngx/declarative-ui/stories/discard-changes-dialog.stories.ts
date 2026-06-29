import { Component } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';
import { DiscardChangesDialog } from '../dashboard/discard-changes-dialog/discard-changes-dialog.component';
import { DashboardI18nService } from '../dashboard/i18n';

@Component({
  selector: 'mfp-discard-changes-dialog-story',
  imports: [DiscardChangesDialog],
  // `DashboardI18nService` is normally provided by `<mfp-dashboard>`. The
  // dialog is shown here standalone, so we provide the service on the story
  // wrapper instead — every dialog nested below resolves it from this injector.
  providers: [DashboardI18nService],
  template: `
    <ui5-button design="Negative" (click)="open = true">Open Dialog</ui5-button>
    <mfp-discard-changes-dialog
      [open]="open"
      (cancelled)="open = false"
      (confirm)="onConfirm()"
    />
    @if (lastMessage) {
      <ui5-message-strip design="Negative" style="margin-top: 1rem;">
        {{ lastMessage }}
      </ui5-message-strip>
    }
  `,
})
class DiscardChangesDialogStory {
  open = false;
  lastMessage = '';

  onConfirm(): void {
    this.open = false;
    this.lastMessage = 'Changes discarded.';
    setTimeout(() => (this.lastMessage = ''), 3000);
  }
}

const meta: Meta<DiscardChangesDialogStory> = {
  title: 'Declarative UI / DiscardChangesDialog',
  component: DiscardChangesDialogStory,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<DiscardChangesDialogStory>;

export const Default: Story = {};
