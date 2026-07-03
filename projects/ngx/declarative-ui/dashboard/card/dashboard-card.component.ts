import { DASHBOARD_I18N_KEYS, DashboardI18nService } from '../i18n';
import { CARD_TYPES, CardConfig } from '../models';
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
  output,
  viewChild,
} from '@angular/core';
import { Button } from '@fundamental-ngx/ui5-webcomponents/button';
import { Icon } from '@fundamental-ngx/ui5-webcomponents/icon';
import '@ui5/webcomponents-icons/dist/resize-corner.js';

@Component({
  selector: 'mfp-dashboard-card',
  imports: [Button, Icon],
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
  editMode = input<boolean>(false);
  readonly removeCard = output<void>();
  protected readonly i18n = inject(DashboardI18nService);
  protected readonly i18nKeys = DASHBOARD_I18N_KEYS;
  protected readonly gridColumn = computed(() => {
    const width = this.card().w ?? 12;
    return this.createGridTrack(this.card().x, width);
  });
  protected readonly gridRow = computed(() => {
    const height = this.card().h ?? 100;
    return this.createGridTrack(this.card().y, height);
  });

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

      switch (mountCfg.type) {
        case CARD_TYPES.SAP_UI:
          mountSapCard(mountCfg, host, onCleanup);
          break;
        case CARD_TYPES.ANGULAR:
          mountAngularCard(mountCfg, host, onCleanup);
          break;
        case CARD_TYPES.WC:
        default:
          mountWcCard(mountCfg, host, onCleanup, this.renderer);
          break;
      }
    });
  }

  private createGridTrack(start: number | undefined, span: number): string {
    if (start === undefined) {
      return `span ${span}`;
    }

    return `${start + 1} / span ${span}`;
  }
}
