import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  Injector,
  ViewEncapsulation,
  afterNextRender,
  computed,
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
import { Button } from '@fundamental-ngx/ui5-webcomponents/button';
import '@ui5/webcomponents-icons/dist/search.js';
import { debounceTime } from 'rxjs';
import { ButtonSettings } from '../../models';
import { TableCardSearchConfig } from '../models/search-config';

type SearchState = 'collapsed' | 'expanded' | 'collapsing';

interface Ui5SearchEventTarget {
  value?: string;
  scopeValue?: string;
}

@Component({
  selector: 'mfp-table-card-search',
  imports: [Button, Search, SearchScope],
  templateUrl: './table-card-search.component.html',
  styleUrl: './table-card-search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.ShadowDom,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TableCardSearch {
  searchConfig = input.required<TableCardSearchConfig>();
  searchButtonConfig = input<Partial<ButtonSettings> | undefined>(undefined);

  readonly searchChanged = output<{ value: string; scope?: string }>();
  readonly searchSubmit = output<{ value: string; scope?: string }>();
  readonly scopeChanged = output<{ value: string; scope?: string }>();

  protected searchState = signal<SearchState>('collapsed');
  protected searchExpanded = computed(() => this.searchState() !== 'collapsed');
  protected searchCollapsing = computed(
    () => this.searchState() === 'collapsing',
  );
  protected searchControl = new FormControl('');
  protected searchInputRef = viewChild<Search>('searchInput');
  protected activeScope = signal<string | undefined>(undefined);
  protected alwaysOnDisplay = computed(
    () => this.searchConfig().alwaysOnDisplay === true,
  );

  private readonly injector = inject(Injector);

  constructor() {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed())
      .subscribe((value) => {
        this.searchChanged.emit({
          value: value ?? '',
          scope: this.activeScope(),
        });
      });

    effect(() => {
      this.activeScope.set(this.searchConfig().scopeValue);
    });
  }

  toggleSearch(): void {
    if (this.alwaysOnDisplay()) {
      return;
    }
    if (this.searchState() === 'expanded') {
      this.collapseSearch();
    } else if (this.searchState() === 'collapsed') {
      this.searchState.set('expanded');
      afterNextRender(
        () => {
          this.searchInputRef()?.elementRef.nativeElement.focus();
        },
        { injector: this.injector },
      );
    }
  }

  onSearchAnimationEnd(): void {
    if (this.searchCollapsing()) {
      this.searchState.set('collapsed');
    }
  }

  onSearchInput(event: Event): void {
    const target = event.target as Ui5SearchEventTarget | null;
    this.searchControl.setValue(target?.value ?? '');
  }

  onSearchSubmit(event: Event): void {
    const target = event.target as Ui5SearchEventTarget | null;
    this.searchSubmit.emit({
      value: target?.value ?? '',
      scope: target?.scopeValue || undefined,
    });
  }

  onSearchScopeChange(event: Event): void {
    const target = event.target as Ui5SearchEventTarget | null;
    const scope = target?.scopeValue || undefined;
    this.activeScope.set(scope);
    this.scopeChanged.emit({
      value: this.searchControl.value ?? '',
      scope,
    });
  }

  private collapseSearch(): void {
    this.searchState.set('collapsing');
  }
}
