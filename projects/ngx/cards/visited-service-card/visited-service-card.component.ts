import { Component, ViewEncapsulation, input, output } from '@angular/core';
import { Card } from '@fundamental-ngx/ui5-webcomponents/card';
import { CardHeader } from '@fundamental-ngx/ui5-webcomponents/card-header';
import { Icon } from '@fundamental-ngx/ui5-webcomponents/icon';
import '@ui5/webcomponents-icons/dist/AllIcons.js';

@Component({
  selector: 'mfp-visited-service-card',
  imports: [Card, CardHeader, Icon],
  templateUrl: './visited-service-card.component.html',
  styleUrl: './visited-service-card.component.scss',
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class VisitedServiceCard {
  serviceType = input.required<string>();
  serviceName = input.required<string>();
  serviceDescription = input.required<string>();
  serviceIcon = input.required<string>();
  path = input.required<string>();

  readonly cardClick = output<string>();
}
