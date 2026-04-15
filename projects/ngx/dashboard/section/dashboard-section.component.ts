import { DashboardCardComponent } from '../card/dashboard-card.component';
import { CardConfig, SectionConfig } from '../models';
import { Component, ViewEncapsulation, input, output } from '@angular/core';
import { Button } from '@fundamental-ngx/ui5-webcomponents/button';

@Component({
  selector: 'mfp-dashboard-section',
  imports: [DashboardCardComponent, Button],
  templateUrl: './dashboard-section.component.html',
  styleUrl: './dashboard-section.component.scss',
  encapsulation: ViewEncapsulation.ShadowDom,
  host: {
    '[style.grid-column]': '"span " + (section().w ?? 12)',
    '[style.grid-row]': '"span " + (section().h ?? 1)',
  },
})
export class DashboardSectionComponent {
  section = input.required<SectionConfig>();
  cards = input<CardConfig[]>([]);
  columns = input<number>(12);
  editMode = input<boolean>(false);
  readonly removeSection = output<void>();
  readonly removeCard = output<string>();
}
