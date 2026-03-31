import type { CardConfig, SectionConfig } from '../models';
import { TABLE_COLUMNS, TABLE_RESOURCES } from './pods-table.config';

export const SECTIONS: SectionConfig[] = [
  { id: 'ras', title: 'Recently accessed services', editable: false },
  { id: 'pods', title: 'Pods', colSpan: 12 },
  { id: 'traffic', title: 'Traffic', colSpan: 12 },
];

const RAS_CARD_TEMPLATES = [
  { serviceType: 'SAP HANA Cloud', serviceName: 'olc-hana-db', serviceIcon: 'database', serviceDescription: 'My Subaccount 1/Space dev', path: '/hana/olc-hana-db' },
  { serviceType: 'Cloud Identity Service', serviceName: 'Cloud Identity', serviceIcon: 'customer', serviceDescription: 'My Subaccount 1/Space dev', path: '/identity/cloud-identity' },
  { serviceType: 'SAP HANA Cloud', serviceName: 'olc-hana-db-test', serviceIcon: 'database', serviceDescription: 'My Subaccount 1/Space dev', path: '/hana/olc-hana-db-test' },
  { serviceType: 'Application Autoscaler', serviceName: 'applicationtest', serviceIcon: 'accelerated', serviceDescription: 'My Subaccount 2/Space prod', path: '/autoscaler/applicationtest' },
  { serviceType: 'Cloud Identity Service', serviceName: 'Cloud Identity 2', serviceIcon: 'customer', serviceDescription: 'Long text Subaccount 1/Space', path: '/identity/cloud-identity-2' },
  { serviceType: 'Audit Log Service', serviceName: 'auditlog-name', serviceIcon: 'log', serviceDescription: 'My Subaccount 4/Space dev', path: '/auditlog/auditlog-name' },
];

export const CARDS: CardConfig[] = [
  ...RAS_CARD_TEMPLATES.map((t, i) => ({
    id: `ras-card-${i}`,
    colSpan: 4,
    rowSpan: 1,
    sectionId: 'ras',
    component: 'mfp-visited-service-card',
    componentInputs: { ...t },
  })),
  {
    id: 'table-pods',
    colSpan: 12,
    rowSpan: 4,
    sectionId: 'pods',
    component: 'mfp-declarative-table',
    componentInputs: {
      columns: TABLE_COLUMNS,
      resources: TABLE_RESOURCES,
      trackBy: (item: any) => item.metadata.uid,
      hasMore: false,
      paginationLimit: 5,
    },
  },
  { id: 'card-5', colSpan: 8, rowSpan: 2, sectionId: 'traffic' },
  { id: 'card-6', colSpan: 4, rowSpan: 2, sectionId: 'traffic' },
  { id: 'loose-1', colSpan: 4, rowSpan: 3 },
  { id: 'loose-2', colSpan: 8, rowSpan: 5 },
];
