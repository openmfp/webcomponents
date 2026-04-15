import { AddCardDialog } from '../add-card-dialog/add-card-dialog.component';
import { DashboardCardComponent } from '../card/dashboard-card.component';
import { CardConfig, DashboardConfig, SectionConfig } from '../models';
import { DashboardSectionComponent } from '../section/dashboard-section.component';
import {
  Component,
  ViewEncapsulation,
  computed,
  input,
  linkedSignal,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Button } from '@fundamental-ngx/ui5-webcomponents/button';
import { Text } from '@fundamental-ngx/ui5-webcomponents/text';
import { Title } from '@fundamental-ngx/ui5-webcomponents/title';
import { GridStackNode, GridStackOptions } from 'gridstack';
import {
  GridstackComponent,
  GridstackItemComponent,
  nodesCB,
} from 'gridstack/dist/angular';

document.body.classList.add('ui5-content-density-compact');

@Component({
  selector: 'mfp-dashboard',
  imports: [
    GridstackComponent,
    GridstackItemComponent,
    AddCardDialog,
    DashboardSectionComponent,
    DashboardCardComponent,
    Button,
    Title,
    Text,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  encapsulation: ViewEncapsulation.ShadowDom,
  host: {
    '[style.background-image]':
      'config().backgroundImageUrl ? "url(" + config().backgroundImageUrl + ")" : null',
  },
})
export class Dashboard {
  config = input.required<DashboardConfig>();
  sections = model<SectionConfig[]>([]);
  cards = model<CardConfig[]>([]);
  availableCards = input<CardConfig[]>([]);

  readonly saved = output<{ sections: SectionConfig[]; cards: CardConfig[] }>();

  editMode = signal(false);

  private sectionsSnapshot: SectionConfig[] = [];
  private cardsSnapshot: CardConfig[] = [];
  private positionSnapshot: GridStackNode[] = [];
  private gridStackItems = viewChild.required<GridstackComponent>('grid');

  protected gridOptions = computed(
    (): GridStackOptions => ({
      cellHeight: 100,
      disableResize: true,
      disableDrag: !this.editMode(),
      columnOpts: {
        breakpoints: [
          {
            w: 600,
            c: 1,
            layout: 'compact',
          },
          {
            w: 1023,
            c: 8,
            layout: 'compact',
          },
        ],
      },
    }),
  );

  cardDialogOpen = signal(false);

  addedComponents = computed(
    () =>
      new Set(
        this.cards()
          .map((c) => c.component)
          .filter(Boolean) as string[],
      ),
  );

  sectionCards = computed(() => {
    const all = this.cards();
    return (sectionId: string) => all.filter((c) => c.sectionId === sectionId);
  });

  cardsPosition = new Map();
  looseCards = linkedSignal(() => this.cards().filter((c) => !c.sectionId));

  private newGridStackNodes: GridStackNode[] = [];

  enterEditMode(): void {
    const gridStackNodes = this.gridStackItems()
      .gridstackItems?.toArray()
      .map((node) => node.options);

    if (gridStackNodes) {
      this.saveCardsPosition(gridStackNodes);
    }

    this.sectionsSnapshot = [...this.sections()];
    this.cardsSnapshot = [...this.cards()];
    this.editMode.set(true);
  }

  saveEdit(): void {
    this.saved.emit({ sections: this.sections(), cards: this.cards() });
    this.saveCardsPosition(this.newGridStackNodes);
    this.editMode.set(false);
  }

  cancelEdit(): void {
    this.sections.set(this.sectionsSnapshot);
    this.cards.set(
      this.cardsSnapshot.map((c) => {
        const pos = this.cardsPosition.get(c.id);
        return {
          ...c,
          x: pos?.x,
          y: pos?.y,
        };
      }),
    );
    this.cardDialogOpen.set(false);
    this.editMode.set(false);
  }

  removeSection(id: string): void {
    this.sections.update((list) => list.filter((s) => s.id !== id));
    this.cards.update((list) => list.filter((c) => c.sectionId !== id));
  }

  removeCard(id: string): void {
    this.cards.update((list) => list.filter((c) => c.id !== id));
  }

  openCardPanel(): void {
    this.cardDialogOpen.set(true);
  }

  closeCardPanel(): void {
    this.cardDialogOpen.set(false);
  }

  onCardsAdded(cards: CardConfig[]): void {
    if (cards.length > 0) {
      this.cards.update((list) => [
        ...list,
        ...cards.map((ac) => ({
          ...ac,
          id: `card-${ac.component}-${Date.now()}`,
        })),
      ]);
    }
    this.closeCardPanel();
  }

  onOrderChange(event: nodesCB): void {
    this.newGridStackNodes = event.nodes;
  }

  private saveCardsPosition(items: GridStackNode[]): void {
    if (items) {
      items.forEach((node) => {
        this.cardsPosition.set(node.id, { x: node.x, y: node.y });
      });
    }
  }
}
