import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'secret-value',
  imports: [],
  schemas: [],
  templateUrl: './secret-value.component.html',
  styleUrl: './secret-value.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecretValue {
  value = input.required<string>();
  isVisible = input<boolean>(false);
  testId = input<string>('secret-value');
  maskedValue = computed(() => '*'.repeat(this.value().length || 8));
}
