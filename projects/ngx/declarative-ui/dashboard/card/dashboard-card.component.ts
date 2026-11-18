import { CardTemplate } from '../../../cards/card-template/card-template.component';
import type {
  ActionsHook,
  AfterCardRequest,
  AfterRequest,
  BeforeCardRequest,
  BeforeRequest,
} from '../../../services/data-fetch.model';
import { DASHBOARD_CARD_DRAG_ORIGIN_CLASS } from '../constants';
import { DASHBOARD_I18N_KEYS, DashboardI18nService } from '../i18n';
import {
  CARD_TYPES,
  CardConfig,
  DashboardCardContent,
  type MountCfg,
} from '../models';
import {
  getRegisteredDashboardCardComponent,
  mountAngularCard,
  mountSapCard,
  mountWcCard,
} from './utils';
import {
  Component,
  type EffectCleanupRegisterFn,
  ElementRef,
  ErrorHandler,
  Renderer2,
  ViewContainerRef,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  isDevMode,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { Button } from '@fundamental-ngx/ui5-webcomponents/button';
import { Icon } from '@fundamental-ngx/ui5-webcomponents/icon';
import '@ui5/webcomponents-icons/dist/resize-corner.js';

@Component({
  selector: 'mfp-dashboard-card',
  imports: [Button, CardTemplate, Icon],
  templateUrl: './dashboard-card.component.html',
  styleUrl: './dashboard-card.component.scss',
  encapsulation: ViewEncapsulation.Emulated,
  host: {
    '[class.dashboard-card--auto-height]': 'autoHeight()',
    '[style.grid-column]': 'gridColumn()',
    '[style.grid-row]': 'gridRow()',
  },
})
export class DashboardCard {
  card = input.required<CardConfig>();
  beforeCardRequest = input<BeforeCardRequest>();
  afterCardRequest = input<AfterCardRequest>();
  editMode = input<boolean>(false);
  readonly removeCard = output<void>();
  readonly cardAction = output<string>();
  protected readonly i18n = inject(DashboardI18nService);
  protected readonly i18nKeys = DASHBOARD_I18N_KEYS;
  protected readonly componentHostClasses = `component-host ${DASHBOARD_CARD_DRAG_ORIGIN_CLASS}`;
  protected readonly cardBodyClasses = `card__body ${DASHBOARD_CARD_DRAG_ORIGIN_CLASS}`;
  protected readonly gridColumn = computed(() => {
    const width = this.card().w ?? 12;
    return this.createGridTrack(this.card().x, width);
  });
  protected readonly autoHeight = computed(() => this.card().h === 'auto');
  protected readonly gridRow = computed(() => {
    const h = this.card().h;
    const height = h === 'auto' ? this.autoRowSpan() : (h ?? 100);
    return this.createGridTrack(this.card().y, height);
  });
  protected readonly searchQuery = signal('');
  protected readonly templateSearch = computed(() => {
    const search = this.card().componentTemplate?.search;
    return search && typeof this.mountedContent()?.onCardSearch === 'function'
      ? search
      : undefined;
  });

  private readonly mountedContent = signal<DashboardCardContent | undefined>(
    undefined,
  );
  private readonly autoRowSpan = signal(1);
  private readonly frame = viewChild<ElementRef<HTMLElement>>('frame');
  private readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef);
  private searchedContent: DashboardCardContent | undefined;
  private host = viewChild('elementHost', { read: ViewContainerRef });
  private renderer = inject(Renderer2);
  private errorHandler = inject(ErrorHandler);

  private readonly mountCfg = computed(
    () => {
      const c = this.card();
      return {
        type: c.type,
        component: c.component,
        componentInputs: c.componentInputs,
        autoHeight: c.h === 'auto',
      };
    },
    {
      equal: (a, b) =>
        a.type === b.type &&
        a.component === b.component &&
        a.autoHeight === b.autoHeight &&
        JSON.stringify(a.componentInputs) === JSON.stringify(b.componentInputs),
    },
  );

  constructor() {
    effect((onCleanup) => {
      const host = this.host();
      const mountCfg = this.mountCfg();
      if (!host || !mountCfg.component) return;

      host.clear();
      host.element.nativeElement.innerHTML = '';
      this.mountedContent.set(undefined);
      const onMounted = (content: DashboardCardContent) => {
        untracked(() => {
          this.onContentMounted(content);
        });
      };

      if (mountCfg.type === CARD_TYPES.SAP_UI) {
        mountSapCard(mountCfg, host, onCleanup, onMounted);
        return;
      }

      let isActive = true;
      const isCurrentMount = () =>
        isActive && this.mountCfg() === mountCfg && this.host() === host;
      const registerMountCleanup: EffectCleanupRegisterFn = (cleanup) => {
        onCleanup(() => {
          isActive = false;
          cleanup();
        });
      };
      const beforeRequest = this.createBeforeRequestAdapter(
        mountCfg,
        isCurrentMount,
      );
      const afterRequest = this.createAfterRequestAdapter(
        mountCfg,
        isCurrentMount,
      );
      const actionsHook = this.createActionsHookAdapter(
        mountCfg,
        isCurrentMount,
      );

      if (mountCfg.type === CARD_TYPES.ANGULAR) {
        mountAngularCard(
          mountCfg,
          host,
          registerMountCleanup,
          onMounted,
          beforeRequest,
          afterRequest,
          actionsHook,
        );
      } else {
        mountWcCard(
          mountCfg,
          host,
          registerMountCleanup,
          this.renderer,
          onMounted,
          beforeRequest,
          afterRequest,
          actionsHook,
        );
      }
    });

    effect((onCleanup) => {
      const frame = this.frame()?.nativeElement;
      if (!this.autoHeight() || !frame) return;

      const observer = new ResizeObserver(() => {
        this.autoRowSpan.set(this.measureRowSpan(frame));
      });
      observer.observe(frame);
      onCleanup(() => {
        observer.disconnect();
      });
    });

    effect(() => {
      const content = this.mountedContent();
      const query = this.searchQuery();
      if (!content?.onCardSearch) return;
      const isSameContent = content === this.searchedContent;
      this.searchedContent = content;
      if (isSameContent || query) {
        untracked(() => {
          content.onCardSearch?.(query);
        });
      }
    });
  }

  protected onTemplateAction(key: string): void {
    try {
      this.mountedContent()?.onCardAction?.(key);
    } catch (error) {
      this.errorHandler.handleError(error);
    }
    this.cardAction.emit(key);
  }

  private createActionsHookAdapter(
    mountCfg: MountCfg,
    isCurrentMount: () => boolean,
  ): ActionsHook {
    return (key) =>
      untracked(() => {
        if (!isCurrentMount()) return undefined;

        const localHook = this.readLocalHook(mountCfg, 'actionsHook');
        return typeof localHook === 'function'
          ? (localHook as ActionsHook)(key)
          : undefined;
      });
  }

  private createBeforeRequestAdapter(
    mountCfg: MountCfg,
    isCurrentMount: () => boolean,
  ): BeforeRequest {
    const cardId = untracked(() => this.card().id);
    return (request) =>
      untracked(() => {
        if (!isCurrentMount()) return undefined;

        const localHook = this.readLocalHook(mountCfg, 'beforeRequest');
        return typeof localHook === 'function'
          ? (localHook as BeforeRequest)(request)
          : this.beforeCardRequest()?.(request, cardId);
      });
  }

  private createAfterRequestAdapter(
    mountCfg: MountCfg,
    isCurrentMount: () => boolean,
  ): AfterRequest {
    const cardId = untracked(() => this.card().id);
    return (response) =>
      untracked(() => {
        if (!isCurrentMount()) return undefined;

        const localHook = this.readLocalHook(mountCfg, 'afterRequest');
        return typeof localHook === 'function'
          ? (localHook as AfterRequest)(response)
          : this.afterCardRequest()?.(response, cardId);
      });
  }

  private readLocalHook(
    mountCfg: MountCfg,
    name: 'beforeRequest' | 'afterRequest' | 'actionsHook',
  ): unknown {
    const componentInputs = this.card().componentInputs;
    if (!componentInputs) return undefined;
    if (mountCfg.type !== CARD_TYPES.ANGULAR) return componentInputs[name];

    const inputNames = getRegisteredDashboardCardComponent(
      mountCfg.component,
    )?.inputs;
    if (!inputNames) return undefined;

    const templateName = inputNames.get(name);
    if (!templateName) return undefined;

    let value: unknown;
    for (const [key, candidate] of Object.entries(componentInputs)) {
      if (inputNames.get(key) === templateName) value = candidate;
    }
    return value;
  }

  private onContentMounted(content: DashboardCardContent): void {
    this.mountedContent.set(content);
    const card = this.card();
    if (
      isDevMode() &&
      card.componentTemplate?.search &&
      typeof content.onCardSearch !== 'function'
    ) {
      console.warn(
        `[DashboardCard] Card "${card.id}" declares componentTemplate.search, but "${card.component}" has no onCardSearch(query) method. The search field is hidden.`,
      );
    }
  }

  private measureRowSpan(frame: HTMLElement): number {
    const grid = this.hostElement.nativeElement.parentElement;
    if (!grid) return 1;

    const gridStyle = getComputedStyle(grid);
    const rowHeight = parseFloat(gridStyle.gridAutoRows);
    if (!(rowHeight > 0)) return 1;

    const rowGap = parseFloat(gridStyle.rowGap) || 0;
    return Math.max(
      1,
      Math.ceil((frame.offsetHeight + rowGap) / (rowHeight + rowGap)),
    );
  }

  private createGridTrack(start: number | undefined, span: number): string {
    if (start === undefined) {
      return `span ${span}`;
    }

    return `${start + 1} / span ${span}`;
  }
}
