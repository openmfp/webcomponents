import { DashboardComponent } from '../dashboard/dashboard.component';
import type { Meta, StoryObj } from '@storybook/angular';

const meta: Meta<DashboardComponent> = {
  title: 'Dashboard / Dashboard',
  component: DashboardComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  render: () => ({
    template: `<mfp-dashboard />`,
  }),
};

export default meta;
type Story = StoryObj<DashboardComponent>;

export const Default: Story = {};
