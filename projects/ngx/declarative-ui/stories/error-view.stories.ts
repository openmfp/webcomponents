import { ErrorView } from '../error-view/error-view.component';
import type {
  ErrorViewButton,
  ErrorViewConfig,
} from '../error-view/error-view.model';
import { CUSTOM_ELEMENTS_SCHEMA, Component, Input } from '@angular/core';
import { MessageStrip } from '@fundamental-ngx/ui5-webcomponents/message-strip';
import { Option } from '@fundamental-ngx/ui5-webcomponents/option';
import { Select } from '@fundamental-ngx/ui5-webcomponents/select';
import type { Meta, StoryObj } from '@storybook/angular';
import '@ui5/webcomponents-fiori/dist/illustrations/NoEntries.js';
import '@ui5/webcomponents-fiori/dist/illustrations/UnableToLoad.js';
import '@ui5/webcomponents-fiori/dist/illustrations/tnt/NoApplications.js';
import '@ui5/webcomponents-fiori/dist/illustrations/tnt/UnsuccessfulAuth.js';

@Component({
  selector: 'mfp-error-view-story',
  imports: [ErrorView, MessageStrip, Option, Select],
  template: `
    <mfp-error-view [config]="config" (buttonClick)="clicked = $event">
      @if (extraContent) {
        <ui5-select accessibleName="Namespace">
          <ui5-option value="">Select namespace</ui5-option>
          <ui5-option value="default">default</ui5-option>
          <ui5-option value="kube-system">kube-system</ui5-option>
        </ui5-select>
      }
    </mfp-error-view>
    @if (clicked) {
      <ui5-message-strip design="Information" (close)="clicked = undefined">
        buttonClick emitted: {{ clicked.label }}
      </ui5-message-strip>
    }
  `,
})
class ErrorViewStory {
  @Input() config?: ErrorViewConfig;
  @Input() extraContent = false;
  clicked?: ErrorViewButton;
}

@Component({
  selector: 'mfp-wc-error-view-story',
  imports: [MessageStrip],
  template: `
    <mfp-wc-error-view
      [config]="config"
      (buttonClick)="clicked = $event.detail"
    />
    @if (clicked) {
      <ui5-message-strip design="Information" (close)="clicked = undefined">
        buttonClick emitted: {{ clicked.label }}
      </ui5-message-strip>
    }
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class WcErrorViewStory {
  @Input() config?: ErrorViewConfig;
  clicked?: ErrorViewButton;
}

const meta: Meta<ErrorViewStory> = {
  title: 'Declarative UI / ErrorView',
  component: ErrorViewStory,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    config: { control: 'object' },
    extraContent: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<ErrorViewStory>;

export const NotFound: Story = {
  args: {
    config: {
      illustration: 'NoEntries',
      title: 'Content not found',
      subtitle: 'The page you are looking for does not exist.',
    },
  },
};

export const Unauthorized: Story = {
  args: {
    config: {
      illustration: 'tnt/UnsuccessfulAuth',
      title: 'You are not authorized to access this content.',
    },
  },
};

export const PendingDeletion: Story = {
  args: {
    config: {
      illustration: 'tnt/NoApplications',
      title: 'The resource is pending deletion.',
    },
  },
};

export const WithAction: Story = {
  args: {
    config: {
      illustration: 'UnableToLoad',
      title: 'Unable to load the content',
      subtitle: 'Please try again later.',
      buttons: [{ key: 'retry', label: 'Retry', design: 'Emphasized' }],
    },
  },
};

export const WithDisabledAction: Story = {
  args: {
    config: {
      illustration: 'UnableToLoad',
      title: 'Could not load resource',
      subtitle: 'Select a namespace and try again.',
      buttons: [
        { key: 'retry', label: 'Retry', design: 'Emphasized', disabled: true },
      ],
    },
    extraContent: true,
  },
};

export const WithMultipleActions: Story = {
  args: {
    config: {
      illustration: 'UnableToLoad',
      title: 'Unable to load the content',
      subtitle: 'Please try again later.',
      buttons: [
        { key: 'retry', label: 'Retry', design: 'Emphasized', icon: 'refresh' },
        { key: 'back', label: 'Back to overview' },
      ],
    },
  },
};

export const WebComponent: StoryObj<WcErrorViewStory> = {
  parameters: { webcomponentsBundle: true },
  args: {
    config: {
      illustration: 'NoEntries',
      title: 'Content not found',
      subtitle: 'The page you are looking for does not exist.',
      buttons: [{ key: 'back', label: 'Back to overview' }],
    },
  },
  render: (args) => ({
    props: args,
    moduleMetadata: { imports: [WcErrorViewStory] },
    template: `<mfp-wc-error-view-story [config]="config" />`,
  }),
};
