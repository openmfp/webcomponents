# ErrorView

A component that shows an error state: a UI5 illustration, a title, a subtitle, optional projected content and optional action buttons. It carries no texts, no status-code logic and no navigation of its own — the consumer decides what to show and what a button does.

| Item        | Value                                     |
| ----------- | ----------------------------------------- |
| Selector    | `<mfp-error-view>`                        |
| Web element | `<mfp-wc-error-view>`                     |
| Class       | `ErrorView`                               |
| Import      | `@openmfp/ngx`                            |
| Source      | `projects/ngx/declarative-ui/error-view/` |

---

## Illustrations

`ErrorView` does not ship any illustration. The images come from `@ui5/webcomponents-fiori`, which is a peer dependency, and the consumer imports each illustration it uses:

```ts
import '@ui5/webcomponents-fiori/dist/illustrations/NoEntries.js';
import '@ui5/webcomponents-fiori/dist/illustrations/tnt/UnsuccessfulAuth.js';
```

The value of `config.illustration` is the name of the imported module: `NoEntries`, `UnableToLoad`, `tnt/UnsuccessfulAuth`, and so on. The [UI5 illustrated message documentation](https://ui5.github.io/webcomponents/components/fiori/IllustratedMessage/) lists all names.

An illustration that was not imported is not drawn; the texts and buttons are still shown. Import the illustration before the component renders it: an illustration imported afterwards is not picked up by a component that is already rendered.

A button `icon` works the same way: import the icon from `@ui5/webcomponents-icons` before using its name.

---

## Usage

### Angular

```ts
import { ErrorView, ErrorViewButton, ErrorViewConfig } from '@openmfp/ngx';
import '@ui5/webcomponents-fiori/dist/illustrations/UnableToLoad.js';

interface RetryButton extends ErrorViewButton {
  action: 'retry' | 'back';
}

@Component({
  selector: 'app-orders-error',
  imports: [ErrorView],
  template: `
    <mfp-error-view [config]="config" (buttonClick)="onButtonClick($event)" />
  `,
})
export class OrdersError {
  protected readonly config: ErrorViewConfig<RetryButton> = {
    illustration: 'UnableToLoad',
    title: 'Unable to load the orders',
    subtitle: 'Please try again later.',
    buttons: [
      { key: 'retry', label: 'Retry', design: 'Emphasized', action: 'retry' },
      { key: 'back', label: 'Back to overview', action: 'back' },
    ],
  };

  protected onButtonClick(button: RetryButton): void {
    // button is the object passed in `config.buttons`
  }
}
```

### Web component

`<mfp-wc-error-view>` is part of `mfp-webcomponents.js`. Set `config` as a property and listen to `buttonClick`; the clicked button is in `event.detail`.

```html
<mfp-wc-error-view id="error"></mfp-wc-error-view>

<script type="module">
  import '@ui5/webcomponents-fiori/dist/illustrations/NoEntries.js';

  const error = document.getElementById('error');
  error.config = {
    illustration: 'NoEntries',
    title: 'Content not found',
    subtitle: 'The page you are looking for does not exist.',
    buttons: [{ key: 'back', label: 'Back to overview', route: '/overview' }],
  };
  error.addEventListener('buttonClick', (event) => {
    // event.detail is the clicked button: { key, label, route }
  });
</script>
```

The host page imports the illustration in its own code, as above, before it sets `config`. UI5 keeps illustrations in a registry that all UI5 runtimes on the page share, so an illustration imported by the host is available to the component inside the bundle.

---

## API

### Inputs

| Input    | Type              | Default | Description                                                     |
| -------- | ----------------- | ------- | --------------------------------------------------------------- |
| `config` | `ErrorViewConfig` | —       | What the error view shows. Nothing is rendered until it is set. |

### `ErrorViewConfig`

| Property       | Type                | Default      | Description                                                                 |
| -------------- | ------------------- | ------------ | --------------------------------------------------------------------------- |
| `illustration` | `string`            | — (required) | Name of the UI5 illustration.                                               |
| `title`        | `string`            | —            | Title below the illustration, rendered as a level 1 heading.                |
| `subtitle`     | `string`            | —            | Text below the title.                                                       |
| `buttons`      | `ErrorViewButton[]` | —            | Action buttons below the texts, in the given order. Omit it for no buttons. |

The title and the subtitle replace the default texts of the UI5 illustration, also when they are not set.

To change what is shown, pass a new config object. A change made inside the object that is already set, for example to a button's `disabled`, is not picked up.

`ErrorView` takes the full height of its container, like the UI5 illustrated message it wraps: in a container with a definite height the illustration, texts and actions are centred vertically; otherwise the component is as high as its content.

### Outputs

| Output        | Payload           | Description                                                             |
| ------------- | ----------------- | ----------------------------------------------------------------------- |
| `buttonClick` | `ErrorViewButton` | The clicked button: the same object that was passed in `config.buttons` |

### `ErrorViewButton`

| Property   | Type                                                                                    | Default         | Description                                                                                                    |
| ---------- | --------------------------------------------------------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------- |
| `key`      | `string`                                                                                | — (required)    | Identifies the button. Used for its test id `error-view-button-{key}`; must be unique within `config.buttons`. |
| `label`    | `string`                                                                                | — (required)    | Button text.                                                                                                   |
| `design`   | `'Default' \| 'Positive' \| 'Negative' \| 'Transparent' \| 'Emphasized' \| 'Attention'` | `'Transparent'` | UI5 button design.                                                                                             |
| `icon`     | `string`                                                                                | —               | UI5 icon name shown before the label.                                                                          |
| `disabled` | `boolean`                                                                               | `false`         | Disables the button. A disabled button does not emit `buttonClick`.                                            |

A button can carry any further properties, for example a route. `ErrorView` is generic over the button type, so in Angular `buttonClick` emits the button type of `ErrorViewConfig<T>`.

### Content

Content placed inside the element is shown below the texts and above the buttons, for example a selector the user has to fill in before a retry:

```html
<mfp-error-view [config]="config()" (buttonClick)="retry()">
  <app-namespace-select [(value)]="namespace" />
</mfp-error-view>
```

The content is moved into the shadow root of `ErrorView`. Styles of a parent component that itself uses `ViewEncapsulation.ShadowDom` do not reach it there; styles of components with the default emulated encapsulation do.

---

## Test IDs

See [test-ids.md](./test-ids.md#errorview-error-view-).
