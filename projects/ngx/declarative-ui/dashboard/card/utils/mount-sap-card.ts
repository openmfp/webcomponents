import { CardConfig } from '../../models';
import { EffectCleanupRegisterFn, ViewContainerRef } from '@angular/core';

export type SapUiRequire = (
  deps: string[],
  cb: (
    ComponentContainer: new (cfg: {
      name: string;
      manifest: boolean;
      async: boolean;
      settings: Record<string, unknown>;
    }) => { placeAt(el: HTMLElement): void; destroy(): void },
  ) => void,
) => void;

export function mountSapCard(
  cfg: CardConfig,
  container: ViewContainerRef,
  onCleanup: EffectCleanupRegisterFn,
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
        settings: cfg.componentInputs ?? {},
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
