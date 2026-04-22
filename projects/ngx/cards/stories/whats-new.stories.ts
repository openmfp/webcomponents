import type { Meta, StoryObj } from '@storybook/angular';
import { Component } from '@angular/core';

@Component({
  selector: 'whats-new-story',
  template: `<mfp-whats-new style="display: block; height: 480px;"></mfp-whats-new>`,
})
class WhatsNewStory {}

const meta: Meta<WhatsNewStory> = {
  title: "Cards / WhatsNew",
  component: WhatsNewStory,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<WhatsNewStory>;

export const Default: Story = {};
