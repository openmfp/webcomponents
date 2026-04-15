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
  imports: [Button],
  templateUrl: './dashboard-card.component.html',
  styleUrl: './dashboard-card.component.scss',
  encapsulation: ViewEncapsulation.ShadowDom,
  host: {
    '[style.grid-column]': '"span " + (card().w ?? 1)',
    '[style.grid-row]': '"span " + (card().h ?? 1)',
  },
})
export class DashboardCardComponent {
  card = input.required<CardConfig>();
  editMode = input<boolean>(false);
  readonly removeCard = output<void>();

  private componentHost = viewChild<ElementRef>('componentHost');
  private renderer = inject(Renderer2);

  constructor() {
    effect(() => {
      const host = this.componentHost();
      const cfg = this.card();
      if (!host || !cfg.component) return;

      host.nativeElement.innerHTML = '';

      const el = this.renderer.createElement(cfg.component);
      for (const [key, value] of Object.entries(cfg.componentInputs ?? {})) {
        this.renderer.setProperty(el, key, value);
      }
      this.renderer.appendChild(host.nativeElement, el);

      return () => {
        host.nativeElement.innerHTML = '';
      };
    });
  }
}
