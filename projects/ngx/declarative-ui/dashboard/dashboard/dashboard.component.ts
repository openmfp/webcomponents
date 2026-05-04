import { ButtonSettings } from '../../models/ui-definition';
import { AddCardDialog } from '../add-card-dialog/add-card-dialog.component';
import { addComponentToRegistry } from '../card/dashboard-card-registry';
import { DashboardCard } from '../card/dashboard-card.component';
import { CardConfig, DashboardConfig, SectionConfig } from '../models';
import { CELL_HEIGHT, COMPACT_BREAKPOINT } from '../models/constants';
import { DashboardSection } from '../section/dashboard-section.component';
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  Type,
  ViewEncapsulation,
  computed,
  inject,
  input,
  linkedSignal,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Button } from '@fundamental-ngx/ui5-webcomponents/button';
import { Menu } from '@fundamental-ngx/ui5-webcomponents/menu';
import { MenuItem } from '@fundamental-ngx/ui5-webcomponents/menu-item';
import { MenuSeparator } from '@fundamental-ngx/ui5-webcomponents/menu-separator';
import { Text } from '@fundamental-ngx/ui5-webcomponents/text';
import { Title } from '@fundamental-ngx/ui5-webcomponents/title';
import '@ui5/webcomponents-icons/dist/action-settings.js';
import '@ui5/webcomponents-icons/dist/menu2.js';
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
    Menu,
    MenuItem,
    MenuSeparator,
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
export class Dashboard implements OnInit, OnDestroy {
  static registerAngularComponents(componentTypes: Type<unknown>[]): void {
    addComponentToRegistry(componentTypes);
  }

  config = input.required<DashboardConfig>();
  sections = model<SectionConfig[]>([]);
  cards = model<CardConfig[]>([]);
  availableCards = input<CardConfig[]>([]);

  readonly saved = output<{ sections: SectionConfig[]; cards: CardConfig[] }>();
  readonly actionButtonClick = output<{
    event: MouseEvent;
    action: ButtonSettings;
  }>();

  editMode = signal(false);
  compactToolbar = signal(false);
  toolbarMenuOpen = signal(false);

  private sectionsSnapshot: SectionConfig[] = [];
  private cardsSnapshot: CardConfig[] = [];
  private gridStackItems = viewChild.required<GridstackComponent>('grid');
  private resizeObserver?: ResizeObserver;
  private readonly hostEl = inject(ElementRef<HTMLElement>);

  protected gridOptions = computed(
    (): GridStackOptions => ({
      cellHeight: CELL_HEIGHT,
      disableResize: !this.editMode(),
      disableDrag: !this.editMode(),
      columnOpts: {
        breakpointForWindow: true,
        breakpoints: [
          { w: 1440, c: 12, layout: 'none' },
          { w: 1024, c: 8, layout: 'compact' },
          { w: 600, c: 1, layout: 'list' },
        ],
      },
    }),
  );

  cardDialogOpen = signal(false);
  customActions = computed(() => this.config().customActions ?? []);
  addedCardsIds = computed(() => new Set(this.cards().map((c) => c.id)));

  editViewButton = computed(() => ({
    icon: 'action-settings',
    design: 'Transparent' as const,
    tooltip: 'Edit View',
    text: '',
    ...this.config().buttonsSettings?.editViewButton,
  }));

  addCardButton = computed(() => ({
    icon: '',
    design: 'Default' as const,
    tooltip: '',
    text: '+ Add Card',
    ...this.config().buttonsSettings?.addCardButton,
  }));

  sectionCards = computed(() => {
    const all = this.cards();
    return (sectionId: string) => all.filter((c) => c.sectionId === sectionId);
  });

  cardsPosition = new Map<string, { x?: number; y?: number }>();
  looseCards = linkedSignal(() => this.cards().filter((c) => !c.sectionId));

  private newGridStackNodes: GridStackNode[] = [];

  ngOnInit(): void {
    this.resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      this.compactToolbar.set(width < COMPACT_BREAKPOINT);
    });
    this.resizeObserver.observe(this.hostEl.nativeElement);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  onMenuItemClick(actionId: string, event: Event): void {
    if (actionId === 'edit-view') {
      this.enterEditMode();
      return;
    }
    const action = this.customActions().find((a) => a.action === actionId);
    if (action) {
      this.actionButtonClick.emit({ event: event as MouseEvent, action });
    }
  }

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
        return { ...c, x: pos?.x, y: pos?.y };
      }),
    });
    this.editMode.set(false);
  }

  cancelEdit(): void {
    this.sections.set(this.sectionsSnapshot);
    this.cards.set(
      this.cardsSnapshot.map((c) => {
        const pos = this.cardsPosition.get(c.id);
        return { ...c, x: pos?.x, y: pos?.y };
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
