import { CardConfig } from '../models';
import {
  getRegisteredDashboardCardComponent,
  warnForUnknownDashboardCardInput,
} from './dashboard-card-registry';
import {
  Component,
  ComponentRef,
  ElementRef,
  Renderer2,
  ViewContainerRef,
  ViewEncapsulation,
  effect,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { Button } from '@fundamental-ngx/ui5-webcomponents/button';

@Component({
  selector: 'mfp-dashboard-card',
  imports: [Button],
  templateUrl: './dashboard-card.component.html',
  styleUrl: './dashboard-card.component.scss',
  encapsulation: ViewEncapsulation.ShadowDom,
  host: {
    '[style.grid-column]': '"span " + (card().w ?? 1)',
    '[style.grid-row]': '"span " + (card().h ?? 1)',
  },
})
export class DashboardCard {
  card = input.required<CardConfig>();
  editMode = input<boolean>(false);
  readonly removeCard = output<void>();

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

      const registeredComponent = getRegisteredDashboardCardComponent(
        cfg.component,
      );

      if (registeredComponent) {
        const componentRef = angularHost.createComponent(
          registeredComponent.componentType,
        );

        this.applyAngularInputs(
          componentRef,
          cfg.component,
          registeredComponent.inputs,
          cfg.componentInputs ?? {},
        );
        componentRef.changeDetectorRef.detectChanges();

        onCleanup(() => {
          this.clearAngularHost(angularHost);
        });

        return;
      }

      const element = this.renderer.createElement(cfg.component);

      for (const [key, value] of Object.entries(cfg.componentInputs ?? {})) {
        this.renderer.setProperty(element, key, value);
      }

      this.renderer.appendChild(elementHost.nativeElement, element);

      onCleanup(() => {
        this.clearElementHost(elementHost.nativeElement);
      });
    });
  }

  private applyAngularInputs(
    componentRef: ComponentRef<unknown>,
    selector: string,
    bindings: ReadonlyMap<
      string,
      {
        propName: string;
        templateName: string;
      }
    >,
    componentInputs: Record<string, unknown>,
  ): void {
    for (const [inputName, value] of Object.entries(componentInputs)) {
      const binding = bindings.get(inputName);

      if (!binding) {
        warnForUnknownDashboardCardInput(selector, inputName);
        continue;
      }

      componentRef.setInput(binding.templateName, value);
    }
  }

  private clearAngularHost(host: ViewContainerRef): void {
    host.clear();
  }

  private clearElementHost(host: HTMLElement): void {
    host.innerHTML = '';
  }
}
