import { DashboardCardComponent } from '../card/dashboard-card.component';
import { SectionConfig } from '../models';
import { Component, ViewEncapsulation, input } from '@angular/core';

@Component({
  selector: 'mfp-dashboard-section',
  templateUrl: './dashboard-section.component.html',
  styleUrls: ['./dashboard-section.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom,
  imports: [DashboardCardComponent],
  host: {
    '[style.grid-column]': '"span " + (section().colSpan ?? 12)',
    '[style.grid-row]': '"span " + (section().rowSpan ?? 1)',
  },
})
export class DashboardSectionComponent {
  section = input.required<SectionConfig>();
  columns = input<number>(12);
}
