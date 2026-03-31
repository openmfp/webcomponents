import { DashboardCardComponent } from '../card/dashboard-card.component';
import { CardConfig, DashboardConfig, SectionConfig } from '../models';
import { DashboardSectionComponent } from '../section/dashboard-section.component';
import {
  Component,
  ViewEncapsulation,
  computed,
  input,
  model,
  signal,
} from '@angular/core';
import { Button } from '@fundamental-ngx/ui5-webcomponents/button';
import { Input } from '@fundamental-ngx/ui5-webcomponents/input';
import { Label } from '@fundamental-ngx/ui5-webcomponents/label';
import { Option } from '@fundamental-ngx/ui5-webcomponents/option';
import { Popover } from '@fundamental-ngx/ui5-webcomponents/popover';
import { Select } from '@fundamental-ngx/ui5-webcomponents/select';
import { Text } from '@fundamental-ngx/ui5-webcomponents/text';
import { Title } from '@fundamental-ngx/ui5-webcomponents/title';

document.body.classList.add('ui5-content-density-compact');

@Component({
  selector: 'mfp-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom,
  imports: [
    DashboardSectionComponent,
    DashboardCardComponent,
    Button,
    Input,
    Label,
    Option,
    Popover,
    Select,
    Title,
    Text,
  ],
})
export class Dashboard {
  config = input.required<DashboardConfig>();
  sections = model<SectionConfig[]>([]);
  cards = model<CardConfig[]>([]);

  editMode = signal(false);

  private sectionsSnapshot: SectionConfig[] = [];
  private cardsSnapshot: CardConfig[] = [];

  sectionPanelOpen = signal(false);
  formTitle = '';
  formCols = 12;
  formRows = 1;

  cardPanelOpen = signal(false);
  cardFormCols = 3;
  cardFormRows = 1;
  cardFormSectionId = signal('');

  sectionCards = computed(() => {
    const all = this.cards();
    return (sectionId: string) => all.filter((c) => c.sectionId === sectionId);
  });

  looseCards = computed(() => this.cards().filter((c) => !c.sectionId));

  enterEditMode(): void {
    this.sectionsSnapshot = structuredClone(this.sections());
    this.cardsSnapshot = this.cards().map((c) => ({
      ...c,
      componentInputs: c.componentInputs ? { ...c.componentInputs } : undefined,
    }));
    this.editMode.set(true);
  }

  saveEdit(): void {
    this.editMode.set(false);
  }

  cancelEdit(): void {
    this.sections.set(this.sectionsSnapshot);
    this.cards.set(this.cardsSnapshot);
    this.sectionPanelOpen.set(false);
    this.cardPanelOpen.set(false);
    this.editMode.set(false);
  }

  openPanel(): void {
    this.formTitle = '';
    this.formCols = 12;
    this.formRows = 1;
    this.sectionPanelOpen.set(true);
  }

  closePanel(): void {
    this.sectionPanelOpen.set(false);
  }

  confirmAdd(): void {
    this.sections.update((s) => [
      ...s,
      {
        id: `section-${Date.now()}`,
        title: this.formTitle || undefined,
        colSpan: this.formCols,
        rowSpan: this.formRows,
      },
    ]);
    this.closePanel();
  }

  removeSection(id: string): void {
    this.sections.update((list) => list.filter((s) => s.id !== id));
    this.cards.update((list) => list.filter((c) => c.sectionId !== id));
  }

  removeCard(id: string): void {
    this.cards.update((list) => list.filter((c) => c.id !== id));
  }

  openCardPanel(): void {
    this.cardFormCols = 3;
    this.cardFormRows = 1;
    this.cardFormSectionId.set('');
    this.cardPanelOpen.set(true);
  }

  closeCardPanel(): void {
    this.cardPanelOpen.set(false);
    this.cardFormSectionId.set('');
  }

  confirmAddCard(): void {
    this.cards.update((list) => [
      ...list,
      {
        id: `card-${Date.now()}`,
        colSpan: this.cardFormCols,
        rowSpan: this.cardFormRows,
        sectionId: this.cardFormSectionId() || undefined,
      },
    ]);
    this.closeCardPanel();
  }
}

