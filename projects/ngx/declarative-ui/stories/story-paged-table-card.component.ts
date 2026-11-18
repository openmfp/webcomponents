import { DeclarativeTableCard } from '../table-card/declarative-table-card.component';
import type { TableCardConfig } from '../table-card/models/configs';
import { TABLE_CARD_CONFIG, TABLE_RESOURCES } from './pods-table.config';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';

const POD_COUNT = 42;

@Component({
  selector: 'mfp-story-paged-table-card',
  imports: [DeclarativeTableCard],
  template: `
    <mfp-declarative-table-card
      [config]="config()"
      [contentHeight]="contentHeight()"
      [resources]="loadedPods()"
      (loadMoreResources)="loadMore()"
      (paginationLimitChanged)="changePaginationLimit($event)"
    />
  `,
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoryPagedTableCard {
  readonly header = input('Pods');
  readonly contentHeight = input<number | undefined>(undefined);

  private readonly pods = Array.from({ length: POD_COUNT }, (_, index) => {
    const pod = TABLE_RESOURCES[index % TABLE_RESOURCES.length];
    const uid = `pod-${index + 1}`;
    return {
      ...pod,
      id: uid,
      metadata: {
        ...pod.metadata,
        name: `${pod.metadata.name}-${index + 1}`,
        uid,
      },
    };
  });
  private readonly paginationLimit = signal(5);
  private readonly loadedCount = signal(this.paginationLimit());

  protected readonly loadedPods = computed(() =>
    this.pods.slice(0, this.loadedCount()),
  );
  protected readonly config = computed((): TableCardConfig => ({
    ...TABLE_CARD_CONFIG,
    header: this.header(),
    tableConfig: {
      ...TABLE_CARD_CONFIG.tableConfig,
      paginationLimit: this.paginationLimit(),
      hasMore: this.loadedCount() < this.pods.length,
      totalItemsCount: this.pods.length,
    },
  }));

  protected loadMore(): void {
    this.loadedCount.update((count) =>
      Math.min(this.pods.length, count + this.paginationLimit()),
    );
  }

  protected changePaginationLimit(limit: number): void {
    this.paginationLimit.set(limit);
    this.loadedCount.set(limit);
  }
}
