import { ErrorViewButton, ErrorViewConfig } from './error-view.model';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  input,
  output,
} from '@angular/core';
import { IllustratedMessage } from '@fundamental-ngx/ui5-webcomponents-fiori';
import { Button } from '@fundamental-ngx/ui5-webcomponents/button';
import { Title } from '@fundamental-ngx/ui5-webcomponents/title';

@Component({
  selector: 'mfp-error-view',
  imports: [IllustratedMessage, Button, Title],
  templateUrl: './error-view.component.html',
  styleUrl: './error-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class ErrorView<T extends ErrorViewButton = ErrorViewButton> {
  config = input<ErrorViewConfig<T>>();

  readonly buttonClick = output<T>();
}
