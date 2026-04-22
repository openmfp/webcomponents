import { Favorites } from '../favorites/favorites.component';
import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

@Component({
  selector: 'favorites-story',
  imports: [Favorites],
  template: `<mfp-favorites style="display: block;"></mfp-favorites>`,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
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
