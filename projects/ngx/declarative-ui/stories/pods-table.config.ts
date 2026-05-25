import type { TableFieldDefinition } from '../../declarative-ui/table/models';
import type {
  DeleteResourceConfirmationConfig,
  ResourceFormConfig,
  TableCardConfig,
  TableConfig,
} from '..//table-card/models/configs';

export const TABLE_RESOURCES = [
  {
    id: 'abc-001',
    metadata: { name: 'api-server-7d9f', namespace: 'default', uid: 'abc-001' },
    status: { phase: 'Running', ready: true, restarts: 0, message: undefined },
    spec: { nodeName: 'node-1', image: 'nginx:1.25' },
    isAvailable: true,
  },
  {
    id: 'abc-002',
    metadata: { name: 'worker-5bc8', namespace: 'default', uid: 'abc-002' },
    status: {
      phase: 'Pending',
      ready: false,
      restarts: 3,
      message: 'ImagePullBackOff',
    },
    spec: { nodeName: 'node-2', image: 'myapp:latest' },
    isAvailable: false,
    accessibleName: 'Pod unavailable: ImagePullBackOff',
  },
  {
    id: 'abc-003',
    metadata: {
      name: 'cache-redis-0',
      namespace: 'kube-system',
      uid: 'abc-003',
    },
    status: { phase: 'Running', ready: true, restarts: 1, message: undefined },
    spec: { nodeName: 'node-1', image: 'redis:7' },
    isAvailable: true,
  },
  {
    id: 'abc-004',
    metadata: {
      name: 'db-postgres-0',
      namespace: 'production',
      uid: 'abc-004',
    },
    status: {
      phase: 'Failed',
      ready: false,
      restarts: 5,
      message: 'CrashLoopBackOff',
    },
    spec: { nodeName: 'node-3', image: 'postgres:16' },
    isAvailable: false,
    accessibleName: 'Pod unavailable: CrashLoopBackOff',
  },
  {
    id: 'abc-005',
    metadata: {
      name: 'ingress-ctrl-xkp',
      namespace: 'default',
      uid: 'abc-005',
    },
    status: { phase: 'Running', ready: true, restarts: 0, message: undefined },
    spec: { nodeName: 'node-2', image: 'nginx-ingress:1.9' },
    isAvailable: true,
  },
];

export const TABLE_COLUMNS: TableFieldDefinition[] = [
  { label: 'Name', property: 'metadata.name' },
  { label: 'Namespace', property: 'metadata.namespace' },
  {
    label: 'Ready',
    property: 'status.ready',
    uiSettings: { displayAs: 'boolIcon', columnWidth: '56px' },
  },
  {
    label: 'Phase',
    property: 'status.phase',
    uiSettings: {
      cssRules: [
        {
          if: { condition: 'equals', value: 'Running' },
          styles: { color: 'green' },
        },
        {
          if: { condition: 'equals', value: 'Pending' },
          styles: { color: 'darkorange' },
        },
        {
          if: { condition: 'equals', value: 'Failed' },
          styles: { color: 'red', fontWeight: 'bold' },
        },
      ],
    },
  },
  {
    label: 'UID',
    property: 'metadata.uid',
    uiSettings: { displayAs: 'secret', withCopyButton: true },
  },
  {
    property: 'spec.image',
    uiSettings: { displayAs: 'tag' },
    group: { name: 'placement', label: 'Placement', delimiter: ' ' },
  },
  {
    property: 'spec.nodeName',
    uiSettings: { displayAs: 'tag' },
    group: { name: 'placement' },
  },
  {
    label: 'Alert',
    property: 'status.message',
    uiSettings: { displayAs: 'alert', columnWidth: '42px' },
  },
  { label: 'Message', property: 'status.message', value: '—' },
  {
    property: 'metadata.name',
    uiSettings: {
      displayAs: 'button',
      buttonSettings: {
        icon: 'inspect',
        design: 'Transparent',
        action: 'navigate',
      },
    },
    group: { name: 'actions', label: 'Actions', multiline: false },
  },
];

export const POD_FORM_FIELDS = [
  { name: 'metadata.name', label: 'Name', required: true },
  {
    name: 'metadata.namespace',
    label: 'Namespace',
    required: true,
    values: ['default', 'kube-system', 'production'],
  },
];

export const POD_EDIT_FORM_FIELDS = [
  { name: 'metadata.name', label: 'Name', required: true, disabled: true },
  {
    name: 'metadata.namespace',
    label: 'Namespace',
    required: true,
    values: ['default', 'kube-system', 'production'],
  },
];

export const BASE_TABLE_CONFIG: TableConfig = {
  fields: TABLE_COLUMNS,
  paginationLimit: 5,
  hasMore: false,
};

export const DELETE_CONFIRMATION_CONFIG: DeleteResourceConfirmationConfig = {
  title: 'Delete Pod?',
  message: 'This action cannot be undone. The pod will be permanently removed.',
  confirmLabel: 'Delete',
  cancelLabel: 'Cancel',
};

export const CREATE_FORM_CONFIG: ResourceFormConfig = {
  fields: POD_FORM_FIELDS,
  title: 'Create Pod',
  confirmLabel: 'Create',
  cancelLabel: 'Cancel',
};

export const EDIT_FORM_CONFIG: ResourceFormConfig = {
  fields: POD_EDIT_FORM_FIELDS,
  title: 'Edit Pod',
  confirmLabel: 'Save',
  cancelLabel: 'Cancel',
};

export const TABLE_CARD_CONFIG: TableCardConfig = {
  header: 'Pods',
  headerTooltip: 'This table lists all pods running in the cluster.',
  tableConfig: BASE_TABLE_CONFIG,
  createResourceFormConfig: CREATE_FORM_CONFIG,
  editResourceFormConfig: EDIT_FORM_CONFIG,
  deleteResourceConfirmationConfig: DELETE_CONFIRMATION_CONFIG,
};
