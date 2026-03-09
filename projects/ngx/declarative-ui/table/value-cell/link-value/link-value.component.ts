import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Link } from '@fundamental-ngx/ui5-webcomponents/link';

@Component({
  selector: 'link-value',
  imports: [Link],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './link-value.component.html',
  styleUrl: './link-value.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkValue {
  urlValue = input.required<string>();
  testId = input<string>('link-value-link');

  public stopPropagation(event: Event) {
    event.stopPropagation();
  }
}
