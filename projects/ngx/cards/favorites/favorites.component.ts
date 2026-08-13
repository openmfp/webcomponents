import { Component, ViewEncapsulation } from '@angular/core';
import { Button } from '@fundamental-ngx/ui5-webcomponents/button';
import { Icon } from '@fundamental-ngx/ui5-webcomponents/icon';
import { Title } from '@fundamental-ngx/ui5-webcomponents/title';

@Component({
  selector: 'mfp-favorites',
  imports: [Button, Icon, Title],
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.scss',
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class Favorites {
  readonly items = [
    { label: 'Create Account', icon: 'add', action: 'create-account' },
    {
      label: 'Start Approval',
      icon: 'workflow-tasks',
      action: 'start-approval',
    },
    {
      label: 'Add User to Account',
      icon: 'person-placeholder',
      action: 'add-user',
    },
  ];
}
