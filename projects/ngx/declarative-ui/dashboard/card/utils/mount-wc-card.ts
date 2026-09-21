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

  const observer = new ResizeObserver(() => {
    renderer.setProperty(element, 'contentHeight', host.clientHeight);
  });
  observer.observe(host);
  renderer.setProperty(element, 'contentHeight', host.clientHeight);

  onCleanup(() => {
    observer.disconnect();
    host.innerHTML = '';
  });
}
