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
  templateUrl: './add-card-dialog.component.html',
  styleUrls: ['./add-card-dialog.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom,
  imports: [Button, CheckBox, Dialog, Title],
})
export class AddCardDialog {
  availableCards = input<CardConfig[]>([]);
  addedComponents = input<Set<string>>(new Set());
  open = input<boolean>(false);

  confirm = output<CardConfig[]>();
  cancel = output<void>();

  selectedComponents = signal<Set<string>>(new Set());

  constructor() {
    effect(() => {
      if (this.open()) {
        this.selectedComponents.set(new Set());
      }
    });
  }

  toggle(component: string): void {
    this.selectedComponents.update((set) => {
      const next = new Set(set);
      if (next.has(component)) {
        next.delete(component);
      } else {
        next.add(component);
      }
      return next;
    });
  }

  confirmAdd(): void {
    const toAdd = this.availableCards().filter(
      (ac) =>
        this.selectedComponents().has(ac.component) &&
        !this.addedComponents().has(ac.component),
    );
    this.confirm.emit(toAdd);
  }
}
