import { Component, ViewEncapsulation } from '@angular/core';
import { Button } from '@fundamental-ngx/ui5-webcomponents/button';
import { Icon } from '@fundamental-ngx/ui5-webcomponents/icon';
import { Title } from '@fundamental-ngx/ui5-webcomponents/title';

@Component({
  selector: 'mfp-favorites',
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom,
  imports: [Button, Icon, Title],
})
export class Favorites {
  readonly items = [
    { label: 'Create Account', icon: 'add', action: 'create-account' },
    { label: 'Start Approval', icon: 'workflow-tasks', action: 'start-approval' },
    { label: 'Add User to Account', icon: 'person-placeholder', action: 'add-user' },
  ];
}
