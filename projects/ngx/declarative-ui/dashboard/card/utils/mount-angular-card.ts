import type {
  AfterRequestHook,
  BeforeRequest,
} from '../../../../services/data-fetch.model';
import { DashboardCardContent, MountCfg } from '../../models';
import {
  getRegisteredDashboardCardComponent,
  warnForUnknownDashboardCardInput,
} from './dashboard-card-registry';
import { EffectCleanupRegisterFn, ViewContainerRef } from '@angular/core';

export function mountAngularCard(
  cfg: MountCfg,
  angularHost: ViewContainerRef,
  onCleanup: EffectCleanupRegisterFn,
  onMounted?: (content: DashboardCardContent) => void,
  beforeRequest?: BeforeRequest,
  afterRequestHook?: AfterRequestHook,
): void {
  const registeredComponent = getRegisteredDashboardCardComponent(
    cfg.component,
  );

  if (!registeredComponent) {
    console.warn(
      `[DashboardCard] Angular component "${cfg.component}" is not registered`,
    );
    return;
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
  if (beforeRequestInput && beforeRequest) {
    componentRef.setInput(beforeRequestInput, beforeRequest);
  }

  const afterRequestInput = registeredComponent.inputs.get('afterRequestHook');
  if (afterRequestInput && afterRequestHook) {
    componentRef.setInput(afterRequestInput, afterRequestHook);
  }

  const contentHeightInput = registeredComponent.inputs.get('contentHeight');
  let observer: ResizeObserver | undefined;

  if (contentHeightInput) {
    const host = angularHost.element.nativeElement as HTMLElement;
    const apply = () => {
      componentRef.setInput(contentHeightInput, host.clientHeight);
      componentRef.changeDetectorRef.detectChanges();
    };
    observer = new ResizeObserver(apply);
    observer.observe(host);
    apply();
  }

  componentRef.changeDetectorRef.detectChanges();
  onMounted?.(componentRef.instance as DashboardCardContent);

  onCleanup(() => {
    observer?.disconnect();
    angularHost.clear();
  });
}
