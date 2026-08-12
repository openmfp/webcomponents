import {
  ICON_DESIGN_NEGATIVE,
  ICON_DESIGN_POSITIVE,
  ICON_NAME_NEGATIVE,
  ICON_NAME_POSITIVE,
} from './boolean-cell.constants';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { Icon } from '@fundamental-ngx/ui5-webcomponents/icon';

export type IconDesignType =
  typeof ICON_DESIGN_POSITIVE | typeof ICON_DESIGN_NEGATIVE;

@Component({
  selector: 'mfp-boolean-value',
  imports: [Icon],
  templateUrl: './boolean-value.component.html',
  styleUrl: './boolean-value.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class BooleanValue {
  boolValue = input.required<boolean>();
  testId = input<string>('boolean-value-icon');
  iconDesign = computed<IconDesignType>(() => {
    return this.boolValue() ? ICON_DESIGN_POSITIVE : ICON_DESIGN_NEGATIVE;
  });
  iconName = computed<string>(() => {
    return this.boolValue() ? ICON_NAME_POSITIVE : ICON_NAME_NEGATIVE;
  });
}
