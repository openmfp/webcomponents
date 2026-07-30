import { Component, ViewEncapsulation, input } from '@angular/core';
import { Button } from '@fundamental-ngx/ui5-webcomponents/button';
import { Title } from '@fundamental-ngx/ui5-webcomponents/title';
import '@ui5/webcomponents-icons/dist/overflow.js';

@Component({
  selector: 'mfp-mock-card',
  imports: [Button, Title],
  templateUrl: './mock-card.component.html',
  styleUrl: './mock-card.component.scss',
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class MockCard {
  readonly title = input<string>('Card Name');
}
