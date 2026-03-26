import { CardConfig } from '../models';
import { Component, ViewEncapsulation, input, output } from '@angular/core';
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
  removeCard = output<void>();
}
