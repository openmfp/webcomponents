import { VisitedServiceCard } from '../visited-service-card.component';
import type { Meta, StoryObj } from '@storybook/angular';

const meta: Meta<VisitedServiceCard> = {
  title: 'Visited Service Card / VisitedServiceCard',
  component: VisitedServiceCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    serviceType: { control: 'text' },
    serviceName: { control: 'text' },
    serviceIcon: { control: 'text' },
    serviceDescription: { control: 'text' },
    path: { control: 'text' },
  },
  render: (args) => ({
    props: {
      ...args,
      clicked: false,
      onCardClick() {
        this['clicked'] = true;
        setTimeout(() => (this['clicked'] = false), 3000);
      },
    },
    template: `
      <mfp-visited-service-card
        [serviceType]="serviceType"
        [serviceName]="serviceName"
        [serviceIcon]="serviceIcon"
        [serviceDescription]="serviceDescription"
        [path]="path"
        (click)="onCardClick()"
      />
      @if (clicked) {
        <ui5-message-strip design="Information" style="margin-top: 1rem;">
          Card clicked — would navigate to: {{ path }}
        </ui5-message-strip>
      }
    `,
  }),
};

export default meta;
type Story = StoryObj<VisitedServiceCard>;

export const HanaCloud: Story = {
  args: {
    serviceType: 'SAP HANA Cloud',
    serviceName: 'olc-hana-db',
    serviceIcon: 'database',
    serviceDescription: 'My Subaccount 1/Space dev',
    path: '/hana/olc-hana-db',
  },
};

export const CloudIdentityService: Story = {
  args: {
    serviceType: 'Cloud Identity Service',
    serviceName: 'Cloud Identity Service',
    serviceIcon: 'customer',
    serviceDescription: 'My Subaccount 1/Space dev',
    path: '/identity/cloud-identity-service',
  },
};

export const HanaCloudTest: Story = {
  args: {
    serviceType: 'SAP HANA Cloud',
    serviceName: 'olc-hana-db-test',
    serviceIcon: 'database',
    serviceDescription: 'My Subaccount 1/Space dev',
    path: '/hana/olc-hana-db-test',
  },
};

export const ApplicationAutoscaler: Story = {
  args: {
    serviceType: 'Application Autoscaler',
    serviceName: 'applicationtest',
    serviceIcon: 'accelerated',
    serviceDescription: 'My Subaccount 2/Space prod',
    path: '/autoscaler/applicationtest',
  },
};

export const CloudIdentityLongPath: Story = {
  args: {
    serviceType: 'Cloud Identity Service',
    serviceName: 'Cloud Identity Service',
    serviceIcon: 'customer',
    serviceDescription: 'Long text Subaccount 1/Space',
    path: '/identity/cloud-identity-service',
  },
};

export const AuditLogService: Story = {
  args: {
    serviceType: 'Audit Log Service',
    serviceName: 'auditlog-name',
    serviceIcon: 'log',
    serviceDescription: 'My Subaccount 4/Space dev',
    path: '/auditlog/auditlog-name',
  },
};

export const AllCards: Story = {
  render: () => ({
    props: {
      clicked: false,
      clickedPath: '',
      onCardClick(path: string) {
        this['clickedPath'] = path;
        this['clicked'] = true;
        setTimeout(() => (this['clicked'] = false), 3000);
      },
    },
    template: `
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; padding: 1rem;">
        <mfp-visited-service-card serviceType="SAP HANA Cloud" serviceName="olc-hana-db" serviceIcon="database" serviceDescription="My Subaccount 1/Space dev" path="/hana/olc-hana-db" (click)="onCardClick('/hana/olc-hana-db')" />
        <mfp-visited-service-card serviceType="Cloud Identity Service" serviceName="Cloud Identity Service" serviceIcon="customer" serviceDescription="My Subaccount 1/Space dev" path="/identity/cloud-identity-service" (click)="onCardClick('/identity/cloud-identity-service')" />
        <mfp-visited-service-card serviceType="SAP HANA Cloud" serviceName="olc-hana-db-test" serviceIcon="database" serviceDescription="My Subaccount 1/Space dev" path="/hana/olc-hana-db-test" (click)="onCardClick('/hana/olc-hana-db-test')" />
        <mfp-visited-service-card serviceType="Application Autoscaler" serviceName="applicationtest" serviceIcon="accelerated" serviceDescription="My Subaccount 2/Space prod" path="/autoscaler/applicationtest" (click)="onCardClick('/autoscaler/applicationtest')" />
        <mfp-visited-service-card serviceType="Cloud Identity Service" serviceName="Cloud Identity Service" serviceIcon="customer" serviceDescription="Long text Subaccount 1/Space" path="/identity/cloud-identity-service" (click)="onCardClick('/identity/cloud-identity-service')" />
        <mfp-visited-service-card serviceType="Audit Log Service" serviceName="auditlog-name" serviceIcon="log" serviceDescription="My Subaccount 4/Space dev" path="/auditlog/auditlog-name" (click)="onCardClick('/auditlog/auditlog-name')" />
      </div>
      @if (clicked) {
        <ui5-message-strip design="Information" style="margin-top: 1rem;">
          Card clicked — would navigate to: {{ clickedPath }}
        </ui5-message-strip>
      }
    `,
  }),
};
