import { DashboardCard } from '../card/dashboard-card.component';
import { CardConfig, SectionConfig } from '../models';
import { Component, ViewEncapsulation, input, output } from '@angular/core';
import { Button } from '@fundamental-ngx/ui5-webcomponents/button';

@Component({
  selector: 'mfp-dashboard-section',
  imports: [DashboardCard, Button],
  templateUrl: './dashboard-section.component.html',
  styleUrl: './dashboard-section.component.scss',
  encapsulation: ViewEncapsulation.Emulated,
  host: {
    '[style.grid-column]': '"span " + (section().w ?? 12)',
  },
})
export class DashboardSection {
  section = input.required<SectionConfig>();
  cards = input<CardConfig[]>([]);
  columns = input<number>(12);
  editMode = input<boolean>(false);
  readonly removeSection = output<void>();
  readonly removeCard = output<string>();
}
