import type { Meta, StoryObj } from '@storybook/angular';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { AddCardDialog } from '../add-card-dialog.component';
import type { CardConfig } from '../../models';

const AVAILABLE_CARDS: CardConfig[] = [
  { component: 'mfp-declarative-table', label: 'Pods Table', colSpan: 12, rowSpan: 4 },
  { component: 'mfp-whats-new', label: "What's New", colSpan: 3, rowSpan: 3 },
  { component: 'mfp-visited-service-card', label: 'Recently Visited', colSpan: 4, rowSpan: 1 },
];

@Component({
  selector: 'add-card-dialog-story',
  imports: [AddCardDialog],
  template: `
    <ui5-button (click)="open = true">Open Dialog</ui5-button>
    <mfp-add-card-dialog
      [open]="open"
      [availableCards]="availableCards"
      [addedComponents]="addedComponents"
      (confirm)="onConfirm($event)"
      (cancel)="open = false"
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
  title: 'Dashboard / AddCardDialog',
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
    addedComponents: new Set(['mfp-whats-new']),
  },
};

export const AllAdded: Story = {
  args: {
    availableCards: AVAILABLE_CARDS,
    addedComponents: new Set(AVAILABLE_CARDS.map((c) => c.component)),
  },
};
