import { CardConfig } from '../models';
import {
  Component,
  ElementRef,
  Renderer2,
  ViewEncapsulation,
  effect,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { Button } from '@fundamental-ngx/ui5-webcomponents/button';

@Component({
  selector: 'mfp-dashboard-card',
  templateUrl: './dashboard-card.component.html',
  styleUrls: ['./dashboard-card.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom,
  imports: [Button],
  host: {
    '[style.grid-column]': '"span " + (card().colSpan ?? 1)',
    '[style.grid-row]': '"span " + (card().rowSpan ?? 1)',
  },
})
export class DashboardCardComponent {
  card = input.required<CardConfig>();
  editMode = input<boolean>(false);
  removeCard = output<void>();

  private componentHost = viewChild<ElementRef>('componentHost');
  private renderer = inject(Renderer2);

  constructor() {
    effect(() => {
      const host = this.componentHost();
      const cfg = this.card();
      if (!host || !cfg.component) return;

      const el = this.renderer.createElement(cfg.component);
      for (const [key, value] of Object.entries(cfg.componentInputs ?? {})) {
        this.renderer.setProperty(el, key, value);
      }
      this.renderer.appendChild(host.nativeElement, el);

      return () => this.renderer.removeChild(host.nativeElement, el);
    });
  }
}
