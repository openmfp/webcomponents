import { BeforeRequest } from '../../../data-fetch-table/data-fetch-table.model';
import { DashboardCardContent, MountCfg } from '../../models';
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
  onMounted?: (content: DashboardCardContent) => void,
  beforeRequest?: BeforeRequest,
): void {
  const host = container.element.nativeElement;
  const element: HTMLElement = renderer.createElement(cfg.component);

  for (const [key, value] of Object.entries(cfg.componentInputs ?? {})) {
    renderer.setProperty(element, key, value);
  }

  const acceptsBeforeRequest = beforeRequest && 'beforeRequest' in element;
  if (acceptsBeforeRequest) {
    renderer.setProperty(element, 'beforeRequest', beforeRequest);
  }
  renderer.appendChild(host, element);

  const observer = new ResizeObserver(() => {
    renderer.setProperty(element, 'contentHeight', host.clientHeight);
  });
  observer.observe(host);
  renderer.setProperty(element, 'contentHeight', host.clientHeight);
  onMounted?.(element as DashboardCardContent);

  onCleanup(() => {
    observer.disconnect();
    host.innerHTML = '';
  });
}
