import { AddCardDialog } from '../dashboard/add-card-dialog/add-card-dialog.component';
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
  selector: 'add-card-dialog-story',
  imports: [AddCardDialog],
  template: `
    <ui5-button (click)="open = true">Open Dialog</ui5-button>
    <mfp-add-card-dialog
      [addedCardsIds]="addedComponents"
      [availableCards]="availableCards"
      [open]="open"
      (cancel)="open = false"
      (confirm)="onConfirm($event)"
    />
    @if (lastAdded) {
      <ui5-message-strip design="Positive" style="margin-top: 1rem;">
        Added: {{ lastAdded }}
      </ui5-message-strip>
    }
  `,
})
class AddCardDialogStory {
  @Input() availableCards: CardConfig[] = AVAILABLE_CARDS;
  @Input() addedComponents: Set<string> = new Set<string>();

  open = false;
  lastAdded = '';

  onConfirm(cards: CardConfig[]): void {
    this.open = false;
    this.lastAdded = cards.map((c) => c.label || c.component).join(', ');
    setTimeout(() => (this.lastAdded = ''), 3000);
  }
}

const meta: Meta<AddCardDialogStory> = {
  title: 'Declarative UI / AddCardDialog',
  component: AddCardDialogStory,
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
type Story = StoryObj<AddCardDialogStory>;

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
