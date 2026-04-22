import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

@Component({
  selector: 'service-status-story',
  template: `<mfp-wc-service-status-card
    style="display: block; height: 480px; width: 400px;"
  ></mfp-wc-service-status-card>`,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class ServiceStatusStory {}

const meta: Meta<ServiceStatusStory> = {
  title: 'Cards / ServiceStatus',
  component: ServiceStatusStory,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<ServiceStatusStory>;

export const Default: Story = {};
