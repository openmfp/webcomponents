import { Favorites } from '../../cards/favorites/favorites.component';
import { ServiceStatusCard } from '../../cards/service-status/service-status-card.component';
import { VisitedServiceCard } from '../../cards/visited-service-card/visited-service-card.component';
import { WhatsNew } from '../../cards/whats-new/whats-new.component';
import { Dashboard } from '../dashboard/dashboard/dashboard.component';
import type { CardConfig, SectionConfig } from '../dashboard/models';
import { TABLE_CARD_CONFIG, TABLE_RESOURCES } from './pods-table.config';

Dashboard.registerAngularComponents([
  Favorites,
  VisitedServiceCard,
  ServiceStatusCard,
  WhatsNew,
]);

export const SECTIONS: SectionConfig[] = [
  { id: 'ras', title: 'Recently accessed services', editable: false, w: 12 },
];

const RAS_CARD_TEMPLATES = [
  {
    serviceType: 'SAP HANA Cloud',
    serviceName: 'olc-hana-db',
    serviceIcon: 'database',
    serviceDescription: 'My Subaccount 1/Space dev',
    path: '/hana/olc-hana-db',
  },
  {
    serviceType: 'Cloud Identity Service',
    serviceName: 'Cloud Identity',
    serviceIcon: 'customer',
    serviceDescription: 'My Subaccount 1/Space dev',
    path: '/identity/cloud-identity',
  },
  {
    serviceType: 'SAP HANA Cloud',
    serviceName: 'olc-hana-db-test',
    serviceIcon: 'database',
    serviceDescription: 'My Subaccount 1/Space dev',
    path: '/hana/olc-hana-db-test',
  },
  {
    serviceType: 'Application Autoscaler',
    serviceName: 'applicationtest',
    serviceIcon: 'accelerated',
    serviceDescription: 'My Subaccount 2/Space prod',
    path: '/autoscaler/applicationtest',
  },
  {
    serviceType: 'Cloud Identity Service',
    serviceName: 'Cloud Identity 2',
    serviceIcon: 'customer',
    serviceDescription: 'Long text Subaccount 1/Space',
    path: '/identity/cloud-identity-2',
  },
  {
    serviceType: 'Audit Log Service',
    serviceName: 'auditlog-name',
    serviceIcon: 'log',
    serviceDescription: 'My Subaccount 4/Space dev',
    path: '/auditlog/auditlog-name',
  },
];

export const RAS_CARDS: CardConfig[] = RAS_CARD_TEMPLATES.map((t, i) => ({
  id: `ras-card-${i}`,
  w: 4,
  h: 10,
  sectionId: 'ras',
  type: 'angular' as const,
  component: 'mfp-visited-service-card',
  componentInputs: { ...t },
}));

export const CARDS: CardConfig[] = [
  ...RAS_CARDS,
  {
    id: 'table-pods',
    w: 12,
    h: 45,
    component: 'mfp-wc-declarative-table-card',
    componentInputs: {
      config: TABLE_CARD_CONFIG,
      header: 'Pods',
      headerTooltip: 'This table lists all pods running in the cluster.',
      resources: TABLE_RESOURCES,
    },
  },
  {
    id: 'whats-new',
    label: "What's New",
    type: 'angular',
    w: 6,
    h: 55,
    component: 'mfp-whats-new',
  },
  {
    id: 'favorites',
    label: 'Favorites',
    type: 'angular',
    w: 6,
    h: 20,
    minW: 3,
    maxW: 6,
    minH: 10,
    maxH: 40,
    component: 'mfp-favorites',
  },
  {
    id: 'service-status',
    label: 'Service Status',
    type: 'angular',
    w: 6,
    h: 28,
    component: 'mfp-service-status-card',
  },
];
