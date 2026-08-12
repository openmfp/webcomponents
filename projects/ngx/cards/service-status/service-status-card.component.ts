import { Component, ViewEncapsulation } from '@angular/core';
import { Icon } from '@fundamental-ngx/ui5-webcomponents/icon';
import { Title } from '@fundamental-ngx/ui5-webcomponents/title';

/** Possible health states for a service. */
export type ServiceStatusValue =
  'operational' | 'degraded' | 'outage' | 'maintenance';

/** A single service entry displayed in the service-status card. */
export interface ServiceStatusItem {
  /** Display name of the service. */
  name: string;
  /** SAP UI5 icon name used as the service icon. */
  icon: string;
  /** Current health status of the service. */
  status: ServiceStatusValue;
}

@Component({
  selector: 'mfp-service-status-card',
  imports: [Icon, Title],
  templateUrl: './service-status-card.component.html',
  styleUrl: './service-status-card.component.scss',
  encapsulation: ViewEncapsulation.ShadowDom,
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

  readonly statusConfig: Record<
    ServiceStatusValue,
    { label: string; icon: string; colorClass: string }
  > = {
    operational: {
      label: 'Operational',
      icon: 'status-positive',
      colorClass: 'status--operational',
    },
    degraded: {
      label: 'Degraded',
      icon: 'status-critical',
      colorClass: 'status--degraded',
    },
    outage: {
      label: 'Outage',
      icon: 'status-negative',
      colorClass: 'status--outage',
    },
    maintenance: {
      label: 'Maintenance',
      icon: 'status-inactive',
      colorClass: 'status--maintenance',
    },
  };
}
