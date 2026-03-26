import { DashboardCardComponent } from '../card/dashboard-card.component';
import { SectionConfig } from '../models';
import { Component, ViewEncapsulation, input, output } from '@angular/core';
import { Button } from '@fundamental-ngx/ui5-webcomponents/button';

@Component({
  selector: 'mfp-dashboard-section',
  templateUrl: './dashboard-section.component.html',
  styleUrls: ['./dashboard-section.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom,
  imports: [DashboardCardComponent, Button],
  host: {
    '[style.grid-column]': '"span " + (section().colSpan ?? 12)',
    '[style.grid-row]': '"span " + (section().rowSpan ?? 1)',
  },
})
export class DashboardSectionComponent {
  section = input.required<SectionConfig>();
  columns = input<number>(12);
  removeSection = output<void>();
  removeCard = output<string>();
}
