import { Dashboard } from '../dashboard/dashboard/dashboard.component';
import { EN_DEFAULTS } from '../dashboard/i18n';
import type { CardConfig, DashboardConfig } from '../dashboard/models';
import { DataFetchList, type DataFetchListData } from '../data-fetch-list';
import type { BeforeCardRequest } from '../data-fetch-table';
import type { FieldDefinition } from '../models';
import { SUBACCOUNTS_LIST_INPUTS } from './subaccounts-list.config';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

Dashboard.registerAngularComponents([DataFetchList]);

const dashboardConfig: DashboardConfig = {
  zFlow: { cardHeight: 40, defaultCardSize: 'xxl' },
};
const dashboardI18n = { ...EN_DEFAULTS, title: '', description: '' };

@Component({
  selector: 'mfp-data-fetch-list-story',
  imports: [Dashboard],
  standalone: true,
  template: `
    <mfp-dashboard
      [availableCards]="cards()"
      [beforeCardRequest]="beforeRequest"
      [cards]="cards()"
      [config]="dashboardConfig"
      [i18n]="dashboardI18n"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class DataFetchListStory {
  readonly data = input<DataFetchListData>();
  readonly description = input<string>();
  readonly fieldDefinition = input<FieldDefinition>(
    SUBACCOUNTS_LIST_INPUTS.fieldDefinition,
  );
  readonly requestBehavior = input<'normal' | 'loading' | 'fail-once'>(
    'normal',
  );

  protected readonly dashboardConfig = dashboardConfig;
  protected readonly dashboardI18n = dashboardI18n;
  protected readonly cards = computed<CardConfig[]>(() => [
    {
      id: 'affected-subaccounts',
      label: 'Affected Subaccounts',
      type: 'angular',
      component: 'mfp-data-fetch-list',
      size: 's',
      componentTemplate: {
        badge: { text: 'Action Needed', state: 'Critical' },
        actions: [{ key: 'view-subaccounts', text: 'View subaccounts' }],
      },
      componentInputs: {
        data: this.data(),
        description: this.description(),
        fieldDefinition: this.fieldDefinition(),
        lastUpdated: { label: 'Last updated:', text: '30 minutes ago' },
        status: { text: '{{$length}} Subaccounts', state: 'Critical' },
        emptyState: {
          title: 'No subaccounts found',
          subtitle: 'There are currently no subaccounts to show.',
        },
        errorState: {
          title: 'Unable to load subaccounts',
          subtitle: 'Retry to request the subaccounts again.',
          buttons: [{ key: 'retry', label: 'Retry', design: 'Emphasized' }],
        },
      },
    },
  ]);

  private hasFailed = false;

  protected readonly beforeRequest: BeforeCardRequest = ({ signal }) => {
    if (this.requestBehavior() === 'loading') {
      return new Promise<never>((_, reject) => {
        signal.throwIfAborted();
        signal.addEventListener(
          'abort',
          () => {
            reject(signal.reason);
          },
          { once: true },
        );
      });
    }

    if (this.requestBehavior() === 'fail-once' && !this.hasFailed) {
      this.hasFailed = true;
      return Promise.reject(new Error('The first request failed.'));
    }

    return undefined;
  };
}

const meta = {
  title: 'Declarative UI / DataFetchList',
  component: DataFetchListStory,
  tags: ['autodocs'],
  args: SUBACCOUNTS_LIST_INPUTS,
  argTypes: {
    requestBehavior: { table: { disable: true } },
  },
} satisfies Meta<DataFetchListStory>;

export default meta;

type Story = StoryObj<DataFetchListStory>;

export const FetchedRows: Story = {};

export const Loading: Story = {
  args: { requestBehavior: 'loading' },
};

export const ErrorWithRetry: Story = {
  args: { requestBehavior: 'fail-once' },
};

export const Empty: Story = {
  args: { data: { ...SUBACCOUNTS_LIST_INPUTS.data, path: 'empty' } },
};

export const InvalidResponse: Story = {
  args: { data: { ...SUBACCOUNTS_LIST_INPUTS.data, path: 'invalid' } },
};
