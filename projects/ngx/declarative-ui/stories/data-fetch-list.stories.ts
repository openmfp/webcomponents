import { DataFetchList, type DataFetchListData } from '../data-fetch-list';
import type { BeforeRequest } from '../data-fetch-table';
import type { FieldDefinition } from '../models';
import { SUBACCOUNTS_LIST_INPUTS } from './subaccounts-list.config';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

@Component({
  selector: 'mfp-data-fetch-list-story',
  imports: [DataFetchList],
  standalone: true,
  template: `
    <mfp-data-fetch-list
      [beforeRequest]="beforeRequest"
      [data]="data()"
      [description]="description()"
      [fieldDefinition]="fieldDefinition()"
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

  private hasFailed = false;

  protected readonly beforeRequest: BeforeRequest = ({ signal }) => {
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

const meta: Meta<DataFetchListStory> = {
  title: 'Declarative UI / DataFetchList',
  component: DataFetchListStory,
  tags: ['autodocs'],
  args: SUBACCOUNTS_LIST_INPUTS,
  argTypes: {
    requestBehavior: { table: { disable: true } },
  },
};

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
