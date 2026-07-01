import { MountCfg } from '../../models';
import {
  EffectCleanupRegisterFn,
  Renderer2,
  ViewContainerRef,
} from '@angular/core';

export function mountWcCard(
  cfg: MountCfg,
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
