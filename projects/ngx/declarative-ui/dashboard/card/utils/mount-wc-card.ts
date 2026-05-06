import { EffectCleanupRegisterFn, Renderer2 } from '@angular/core';
import { CardConfig } from '../../models';

export function mountWcCard(
  cfg: CardConfig,
  host: HTMLElement,
  onCleanup: EffectCleanupRegisterFn,
  renderer: Renderer2,
): void {
  const element = renderer.createElement(cfg.component);

  for (const [key, value] of Object.entries(cfg.componentInputs ?? {})) {
    renderer.setProperty(element, key, value);
  }

  renderer.appendChild(host, element);

  onCleanup(() => {
    host.innerHTML = '';
  });
}
