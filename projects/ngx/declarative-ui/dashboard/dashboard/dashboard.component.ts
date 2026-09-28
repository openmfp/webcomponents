import { ButtonSettings } from '../../models';
import { DashboardCard } from '../card/dashboard-card.component';
import { addComponentToRegistry } from '../card/utils';
import {
  CELL_HEIGHT,
  COMPACT_BREAKPOINT,
  DASHBOARD_CARD_DRAG_ORIGIN_SELECTOR,
} from '../constants';
import { DiscardChangesDialog } from '../discard-changes-dialog/discard-changes-dialog.component';
import { EditCardsDialog } from '../edit-cards-dialog/edit-cards-dialog.component';
import {
  DASHBOARD_I18N_KEYS,
  DashboardI18nService,
  DashboardTranslations,
  EN_DEFAULTS,
} from '../i18n';
import {
  CardConfig,
  CardSize,
  DashboardConfig,
  SectionConfig,
} from '../models';
import { DashboardSection } from '../section/dashboard-section.component';
import { UnsavedChangesDialog } from '../unsaved-changes-dialog/unsaved-changes-dialog.component';
import { ENGINE_PROFILES, EngineProfile } from './engines/contants/engines';
import { parseCardKeyCommand } from './engines/keyboard/keyboard.helpers';
import { CARD_ARIA_KEYSHORTCUTS } from './engines/keyboard/keyboard.types';
import {
  getZFlowCardSpan,
  getZFlowPageSizeConfig,
} from './engines/zflow/card-size.helpers';
import { ZflowGridStackEngine } from './engines/zflow/z-flow-engine';
import { ZFlowGridStackNode } from './engines/zflow/z-flow.helpers';
import {
  Component,
  ElementRef,
  Injector,
  OnDestroy,
  OnInit,
  SecurityContext,
  Type,
  ViewEncapsulation,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  model,
  numberAttribute,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BusyIndicator } from '@fundamental-ngx/ui5-webcomponents/busy-indicator';
import { Button } from '@fundamental-ngx/ui5-webcomponents/button';
import { Icon } from '@fundamental-ngx/ui5-webcomponents/icon';
import { Menu } from '@fundamental-ngx/ui5-webcomponents/menu';
import { MenuItem } from '@fundamental-ngx/ui5-webcomponents/menu-item';
import { MenuSeparator } from '@fundamental-ngx/ui5-webcomponents/menu-separator';
import { Title } from '@fundamental-ngx/ui5-webcomponents/title';
import '@ui5/webcomponents-icons/dist/action-settings.js';
import '@ui5/webcomponents-icons/dist/overflow.js';
import '@ui5/webcomponents-icons/dist/user-edit.js';
import {
  GridItemHTMLElement,
  GridStackNode,
  GridStackOptions,
  GridStackPosition,
} from 'gridstack';
import {
  GridstackComponent,
  GridstackItemComponent,
} from 'gridstack/dist/angular';

document.body.classList.add('ui5-content-density-compact');

@Component({
  selector: 'mfp-dashboard',
  imports: [
    GridstackComponent,
    GridstackItemComponent,
    DiscardChangesDialog,
    EditCardsDialog,
    UnsavedChangesDialog,
    DashboardSection,
    DashboardCard,
    BusyIndicator,
    Button,
    Icon,
    Menu,
    MenuItem,
    MenuSeparator,
    Title,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  providers: [DashboardI18nService],
  encapsulation: ViewEncapsulation.None,
  host: {
    '[style.background-image]':
      'config().backgroundImageUrl ? "url(" + config().backgroundImageUrl + ")" : "var(--mfp-dashboard-background, none)"',
    '[style.background-size]':
      'backgroundImageHeight() ? "100% " + backgroundImageHeight() + "px" : "100% auto"',
  },
})
export class Dashboard implements OnInit, OnDestroy {
  static registerAngularComponents(componentTypes: Type<unknown>[]): void {
    addComponentToRegistry(componentTypes);
  }
  private readonly hostEl = inject(ElementRef<HTMLElement>);
  private readonly injector = inject(Injector);
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly i18nService = inject(DashboardI18nService);

  config = input<DashboardConfig>({});
  sections = model<SectionConfig[]>([]);
  cards = model<CardConfig[]>([]);
  availableCards = input<CardConfig[]>([]);
  customActions = input<ButtonSettings[]>([]);
  i18n = input<DashboardTranslations | null | undefined>(EN_DEFAULTS);
  loading = input(false, { transform: booleanAttribute });
  loadingDelay = input(1000, { transform: numberAttribute });

  readonly saved = output<{ sections: SectionConfig[]; cards: CardConfig[] }>();
  readonly actionButtonClick = output<{
    event: MouseEvent;
    action: ButtonSettings;
  }>();
  readonly unsavedChangesChange = output<boolean>();

  protected readonly i18nKeys = DASHBOARD_I18N_KEYS;

  /** True once the user has dragged/resized any grid item while in edit mode. */
  private gridDirty = signal(false);
  private zFlowColumns = signal<number | undefined>(undefined);

  editMode = signal(false);
  compactToolbar = signal(false);
  toolbarMenuOpen = signal(false);
  cardDialogOpen = signal(false);
  discardDialogOpen = signal(false);
  unsavedNavDialogOpen = signal(false);
  backgroundImageHeight = signal<number | null>(null);
  dragOriginStyle = signal<{
    top: string;
    left: string;
    width: string;
    height: string;
  } | null>(null);
  dragOriginVisible = signal(false);

  protected readonly busyVisible = signal(false);

  protected hasUnsavedChanges = computed(() => {
    if (!this.editMode()) return false;
    if (this.gridDirty()) return true;
    return (
      JSON.stringify(this.sections()) !== this.sectionsSnapshotJson ||
      JSON.stringify(this.cards()) !== this.cardsSnapshotJson
    );
  });

  protected safeTitle = computed((): SafeHtml => {
    const clean =
      this.sanitizer.sanitize(
        SecurityContext.HTML,
        this.config().title ??
          this.i18nService.getTranslation(DASHBOARD_I18N_KEYS.TITLE),
      ) ?? '';
    return this.sanitizer.bypassSecurityTrustHtml(clean);
  });
  protected safeDescription = computed((): SafeHtml | null => {
    const desc =
      this.config().description ??
      this.i18nService.getTranslation(DASHBOARD_I18N_KEYS.DESCRIPTION);
    if (!desc) return null;

    const clean = this.sanitizer.sanitize(SecurityContext.HTML, desc) ?? '';
    return this.sanitizer.bypassSecurityTrustHtml(clean);
  });

  protected engineProfile = computed((): EngineProfile =>
    this.config().zFlow ? ENGINE_PROFILES.zFlow : ENGINE_PROFILES.default,
  );
  protected isZFlow = computed(() => !!this.config().zFlow);
  protected pageSize = computed(() => {
    const columns = this.zFlowColumns();
    if (!this.isZFlow() || columns === undefined) return null;
    return getZFlowPageSizeConfig(columns)?.pageSize ?? null;
  });
  protected pageColumns = computed(() =>
    this.pageSize() ? this.zFlowColumns() : null,
  );
  protected keyboardNavigationActive = computed(
    () => this.editMode() && this.isZFlow(),
  );
  protected readonly cardAriaKeyshortcuts = CARD_ARIA_KEYSHORTCUTS;

  protected hasToolbarMenuContent = computed(
    () => !!this.config().editable || this.customActions().length > 0,
  );

  protected gridStackEngine = computed(() => this.engineProfile().engineClass);

  protected gridBreakpoints = computed(() => [
    ...this.engineProfile().breakpoints,
  ]);

  protected columnVars = computed(() => {
    const [sm, md, lg, xl] = this.engineProfile().sectionColumns;
    return {
      '--dashboard-cols-sm': sm,
      '--dashboard-cols-md': md,
      '--dashboard-cols-lg': lg,
      '--dashboard-cols-xl': xl,
    };
  });

  protected addedCardsIds = computed(
    () => new Set(this.cards().map((c) => c.id)),
  );

  protected editViewButton = computed(() => ({
    icon: 'action-settings',
    design: 'Transparent' as const,
    tooltip: this.i18nService.getTranslation(
      DASHBOARD_I18N_KEYS.EDIT_HOME_BUTTON,
    ),
    ...this.config().buttonsSettings?.editViewButton,
    text: this.i18nService.getTranslation(DASHBOARD_I18N_KEYS.EDIT_HOME_BUTTON),
  }));
  protected editCardsButton = computed(() => ({
    icon: '',
    design: 'Default' as const,
    tooltip: '',
    ...this.config().buttonsSettings?.editCardsButton,
    text: this.i18nService.getTranslation(
      DASHBOARD_I18N_KEYS.EDIT_CARDS_BUTTON,
    ),
  }));

  protected sectionCards = computed(() => {
    const all = this.cards();
    return (sectionId: string) => all.filter((c) => c.sectionId === sectionId);
  });
  protected looseCards = linkedSignal(() => {
    const loose = this.cards().filter((c) => !c.sectionId);
    const zFlow = this.config().zFlow;
    if (!this.engineProfile().fixedCardHeight || !zFlow) return loose;
    const columns = this.zFlowColumns();
    return loose.map((c) => this.toZFlowCard(c, zFlow, columns));
  });

  protected isEmpty = computed(() => this.looseCards().length === 0);
  protected isDashboardEditable = computed(() => this.config().editable);

  protected gridOptions = computed((): GridStackOptions => ({
    cellHeight: CELL_HEIGHT,
    disableResize: !this.editMode(),
    disableDrag: !this.editMode(),
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    engineClass: this.gridStackEngine(),
    columnOpts: {
      // Source of truth: ../constants/breakpoints.ts — active profile's
      // breakpoints (paired with ../constants/_breakpoints.scss for the
      // section grid's media queries via --dashboard-cols-* CSS vars).
      breakpoints: this.gridBreakpoints(),
      breakpointForWindow: true,
      columnMax: this.engineProfile().columnMax,
    },
  }));

  /** JSON snapshots of sections/cards taken on entering edit mode, used to detect changes. */
  private sectionsSnapshotJson = '';
  private cardsSnapshotJson = '';
  private sectionsSnapshot: SectionConfig[] = [];
  private cardsSnapshot: CardConfig[] = [];

  private gridStack = viewChild.required<GridstackComponent>('grid');
  private dragOriginPlaceholder = viewChild<ElementRef<HTMLElement>>(
    'dragOriginPlaceholder',
  );
  private addCardBtn = viewChild<Button>('editCardsBtn');
  private resizeObserver?: ResizeObserver;
  private cardsPosition = new Map<
    string,
    GridStackPosition & { size?: CardSize }
  >();
  private pendingFrontCardIds: string[] = [];

  /** Callback that resumes the intercepted navigation once the user resolves the dialog. */
  private pendingNavigation: (() => void) | null = null;
  /** beforeunload handler kept on instance so add/removeEventListener pair up. */
  private readonly beforeUnloadHandler = (event: BeforeUnloadEvent): void => {
    if (this.hasUnsavedChanges()) {
      event.preventDefault();
      // Required by older browsers; the string itself is ignored — modern
      // browsers always render their own generic prompt.
      event.returnValue = '';
    }
  };

  constructor() {
    afterNextRender(() => {
      this.connectZFlowEngine();
    });
    effect(() => {
      this.unsavedChangesChange.emit(this.hasUnsavedChanges());
    });
    effect(() => {
      const supplied = this.i18n();
      const cfg = this.config();
      const fromConfig: Partial<DashboardTranslations> = {};
      if (cfg.title != null) fromConfig.title = cfg.title;
      if (cfg.description != null) fromConfig.description = cfg.description;

      const suppliedNonEmpty =
        supplied && Object.keys(supplied).length > 0 ? supplied : null;
      const resolved =
        suppliedNonEmpty || Object.keys(fromConfig).length > 0
          ? { ...fromConfig, ...suppliedNonEmpty }
          : EN_DEFAULTS;
      this.i18nService.overrides.set(resolved);
    });
    effect((onCleanup) => {
      if (!this.loading()) {
        this.busyVisible.set(false);
        return;
      }
      const delay = Math.max(0, this.loadingDelay());
      if (delay === 0) {
        this.busyVisible.set(true);
        return;
      }
      const timer = setTimeout(() => {
        this.busyVisible.set(true);
      }, delay);
      // Covers both the load finishing first and the component being destroyed
      // mid-flight, so a resolved request never leaves a spinner behind.
      onCleanup(() => {
        clearTimeout(timer);
      });
    });
    effect((onCleanup) => {
      const url = this.config().backgroundImageUrl;
      this.backgroundImageHeight.set(null);
      if (!url) return;
      const img = new Image();
      img.onload = () => {
        this.backgroundImageHeight.set(img.naturalHeight);
      };
      img.src = url;
      onCleanup(() => {
        img.onload = null;
      });
    });
  }

  ngOnInit(): void {
    this.resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      this.compactToolbar.set(width < COMPACT_BREAKPOINT);
    });
    this.resizeObserver.observe(this.hostEl.nativeElement);
    window.addEventListener('beforeunload', this.beforeUnloadHandler);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    window.removeEventListener('beforeunload', this.beforeUnloadHandler);
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
    this.updateCardsPositions();
    this.getZFlowEngine()?.syncZFlowOrderFromLayout();
    this.sectionsSnapshot = [...this.sections()];
    this.cardsSnapshot = [...this.cards()];
    this.sectionsSnapshotJson = JSON.stringify(this.sections());
    this.cardsSnapshotJson = JSON.stringify(this.cards());
    this.gridDirty.set(false);
    this.editMode.set(true);
    afterNextRender(
      () => {
        this.addCardBtn()?.element.focus();
      },
      { injector: this.injector },
    );
  }

  /**
   * Empty-state call to action: switch to edit mode and immediately surface the
   * Edit Cards dialog, so a user starting from an empty home lands directly on
   * the card picker instead of an empty grid.
   */
  enterEditModeAndEditCards(): void {
    this.enterEditMode();
    this.openCardPanel();
  }

  saveEdit(): void {
    this.updateCardsPositions();

    const savedCards = this.cards().map((c) => {
      const pos = this.cardsPosition.get(c.id);
      return {
        ...c,
        x: pos?.x,
        y: pos?.y,
        w: pos?.w ?? c.w,
        h: pos?.h ?? c.h,
        ...(pos?.size ? { size: pos.size } : {}),
      };
    });
    this.gridDirty.set(false);
    this.editMode.set(false);

    this.cards.set(savedCards);
    this.saved.emit({
      sections: this.sections(),
      cards: savedCards,
    });
  }

  cancelEdit(): void {
    if (this.hasUnsavedChanges()) {
      this.discardDialogOpen.set(true);
      return;
    }
    this.discardEdit();
  }

  confirmDiscard(): void {
    this.discardDialogOpen.set(false);
    this.discardEdit();
  }

  cancelDiscard(): void {
    this.discardDialogOpen.set(false);
  }

  /**
   * Public framework-agnostic navigation guard. Consumer apps (Angular Router
   * CanDeactivate guard, Luigi navigation listener, plain `<a>` click handler,
   * window history listener — anything) call this before performing their
   * navigation:
   *
   *   if (dashboard.requestNavigation(() => router.navigateByUrl(target))) {
   *     // already navigated synchronously — clean state
   *   } else {
   *     // dashboard popped the unsaved-changes dialog; the navigation will
   *     // resume from the user's choice (Save → proceed, Discard → proceed,
   *     // Cancel → drop the request entirely).
   *   }
   *
   * Returns `true` when navigation may proceed immediately (no unsaved
   * changes — `proceed` was invoked synchronously). Returns `false` when the
   * dialog has been opened and the caller must NOT navigate; the dashboard
   * will run the callback later if the user picks Save or Discard.
   *
   * If a previous navigation is already pending, that one is dropped in
   * favour of the new request — Cancel always means "stay here", so losing
   * the older queued navigation is the correct outcome.
   */
  requestNavigation(proceed: () => void): boolean {
    if (!this.hasUnsavedChanges()) {
      proceed();
      return true;
    }
    this.pendingNavigation = proceed;
    this.unsavedNavDialogOpen.set(true);
    return false;
  }

  /** Save → persist changes, close the dialog, then resume navigation. */
  onUnsavedNavSave(): void {
    this.unsavedNavDialogOpen.set(false);
    this.saveEdit();
    this.runPendingNavigation();
  }

  /** Discard → revert to snapshot, close the dialog, then resume navigation. */
  onUnsavedNavDiscard(): void {
    this.unsavedNavDialogOpen.set(false);
    this.discardEdit();
    this.runPendingNavigation();
  }

  /** Cancel → drop the queued navigation and stay in edit mode. */
  onUnsavedNavCancel(): void {
    this.unsavedNavDialogOpen.set(false);
    this.pendingNavigation = null;
  }

  private runPendingNavigation(): void {
    const pending = this.pendingNavigation;
    this.pendingNavigation = null;
    pending?.();
  }

  private discardEdit(): void {
    this.pendingFrontCardIds = [];
    this.sections.set(this.sectionsSnapshot);
    this.cards.set(
      this.cardsSnapshot.map((c) => {
        const pos = this.cardsPosition.get(c.id);
        return { ...c, x: pos?.x, y: pos?.y };
      }),
    );
    this.cardDialogOpen.set(false);
    this.gridDirty.set(false);
    this.editMode.set(false);
    afterNextRender(
      () => {
        this.restoreGridLayoutFromCards();
        const engine = this.getZFlowEngine();
        engine?.syncZFlowOrderFromLayout();
        engine?.commitZFlowLayout();
      },
      { injector: this.injector },
    );
  }

  private restoreGridLayoutFromCards(): void {
    const grid = this.gridStack().grid;
    if (!grid) return;

    grid.load(this.createGridLayoutFromCards(grid.engine.nodes), false);
  }

  private createGridLayoutFromCards(nodes: GridStackNode[]): GridStackNode[] {
    const cardsById = new Map(this.looseCards().map((card) => [card.id, card]));

    return nodes.map((node) => {
      const position = node.id ? cardsById.get(node.id) : undefined;
      return {
        id: node.id,
        x: position?.x ?? node.x,
        y: position?.y ?? node.y,
        w: position?.w ?? node.w,
        h: position?.h ?? node.h,
      };
    });
  }

  onCardKeydown(event: KeyboardEvent, cardId: string): void {
    const zFlowEngine = this.getZFlowEngine();
    if (
      !this.keyboardNavigationActive() ||
      !zFlowEngine ||
      event.target !== event.currentTarget
    ) {
      return;
    }

    const command = parseCardKeyCommand(event);
    if (!command) return;

    event.preventDefault();
    event.stopPropagation();

    const gridItemHost = event.currentTarget as GridItemHTMLElement;
    const node = gridItemHost.gridstackNode;
    if (!node || node.id !== cardId) {
      this.restoreCardFocus(gridItemHost);
      return;
    }

    const changed = zFlowEngine.applyKeyboardCommand(cardId, command);

    if (changed) {
      this.onGridChange();
    }

    this.restoreCardFocus(gridItemHost);
  }

  private restoreCardFocus(host: HTMLElement): void {
    queueMicrotask(() => {
      if (host.isConnected && this.editMode())
        host.focus({ preventScroll: true });
    });
  }

  removeSection(id: string): void {
    this.sections.update((list) => list.filter((s) => s.id !== id));
    this.cards.update((list) => list.filter((c) => c.sectionId !== id));
  }

  removeCard(id: string): void {
    const wasLooseCard = this.looseCards().some((c) => c.id === id);
    this.cards.update((list) => list.filter((c) => c.id !== id));

    if (wasLooseCard) {
      afterNextRender(
        () => {
          this.gridStack().grid?.compact('compact', false);
        },
        { injector: this.injector },
      );
    }
  }

  openCardPanel(): void {
    this.cardDialogOpen.set(true);
  }

  closeCardPanel(): void {
    this.cardDialogOpen.set(false);
  }

  onCardsEdited(event: { added: CardConfig[]; removed: string[] }): void {
    const looseCardIds = new Set(this.looseCards().map((c) => c.id));

    const hasLooseCardChanges =
      event.added.some((card) => !card.sectionId) ||
      event.removed.some((id) => looseCardIds.has(id));
    if (hasLooseCardChanges) {
      this.getZFlowEngine()?.syncZFlowOrderFromLayout();
    }

    this.pendingFrontCardIds = event.added
      .filter((card) => !card.sectionId)
      .map((card) => card.id);

    const zFlow = this.config().zFlow;
    this.cards.update((list) => {
      const withoutRemoved = list.filter((c) => !event.removed.includes(c.id));
      return [
        ...event.added.map((ac) =>
          zFlow && !ac.sectionId
            ? { ...ac, size: ac.size ?? zFlow.defaultCardSize }
            : { ...ac },
        ),
        ...withoutRemoved,
      ];
    });
    this.closeCardPanel();
  }

  onDragStart(event: { el: Element }): void {
    this.getZFlowEngine()?.syncZFlowOrderFromLayout();
    this.dragOriginVisible.set(false);

    if (!this.engineProfile().renderOriginPosition) {
      return;
    }

    this.renderDragOriginPlaceholder(event.el);
  }

  onDrag(): void {
    this.dragOriginVisible.set(false);
  }

  onDragStop(): void {
    this.getZFlowEngine()?.commitZFlowLayout();
    this.dragOriginVisible.set(false);
    this.dragOriginStyle.set(null);
  }

  onGridChange(): void {
    this.moveAddedCardsToFront();
    this.getZFlowEngine()?.commitZFlowLayout();
    this.syncCardSizesFromGrid();
    if (this.editMode()) {
      this.gridDirty.set(true);
    }
  }

  private moveAddedCardsToFront(): void {
    const ids = this.pendingFrontCardIds;
    const grid = this.gridStack().grid;
    if (!ids.length || !grid) return;

    const nodes = grid.engine.nodes;
    if (!ids.every((id) => nodes.some((node) => node.id === id))) return;
    this.pendingFrontCardIds = [];

    const zFlowEngine = this.getZFlowEngine();
    if (zFlowEngine) {
      zFlowEngine.moveNodesToFront(ids);
      return;
    }

    grid.batchUpdate();
    [...ids].reverse().forEach((id) => {
      const el = nodes.find((node) => node.id === id)?.el;
      if (el) grid.update(el, { x: 0, y: 0 });
    });
    grid.batchUpdate(false);
  }

  private saveCardsPosition(items: ZFlowGridStackNode[]): void {
    items.forEach((node) => {
      if (node.id) {
        this.cardsPosition.set(node.id, {
          x: node.x,
          y: node.y,
          w: node.w,
          h: node.h,
          size: node.size,
        });
      }
    });
  }

  private updateCardsPositions(): void {
    const gridStackNodes = this.gridStack()
      .gridstackItems?.toArray()
      .map((node) => node.options);

    if (gridStackNodes) {
      this.saveCardsPosition(gridStackNodes);
    }
  }

  private getZFlowEngine(): ZflowGridStackEngine | null {
    const engine = this.gridStack().grid?.engine;
    return engine instanceof ZflowGridStackEngine ? engine : null;
  }

  private connectZFlowEngine(): void {
    const engine = this.getZFlowEngine();
    if (!engine) return;

    engine.columnChangeListener = (column) => {
      this.zFlowColumns.set(column);
    };
    this.zFlowColumns.set(engine.column);
  }

  private toZFlowCard(
    card: CardConfig,
    zFlow: NonNullable<DashboardConfig['zFlow']>,
    columns: number | undefined,
  ): CardConfig {
    const { w, minW, maxW, ...rest } = card;
    const size = card.size ?? zFlow.defaultCardSize;
    const span =
      columns === undefined ? undefined : getZFlowCardSpan(size, columns);

    return {
      ...rest,
      size,
      ...(span === undefined ? {} : { w: span }),
      h: zFlow.cardHeight,
      maxH: zFlow.cardHeight,
      minH: zFlow.cardHeight,
    };
  }

  private syncCardSizesFromGrid(): void {
    const zFlow = this.config().zFlow;
    const engine = this.getZFlowEngine();
    if (!zFlow || !engine) return;

    const nodeSizes = new Map(
      (engine.nodes as ZFlowGridStackNode[]).map((node) => [
        node.id,
        node.size,
      ]),
    );
    const cards = this.cards();
    const synced = cards.map((card) => {
      const size = nodeSizes.get(card.id);
      return size && size !== (card.size ?? zFlow.defaultCardSize)
        ? { ...card, size }
        : card;
    });
    if (synced.some((card, index) => card !== cards[index])) {
      this.cards.set(synced);
    }
  }

  private createDragOriginClone(gridItem: Element): HTMLElement | null {
    const source = gridItem.querySelector<HTMLElement>(
      DASHBOARD_CARD_DRAG_ORIGIN_SELECTOR,
    );
    if (!source) return null;

    const clone = source.cloneNode(true) as HTMLElement;
    clone.classList.add('mfp-dashboard__drag-origin-content');
    clone.setAttribute('aria-hidden', 'true');
    clone.removeAttribute('id');
    clone.querySelectorAll('[id]').forEach((element) => {
      element.removeAttribute('id');
    });
    return clone;
  }

  private renderDragOriginPlaceholder(gridItem: Element): void {
    const gridEl = this.gridStack().el as HTMLElement;
    const gridRect = gridEl.getBoundingClientRect();
    const itemRect = gridItem.getBoundingClientRect();
    const clone = this.createDragOriginClone(gridItem);

    this.dragOriginStyle.set({
      top: `${itemRect.top - gridRect.top}px`,
      left: `${itemRect.left - gridRect.left}px`,
      width: `${itemRect.width}px`,
      height: `${itemRect.height}px`,
    });
    this.dragOriginVisible.set(true);

    if (!clone) return;

    afterNextRender(
      () => {
        if (!this.dragOriginVisible()) return;
        this.dragOriginPlaceholder()?.nativeElement.replaceChildren(clone);
      },
      { injector: this.injector },
    );
  }
}
