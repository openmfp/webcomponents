import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';
import { Link } from '@fundamental-ngx/ui5-webcomponents/link';

@Component({
  selector: 'mfp-link-value',
  imports: [Link],
  templateUrl: './link-value.component.html',
  styleUrl: './link-value.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LinkValue {
  urlValue = input.required<string>();
  testId = input<string>('link-value-link');

  public stopPropagation(event: Event) {
    event.stopPropagation();
  }
}
