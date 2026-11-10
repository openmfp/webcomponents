import {
  CardTemplateAction,
  CardTemplateBackground,
  CardTemplateBadge,
  CardTemplateMessageStrip,
  CardTemplateSearch,
} from './card-template.model';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  input,
  linkedSignal,
  model,
  output,
  signal,
} from '@angular/core';
import { Button } from '@fundamental-ngx/ui5-webcomponents/button';
import { Icon } from '@fundamental-ngx/ui5-webcomponents/icon';
import { Input } from '@fundamental-ngx/ui5-webcomponents/input';
import { Menu } from '@fundamental-ngx/ui5-webcomponents/menu';
import { MenuItem } from '@fundamental-ngx/ui5-webcomponents/menu-item';
import { MessageStrip } from '@fundamental-ngx/ui5-webcomponents/message-strip';
import { Tag } from '@fundamental-ngx/ui5-webcomponents/tag';
import { Title } from '@fundamental-ngx/ui5-webcomponents/title';
import type { UI5CustomEvent } from '@ui5/webcomponents-base';
import '@ui5/webcomponents-icons/dist/overflow.js';
import '@ui5/webcomponents-icons/dist/search.js';
import '@ui5/webcomponents-icons/dist/status-critical.js';
import type { default as Ui5Menu } from '@ui5/webcomponents/dist/Menu.js';

@Component({
  selector: 'mfp-card-template',
  imports: [Button, Icon, Input, Menu, MenuItem, MessageStrip, Tag, Title],
  templateUrl: './card-template.component.html',
  styleUrl: './card-template.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.Emulated,
})
export class CardTemplate {
  readonly name = input.required<string>();
  readonly subtitle = input<string>();
  readonly criticalStatus = input<string>();
  readonly header = input(true, { transform: booleanAttribute });
  readonly background = input<CardTemplateBackground>('solid');
  readonly badge = input<CardTemplateBadge>();
  readonly search = input<CardTemplateSearch>();
  readonly actions = input<CardTemplateAction[]>([]);
  readonly actionsLabel = input('More actions');
  readonly messageStrip = input<CardTemplateMessageStrip>();
  readonly searchValue = model('');

  readonly actionPress = output<string>();

  protected readonly actionsMenuOpen = signal(false);
  protected readonly messageStripClosed = linkedSignal({
    source: this.messageStrip,
    computation: () => false,
  });

  protected onActionClick(event: UI5CustomEvent<Ui5Menu, 'item-click'>): void {
    const key = event.detail.item.dataset['key'];
    if (key !== undefined) {
      this.actionPress.emit(key);
    }
  }
}
