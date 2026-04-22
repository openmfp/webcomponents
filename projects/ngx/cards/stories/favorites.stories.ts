import type { Meta, StoryObj } from '@storybook/angular';
import { Component } from '@angular/core';

@Component({
  selector: 'favorites-story',
  template: `<mfp-favorites style="display: block;"></mfp-favorites>`,
})
class FavoritesStory {}

const meta: Meta<FavoritesStory> = {
  title: 'Cards / Favorites',
  component: FavoritesStory,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<FavoritesStory>;

export const Default: Story = {};
