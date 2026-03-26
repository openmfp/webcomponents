import { DashboardConfig, SectionConfig } from '../models';
import { DashboardSectionComponent } from '../section/dashboard-section.component';
import {
  Component,
  ViewEncapsulation,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { Button } from '@fundamental-ngx/ui5-webcomponents/button';
import { Input } from '@fundamental-ngx/ui5-webcomponents/input';
import { Label } from '@fundamental-ngx/ui5-webcomponents/label';
import { Popover } from '@fundamental-ngx/ui5-webcomponents/popover';
import { Text } from '@fundamental-ngx/ui5-webcomponents/text';
import { Title } from '@fundamental-ngx/ui5-webcomponents/title';

document.body.classList.add('ui5-content-density-compact');

@Component({
  selector: 'mfp-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom,
  imports: [DashboardSectionComponent, Button, Input, Label, Popover, Title, Text],
})
export class DashboardComponent {
  config = input.required<DashboardConfig>();

  sectionAdded = output<SectionConfig>();

  sections = signal<SectionConfig[]>([]);
  panelOpen = signal(false);
  formTitle = '';
  formCols = 12;
  formRows = 1;

  constructor() {
    effect(() => {
      this.sections.set(this.config().sections);
    });
  }

  openPanel(): void {
    this.formTitle = '';
    this.formCols = this.config().columns ?? 12;
    this.formRows = 1;
    this.panelOpen.set(true);
  }

  closePanel(): void {
    this.panelOpen.set(false);
  }

  confirmAdd(): void {
    const section: SectionConfig = {
      id: `section-${Date.now()}`,
      title: this.formTitle || undefined,
      colSpan: this.formCols,
      rowSpan: this.formRows,
      cards: [],
    };
    this.sections.update((s) => [...s, section]);
    this.sectionAdded.emit(section);
    this.closePanel();
  }

  removeSection(id: string): void {
    this.sections.update((list) => list.filter((s) => s.id !== id));
  }
}
