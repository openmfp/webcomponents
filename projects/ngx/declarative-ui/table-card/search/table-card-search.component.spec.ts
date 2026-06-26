import { TableCardSearch } from './table-card-search.component';
import { Scope, TableCardSearchConfig } from '../models/search-config';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

type Comp = TableCardSearch;
type Fixture = ComponentFixture<Comp>;

const ALL_SCOPE: Scope = {
  id: 'all',
  label: 'All',
  value: '*',
  property: 'owner',
};
const MINE_SCOPE: Scope = {
  id: 'mine',
  label: 'My Contributions',
  value: 'me',
  property: 'owner',
};

function root(fixture: Fixture): ShadowRoot | HTMLElement {
  return fixture.nativeElement.shadowRoot ?? fixture.nativeElement;
}

function fakeSearchEvent(opts: { value?: string; scopeValue?: string } = {}): Event {
  return { target: { value: opts.value ?? '', scopeValue: opts.scopeValue } } as unknown as Event;
}

function setup(opts: {
  searchConfig?: TableCardSearchConfig;
} = {}): { fixture: Fixture; component: Comp } {
  const fixture = TestBed.createComponent(TableCardSearch);
  const component = fixture.componentInstance;

  fixture.componentRef.setInput('searchConfig', opts.searchConfig ?? {});

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
  // 1. Rendering
  // -------------------------------------------------------------------------

  describe('rendering', () => {
    it('always renders ui5-search when searchConfig is provided', () => {
      const { fixture } = setup({ searchConfig: { placeholder: 'Search pods…' } });
      expect(root(fixture).querySelector('ui5-search')).not.toBeNull();
    });

    it('does not render a search toggle button', () => {
      const { fixture } = setup({ searchConfig: { placeholder: 'Search pods…' } });
      expect(root(fixture).querySelector('.card__search-btn')).toBeNull();
    });

    it('binds placeholder from searchConfig to ui5-search', () => {
      const { fixture } = setup({ searchConfig: { placeholder: 'Search pods…' } });
      const search = root(fixture).querySelector('ui5-search');
      expect((search as HTMLElement & { placeholder?: string })?.placeholder).toBe('Search pods…');
    });

    it('binds accessibleName from searchConfig', () => {
      const { fixture } = setup({ searchConfig: { accessibleName: 'Pod search' } });
      const search = root(fixture).querySelector('ui5-search');
      expect((search as HTMLElement & { accessibleName?: string })?.accessibleName).toBe('Pod search');
    });

    it('defaults showClearIcon to true when not specified', () => {
      const { fixture } = setup({ searchConfig: {} });
      const search = root(fixture).querySelector('ui5-search');
      expect((search as HTMLElement & { showClearIcon?: boolean })?.showClearIcon).toBe(true);
    });

    it('forwards showClearIcon: false when configured', () => {
      const { fixture } = setup({ searchConfig: { showClearIcon: false } });
      const search = root(fixture).querySelector('ui5-search');
      expect((search as HTMLElement & { showClearIcon?: boolean })?.showClearIcon).toBe(false);
    });

    it('renders one ui5-search-scope per scopes entry', () => {
      const { fixture } = setup({
        searchConfig: {
          scopes: [ALL_SCOPE, MINE_SCOPE],
        },
      });
      expect(root(fixture).querySelectorAll('ui5-search-scope')).toHaveLength(2);
    });

    it('renders zero ui5-search-scope elements when scopes array is empty', () => {
      const { fixture } = setup({ searchConfig: { scopes: [] } });
      expect(root(fixture).querySelectorAll('ui5-search-scope')).toHaveLength(0);
    });

    it('sets text from label and value from id on each ui5-search-scope', () => {
      const { fixture } = setup({
        searchConfig: { scopes: [ALL_SCOPE] },
      });
      const scope = root(fixture).querySelector('ui5-search-scope') as HTMLElement & {
        text?: string;
        value?: string;
      };
      expect(scope?.text).toBe('All');
      // ui5-search-scope's `value` is the scope `id`, used by ui5 to match the
      // active scopeValue. The Scope.value field is forwarded separately on events.
      expect(scope?.value).toBe('all');
    });
  });

  // -------------------------------------------------------------------------
  // 2. searchChanged output (debounced)
  // -------------------------------------------------------------------------

  describe('searchChanged output', () => {
    it('emits searchChanged with the current value after 300ms debounce on ui5Input', () => {
      const { fixture, component } = setup({ searchConfig: {} });
      fixture.detectChanges();

      const emitted: (string | null)[] = [];
      component.searchChanged.subscribe((e) => emitted.push(e));

      component.onSearchInput(fakeSearchEvent({ value: 'alpha' }));
      expect(emitted).toHaveLength(0);
      vi.advanceTimersByTime(300);
      expect(emitted).toEqual(['alpha']);
    });

    it('does not emit searchChanged before the 300ms debounce elapses', () => {
      const { fixture, component } = setup({ searchConfig: {} });
      fixture.detectChanges();

      const emitted: (string | null)[] = [];
      component.searchChanged.subscribe((e) => emitted.push(e));

      component.onSearchInput(fakeSearchEvent({ value: 'beta' }));
      vi.advanceTimersByTime(299);
      expect(emitted).toHaveLength(0);
    });

    it('emits searchChanged with empty value after simulated clear', () => {
      const { fixture, component } = setup({ searchConfig: {} });
      fixture.detectChanges();

      component.onSearchInput(fakeSearchEvent({ value: 'foo' }));
      vi.advanceTimersByTime(300);

      const emitted: (string | null)[] = [];
      component.searchChanged.subscribe((e) => emitted.push(e));

      component.onSearchInput(fakeSearchEvent({ value: '' }));
      vi.advanceTimersByTime(300);

      expect(emitted).toEqual(['']);
    });
  });

  // -------------------------------------------------------------------------
  // 3. searchSubmit output (synchronous)
  // -------------------------------------------------------------------------

  describe('searchSubmit output', () => {
    it('emits searchSubmit synchronously on ui5Search event', () => {
      const { fixture, component } = setup({ searchConfig: {} });
      fixture.detectChanges();

      const emitted: (string | null)[] = [];
      component.searchSubmit.subscribe((e) => emitted.push(e));

      component.onSearchSubmit(fakeSearchEvent({ value: 'my-pod' }));
      expect(emitted).toEqual(['my-pod']);
    });

    it('forwards the current input value verbatim even when a scope is active', () => {
      const { component } = setup({
        searchConfig: { scopes: [ALL_SCOPE] },
      });

      // Activate a scope first.
      component.onSearchScopeChange(fakeSearchEvent({ value: '', scopeValue: 'all' }));

      const emitted: (string | null)[] = [];
      component.searchSubmit.subscribe((e) => emitted.push(e));

      // The scope is NOT bundled in the searchSubmit payload (decoupled events).
      component.onSearchSubmit(fakeSearchEvent({ value: 'redis', scopeValue: 'all' }));
      expect(emitted).toEqual(['redis']);
    });
  });

  // -------------------------------------------------------------------------
  // 4. scopeChanged output (synchronous)
  // -------------------------------------------------------------------------

  describe('scopeChanged output', () => {
    it('emits the matching Scope object synchronously on ui5ScopeChange event', () => {
      const { component } = setup({
        searchConfig: { scopes: [ALL_SCOPE, MINE_SCOPE] },
      });

      const emitted: (Scope | undefined)[] = [];
      component.scopeChanged.subscribe((e) => emitted.push(e));

      component.onSearchScopeChange(fakeSearchEvent({ value: '', scopeValue: 'mine' }));
      expect(emitted).toEqual([MINE_SCOPE]);
    });

    it('emits undefined when the event carries no matching scope id', () => {
      const { component } = setup({
        searchConfig: { scopes: [ALL_SCOPE, MINE_SCOPE] },
      });

      const emitted: (Scope | undefined)[] = [];
      component.scopeChanged.subscribe((e) => emitted.push(e));

      component.onSearchScopeChange(fakeSearchEvent({ value: '', scopeValue: 'nonexistent' }));
      expect(emitted).toEqual([undefined]);
    });

    it('emits undefined when the event omits a scopeValue', () => {
      const { component } = setup({
        searchConfig: { scopes: [ALL_SCOPE, MINE_SCOPE] },
      });

      const emitted: (Scope | undefined)[] = [];
      component.scopeChanged.subscribe((e) => emitted.push(e));

      component.onSearchScopeChange(fakeSearchEvent({ value: '' }));
      expect(emitted).toEqual([undefined]);
    });

    it('subsequent searchChanged is independent of scope (events are decoupled)', () => {
      const { component } = setup({
        searchConfig: { scopes: [MINE_SCOPE] },
      });

      component.onSearchScopeChange(fakeSearchEvent({ value: '', scopeValue: 'mine' }));

      const emitted: (string | null)[] = [];
      component.searchChanged.subscribe((e) => emitted.push(e));

      component.onSearchInput(fakeSearchEvent({ value: 'pod' }));
      vi.advanceTimersByTime(300);

      // searchChanged carries only the search text; the host correlates scope
      // and search text from their separate streams.
      expect(emitted).toEqual(['pod']);
    });
  });

  // -------------------------------------------------------------------------
  // 5. searchConfig.value binding
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
      const { fixture, component } = setup({ searchConfig: {} });
      vi.advanceTimersByTime(300); // flush any pending init emission

      const emitted: (string | null)[] = [];
      component.searchChanged.subscribe((e) => emitted.push(e));

      fixture.componentRef.setInput('searchConfig', { value: 'same' });
      fixture.detectChanges();
      vi.advanceTimersByTime(300);
      emitted.length = 0; // clear first emission

      fixture.componentRef.setInput('searchConfig', { value: 'same' });
      fixture.detectChanges();
      vi.advanceTimersByTime(300);
      expect(emitted).toHaveLength(0);
    });
  });
});
