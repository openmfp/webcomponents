import { CardTemplate } from '../../../cards/card-template/card-template.component';
import type {
  AfterCardRequest,
  AfterRequestHook,
  BeforeCardRequest,
  BeforeRequest,
} from '../../../services/data-fetch.model';
import { DASHBOARD_CARD_DRAG_ORIGIN_CLASS } from '../constants';
import { DASHBOARD_I18N_KEYS, DashboardI18nService } from '../i18n';
import { CARD_TYPES, CardConfig, DashboardCardContent } from '../models';
import { mountAngularCard, mountSapCard, mountWcCard } from './utils';
import {
  Component,
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
  protected readonly gridRow = computed(() => {
    const height = this.card().h ?? 100;
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
  private searchedContent: DashboardCardContent | undefined;
  private host = viewChild('elementHost', { read: ViewContainerRef });
  private renderer = inject(Renderer2);

  private readonly mountCfg = computed(
    () => {
      const c = this.card();
      return {
        type: c.type,
        component: c.component,
        componentInputs: c.componentInputs,
      };
    },
    {
      equal: (a, b) =>
        a.type === b.type &&
        a.component === b.component &&
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

      switch (mountCfg.type) {
        case CARD_TYPES.SAP_UI:
          mountSapCard(mountCfg, host, onCleanup, onMounted);
          break;
        case CARD_TYPES.ANGULAR:
          mountAngularCard(
            mountCfg,
            host,
            onCleanup,
            onMounted,
            this.createBeforeRequestAdapter(),
            this.createAfterRequestAdapter(),
          );
          break;
        case CARD_TYPES.WC:
        default:
          mountWcCard(
            mountCfg,
            host,
            onCleanup,
            this.renderer,
            onMounted,
            this.createBeforeRequestAdapter(),
            this.createAfterRequestAdapter(),
          );
          break;
      }
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
    this.mountedContent()?.onCardAction?.(key);
    this.cardAction.emit(key);
  }

  private createBeforeRequestAdapter(): BeforeRequest {
    const cardId = untracked(() => this.card().id);
    return (request) =>
      untracked(() => this.beforeCardRequest()?.(request, cardId));
  }

  private createAfterRequestAdapter(): AfterRequestHook {
    const cardId = untracked(() => this.card().id);
    return (response) =>
      untracked(() => this.afterCardRequest()?.(response, cardId));
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

  private createGridTrack(start: number | undefined, span: number): string {
    if (start === undefined) {
      return `span ${span}`;
    }

    return `${start + 1} / span ${span}`;
  }
}
