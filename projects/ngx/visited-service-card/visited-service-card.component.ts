import { Component, ViewEncapsulation, input } from '@angular/core';
import { Card } from '@fundamental-ngx/ui5-webcomponents/card';
import { CardHeader } from '@fundamental-ngx/ui5-webcomponents/card-header';
import { Icon } from '@fundamental-ngx/ui5-webcomponents/icon';
import '@ui5/webcomponents-icons/dist/AllIcons.js';
import * as LuigiClient from '@luigi-project/client';

@Component({
  selector: 'mfp-visited-service-card',
  templateUrl: './visited-service-card.component.html',
  styleUrls: ['./visited-service-card.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom,
  imports: [Card, CardHeader, Icon],
})
export class VisitedServiceCard {
  serviceType = input.required<string>();
  serviceName = input.required<string>();
  serviceDescription = input.required<string>();
  serviceIcon = input.required<string>();
  path = input.required<string>();

  navigate(): void {
    LuigiClient.linkManager().navigate(this.path());
  }
}
