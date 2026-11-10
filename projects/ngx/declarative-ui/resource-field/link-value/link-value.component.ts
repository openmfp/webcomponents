import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  SecurityContext,
  computed,
  inject,
  input,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
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
  displayValue = input<string>();

  private readonly sanitizer = inject(DomSanitizer);
  protected readonly sanitizedHref = computed(
    () =>
      this.sanitizer.sanitize(SecurityContext.URL, this.urlValue()) ??
      undefined,
  );

  public stopPropagation(event: Event) {
    event.stopPropagation();
  }
}
