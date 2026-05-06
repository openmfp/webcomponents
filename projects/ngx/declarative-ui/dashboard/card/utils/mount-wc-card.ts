import { EffectCleanupRegisterFn, Renderer2, ViewContainerRef } from '@angular/core';
import { CardConfig } from '../../models';

export function mountWcCard(
  cfg: CardConfig,
  container: ViewContainerRef,
  onCleanup: EffectCleanupRegisterFn,
  renderer: Renderer2,
): void {
  const host = container.element.nativeElement;
  const element = renderer.createElement(cfg.component);

  for (const [key, value] of Object.entries(cfg.componentInputs ?? {})) {
    renderer.setProperty(element, key, value);
  }

  renderer.appendChild(host, element);

  onCleanup(() => {
    host.innerHTML = '';
  });
}
