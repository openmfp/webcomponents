import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';

type SapUiRequire = (
  deps: string[],
  cb: (ComponentContainer: new (cfg: { name: string; manifest: boolean; async: boolean }) => {
    placeAt(el: HTMLElement): void;
    destroy(): void;
  }) => void,
) => void;

@Component({
  selector: 'mfp-ui5-card-host',
  standalone: true,
  template: `<div #container style="width:100%;height:100%"></div>`,
  encapsulation: ViewEncapsulation.None,
})
export class UI5CardHostComponent implements AfterViewInit, OnDestroy {
  @Input() componentName = '';

  @ViewChild('container') containerRef!: ElementRef<HTMLDivElement>;
  private ui5Container: { destroy(): void } | null = null;

  ngAfterViewInit(): void {
    if (!this.componentName) return;

    const sapRequire = (
      window as unknown as { sap?: { ui: { require: SapUiRequire } } }
    ).sap?.ui?.require;
    if (!sapRequire) {
      console.error('[mfp-ui5-card-host] UI5 is not available on window.sap');
      return;
    }
    sapRequire(['sap/ui/core/ComponentContainer'], (ComponentContainer) => {
      const container = new ComponentContainer({
        name: this.componentName,
        manifest: true,
        async: true,
      });
      container.placeAt(this.containerRef.nativeElement);
      this.ui5Container = container;
    });
  }

  ngOnDestroy(): void {
    this.ui5Container?.destroy();
    this.ui5Container = null;
  }
}
