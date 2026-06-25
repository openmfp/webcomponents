import { Scope, TableCardSearchConfig } from '../models/search-config';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  Injector,
  ViewEncapsulation,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { Search } from '@fundamental-ngx/ui5-webcomponents-fiori/search';
import { SearchScope } from '@fundamental-ngx/ui5-webcomponents-fiori/search-scope';
import '@ui5/webcomponents-icons/dist/search.js';
import { debounceTime } from 'rxjs';

interface Ui5SearchEventTarget {
  value?: string;
  scopeValue?: string;
}

@Component({
  selector: 'mfp-table-card-search',
  imports: [Search, SearchScope],
  templateUrl: './table-card-search.component.html',
  styleUrl: './table-card-search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.ShadowDom,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TableCardSearch {
  searchConfig = input.required<TableCardSearchConfig>();

  readonly searchChanged = output<string | null>();
  readonly searchSubmit = output<string | null>();
  readonly scopeChanged = output<Scope | undefined>();

  protected searchControl = new FormControl('');
  protected searchInputRef = viewChild<Search>('searchInput');
  protected activeScope = signal<Scope | undefined>(undefined);
  /**
   * Signal mirror of `searchConfig().value` used as the source of truth for
   * `[value]` on `<ui5-search>`. Decoupling the template binding from
   * `searchControl.value` prevents the bound property from snapping the
   * input back to a stale value during user interactions like clicking the
   * clear icon — ui5 owns the live displayed value, Angular only writes it
   * when the parent's config changes.
   */
  protected externalValue = signal('');

  private readonly injector = inject(Injector);

  constructor() {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed())
      .subscribe((value) => {
        this.searchChanged.emit(value);
      });

    effect(() => {
      const config = this.searchConfig();
      this.activeScope.set(config.initialScopeValue);

      const nextValue = config.value ?? '';
      if (this.searchControl.value !== nextValue) {
        this.searchControl.setValue(nextValue);
        this.externalValue.set(nextValue);
      }
    });

    // Workaround for ui5-select truncating long scope labels — see https://github.com/UI5/webcomponents/issues/13719
    setTimeout(() => {
      this.fixSelectWidth();
      this.fixSearchIconSize();
      this.fixSearchWidth();
      this.bindNativeInputListener();
    }, 0);
  }

  onSearchInput(event: Event): void {
    const target = event.target as Ui5SearchEventTarget | null;
    this.searchControl.setValue(target?.value ?? '');
  }

  onSearchSubmit(event: Event): void {
    const target = event.target as Ui5SearchEventTarget | null;
    this.searchSubmit.emit(target?.value ?? '');
  }

  onSearchScopeChange(event: Event): void {
    const target = event.target as Ui5SearchEventTarget | null;
    const scopeProperty = target?.scopeValue || undefined;
    const scope = this.searchConfig().scopes?.find(
      (e) => e.property === scopeProperty,
    );
    this.activeScope.set(scope);
    this.scopeChanged.emit(scope);
  }

  private fixSelectWidth(): void {
    if (!this.searchConfig().scopes?.length) return;
    const nativeEl = this.searchInputRef()?.elementRef.nativeElement as
      | HTMLElement
      | undefined;
    const ui5Select = nativeEl?.shadowRoot?.querySelector(
      'ui5-select',
    ) as HTMLElement | null;
    if (!ui5Select) return;
    ui5Select.style.maxWidth = 'none';
    ui5Select.style.minWidth = 'fit-content';
    const label = ui5Select.shadowRoot?.querySelector(
      '.ui5-select-label-root',
    ) as HTMLElement | null;
    if (label) {
      label.style.marginRight = '5px';
      label.style.overflow = 'visible';
      label.style.textOverflow = 'clip';
    }
  }

  /**
   * Workaround for the ui5 SearchField icon collapsing in some host theme
   * environments: the rule `.ui5-shell-search-field-icon::part(root){width:1rem;height:1rem}`
   * lives inside `<ui5-search>`'s own shadow root and is occasionally stripped
   * by the consumer's theming layer, leaving the icon mispositioned. We append
   * the missing width/height back into the same shadow root so the icon
   * renders identically to Storybook regardless of the host environment.
   */
  private fixSearchIconSize(): void {
    const nativeEl = this.searchInputRef()?.elementRef.nativeElement as
      | HTMLElement
      | undefined;
    const shadow = nativeEl?.shadowRoot;
    if (!shadow) return;

    // Idempotent — only inject once per component instance.
    const STYLE_ID = 'mfp-search-icon-size-fix';
    if (shadow.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .ui5-shell-search-field-icon::part(root) {
        width: 1rem;
        height: 1rem;
      }
    `;
    shadow.appendChild(style);
  }

  /**
   * Workaround for the ui5 SearchField shadow CSS pinning its host to
   * `min-width: 18rem; max-width: 36rem`. In dense toolbar layouts that
   * lets the search render almost twice the width it should. We replace
   * those rules with inline styles on the host so layout behavior lives
   * in one place (this method).
   */
  private fixSearchWidth(): void {
    const nativeEl = this.searchInputRef()?.elementRef.nativeElement as
      | HTMLElement
      | undefined;
    if (!nativeEl) return;
    nativeEl.style.flex = '1';
    nativeEl.style.minWidth = '150px';
    nativeEl.style.maxWidth = 'calc(20rem + 50px)';
    nativeEl.style.width = '100%';
  }

  /**
   * Some ngx wrapper / shadow-DOM event-bubbling edge-cases cause the
   * Angular `(ui5Input)` binding to miss the synthetic `input` event that
   * `<ui5-search>` fires when its clear icon is clicked. Bind a native
   * listener directly on the host element as an immediate, unconditional
   * path so the clear button always resets the search.
   *
   * The event fires for BOTH user typing and clear-icon clicks; reading
   * `target.value` (which ui5 sets to `""` before firing for clear) tells
   * us which case we're in. Typing is already handled by `(ui5Input)`'s
   * debounced flow — we only need to act here when the value is empty so
   * the clear is instant (no 300ms wait).
   */
  private bindNativeInputListener(): void {
    const nativeEl = this.searchInputRef()?.elementRef.nativeElement as
      | (HTMLElement & { value?: string })
      | undefined;
    if (!nativeEl) return;

    nativeEl.addEventListener('input', () => {
      const next = nativeEl.value ?? '';
      if (this.searchControl.value !== next) {
        this.searchControl.setValue(next);
      }
      // Fire the parent notification immediately on clear (skipping the
      // 300ms debounce that exists for typed input).
      if (next === '') {
        this.searchChanged.emit('');
      }
    });
  }
}
