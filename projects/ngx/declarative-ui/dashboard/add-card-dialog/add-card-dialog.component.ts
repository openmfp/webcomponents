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
import { CheckBox } from '@fundamental-ngx/ui5-webcomponents/check-box';
import { Dialog } from '@fundamental-ngx/ui5-webcomponents/dialog';
import { Title } from '@fundamental-ngx/ui5-webcomponents/title';

@Component({
  selector: 'mfp-add-card-dialog',
  imports: [Button, CheckBox, Dialog, Title],
  templateUrl: './add-card-dialog.component.html',
  styleUrl: './add-card-dialog.component.scss',
  encapsulation: ViewEncapsulation.ShadowDom
})
export class AddCardDialog {
  availableCards = input<CardConfig[]>([]);
  addedCardsIds = input<Set<string>>(new Set());
  open = input<boolean>(false);

  readonly confirm = output<CardConfig[]>();
  readonly cancelled = output<void>();

  selectedIds = signal<Set<string>>(new Set());

  constructor() {
    effect(() => {
      if (this.open()) {
        this.selectedIds.set(new Set());
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

  confirmAdd(): void {
    const toAdd = this.availableCards().filter(
      (ac) => this.selectedIds().has(ac.id) && !this.addedCardsIds().has(ac.id),
    );
    this.confirm.emit(toAdd);
  }
}
