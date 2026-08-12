import { EditCardsDialog } from '../dashboard/edit-cards-dialog/edit-cards-dialog.component';
import { DashboardI18nService } from '../dashboard/i18n';
import type { CardConfig } from '../dashboard/models';
import { Component, Input } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

const AVAILABLE_CARDS: CardConfig[] = [
  {
    id: 'whats-new',
    component: 'mfp-whats-new',
    label: "What's New",
    w: 3,
    h: 3,
  },
  {
    id: 'recently-visited',
    component: 'mfp-visited-service-card',
    label: 'Recently Visited',
    w: 4,
    h: 1,
  },
];

@Component({
  selector: 'mfp-edit-cards-dialog-story',
  imports: [EditCardsDialog],
  template: `
    <ui5-button (click)="open = true">Open Dialog</ui5-button>
    <mfp-edit-cards-dialog
      [addedCardsIds]="addedComponents"
      [availableCards]="availableCards"
      [open]="open"
      (cancelled)="open = false"
      (confirm)="onConfirm($event)"
    />
    @if (lastMessage) {
      <ui5-message-strip design="Positive" style="margin-top: 1rem;">
        {{ lastMessage }}
      </ui5-message-strip>
    }
  `,
  providers: [DashboardI18nService],
})
class EditCardsDialogStory {
  @Input() availableCards: CardConfig[] = AVAILABLE_CARDS;
  @Input() addedComponents: Set<string> = new Set<string>();

  open = false;
  lastMessage = '';

  onConfirm(event: { added: CardConfig[]; removed: string[] }): void {
    this.open = false;
    const parts: string[] = [];
    if (event.added.length) {
      parts.push(
        `Added: ${event.added.map((c) => c.label || c.component).join(', ')}`,
      );
    }
    if (event.removed.length) {
      parts.push(`Removed: ${event.removed.join(', ')}`);
    }
    this.lastMessage = parts.join(' | ');
    setTimeout(() => (this.lastMessage = ''), 3000);
  }
}

const meta: Meta<EditCardsDialogStory> = {
  title: 'Declarative UI / EditCardsDialog',
  component: EditCardsDialogStory,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    availableCards: { control: 'object' },
    addedComponents: { control: false },
  },
};

export default meta;
type Story = StoryObj<EditCardsDialogStory>;

export const NoneAdded: Story = {
  args: {
    availableCards: AVAILABLE_CARDS,
    addedComponents: new Set<string>(),
  },
};

export const SomeAdded: Story = {
  args: {
    availableCards: AVAILABLE_CARDS,
    addedComponents: new Set(['whats-new']),
  },
};

export const AllAdded: Story = {
  args: {
    availableCards: AVAILABLE_CARDS,
    addedComponents: new Set(AVAILABLE_CARDS.map((c) => c.id)),
  },
};
