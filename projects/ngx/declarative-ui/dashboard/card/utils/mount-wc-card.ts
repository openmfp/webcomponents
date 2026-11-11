import type { BeforeRequest } from '../../../../services/data-fetch.model';
import { DashboardCardContent, MountCfg } from '../../models';
import {
  EffectCleanupRegisterFn,
  ErrorHandler,
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
  const host: HTMLElement = container.element.nativeElement;
  const element: HTMLElement = renderer.createElement(cfg.component);
  const registry = element.ownerDocument.defaultView?.customElements;
  let cancel: (() => void) | undefined;
  let disposed = false;
  let observer: ResizeObserver | undefined;

  onCleanup(() => {
    disposed = true;
    cancel?.();
    observer?.disconnect();
    if (element.parentNode === host) renderer.removeChild(host, element);
  });

  const mount = (definedRegistry?: CustomElementRegistry): void => {
    if (disposed) return;
    definedRegistry?.upgrade(element);

    const acceptsBeforeRequest = beforeRequest && 'beforeRequest' in element;
    if (acceptsBeforeRequest) {
      renderer.setProperty(element, 'beforeRequest', beforeRequest);
    }
    for (const [key, value] of Object.entries(cfg.componentInputs ?? {})) {
      if (acceptsBeforeRequest && key === 'beforeRequest') continue;
      renderer.setProperty(element, key, value);
    }

    if (disposed) return;
    renderer.appendChild(host, element);
    if (disposed) return;

    const updateContentHeight = (): void => {
      renderer.setProperty(element, 'contentHeight', host.clientHeight);
    };
    observer = new ResizeObserver(updateContentHeight);
    observer.observe(host);
    updateContentHeight();
    if (!disposed) onMounted?.(element as DashboardCardContent);
  };

  const name = element.localName;
  if (beforeRequest && name.includes('-') && registry && !registry.get(name)) {
    const cancelled = new Promise<void>((resolve) => {
      cancel = resolve;
    });
    void Promise.race([registry.whenDefined(name), cancelled])
      .then(
        (definition) => {
          if (definition) mount(registry);
        },
        () => {
          mount();
        },
      )
      .catch((error: unknown) => {
        container.injector.get(ErrorHandler).handleError(error);
      });
  } else {
    mount();
  }
}
