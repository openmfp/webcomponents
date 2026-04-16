import { Favorites } from '../../favorites/favorites.component';
import { VisitedServiceCard } from '../../visited-service-card/visited-service-card.component';
import { Dashboard } from '../dashboard/dashboard.component';
import type { CardConfig, SectionConfig } from '../models';
import { TABLE_CARD_CONFIG, TABLE_RESOURCES } from './pods-table.config';

Dashboard.addComponentToSelectorType([Favorites, VisitedServiceCard]);

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

export const CARDS: CardConfig[] = [
  ...RAS_CARD_TEMPLATES.map((t, i) => ({
    id: `ras-card-${i}`,
    w: 4,
    h: 12,
    sectionId: 'ras',
    component: 'mfp-visited-service-card',
    componentInputs: { ...t },
  })),
  {
    id: 'table-pods',
    w: 12,
    h: 51,
    component: 'mfp-wc-declarative-table-card',
    componentInputs: {
      config: TABLE_CARD_CONFIG,
      header: 'Pods',
      headerTooltip: 'This table lists all pods running in the cluster.',
      resources: TABLE_RESOURCES,
    },
  },
  {
    id: 'mfp-favorites',
    w: 5,
    h: 21,
    component: 'mfp-wc-favorites',
  },
];
