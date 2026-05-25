import { TagSettings } from '../../models';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Tag } from '@fundamental-ngx/ui5-webcomponents/tag';

@Component({
  selector: 'mfp-tag-list-value',
  imports: [Tag],
  templateUrl: './tag-list-value.component.html',
  styleUrl: './tag-list-value.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagListValue {
  tags = input.required<string[]>();
  tagSettings = input<TagSettings>();
  testId = input<string>('tag-list-value');
}
