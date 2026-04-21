import { AddCardDialog } from '../add-card-dialog/add-card-dialog.component';
import { addComponentToRegistry } from '../card/dashboard-card-registry';
import { DashboardCard } from '../card/dashboard-card.component';
import {
  CardConfig,
  DashboardButtonSettings,
  DashboardConfig,
  SectionConfig,
} from '../models';
import { DashboardSection } from '../section/dashboard-section.component';
import {
  Component,
  Type,
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
    DashboardSection,
    DashboardCard,
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
  static registerAngularComponent(componentTypes: Type<unknown>[]): void {
    addComponentToRegistry(componentTypes);
  }

  config = input.required<DashboardConfig>();
  sections = model<SectionConfig[]>([]);
  cards = model<CardConfig[]>([]);
  availableCards = input<CardConfig[]>([]);

  readonly saved = output<{ sections: SectionConfig[]; cards: CardConfig[] }>();
  readonly actionButtonClick = output<{
    event: MouseEvent;
    action: DashboardButtonSettings;
  }>();

  editMode = signal(false);

  private sectionsSnapshot: SectionConfig[] = [];
  private cardsSnapshot: CardConfig[] = [];
  private gridStackItems = viewChild.required<GridstackComponent>('grid');

  protected gridOptions = computed(
    (): GridStackOptions => ({
      cellHeight: 10,
      disableResize: true,
      disableDrag: !this.editMode(),
      columnOpts: {
        breakpointForWindow: true,
        breakpoints: [
          {
            w: 1920,
            c: 12,
            layout: 'none',
          },
          {
            w: 1200,
            c: 8,
            layout: 'compact',
          },
          {
            w: 726,
            c: 1,
            layout: 'list',
          },
        ],
      },
    }),
  );

  cardDialogOpen = signal(false);

  customActions = computed(() => this.config().customActions ?? []);

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

  cardsPosition = new Map<string, { x?: number; y?: number }>();
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
    this.saveCardsPosition(this.newGridStackNodes);
    this.saved.emit({
      sections: this.sections(),
      cards: this.cards().map((c) => {
        const pos = this.cardsPosition.get(c.id);
        return {
          ...c,
          x: pos?.x,
          y: pos?.y,
        };
      }),
    });
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
    this.cardsPosition.delete(id);
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
    items.forEach((node) => {
      if (node.id) {
        this.cardsPosition.set(node.id, { x: node.x, y: node.y });
      }
    });
  }
}
