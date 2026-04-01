import { Component, ViewEncapsulation } from '@angular/core';
import { Icon } from '@fundamental-ngx/ui5-webcomponents/icon';
import { Title } from '@fundamental-ngx/ui5-webcomponents/title';

export type ServiceStatusValue = 'operational' | 'degraded' | 'outage' | 'maintenance';

export interface ServiceStatusItem {
  name: string;
  icon: string;
  status: ServiceStatusValue;
}

@Component({
  selector: 'mfp-service-status-card',
  templateUrl: './service-status-card.component.html',
  styleUrls: ['./service-status-card.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom,
  imports: [Icon, Title],
})
export class ServiceStatusCard {
  readonly services: ServiceStatusItem[] = [
    { name: 'API Gateway', icon: 'connected', status: 'operational' },
    { name: 'Identity Service', icon: 'customer', status: 'operational' },
    { name: 'Database Cluster', icon: 'database', status: 'degraded' },
    { name: 'Message Queue', icon: 'email', status: 'operational' },
    { name: 'Object Storage', icon: 'storage', status: 'maintenance' },
    { name: 'Audit Log', icon: 'log', status: 'outage' },
  ];

  readonly statusConfig: Record<ServiceStatusValue, { label: string; icon: string; colorClass: string }> = {
    operational: { label: 'Operational', icon: 'status-positive', colorClass: 'status--operational' },
    degraded:    { label: 'Degraded',    icon: 'status-critical', colorClass: 'status--degraded' },
    outage:      { label: 'Outage',      icon: 'status-negative', colorClass: 'status--outage' },
    maintenance: { label: 'Maintenance', icon: 'status-inactive', colorClass: 'status--maintenance' },
  };
}
