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
    status: { phase: 'Pending', ready: false, restarts: 3, message: 'ImagePullBackOff' },
    spec: { nodeName: 'node-2', image: 'myapp:latest' },
    isAvailable: false,
    accessibleName: 'Pod unavailable: ImagePullBackOff',
  },
  {
    id: 'abc-003',
    metadata: { name: 'cache-redis-0', namespace: 'kube-system', uid: 'abc-003' },
    status: { phase: 'Running', ready: true, restarts: 1, message: undefined },
    spec: { nodeName: 'node-1', image: 'redis:7' },
    isAvailable: true,
  },
  {
    id: 'abc-004',
    metadata: { name: 'db-postgres-0', namespace: 'production', uid: 'abc-004' },
    status: { phase: 'Failed', ready: false, restarts: 5, message: 'CrashLoopBackOff' },
    spec: { nodeName: 'node-3', image: 'postgres:16' },
    isAvailable: false,
    accessibleName: 'Pod unavailable: CrashLoopBackOff',
  },
  {
    id: 'abc-005',
    metadata: { name: 'ingress-ctrl-xkp', namespace: 'default', uid: 'abc-005' },
    status: { phase: 'Running', ready: true, restarts: 0, message: undefined },
    spec: { nodeName: 'node-2', image: 'nginx-ingress:1.9' },
    isAvailable: true,
  },
];

export const TABLE_COLUMNS = [
  { label: 'Name', property: 'metadata.name' },
  { label: 'Ready', property: 'status.ready', uiSettings: { displayAs: 'boolIcon' } },
  {
    label: 'Phase',
    property: 'status.phase',
    uiSettings: {
      cssRules: [
        { if: { condition: 'equals', value: 'Running' }, styles: { color: 'green' } },
        { if: { condition: 'equals', value: 'Pending' }, styles: { color: 'darkorange' } },
        { if: { condition: 'equals', value: 'Failed' }, styles: { color: 'red', fontWeight: 'bold' } },
      ],
    },
  },
  { label: 'UID', property: 'metadata.uid', uiSettings: { displayAs: 'secret', withCopyButton: true } },
  {
    property: 'spec.image',
    uiSettings: { labelDisplay: true },
    group: { name: 'placement', label: 'Placement', delimiter: ' ' },
  },
  {
    property: 'spec.nodeName',
    uiSettings: { labelDisplay: true },
    group: { name: 'placement' },
  },
  { label: 'Alert', property: 'status.message', uiSettings: { displayAs: 'alert' } },
  { label: 'Message', property: 'status.message', value: '—' },
  {
    label: 'Actions',
    property: 'metadata.name',
    uiSettings: {
      displayAs: 'button',
      buttonSettings: { text: 'Inspect', icon: 'inspect', design: 'Emphasized', action: 'navigate' },
    },
  },
];
