import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

@Component({
  selector: 'whats-new-story',
  template: `<mfp-wc-whats-new
    style="display: block; height: 480px;"
  ></mfp-wc-whats-new>`,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class WhatsNewStory {}

const meta: Meta<WhatsNewStory> = {
  title: 'Cards / WhatsNew',
  component: WhatsNewStory,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<WhatsNewStory>;

export const Default: Story = {};
