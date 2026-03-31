import { AddCardDialog } from '../add-card-dialog/add-card-dialog.component';
import { DashboardCardComponent } from '../card/dashboard-card.component';
import { CardConfig, DashboardConfig, SectionConfig } from '../models';
import { DashboardSectionComponent } from '../section/dashboard-section.component';
import {
  Component,
  ViewEncapsulation,
  computed,
  input,
  model,
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
  imports: [
    AddCardDialog,
    DashboardSectionComponent,
    DashboardCardComponent,
    Button,
    Input,
    Label,
    Popover,
    Title,
    Text,
  ],
  host: {
    '[style.background-image]':
      'config().backgroundImageUrl ? "url(" + config().backgroundImageUrl + ")" : null',
  },
})
export class Dashboard {
  config = input.required<DashboardConfig>();
  sections = model<SectionConfig[]>([]);
  cards = model<CardConfig[]>([]);
  availableCards = input<CardConfig[]>([]);

  saved = output<{ sections: SectionConfig[]; cards: CardConfig[] }>();

  editMode = signal(false);

  private sectionsSnapshot: SectionConfig[] = [];
  private cardsSnapshot: CardConfig[] = [];

  sectionPanelOpen = signal(false);
  formTitle = '';
  formCols = 12;
  formRows = 1;

  cardDialogOpen = signal(false);

  addedComponents = computed(
    () =>
      new Set(
        this.cards()
          .map((c) => c.component)
          .filter(Boolean) as string[],
      ),
  );

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
    this.saved.emit({ sections: this.sections(), cards: this.cards() });
    this.editMode.set(false);
  }

  cancelEdit(): void {
    this.sections.set(this.sectionsSnapshot);
    this.cards.set(this.cardsSnapshot);
    this.sectionPanelOpen.set(false);
    this.cardDialogOpen.set(false);
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
    this.cardDialogOpen.set(true);
  }

  closeCardPanel(): void {
    this.cardDialogOpen.set(false);
  }

  onCardsAdded(cards: CardConfig[]): void {
    if (cards.length > 0) {
      this.cards.update((list) => [
        ...list,
        ...cards.map((ac) => ({
          ...ac,
          id: `card-${ac.component}-${Date.now()}`,
          sectionId: undefined,
        })),
      ]);
    }
    this.closeCardPanel();
  }
}
