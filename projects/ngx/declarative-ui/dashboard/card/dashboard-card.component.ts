import { CARD_TYPES, CardConfig } from '../models';
import {
  getRegisteredDashboardCardComponent,
  warnForUnknownDashboardCardInput,
} from './dashboard-card-registry';
import {
  Component,
  EffectCleanupRegisterFn,
  ElementRef,
  Renderer2,
  ViewContainerRef,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { Button } from '@fundamental-ngx/ui5-webcomponents/button';

type SapUiRequire = (
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

@Component({
  selector: 'mfp-dashboard-card',
  imports: [Button],
  templateUrl: './dashboard-card.component.html',
  styleUrl: './dashboard-card.component.scss',
  encapsulation: ViewEncapsulation.Emulated,
  host: {
    '[style.grid-column]': 'gridColumn()',
    '[style.grid-row]': 'gridRow()',
  },
})
export class DashboardCard {
  card = input.required<CardConfig>();
  editMode = input<boolean>(false);
  readonly removeCard = output<void>();
  protected readonly gridColumn = computed(() => {
    const width = this.card().w ?? 12;
    return this.createGridTrack(this.card().x, width);
  });
  protected readonly gridRow = computed(() => {
    const height = this.card().h ?? 100;
    return this.createGridTrack(this.card().y, height);
  });

  private angularHost = viewChild('angularHost', { read: ViewContainerRef });
  private elementHost = viewChild<ElementRef<HTMLElement>>('elementHost');
  private renderer = inject(Renderer2);

  constructor() {
    effect((onCleanup) => {
      const angularHost = this.angularHost();
      const elementHost = this.elementHost();
      const cfg = this.card();
      if (!angularHost || !elementHost || !cfg.component) return;

      this.clearAngularHost(angularHost);
      this.clearElementHost(elementHost.nativeElement);

      switch (cfg.type) {
        case CARD_TYPES.SAP_UI:
          this.mountSapCard(cfg, elementHost.nativeElement, onCleanup);
          break;
        case CARD_TYPES.ANGULAR:
          this.mountAngularCard(cfg, angularHost, onCleanup);
          break;
        case CARD_TYPES.WC:
        default:
          this.mountWcCard(cfg, elementHost.nativeElement, onCleanup);
          break;
      }
    });
  }

  private mountSapCard(
    cfg: CardConfig,
    host: HTMLElement,
    onCleanup: EffectCleanupRegisterFn,
  ): void {
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
      this.clearElementHost(host);
    });
  }

  private mountAngularCard(
    cfg: CardConfig,
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

    for (const [inputName, value] of Object.entries(
      cfg.componentInputs ?? {},
    )) {
      const templateName = registeredComponent.inputs.get(inputName);

      if (!templateName) {
        warnForUnknownDashboardCardInput(cfg.component, inputName);
        continue;
      }

      componentRef.setInput(templateName, value);
    }

    componentRef.changeDetectorRef.detectChanges();

    onCleanup(() => {
      this.clearAngularHost(angularHost);
    });
  }

  private mountWcCard(
    cfg: CardConfig,
    host: HTMLElement,
    onCleanup: EffectCleanupRegisterFn,
  ): void {
    const element = this.renderer.createElement(cfg.component);

    for (const [key, value] of Object.entries(cfg.componentInputs ?? {})) {
      this.renderer.setProperty(element, key, value);
    }

    this.renderer.appendChild(host, element);

    onCleanup(() => {
      this.clearElementHost(host);
    });
  }

  private clearAngularHost(host: ViewContainerRef): void {
    host.clear();
  }

  private clearElementHost(host: HTMLElement): void {
    host.innerHTML = '';
  }

  private createGridTrack(start: number | undefined, span: number): string {
    if (start === undefined) {
      return `span ${span}`;
    }

    return `${start + 1} / span ${span}`;
  }
}
