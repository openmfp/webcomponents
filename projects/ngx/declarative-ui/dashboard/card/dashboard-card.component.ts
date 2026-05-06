import { CARD_TYPES, CardConfig } from '../models';
import {
  Component,
  ElementRef,
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
import { mountSapCard } from './utils/mount-sap-card';
import { mountAngularCard } from './utils/mount-angular-card';
import { mountWcCard } from './utils/mount-wc-card';

@Component({
  selector: 'mfp-dashboard-card',
  imports: [Button],
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
  protected readonly gridColumn = computed(() => {
    const width = this.card().w ?? 12;
    return this.createGridTrack(this.card().x, width);
  });
  protected readonly gridRow = computed(() => {
    const height = this.card().h ?? 100;
    return this.createGridTrack(this.card().y, height);
  });

  private angularHost = viewChild('angularHost', { read: ViewContainerRef });
  private elementHost = viewChild<ElementRef<HTMLElement>>('elementHost');
  private renderer = inject(Renderer2);

  constructor() {
    effect((onCleanup) => {
      const angularHost = this.angularHost();
      const elementHost = this.elementHost();
      const cfg = this.card();
      if (!angularHost || !elementHost || !cfg.component) return;

      angularHost.clear();
      elementHost.nativeElement.innerHTML = '';

      switch (cfg.type) {
        case CARD_TYPES.SAP_UI:
          mountSapCard(cfg, elementHost.nativeElement, onCleanup);
          break;
        case CARD_TYPES.ANGULAR:
          mountAngularCard(cfg, angularHost, onCleanup);
          break;
        case CARD_TYPES.WC:
        default:
          mountWcCard(cfg, elementHost.nativeElement, onCleanup, this.renderer);
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
