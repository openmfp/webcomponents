import { TableCardSearch } from './table-card-search.component';
import { ButtonSettings } from '../../models';
import { TableCardSearchConfig } from '../models/search-config';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

type Comp = TableCardSearch;
type Fixture = ComponentFixture<Comp>;

function root(fixture: Fixture): ShadowRoot | HTMLElement {
  return fixture.nativeElement.shadowRoot ?? fixture.nativeElement;
}

function fakeSearchEvent(opts: { value?: string; scopeValue?: string } = {}): Event {
  return { target: { value: opts.value ?? '', scopeValue: opts.scopeValue } } as unknown as Event;
}

function setup(opts: {
  searchConfig?: TableCardSearchConfig;
  searchButtonConfig?: Partial<ButtonSettings>;
} = {}): { fixture: Fixture; component: Comp } {
  const fixture = TestBed.createComponent(TableCardSearch);
  const component = fixture.componentInstance;

  fixture.componentRef.setInput('searchConfig', opts.searchConfig ?? {});
  if (opts.searchButtonConfig !== undefined) {
    fixture.componentRef.setInput('searchButtonConfig', opts.searchButtonConfig);
  }

  fixture.detectChanges();
  return { fixture, component };
}

describe('TableCardSearch', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [TableCardSearch],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create', () => {
    const { component } = setup();
    expect(component).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  // 1. Toggle UX — state machine
  // -------------------------------------------------------------------------

  describe('search toggle UX', () => {
    it('searchExpanded starts as false', () => {
      const { component } = setup();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).searchExpanded()).toBe(false);
    });

    it('toggleSearch() sets searchExpanded to true on first call', () => {
      const { component } = setup();
      component.toggleSearch();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).searchExpanded()).toBe(true);
    });

    it('toggleSearch() starts collapsing on second call when already expanded', () => {
      const { component } = setup();
      component.toggleSearch();
      component.toggleSearch();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).searchCollapsing()).toBe(true);
    });

    it('onSearchAnimationEnd() transitions state to collapsed after collapse animation', () => {
      const { component } = setup();
      component.toggleSearch();
      component.toggleSearch();
      component.onSearchAnimationEnd();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).searchCollapsing()).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).searchExpanded()).toBe(false);
    });

    it('onSearchAnimationEnd() does nothing when not collapsing', () => {
      const { component } = setup();
      component.toggleSearch();
      component.onSearchAnimationEnd();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).searchExpanded()).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Rendering
  // -------------------------------------------------------------------------

  describe('rendering', () => {
    it('does not render ui5-search when alwaysOnDisplay is false and not expanded', () => {
      const { fixture } = setup({ searchConfig: { placeholder: 'Search pods…' } });
      expect(root(fixture).querySelector('ui5-search')).toBeNull();
    });

    it('renders the search toggle button when alwaysOnDisplay is false', () => {
      const { fixture } = setup({ searchConfig: { placeholder: 'Search pods…' } });
      expect(root(fixture).querySelector('.card__search-btn')).not.toBeNull();
    });

    it('renders ui5-search after toggle button is clicked', () => {
      const { fixture, component } = setup({ searchConfig: { placeholder: 'Search pods…' } });
      component.toggleSearch();
      fixture.detectChanges();
      expect(root(fixture).querySelector('ui5-search')).not.toBeNull();
    });

    it('renders ui5-search inline when alwaysOnDisplay is true', () => {
      const { fixture } = setup({ searchConfig: { placeholder: 'Search pods…', alwaysOnDisplay: true } });
      expect(root(fixture).querySelector('ui5-search')).not.toBeNull();
    });

    it('does not render the search toggle button when alwaysOnDisplay is true', () => {
      const { fixture } = setup({ searchConfig: { placeholder: 'Search pods…', alwaysOnDisplay: true } });
      expect(root(fixture).querySelector('.card__search-btn')).toBeNull();
    });

    it('binds placeholder from searchConfig to ui5-search', () => {
      const { fixture } = setup({ searchConfig: { placeholder: 'Search pods…', alwaysOnDisplay: true } });
      const search = root(fixture).querySelector('ui5-search');
      expect((search as HTMLElement & { placeholder?: string })?.placeholder).toBe('Search pods…');
    });

    it('binds accessibleName from searchConfig', () => {
      const { fixture } = setup({ searchConfig: { accessibleName: 'Pod search', alwaysOnDisplay: true } });
      const search = root(fixture).querySelector('ui5-search');
      expect((search as HTMLElement & { accessibleName?: string })?.accessibleName).toBe('Pod search');
    });

    it('defaults showClearIcon to true when not specified', () => {
      const { fixture } = setup({ searchConfig: { alwaysOnDisplay: true } });
      const search = root(fixture).querySelector('ui5-search');
      expect((search as HTMLElement & { showClearIcon?: boolean })?.showClearIcon).toBe(true);
    });

    it('forwards showClearIcon: false when configured', () => {
      const { fixture } = setup({ searchConfig: { alwaysOnDisplay: true, showClearIcon: false } });
      const search = root(fixture).querySelector('ui5-search');
      expect((search as HTMLElement & { showClearIcon?: boolean })?.showClearIcon).toBe(false);
    });

    it('renders one ui5-search-scope per scopes entry', () => {
      const { fixture } = setup({
        searchConfig: {
          alwaysOnDisplay: true,
          scopes: [
            { label: 'All', value: 'all' },
            { label: 'My Contributions', value: 'mine' },
          ],
        },
      });
      expect(root(fixture).querySelectorAll('ui5-search-scope')).toHaveLength(2);
    });

    it('renders zero ui5-search-scope elements when scopes array is empty', () => {
      const { fixture } = setup({ searchConfig: { alwaysOnDisplay: true, scopes: [] } });
      expect(root(fixture).querySelectorAll('ui5-search-scope')).toHaveLength(0);
    });

    it('sets text and value on each ui5-search-scope', () => {
      const { fixture } = setup({
        searchConfig: { alwaysOnDisplay: true, scopes: [{ label: 'All', value: 'all' }] },
      });
      const scope = root(fixture).querySelector('ui5-search-scope') as HTMLElement & {
        text?: string;
        value?: string;
      };
      expect(scope?.text).toBe('All');
      expect(scope?.value).toBe('all');
    });
  });

  // -------------------------------------------------------------------------
  // 3. searchChanged output (debounced)
  // -------------------------------------------------------------------------

  describe('searchChanged output', () => {
    it('emits searchChanged with { value } after 300ms debounce on ui5Input', () => {
      const { fixture, component } = setup({ searchConfig: { alwaysOnDisplay: true } });
      fixture.detectChanges();

      const emitted: { value: string; scope?: string }[] = [];
      component.searchChanged.subscribe((e) => emitted.push(e));

      component.onSearchInput(fakeSearchEvent({ value: 'alpha' }));
      expect(emitted).toHaveLength(0);
      vi.advanceTimersByTime(300);
      expect(emitted).toHaveLength(1);
      expect(emitted[0]).toEqual({ value: 'alpha', scope: undefined });
    });

    it('does not emit searchChanged before the 300ms debounce elapses', () => {
      const { fixture, component } = setup({ searchConfig: { alwaysOnDisplay: true } });
      fixture.detectChanges();

      const emitted: unknown[] = [];
      component.searchChanged.subscribe((e) => emitted.push(e));

      component.onSearchInput(fakeSearchEvent({ value: 'beta' }));
      vi.advanceTimersByTime(299);
      expect(emitted).toHaveLength(0);
    });

    it('includes active scope in searchChanged payload', () => {
      const { fixture, component } = setup({
        searchConfig: {
          alwaysOnDisplay: true,
          scopes: [
            { label: 'All', value: 'all' },
            { label: 'Mine', value: 'mine' },
          ],
        },
      });
      fixture.detectChanges();

      const emitted: { value: string; scope?: string }[] = [];
      component.searchChanged.subscribe((e) => emitted.push(e));

      component.onSearchScopeChange(fakeSearchEvent({ value: '', scopeValue: 'mine' }));
      component.onSearchInput(fakeSearchEvent({ value: 'pod' }));
      vi.advanceTimersByTime(300);

      expect(emitted[0]).toEqual({ value: 'pod', scope: 'mine' });
    });

    it('emits searchChanged with empty value after simulated clear', () => {
      const { fixture, component } = setup({ searchConfig: { alwaysOnDisplay: true } });
      fixture.detectChanges();

      component.onSearchInput(fakeSearchEvent({ value: 'foo' }));
      vi.advanceTimersByTime(300);

      const emitted: { value: string; scope?: string }[] = [];
      component.searchChanged.subscribe((e) => emitted.push(e));

      component.onSearchInput(fakeSearchEvent({ value: '' }));
      vi.advanceTimersByTime(300);

      expect(emitted[0]).toEqual({ value: '', scope: undefined });
    });
  });

  // -------------------------------------------------------------------------
  // 4. searchSubmit output (synchronous)
  // -------------------------------------------------------------------------

  describe('searchSubmit output', () => {
    it('emits searchSubmit synchronously on ui5Search event', () => {
      const { fixture, component } = setup({ searchConfig: { alwaysOnDisplay: true } });
      fixture.detectChanges();

      const emitted: { value: string; scope?: string }[] = [];
      component.searchSubmit.subscribe((e) => emitted.push(e));

      component.onSearchSubmit(fakeSearchEvent({ value: 'my-pod' }));
      expect(emitted).toHaveLength(1);
      expect(emitted[0]).toEqual({ value: 'my-pod', scope: undefined });
    });

    it('includes scope in searchSubmit when a scope is active', () => {
      const { component } = setup({ searchConfig: { alwaysOnDisplay: true } });

      const emitted: { value: string; scope?: string }[] = [];
      component.searchSubmit.subscribe((e) => emitted.push(e));

      component.onSearchSubmit(fakeSearchEvent({ value: 'redis', scopeValue: 'all' }));
      expect(emitted[0]).toEqual({ value: 'redis', scope: 'all' });
    });
  });

  // -------------------------------------------------------------------------
  // 5. scopeChanged output (synchronous)
  // -------------------------------------------------------------------------

  describe('scopeChanged output', () => {
    it('emits scopeChanged synchronously on ui5ScopeChange event', () => {
      const { component } = setup({ searchConfig: { alwaysOnDisplay: true } });

      const emitted: { value: string; scope?: string }[] = [];
      component.scopeChanged.subscribe((e) => emitted.push(e));

      component.onSearchScopeChange(fakeSearchEvent({ value: '', scopeValue: 'mine' }));
      expect(emitted).toHaveLength(1);
      expect(emitted[0]).toEqual({ value: '', scope: 'mine' });
    });

    it('includes in-flight search text in scopeChanged payload', () => {
      const { component } = setup({ searchConfig: { alwaysOnDisplay: true } });

      component.onSearchInput(fakeSearchEvent({ value: 'cache' }));

      const emitted: { value: string; scope?: string }[] = [];
      component.scopeChanged.subscribe((e) => emitted.push(e));

      component.onSearchScopeChange(fakeSearchEvent({ value: 'cache', scopeValue: 'all' }));
      expect(emitted[0]).toEqual({ value: 'cache', scope: 'all' });
    });

    it('updates activeScope so subsequent searchChanged carries new scope', () => {
      const { component } = setup({ searchConfig: { alwaysOnDisplay: true } });

      component.onSearchScopeChange(fakeSearchEvent({ value: '', scopeValue: 'mine' }));

      const emitted: { value: string; scope?: string }[] = [];
      component.searchChanged.subscribe((e) => emitted.push(e));

      component.onSearchInput(fakeSearchEvent({ value: 'pod' }));
      vi.advanceTimersByTime(300);

      expect(emitted[0]?.scope).toBe('mine');
    });
  });

  // -------------------------------------------------------------------------
  // 6. Collapse preserves search state
  // -------------------------------------------------------------------------

  describe('collapse preserves search state', () => {
    it('collapsing does not emit searchChanged synchronously', () => {
      const { component } = setup({ searchConfig: { placeholder: 'Search pods…' } });

      component.toggleSearch();
      component.onSearchInput(fakeSearchEvent({ value: 'alpha' }));
      vi.advanceTimersByTime(300);

      const emitted: unknown[] = [];
      component.searchChanged.subscribe((e) => emitted.push(e));

      component.toggleSearch();
      expect(emitted).toHaveLength(0);
    });

    it('searchControl.value is preserved after collapse animation ends', () => {
      const { component } = setup({ searchConfig: { placeholder: 'Search pods…' } });

      component.toggleSearch();
      component.onSearchInput(fakeSearchEvent({ value: 'preserved-query' }));
      component.toggleSearch();
      component.onSearchAnimationEnd();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).searchControl.value).toBe('preserved-query');
    });

    it('re-expanding after collapse shows the same searchControl value', () => {
      const { component } = setup({ searchConfig: { placeholder: 'Search pods…' } });

      component.toggleSearch();
      component.onSearchInput(fakeSearchEvent({ value: 'in-flight' }));
      component.toggleSearch();
      component.onSearchAnimationEnd();
      component.toggleSearch();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).searchControl.value).toBe('in-flight');
    });

    it('active scope is preserved after collapse', () => {
      const { component } = setup({
        searchConfig: { placeholder: 'Search pods…', scopes: [{ label: 'Mine', value: 'mine' }] },
      });

      component.toggleSearch();
      component.onSearchScopeChange(fakeSearchEvent({ value: '', scopeValue: 'mine' }));
      component.toggleSearch();
      component.onSearchAnimationEnd();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).activeScope()).toBe('mine');
    });
  });

  // -------------------------------------------------------------------------
  // 7. toggleSearch() is a no-op when alwaysOnDisplay is true
  // -------------------------------------------------------------------------

  describe('toggleSearch() is a no-op when alwaysOnDisplay is true', () => {
    it('does not change searchState when alwaysOnDisplay is true', () => {
      const { component } = setup({ searchConfig: { alwaysOnDisplay: true } });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const before = (component as any).searchState();
      component.toggleSearch();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).searchState()).toBe(before);
    });
  });

  // -------------------------------------------------------------------------
  // 8. searchConfig.value binding
  // -------------------------------------------------------------------------

  describe('searchConfig.value binding', () => {
    it('initialises searchControl with config.value on creation', () => {
      const { component } = setup({ searchConfig: { value: 'initial' } });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).searchControl.value).toBe('initial');
    });

    it('updates searchControl when searchConfig.value changes', () => {
      const { fixture, component } = setup({ searchConfig: { value: 'first' } });
      fixture.componentRef.setInput('searchConfig', { value: 'second' });
      fixture.detectChanges();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).searchControl.value).toBe('second');
    });

    it('does not emit searchChanged when config.value is set to the same value', () => {
      const { fixture, component } = setup({ searchConfig: { alwaysOnDisplay: true } });
      vi.advanceTimersByTime(300); // flush any pending init emission

      const emitted: unknown[] = [];
      component.searchChanged.subscribe((e) => emitted.push(e));

      fixture.componentRef.setInput('searchConfig', { alwaysOnDisplay: true, value: 'same' });
      fixture.detectChanges();
      vi.advanceTimersByTime(300);
      emitted.length = 0; // clear first emission

      fixture.componentRef.setInput('searchConfig', { alwaysOnDisplay: true, value: 'same' });
      fixture.detectChanges();
      vi.advanceTimersByTime(300);
      expect(emitted).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // 9. searchButtonConfig input overrides
  // -------------------------------------------------------------------------

  describe('searchButtonConfig input', () => {
    it('applies custom icon and tooltip to the search toggle button', () => {
      const { fixture } = setup({
        searchConfig: { placeholder: 'Search pods…' },
        searchButtonConfig: { icon: 'filter', tooltip: 'Open filter' },
      });

      const btn = root(fixture).querySelector('.card__search-btn') as HTMLElement & {
        icon?: string;
        tooltip?: string;
      };
      expect(btn?.icon).toBe('filter');
      expect(btn?.tooltip).toBe('Open filter');
    });
  });
});
