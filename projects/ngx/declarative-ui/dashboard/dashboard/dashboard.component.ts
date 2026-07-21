import { ButtonSettings } from '../../models';
import { DashboardCard } from '../card/dashboard-card.component';
import { addComponentToRegistry } from '../card/utils';
import {
  CELL_HEIGHT,
  COMPACT_BREAKPOINT,
  DASHBOARD_BREAKPOINTS,
  XL_PAGE,
} from '../constants';
import { DiscardChangesDialog } from '../discard-changes-dialog/discard-changes-dialog.component';
import { EditCardsDialog } from '../edit-cards-dialog/edit-cards-dialog.component';
import {
  DASHBOARD_I18N_KEYS,
  DashboardI18nService,
  DashboardLanguage,
} from '../i18n';
import { CardConfig, DashboardConfig, SectionConfig } from '../models';
import { DashboardSection } from '../section/dashboard-section.component';
import { UnsavedChangesDialog } from '../unsaved-changes-dialog/unsaved-changes-dialog.component';
import { SteppedResizeGridStackEngine } from './stepped-resize-engine';
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
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Button } from '@fundamental-ngx/ui5-webcomponents/button';
import { Icon } from '@fundamental-ngx/ui5-webcomponents/icon';
import { Menu } from '@fundamental-ngx/ui5-webcomponents/menu';
import { MenuItem } from '@fundamental-ngx/ui5-webcomponents/menu-item';
import { MenuSeparator } from '@fundamental-ngx/ui5-webcomponents/menu-separator';
import { Title } from '@fundamental-ngx/ui5-webcomponents/title';
import '@ui5/webcomponents-icons/dist/action-settings.js';
import '@ui5/webcomponents-icons/dist/menu2.js';
import '@ui5/webcomponents-icons/dist/user-edit.js';
import { GridStackNode, GridStackOptions } from 'gridstack';
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
      'config().backgroundImageUrl ? "url(" + config().backgroundImageUrl + ")" : null',
    '[style.background-size]':
      'backgroundImageHeight() ? "100% " + backgroundImageHeight() + "px" : "100% auto"',
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
  language = input<DashboardLanguage>('en');

  readonly saved = output<{ sections: SectionConfig[]; cards: CardConfig[] }>();
  readonly actionButtonClick = output<{
    event: MouseEvent;
    action: ButtonSettings;
  }>();
  readonly unsavedChangesChange = output<boolean>();

  editMode = signal(false);
  compactToolbar = signal(false);
  toolbarMenuOpen = signal(false);

  protected dragOriginStyle = signal<{
    top: string;
    left: string;
    width: string;
    height: string;
  } | null>(null);

  /** True once the user has dragged/resized any grid item while in edit mode. */
  private gridDirty = signal(false);

  protected backgroundImageHeight = signal<number | null>(null);

  /** JSON snapshots of sections/cards taken on entering edit mode, used to detect changes. */
  private sectionsSnapshotJson = '';
  private cardsSnapshotJson = '';

  /**
   * True when the user is in edit mode AND has made any change (sections/cards
   * mutated, or grid items moved/resized). Resets when entering edit mode and
   * after save/cancel.
   */
  hasUnsavedChanges = computed(() => {
    if (!this.editMode()) return false;
    if (this.gridDirty()) return true;
    return (
      JSON.stringify(this.sections()) !== this.sectionsSnapshotJson ||
      JSON.stringify(this.cards()) !== this.cardsSnapshotJson
    );
  });

  private sectionsSnapshot: SectionConfig[] = [];
  private cardsSnapshot: CardConfig[] = [];
  private gridStackItems = viewChild.required<GridstackComponent>('grid');
  private addCardBtn = viewChild<Button>('editCardsBtn');
  private resizeObserver?: ResizeObserver;
  private readonly hostEl = inject(ElementRef<HTMLElement>);
  private readonly injector = inject(Injector);
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly i18n = inject(DashboardI18nService);
  protected readonly i18nKeys = DASHBOARD_I18N_KEYS;

  protected safeTitle = computed((): SafeHtml => {
    const clean =
      this.sanitizer.sanitize(SecurityContext.HTML, this.config().title) ?? '';
    return this.sanitizer.bypassSecurityTrustHtml(clean);
  });

  protected safeDescription = computed((): SafeHtml | null => {
    const desc = this.config().description;
    if (!desc) return null;

    const clean = this.sanitizer.sanitize(SecurityContext.HTML, desc) ?? '';
    return this.sanitizer.bypassSecurityTrustHtml(clean);
  });

  protected gridOptions = computed(
    (): GridStackOptions => ({
      cellHeight: CELL_HEIGHT,
      sizeToContent: true,
      disableResize: !this.editMode(),
      disableDrag: !this.editMode(),
      marginBottom: 0,
      marginLeft: 0,
      marginRight: 0,
      engineClass: SteppedResizeGridStackEngine,
      columnOpts: {
        // Source of truth: ../models/breakpoints.ts (paired with
        // ../models/_breakpoints.scss for the section grid's container queries).
        breakpoints: [...DASHBOARD_BREAKPOINTS],
      },
    }),
  );

  cardDialogOpen = signal(false);
  discardDialogOpen = signal(false);
  unsavedNavDialogOpen = signal(false);
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
  customActions = computed(() => this.config().customActions ?? []);
  addedCardsIds = computed(() => new Set(this.cards().map((c) => c.id)));

  editViewButton = computed(() => ({
    icon: 'action-settings',
    design: 'Transparent' as const,
    tooltip: this.i18n.getTranslation(DASHBOARD_I18N_KEYS.EDIT_VIEW),
    text: '',
    ...this.config().buttonsSettings?.editViewButton,
  }));

  editCardsButton = computed(() => ({
    icon: '',
    design: 'Default' as const,
    tooltip: '',
    text: this.i18n.getTranslation(DASHBOARD_I18N_KEYS.EDIT_CARDS),
    ...this.config().buttonsSettings?.editCardsButton,
  }));

  sectionCards = computed(() => {
    const all = this.cards();
    return (sectionId: string) => all.filter((c) => c.sectionId === sectionId);
  });

  cardsPosition = new Map<
    string,
    { x?: number; y?: number; w?: number; h?: number }
  >();
  looseCards = linkedSignal(() => this.cards().filter((c) => !c.sectionId));
  private isXLPage = signal(true);

  constructor() {
    effect(() => {
      this.unsavedChangesChange.emit(this.hasUnsavedChanges());
    });
    effect(() => {
      this.i18n.language.set(this.language());
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
      this.changeCardSettingsForXlPage(width);
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
  }

  removeSection(id: string): void {
    this.sections.update((list) => list.filter((s) => s.id !== id));
    this.cards.update((list) => list.filter((c) => c.sectionId !== id));
  }

  removeCard(id: string): void {
    const wasLooseCard = this.looseCards().some((c) => c.id === id);
    this.cardsPosition.delete(id);
    this.cards.update((list) => list.filter((c) => c.id !== id));

    if (wasLooseCard) {
      afterNextRender(
        () => {
          this.gridStackItems().grid?.compact('compact', false);
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
    this.cards.update((list) => {
      const withoutRemoved = list.filter((c) => !event.removed.includes(c.id));
      return [...withoutRemoved, ...event.added.map((ac) => ({ ...ac }))];
    });
    this.closeCardPanel();
  }

  onDragStart(event: { el: Element }): void {
    const el = event.el as HTMLElement;
    const gridEl = this.gridStackItems().el as HTMLElement;
    const gridRect = gridEl.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();

    this.dragOriginStyle.set({
      top: `${elRect.top - gridRect.top}px`,
      left: `${elRect.left - gridRect.left}px`,
      width: `${elRect.width}px`,
      height: `${elRect.height}px`,
    });
  }

  onDragStop(): void {
    this.dragOriginStyle.set(null);
  }

  onGridChange(): void {
    if (this.editMode()) {
      this.gridDirty.set(true);
    }
  }

  private saveCardsPosition(items: GridStackNode[]): void {
    items.forEach((node) => {
      if (node.id) {
        this.cardsPosition.set(node.id, {
          x: node.x,
          y: node.y,
          w: node.w,
          h: node.h,
        });
      }
    });
  }

  private updateCardsPositions(): void {
    const gridStackNodes = this.gridStackItems()
      .gridstackItems?.toArray()
      .map((node) => node.options);

    if (gridStackNodes) {
      this.saveCardsPosition(gridStackNodes);
    }
  }

  private changeCardSettingsForXlPage(width: number): void {
    if (width >= XL_PAGE) {
      if (!this.isXLPage()) {
        this.isXLPage.set(true);
        this.cards.set(
          this.cards().map((c) => ({
            ...c,
            w: c.w === 4 ? 3 : c.w,
            maxW: c.maxW === 4 ? 3 : c.maxW,
          })),
        );
      }
    } else {
      if (this.isXLPage()) {
        this.isXLPage.set(false);
        this.cards.set(
          this.cards().map((c) => ({
            ...c,
            w: c.w === 3 ? 4 : c.w,
            maxW: c.maxW === 3 ? 4 : c.maxW,
          })),
        );
      }
    }
  }
}
