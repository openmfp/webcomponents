import { MountCfg } from '../../models';
import {
  getRegisteredDashboardCardComponent,
  warnForUnknownDashboardCardInput,
} from './dashboard-card-registry';
import { EffectCleanupRegisterFn, ViewContainerRef } from '@angular/core';

export function mountAngularCard(
  cfg: MountCfg,
  angularHost: ViewContainerRef,
  onCleanup: EffectCleanupRegisterFn,
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

  componentRef.changeDetectorRef.detectChanges();

  onCleanup(() => {
    angularHost.clear();
  });
}
