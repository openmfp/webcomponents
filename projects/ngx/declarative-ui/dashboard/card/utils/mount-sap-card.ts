import { DashboardCardContent, MountCfg } from '../../models';
import { EffectCleanupRegisterFn, ViewContainerRef } from '@angular/core';

export interface SapComponentCreatedEvent {
  getParameter(name: 'component'): DashboardCardContent;
}

export type SapUiRequire = (
  deps: string[],
  cb: (
    ComponentContainer: new (cfg: {
      name: string;
      manifest: boolean;
      async: boolean;
      height: string;
      settings: Record<string, unknown>;
      componentCreated: (event: SapComponentCreatedEvent) => void;
    }) => { placeAt(el: HTMLElement): void; destroy(): void },
  ) => void,
) => void;

export function mountSapCard(
  cfg: MountCfg,
  container: ViewContainerRef,
  onCleanup: EffectCleanupRegisterFn,
  onMounted?: (content: DashboardCardContent) => void,
): void {
  const host = container.element.nativeElement;

  let sapContainer: { destroy(): void } | null = null;
  let isDestroyed = false;
  const sapRequire = (
    window as unknown as { sap?: { ui: { require: SapUiRequire } } }
  ).sap?.ui?.require;

  if (sapRequire) {
    sapRequire(['sap/ui/core/ComponentContainer'], (ComponentContainer) => {
      if (isDestroyed) return;

      const container = new ComponentContainer({
        name: cfg.component,
        manifest: true,
        async: true,
        height: '100%',
        settings: cfg.componentInputs ?? {},
        componentCreated: (event) => {
          if (isDestroyed) return;
          onMounted?.(event.getParameter('component'));
        },
      });

      container.placeAt(host);
      sapContainer = container;
    });
  } else {
    console.error('[DashboardCard] SAP UI5 is not available on window.sap');
  }

  onCleanup(() => {
    isDestroyed = true;
    sapContainer?.destroy();
    host.innerHTML = '';
  });
}
