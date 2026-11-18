import type {
  ActionsHook,
  AfterRequest,
  BeforeRequest,
} from '../../../../services/data-fetch.model';
import { DashboardCardContent } from '../../models';
import { CardMountCfg, SyncContentHeight } from './card-mount-cfg';
import {
  getRegisteredDashboardCardComponent,
  warnForUnknownDashboardCardInput,
} from './dashboard-card-registry';
import { EffectCleanupRegisterFn, ViewContainerRef } from '@angular/core';

export function mountAngularCard(
  cfg: CardMountCfg,
  angularHost: ViewContainerRef,
  onCleanup: EffectCleanupRegisterFn,
  onMounted?: (content: DashboardCardContent) => void,
  beforeRequestAdapter?: BeforeRequest,
  afterRequestAdapter?: AfterRequest,
  actionsHookAdapter?: ActionsHook,
): SyncContentHeight | undefined {
  const registeredComponent = getRegisteredDashboardCardComponent(
    cfg.component,
  );

  if (!registeredComponent) {
    console.warn(
      `[DashboardCard] Angular component "${cfg.component}" is not registered`,
    );
    return undefined;
  }

  const componentRef = angularHost.createComponent(
    registeredComponent.componentType,
  );

  for (const [inputName, value] of Object.entries(cfg.componentInputs ?? {})) {
    const templateName = registeredComponent.inputs.get(inputName);

    if (!templateName) {
      warnForUnknownDashboardCardInput(cfg.component, inputName);
      continue;
    }

    componentRef.setInput(templateName, value);
  }

  const beforeRequestInput = registeredComponent.inputs.get('beforeRequest');
  if (beforeRequestInput && beforeRequestAdapter) {
    componentRef.setInput(beforeRequestInput, beforeRequestAdapter);
  }

  const afterRequestInput = registeredComponent.inputs.get('afterRequest');
  if (afterRequestInput && afterRequestAdapter) {
    componentRef.setInput(afterRequestInput, afterRequestAdapter);
  }

  const actionsHookInput = registeredComponent.inputs.get('actionsHook');
  if (actionsHookInput && actionsHookAdapter) {
    componentRef.setInput(actionsHookInput, actionsHookAdapter);
  }

  const contentHeightInput = registeredComponent.inputs.get('contentHeight');
  let observer: ResizeObserver | undefined;
  let syncContentHeight: SyncContentHeight | undefined;

  if (contentHeightInput) {
    const host = angularHost.element.nativeElement as HTMLElement;
    let contentHeightSet = false;
    syncContentHeight = () => {
      if (!cfg.autoHeight?.()) {
        componentRef.setInput(contentHeightInput, host.clientHeight);
        contentHeightSet = true;
      } else if (contentHeightSet) {
        componentRef.setInput(contentHeightInput, undefined);
        contentHeightSet = false;
      } else {
        return;
      }
      componentRef.changeDetectorRef.detectChanges();
    };
    observer = new ResizeObserver(syncContentHeight);
    observer.observe(host);
    syncContentHeight();
  }

  componentRef.changeDetectorRef.detectChanges();
  onMounted?.(componentRef.instance as DashboardCardContent);

  onCleanup(() => {
    observer?.disconnect();
    angularHost.clear();
  });

  return syncContentHeight;
}
