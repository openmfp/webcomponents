import { DashboardCard } from '../card/dashboard-card.component';
import { CardConfig, SectionConfig } from '../models';
import { Component, ViewEncapsulation, inject, input, output } from '@angular/core';
import { Button } from '@fundamental-ngx/ui5-webcomponents/button';
import { DASHBOARD_I18N_KEYS, DashboardI18nService } from '../i18n';

@Component({
  selector: 'mfp-dashboard-section',
  imports: [DashboardCard, Button],
  templateUrl: './dashboard-section.component.html',
  styleUrl: './dashboard-section.component.scss',
  encapsulation: ViewEncapsulation.Emulated,
  host: {
    // Section width interpretation:
    //   - `section.w` undefined OR equal to the active outer grid's column
    //     count (12) → span the full outer row (`1 / -1`). This is what the
    //     consumer means by "full-width section": fill whatever the dashboard
    //     is showing right now (4 / 8 / 12 / 14 columns at sm/md/lg/xl).
    //   - any other explicit `w` → span exactly that many outer columns.
    //
    // Without `1 / -1`, a `w: 12` section in an xl grid (14 cols) would only
    // cover 12 of 14 columns, leaving a dead 2-col gutter on the right and
    // squeezing the cards inside it relative to the outer grid's units.
    '[style.grid-column]':
      'section().w === undefined || section().w === 12 ? "1 / -1" : "span " + section().w',
  },
})
export class DashboardSection {
  section = input.required<SectionConfig>();
  cards = input<CardConfig[]>([]);
  /**
   * Optional override for the section's inner grid column count. Leave unset
   * (the default) to inherit the responsive defaults from CSS — the section
   * grid then mirrors the dashboard breakpoints (4/8/12/14 columns) via the
   * `mfp-dashboard` container query in dashboard-section.component.scss.
   * Pass an explicit number only when a section needs a fixed column count
   * regardless of width.
   */
  columns = input<number | undefined>(undefined);
  editMode = input<boolean>(false);
  protected readonly i18n = inject(DashboardI18nService);
  protected readonly i18nKeys = DASHBOARD_I18N_KEYS;
  readonly removeSection = output<void>();
  readonly removeCard = output<string>();
}
