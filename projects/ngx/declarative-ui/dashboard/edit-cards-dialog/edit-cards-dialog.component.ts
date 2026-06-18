import { CardConfig } from '../models';
import { DASHBOARD_I18N_KEYS, DashboardI18nService } from '../i18n';
import {
  Component,
  ElementRef,
  ViewEncapsulation,
  effect,
  inject,
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
  private readonly host = inject(ElementRef<HTMLElement>);
  protected readonly i18n = inject(DashboardI18nService);
  protected readonly i18nKeys = DASHBOARD_I18N_KEYS;

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

  /**
   * Tab moves focus across the switches directly, skipping the wrapping
   * ui5-li-custom rows. Past the last switch Tab goes to the first footer
   * button; before the first switch Shift+Tab goes to the last footer button.
   * The dialog's native focus trap takes care of cycling from the buttons
   * back into the list.
   */
  onSwitchKeydown(event: KeyboardEvent, _id: string): void {
    if (event.key !== 'Tab') {
      return;
    }
    const root: ParentNode =
      this.host.nativeElement.shadowRoot ?? this.host.nativeElement;
    const switches = Array.from(
      root.querySelectorAll('ui5-switch'),
    ) as HTMLElement[];
    const buttons = Array.from(
      root.querySelectorAll('ui5-button'),
    ) as HTMLElement[];
    const currentIndex = switches.indexOf(event.currentTarget as HTMLElement);
    if (currentIndex === -1) {
      return;
    }
    if (event.shiftKey) {
      const prev = switches[currentIndex - 1];
      if (prev) {
        event.preventDefault();
        event.stopPropagation();
        prev.focus();
      }
      // First switch: let Shift+Tab fall through so the dialog's focus trap
      // wraps to the last footer button.
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const next = switches[currentIndex + 1];
    if (next) {
      next.focus();
      return;
    }
    // Last switch: hand off to the first footer button.
    buttons[0]?.focus();
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
