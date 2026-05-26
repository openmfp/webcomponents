import { CardConfig } from '../models';
import {
  Component,
  ViewEncapsulation,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { Button } from '@fundamental-ngx/ui5-webcomponents/button';
import { Dialog } from '@fundamental-ngx/ui5-webcomponents/dialog';
import { List } from '@fundamental-ngx/ui5-webcomponents/list';
import { ListItemCustom } from '@fundamental-ngx/ui5-webcomponents/list-item-custom';
import { Switch } from '@fundamental-ngx/ui5-webcomponents/switch';
import { Title } from '@fundamental-ngx/ui5-webcomponents/title';

@Component({
  selector: 'mfp-edit-cards-dialog',
  imports: [Button, Dialog, List, ListItemCustom, Switch, Title],
  templateUrl: './edit-cards-dialog.component.html',
  styleUrl: './edit-cards-dialog.component.scss',
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class EditCardsDialog {
  availableCards = input<CardConfig[]>([]);
  addedCardsIds = input<Set<string>>(new Set());
  open = input<boolean>(false);

  readonly confirm = output<{ added: CardConfig[]; removed: string[] }>();
  readonly cancelled = output<void>();

  selectedIds = signal<Set<string>>(new Set());

  constructor() {
    effect(() => {
      if (this.open()) {
        const initial = new Set(
          this.availableCards()
            .filter((ac) => this.addedCardsIds().has(ac.id))
            .map((ac) => ac.id),
        );
        this.selectedIds.set(initial);
      }
    });
  }

  toggle(id: string): void {
    this.selectedIds.update((set) => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  confirmSave(): void {
    const availableIds = new Set(this.availableCards().map((ac) => ac.id));
    const added = this.availableCards().filter(
      (ac) => this.selectedIds().has(ac.id) && !this.addedCardsIds().has(ac.id),
    );
    const removed = [...this.addedCardsIds()].filter(
      (id) => availableIds.has(id) && !this.selectedIds().has(id),
    );
    this.confirm.emit({ added, removed });
  }
}
