import { Component, ViewEncapsulation } from '@angular/core';
import { List } from '@fundamental-ngx/ui5-webcomponents/list';
import { ListItemStandard } from '@fundamental-ngx/ui5-webcomponents/list-item-standard';
import { Title } from '@fundamental-ngx/ui5-webcomponents/title';

@Component({
  selector: 'mfp-whats-new',
  imports: [List, ListItemStandard, Title],
  templateUrl: './whats-new.component.html',
  styleUrl: './whats-new.component.scss',
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class WhatsNew {
  readonly headlines = [
    {
      title: 'Kubernetes 1.32 Released',
      description: 'Improved scheduling, new APIs and graduated features.',
      icon: 'cloud',
    },
    {
      title: 'Angular 20 Signals Stable',
      description: 'Signal-based reactivity is now production-ready.',
      icon: 'developer-settings',
    },
    {
      title: 'WebAssembly WASI 2.0 Preview',
      description: 'System interface advances bring server-side WASM closer.',
      icon: 'technical-object',
    },
    {
      title: 'OpenTelemetry Hits 1.0',
      description: 'Unified observability standard lands in enterprise stacks.',
      icon: 'monitor-payments',
    },
    {
      title: 'Rust Enters Linux Kernel Mainstream',
      description: 'More subsystems accept Rust driver contributions.',
      icon: 'settings',
    },
    {
      title: 'TypeScript 5.8 Performance Boost',
      description: 'Declaration emit is up to 10x faster in large projects.',
      icon: 'accelerated',
    },
  ];
}
