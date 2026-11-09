import { filterStoryServices } from './story-services';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { List } from '@fundamental-ngx/ui5-webcomponents/list';
import { ListItemStandard } from '@fundamental-ngx/ui5-webcomponents/list-item-standard';

@Component({
  selector: 'mfp-story-service-list-card',
  imports: [List, ListItemStandard],
  template: `
    <ui5-list accessibleName="Services" noDataText="No services found">
      @for (service of services(); track service.title) {
        <ui5-li [description]="service.description">{{ service.title }}</ui5-li>
      }
    </ui5-list>
    @if (lastAction()) {
      <p class="story-service-list-card__action">
        Action "{{ lastAction() }}" handled by the Angular card.
      </p>
    }
  `,
  styles: `
    .story-service-list-card__action {
      margin: 0.5rem 1rem;
      color: var(--sapTextColor);
      font-family: var(--sapFontFamily);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoryServiceListCard {
  private readonly query = signal('');
  protected readonly lastAction = signal('');
  protected readonly services = computed(() =>
    filterStoryServices(this.query()),
  );

  onCardSearch(query: string): void {
    this.query.set(query);
  }

  onCardAction(key: string): void {
    this.lastAction.set(key);
  }
}
