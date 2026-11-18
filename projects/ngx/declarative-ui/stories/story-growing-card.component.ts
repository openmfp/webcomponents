import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { Button } from '@fundamental-ngx/ui5-webcomponents/button';

@Component({
  selector: 'mfp-story-growing-card',
  imports: [Button],
  template: `
    <div class="story-growing-card">
      <div class="story-growing-card__toolbar">
        <ui5-button design="Emphasized" (click)="addItem()"
          >Add item</ui5-button
        >
        <ui5-button [disabled]="!items().length" (click)="removeItem()"
          >Remove item</ui5-button
        >
      </div>
      <ul class="story-growing-card__items">
        @for (item of items(); track item) {
          <li>{{ item }}</li>
        }
      </ul>
    </div>
  `,
  styles: `
    .story-growing-card {
      padding: 0 1rem 1rem;
      color: var(--sapTextColor);
      font-family: var(--sapFontFamily);
    }

    .story-growing-card__toolbar {
      display: flex;
      gap: 0.5rem;
    }

    .story-growing-card__items {
      margin: 0.5rem 0 0;
      padding-inline-start: 1.25rem;
      line-height: 2;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoryGrowingCard {
  private readonly count = signal(2);
  protected readonly items = computed(() =>
    Array.from({ length: this.count() }, (_, index) => `Item ${index + 1}`),
  );

  protected addItem(): void {
    this.count.update((count) => count + 1);
  }

  protected removeItem(): void {
    this.count.update((count) => Math.max(0, count - 1));
  }
}
