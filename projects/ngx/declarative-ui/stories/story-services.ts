export interface StoryService {
  title: string;
  description: string;
}

export const STORY_SERVICES: StoryService[] = [
  { title: 'olc-hana-db', description: 'SAP HANA Cloud' },
  { title: 'Cloud Identity Service', description: 'Identity Authentication' },
  { title: 'olc-hana-db-test', description: 'SAP HANA Cloud' },
  { title: 'applicationtest', description: 'Application Autoscaler' },
  { title: 'auditlog-name', description: 'Audit Log Service' },
  { title: 'checkout-api', description: 'Cloud Foundry App' },
  { title: 'internal-portal', description: 'HTML5 Application' },
];

export function filterStoryServices(query: string): StoryService[] {
  const normalized = query.toLowerCase();
  return STORY_SERVICES.filter((service) =>
    service.title.toLowerCase().includes(normalized),
  );
}
