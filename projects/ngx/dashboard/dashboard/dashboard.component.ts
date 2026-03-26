import { DashboardConfig } from '../models';
import { DashboardSectionComponent } from '../section/dashboard-section.component';
import { Component, ViewEncapsulation, input } from '@angular/core';

@Component({
  selector: 'mfp-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom,
  imports: [DashboardSectionComponent],
})
export class DashboardComponent {
  config = input.required<DashboardConfig>();
}
