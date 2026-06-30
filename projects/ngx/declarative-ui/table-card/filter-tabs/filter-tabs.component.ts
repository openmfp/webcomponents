import { FieldFilterDefinition } from '../models/configs';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  OnDestroy,
  ViewEncapsulation,
  afterNextRender,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Icon } from '@fundamental-ngx/ui5-webcomponents/icon';
import '@ui5/webcomponents-icons/dist/navigation-left-arrow.js';
import '@ui5/webcomponents-icons/dist/navigation-right-arrow.js';

/**
 * Horizontal filter-tab strip rendered above the table by
 * `<mfp-declarative-table-card>`. Internal to the table-card — not part of the
 * package public API.
 *
 * Renders one tab per {@link FieldFilterDefinition}. When the combined width
 * exceeds the host width, left/right chevron buttons appear and scroll the
 * strip by ~70% of the visible width per click; the native scrollbar is hidden.
 *
 * Initial active tab:
 * - The first `FieldFilterDefinition` with `default: true`, if any.
 * - Otherwise the first tab in the array.
 *
 * The component owns the active-tab state; the host only needs to listen to
 * `tabChanged` and apply the picked filter to its data layer. If the host
 * wants an "All / no filter" option it must author it as a regular tab — the
 * strip never auto-prepends one. The output type still allows `undefined` for
 * forward compatibility with hosts that want to clear the selection.
 */
@Component({
  selector: 'mfp-filter-tabs',
  standalone: true,
  imports: [Icon],
  templateUrl: './filter-tabs.component.html',
  styleUrl: './filter-tabs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class FilterTabs implements OnDestroy {
  tabs = input.required<FieldFilterDefinition[]>();
  readonly tabChanged = output<FieldFilterDefinition | undefined>();

  protected activeTab = signal<FieldFilterDefinition | undefined>(undefined);
  protected stripRef = viewChild<ElementRef<HTMLDivElement>>('strip');
  protected canScrollLeft = signal(false);
  protected canScrollRight = signal(false);

  private readonly injector = inject(Injector);
  private resizeObserver?: ResizeObserver;

  constructor() {
    effect(() => {
      const tabs = this.tabs();
      const next = tabs.find((t) => t.default) ?? tabs[0];
      this.activeTab.set(next);
      afterNextRender(() => this.recomputeScrollState(), {
        injector: this.injector,
      });
    });

    afterNextRender(
      () => {
        const el = this.stripRef()?.nativeElement;
        if (!el) return;
        this.resizeObserver = new ResizeObserver(() =>
          this.recomputeScrollState(),
        );
        this.resizeObserver.observe(el);
        this.recomputeScrollState();
      },
      { injector: this.injector },
    );
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  /**
   * Reflects the carousel's current `scrollLeft` into signals that drive the
   * chevron buttons' visibility. Called on init, on user scroll, and after
   * any size change.
   */
  protected recomputeScrollState(): void {
    const el = this.stripRef()?.nativeElement;
    if (!el) {
      this.canScrollLeft.set(false);
      this.canScrollRight.set(false);
      return;
    }
    const { scrollLeft, scrollWidth, clientWidth } = el;
    // 1px tolerance — browsers occasionally report fractional pixel widths.
    this.canScrollLeft.set(scrollLeft > 1);
    this.canScrollRight.set(scrollLeft + clientWidth < scrollWidth - 1);
  }

  protected onScroll(): void {
    this.recomputeScrollState();
  }

  /**
   * Scrolls the strip by ~70% of its visible width so one filter overlaps
   * the previous viewport — matches the carousel idiom in SAP and Material.
   */
  protected scroll(direction: 'left' | 'right'): void {
    const el = this.stripRef()?.nativeElement;
    if (!el) return;
    const delta = el.clientWidth * 0.7 * (direction === 'right' ? 1 : -1);
    el.scrollBy({ left: delta, behavior: 'smooth' });
  }

  protected select(tab: FieldFilterDefinition): void {
    this.activeTab.set(tab);
    this.tabChanged.emit(tab);
  }
}
