import type { Meta, StoryObj } from '@storybook/angular';
import { Component } from '@angular/core';

@Component({
  selector: 'service-status-story',
  template: `<mfp-service-status-card style="display: block; height: 480px; width: 400px;"></mfp-service-status-card>`,
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
