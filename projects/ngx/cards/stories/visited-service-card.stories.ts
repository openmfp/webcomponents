import { VisitedServiceCard } from '../visited-service-card/visited-service-card.component';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MessageStrip } from '@fundamental-ngx/ui5-webcomponents/message-strip';
import type { Meta, StoryObj } from '@storybook/angular';

@Component({
  selector: 'mfp-visited-service-card-story',
  imports: [MessageStrip, VisitedServiceCard],
  template: `
    <mfp-visited-service-card
      [path]="path"
      [serviceDescription]="serviceDescription"
      [serviceIcon]="serviceIcon"
      [serviceName]="serviceName"
      [serviceType]="serviceType"
      (cardClick)="onCardClick()"
    />
    @if (clicked) {
      <ui5-message-strip design="Information" style="margin-top: 1rem;">
        Card clicked — would navigate to: {{ path }}
      </ui5-message-strip>
    }
  `,
})
class VisitedServiceCardStory {
  @Input() serviceType = '';
  @Input() serviceName = '';
  @Input() serviceIcon = '';
  @Input() serviceDescription = '';
  @Input() path = '';
  @Output() readonly cardClick = new EventEmitter<string>();
  clicked = false;
  onCardClick() {
    this.clicked = true;
    setTimeout(() => (this.clicked = false), 3000);
  }
}

const meta: Meta<VisitedServiceCardStory> = {
  title: 'Cards / VisitedServiceCard',
  component: VisitedServiceCardStory,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    serviceType: { control: 'text' },
    serviceName: { control: 'text' },
    serviceIcon: { control: 'text' },
    serviceDescription: { control: 'text' },
    path: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<VisitedServiceCardStory>;

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
    template: `
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; padding: 1rem;">
        <mfp-visited-service-card-story serviceType="SAP HANA Cloud" serviceName="olc-hana-db" serviceIcon="database" serviceDescription="My Subaccount 1/Space dev" path="/hana/olc-hana-db"></mfp-visited-service-card-story>
        <mfp-visited-service-card-story serviceType="Cloud Identity Service" serviceName="Cloud Identity Service" serviceIcon="customer" serviceDescription="My Subaccount 1/Space dev" path="/identity/cloud-identity-service"></mfp-visited-service-card-story>
        <mfp-visited-service-card-story serviceType="SAP HANA Cloud" serviceName="olc-hana-db-test" serviceIcon="database" serviceDescription="My Subaccount 1/Space dev" path="/hana/olc-hana-db-test"></mfp-visited-service-card-story>
        <mfp-visited-service-card-story serviceType="Application Autoscaler" serviceName="applicationtest" serviceIcon="accelerated" serviceDescription="My Subaccount 2/Space prod" path="/autoscaler/applicationtest"></mfp-visited-service-card-story>
        <mfp-visited-service-card-story serviceType="Cloud Identity Service" serviceName="Cloud Identity Service" serviceIcon="customer" serviceDescription="Long text Subaccount 1/Space" path="/identity/cloud-identity-service"></mfp-visited-service-card-story>
        <mfp-visited-service-card-story serviceType="Audit Log Service" serviceName="auditlog-name" serviceIcon="log" serviceDescription="My Subaccount 4/Space dev" path="/auditlog/auditlog-name"></mfp-visited-service-card-story>
      </div>
    `,
  }),
};
