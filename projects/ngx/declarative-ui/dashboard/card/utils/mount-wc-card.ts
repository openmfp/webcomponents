import type {
  ActionsHook,
  AfterRequest,
  BeforeRequest,
} from '../../../../services/data-fetch.model';
import { DashboardCardContent } from '../../models';
import { CardMountCfg, SyncContentHeight } from './card-mount-cfg';
import {
  EffectCleanupRegisterFn,
  ErrorHandler,
  Renderer2,
  ViewContainerRef,
} from '@angular/core';

export function mountWcCard(
  cfg: CardMountCfg,
  container: ViewContainerRef,
  onCleanup: EffectCleanupRegisterFn,
  renderer: Renderer2,
  onMounted?: (content: DashboardCardContent) => void,
  beforeRequestAdapter?: BeforeRequest,
  afterRequestAdapter?: AfterRequest,
  actionsHookAdapter?: ActionsHook,
): SyncContentHeight {
  const host: HTMLElement = container.element.nativeElement;
  const element: HTMLElement = renderer.createElement(cfg.component);
  const registry = element.ownerDocument.defaultView?.customElements;
  let cancel: (() => void) | undefined;
  let disposed = false;
  let observer: ResizeObserver | undefined;
  let mounted = false;
  let contentHeightSet = false;

  const syncContentHeight = (): void => {
    if (!mounted || disposed) return;
    if (!cfg.autoHeight?.()) {
      renderer.setProperty(element, 'contentHeight', host.clientHeight);
      contentHeightSet = true;
    } else if (contentHeightSet) {
      renderer.setProperty(element, 'contentHeight', undefined);
      contentHeightSet = false;
    }
  };

  onCleanup(() => {
    disposed = true;
    cancel?.();
    observer?.disconnect();
    if (element.parentNode === host) renderer.removeChild(host, element);
  });

  const mount = (definedRegistry?: CustomElementRegistry): void => {
    if (disposed) return;
    definedRegistry?.upgrade(element);

    const acceptsBeforeRequest =
      beforeRequestAdapter && 'beforeRequest' in element;
    if (acceptsBeforeRequest) {
      renderer.setProperty(element, 'beforeRequest', beforeRequestAdapter);
    }
    const acceptsAfterRequest =
      afterRequestAdapter && 'afterRequest' in element;
    if (acceptsAfterRequest) {
      renderer.setProperty(element, 'afterRequest', afterRequestAdapter);
    }
    const acceptsActionsHook = actionsHookAdapter && 'actionsHook' in element;
    if (acceptsActionsHook) {
      renderer.setProperty(element, 'actionsHook', actionsHookAdapter);
    }
    for (const [key, value] of Object.entries(cfg.componentInputs ?? {})) {
      if (acceptsBeforeRequest && key === 'beforeRequest') continue;
      if (acceptsAfterRequest && key === 'afterRequest') continue;
      if (acceptsActionsHook && key === 'actionsHook') continue;
      renderer.setProperty(element, key, value);
    }

    if (disposed) return;
    renderer.appendChild(host, element);
    if (disposed) return;

    mounted = true;
    observer = new ResizeObserver(syncContentHeight);
    observer.observe(host);
    syncContentHeight();
    if (!disposed) onMounted?.(element as DashboardCardContent);
  };

  const name = element.localName;
  if (
    (beforeRequestAdapter || afterRequestAdapter || actionsHookAdapter) &&
    name.includes('-') &&
    registry &&
    !registry.get(name)
  ) {
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

  return syncContentHeight;
}
