import { ResourceField } from '../../resource-field/resource-field.component';
import {
  GenericResource,
  ResourceFieldButtonClickEvent,
  TableFieldDefinition,
} from '../models';
import { DeclarativeTable } from './declarative-table.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

type Fixture = ComponentFixture<DeclarativeTable<GenericResource>>;
type Comp = DeclarativeTable<GenericResource>;

function setup(opts: {
  columns: TableFieldDefinition[];
  resources?: GenericResource[];
  trackByPath?: string;
  totalItemsCount?: number;
  paginationLimit?: number;
  hasMore?: boolean;
  loadMode?: 'scroll' | 'button' | 'pager' | undefined;
  loadMoreButtonText?: string;
  height?: number;
  currentPage?: number;
  permissions?: Record<string, string[]>;
}): { fixture: Fixture; component: Comp } {
  const fixture: Fixture = TestBed.createComponent(
    DeclarativeTable as unknown as typeof DeclarativeTable<GenericResource>,
  );
  const component = fixture.componentInstance;
  fixture.componentRef.setInput('columns', opts.columns);
  fixture.componentRef.setInput('resources', opts.resources ?? []);
  if (opts.trackByPath !== undefined)
    fixture.componentRef.setInput('trackByPath', opts.trackByPath);
  if (opts.totalItemsCount !== undefined)
    fixture.componentRef.setInput('totalItemsCount', opts.totalItemsCount);
  if (opts.paginationLimit !== undefined)
    fixture.componentRef.setInput('paginationLimit', opts.paginationLimit);
  if (opts.hasMore !== undefined)
    fixture.componentRef.setInput('hasMore', opts.hasMore);
  if (opts.loadMode !== undefined)
    fixture.componentRef.setInput('loadMode', opts.loadMode);
  if (opts.loadMoreButtonText !== undefined)
    fixture.componentRef.setInput(
      'loadMoreButtonText',
      opts.loadMoreButtonText,
    );
  if (opts.height !== undefined)
    fixture.componentRef.setInput('height', opts.height);
  if (opts.currentPage !== undefined)
    fixture.componentRef.setInput('currentPage', opts.currentPage);
  if (opts.permissions !== undefined)
    fixture.componentRef.setInput('permissions', opts.permissions);
  fixture.detectChanges();
  return { fixture, component };
}

function root(fixture: Fixture): ShadowRoot | HTMLElement {
  return fixture.nativeElement.shadowRoot ?? fixture.nativeElement;
}

function el(fixture: Fixture, testId: string): Element | null {
  return root(fixture).querySelector(`[data-testid="${testId}"]`);
}

describe('DeclarativeTable', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [
        DeclarativeTable as unknown as typeof DeclarativeTable<GenericResource>,
      ],
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('column headers', () => {
    it('renders a header cell for each column', () => {
      const { fixture } = setup({
        columns: [
          { property: 'name', label: 'Name' },
          { property: 'status', label: 'Status' },
        ],
      });
      expect(el(fixture, 'generic-table-header-name')).not.toBeNull();
      expect(el(fixture, 'generic-table-header-status')).not.toBeNull();
    });

    it('renders group header with group label and test-id from group name', () => {
      const { fixture } = setup({
        columns: [
          {
            property: 'city',
            label: 'City',
            group: { name: 'location', label: 'Location' },
          },
          {
            property: 'country',
            label: 'Country',
            group: { name: 'location', label: 'Location' },
          },
        ],
      });
      const header = el(fixture, 'generic-table-header-location');
      expect(header).not.toBeNull();
      expect(header?.textContent?.trim()).toBe('Location');
    });

    it('renders group header with group name when no label', () => {
      const { fixture } = setup({
        columns: [{ property: 'city', group: { name: 'location' } }],
      });
      const header = el(fixture, 'generic-table-header-location');
      expect(header?.textContent?.trim()).toBe('location');
    });

    it('renders column header with label text', () => {
      const { fixture } = setup({
        columns: [{ property: 'name', label: 'Full Name' }],
      });
      const header = el(fixture, 'generic-table-header-name');
      expect(header?.textContent?.trim()).toBe('Full Name');
    });
  });

  describe('no-data state', () => {
    it('renders no-data illustrated message when resources is empty', () => {
      const { fixture } = setup({
        columns: [{ property: 'name' }],
        resources: [],
      });
      expect(el(fixture, 'generic-table-view-nodata')).not.toBeNull();
    });

    it('does not render no-data message when resources exist', () => {
      const { fixture } = setup({
        columns: [{ property: 'name' }],
        resources: [{ id: '1', name: 'Alice' }],
      });
      expect(el(fixture, 'generic-table-view-nodata')).toBeNull();
    });
  });

  describe('row rendering', () => {
    it('renders a row for each resource', () => {
      const { fixture } = setup({
        columns: [{ property: 'name' }],
        resources: [
          { id: '1', name: 'Alice' },
          { id: '2', name: 'Bob' },
        ],
      });
      expect(el(fixture, 'generic-table-row-0')).not.toBeNull();
      expect(el(fixture, 'generic-table-row-1')).not.toBeNull();
    });

    it('renders cells with correct test-ids', () => {
      const { fixture } = setup({
        columns: [{ property: 'name' }, { property: 'status' }],
        resources: [{ id: '1', name: 'Alice', status: 'Active' }],
      });
      expect(el(fixture, 'generic-table-cell-0-name')).not.toBeNull();
      expect(el(fixture, 'generic-table-cell-0-status')).not.toBeNull();
    });

    it('marks row as disabled when isAvailable is false', () => {
      const { fixture } = setup({
        columns: [{ property: 'name' }],
        resources: [{ id: '1', name: 'Alice', isAvailable: false }],
      });
      const row = el(fixture, 'generic-table-row-0');
      expect(row?.classList.contains('disabled')).toBe(true);
    });

    it('does not mark row as disabled when isAvailable is true', () => {
      const { fixture } = setup({
        columns: [{ property: 'name' }],
        resources: [{ id: '1', name: 'Alice', isAvailable: true }],
      });
      const row = el(fixture, 'generic-table-row-0');
      expect(row?.classList.contains('disabled')).toBe(false);
    });
  });

  describe('group columns', () => {
    it('renders group cell with sub-field test-ids using group name', () => {
      // cell test-id: 'generic-table-cell-{i}-{column.group.name}-{field.property}'
      // => 'generic-table-cell-0-location-city' and 'generic-table-cell-0-location-country'
      const { fixture } = setup({
        columns: [
          { property: 'city', group: { name: 'location' } },
          { property: 'country', group: { name: 'location' } },
        ],
        resources: [{ id: '1', city: 'Berlin', country: 'Germany' }],
      });
      expect(el(fixture, 'generic-table-cell-0-location-city')).not.toBeNull();
      expect(
        el(fixture, 'generic-table-cell-0-location-country'),
      ).not.toBeNull();
    });

    it('renders field label inside group cell when label is set', () => {
      const { fixture } = setup({
        columns: [
          { property: 'city', label: 'City', group: { name: 'location' } },
        ],
        resources: [{ id: '1', city: 'Berlin' }],
      });
      const cell = el(fixture, 'generic-table-cell-0-location-city');
      expect(cell?.textContent).toContain('City:');
    });
  });

  describe('tableRowClicked output', () => {
    it('emits tableRowClicked with resource on row click', () => {
      const resource = { id: '1', name: 'Alice' };
      const { fixture, component } = setup({
        columns: [{ property: 'name' }],
        resources: [resource],
      });

      const emitted: unknown[] = [];
      component.tableRowClicked.subscribe((e) => emitted.push(e));

      const row = el(fixture, 'generic-table-row-0') as HTMLElement;
      row?.click();
      fixture.detectChanges();

      expect(emitted).toHaveLength(1);
      expect(emitted[0]).toEqual(resource);
    });

    it('does not emit tableRowClicked for an unavailable resource', () => {
      const resource = {
        id: '1',
        name: 'Alice',
        isAvailable: false,
      };
      const { fixture, component } = setup({
        columns: [{ property: 'name' }],
        resources: [resource],
      });

      const emitted: unknown[] = [];
      component.tableRowClicked.subscribe((event) => emitted.push(event));

      const row = el(fixture, 'generic-table-row-0') as HTMLElement;
      row.click();

      expect(emitted).toHaveLength(0);
    });
  });

  describe('buttonClick output', () => {
    it('bubbles buttonClick from resource-field', () => {
      const field: TableFieldDefinition = {
        property: 'action',
        uiSettings: {
          displayAs: 'button',
          buttonSettings: { text: 'Go', action: 'navigate' },
        },
      };
      const resource = { id: '1', action: 'go' };
      const { fixture, component } = setup({
        columns: [field],
        resources: [resource],
      });

      const emitted: ResourceFieldButtonClickEvent<GenericResource>[] = [];
      component.buttonClick.subscribe((e) => emitted.push(e));

      // The button lives inside resource-field's shadow root, unreachable via DOM
      // querySelector in jsdom. Get the ResourceField instance directly
      // and invoke its buttonClicked method to test the event chain.
      const resourceFieldDe = fixture.debugElement.query(
        By.directive(ResourceField),
      );
      const resourceFieldComp: ResourceField<
        GenericResource,
        TableFieldDefinition
      > = resourceFieldDe.componentInstance;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- accessing protected method for testing
      (resourceFieldComp as any).buttonClicked(new MouseEvent('click'));
      fixture.detectChanges();

      expect(emitted).toHaveLength(1);
      expect(emitted[0].field).toEqual(field);
      expect(emitted[0].resource).toEqual(resource);
    });
  });

  describe('hasMore / table-growing', () => {
    it('renders ui5-table-growing when hasMore is true', () => {
      const { fixture } = setup({
        columns: [{ property: 'name' }],
        resources: [{ id: '1', name: 'Alice' }],
        hasMore: true,
      });
      expect(root(fixture).querySelector('ui5-table-growing')).not.toBeNull();
    });

    it('does not render ui5-table-growing when hasMore is false', () => {
      const { fixture } = setup({
        columns: [{ property: 'name' }],
        resources: [{ id: '1', name: 'Alice' }],
        hasMore: false,
      });
      expect(root(fixture).querySelector('ui5-table-growing')).toBeNull();
    });

    it('exposes loadMoreResources as output', () => {
      const { component } = setup({
        columns: [{ property: 'name' }],
        resources: [],
        hasMore: true,
      });
      expect(typeof component.loadMoreResources.emit).toBe('function');
      expect(typeof component.loadMoreResources.subscribe).toBe('function');
    });
  });

  describe('pagination footer', () => {
    it('displays loaded count vs total', () => {
      const { fixture } = setup({
        columns: [{ property: 'name' }],
        resources: [
          { id: '1', name: 'Alice' },
          { id: '2', name: 'Bob' },
        ],
        totalItemsCount: 10,
      });
      const text = root(fixture).textContent;
      expect(text).toContain('2 / 10');
    });

    it('emits paginationLimitChanged when select fires change event with value 50', () => {
      const { fixture, component } = setup({
        columns: [{ property: 'name' }],
        resources: [],
        paginationLimit: 5,
      });

      const emitted: number[] = [];
      component.paginationLimitChanged.subscribe((v) => emitted.push(v));

      const select = root(fixture).querySelector(
        'ui5-select',
      ) as HTMLElement & { value: string };
      if (select) {
        Object.defineProperty(select, 'value', {
          value: '50',
          configurable: true,
        });
        select.dispatchEvent(new Event('change'));
        fixture.detectChanges();
      }

      expect(emitted).toHaveLength(1);
      expect(emitted[0]).toBe(50);
    });
  });

  describe('viewColumns computed', () => {
    it('collapses grouped fields into single column entry', () => {
      const { component } = setup({
        columns: [
          { property: 'city', group: { name: 'location' } },
          { property: 'country', group: { name: 'location' } },
          { property: 'name' },
        ],
      });
      const cols = component.viewColumns();
      expect(cols).toHaveLength(2);
      expect(cols[0].group?.fields).toHaveLength(2);
      expect(cols[1].property).toBe('name');
    });
  });

  describe('rowTrackBy', () => {
    it('returns id field value by default', () => {
      const { component } = setup({
        columns: [{ property: 'name' }],
        resources: [{ id: 'abc', name: 'Alice' }],
      });
      const result = component.rowTrackBy(0, { id: 'abc', name: 'Alice' });
      expect(result).toBe('abc');
    });

    it('returns value from custom trackByPath', () => {
      const { component } = setup({
        columns: [{ property: 'name' }],
        resources: [{ id: '1', metadata: { name: 'pod-1' } }],
        trackByPath: 'metadata.name',
      });
      const result = component.rowTrackBy(0, {
        id: '1',
        metadata: { name: 'pod-1' },
      });
      expect(result).toBe('pod-1');
    });

    it('falls back to index when trackByPath resolves to undefined', () => {
      const { component } = setup({
        columns: [{ property: 'name' }],
        resources: [{ name: 'Alice' }],
        trackByPath: 'nonexistent',
      });
      const result = component.rowTrackBy(3, { name: 'Alice' });
      expect(result).toBe(3);
    });

    it('works for resources without an id field', () => {
      const { component } = setup({
        columns: [{ property: 'name' }],
        resources: [{ name: 'Alice' }],
      });
      const result = component.rowTrackBy(0, { name: 'Alice' });
      expect(result).toBe(0);
    });
  });

  describe('height input', () => {
    it('applies height style to ui5-table when height is provided', () => {
      const { fixture } = setup({
        columns: [{ property: 'name' }],
        height: 300,
      });
      const tableEl = el(fixture, 'generic-table') as HTMLElement;
      expect(tableEl.style.height).toBe('300px');
    });

    it('does not apply height style when height is not provided', () => {
      const { fixture } = setup({ columns: [{ property: 'name' }] });
      const tableEl = el(fixture, 'generic-table') as HTMLElement;
      expect(tableEl.style.height).toBeFalsy();
    });

    it('accepts height via input signal', () => {
      const { component } = setup({
        columns: [{ property: 'name' }],
        height: 400,
      });
      expect(component.height()).toBe(400);
    });
  });

  describe('loadMode input', () => {
    it('defaults to button', () => {
      const { component } = setup({ columns: [{ property: 'name' }] });
      expect(component.loadMode()).toBe('button');
    });

    it('marks header row sticky when loadMode is scroll and height is set', () => {
      const { fixture } = setup({
        columns: [{ property: 'name' }],
        loadMode: 'scroll',
        height: 300,
      });
      const headerRowEl = root(fixture).querySelector(
        'ui5-table-header-row',
      ) as HTMLElement & { sticky: boolean };
      expect(headerRowEl.sticky).toBe(true);
    });

    it('header row is not sticky when loadMode is button', () => {
      const { fixture } = setup({
        columns: [{ property: 'name' }],
        height: 300,
      });
      const headerRowEl = root(fixture).querySelector(
        'ui5-table-header-row',
      ) as HTMLElement & { sticky: boolean };
      expect(headerRowEl.sticky).toBe(false);
    });

    it('header row is not sticky when height is not set even if loadMode is scroll', () => {
      const { fixture } = setup({
        columns: [{ property: 'name' }],
        loadMode: 'scroll',
      });
      const headerRowEl = root(fixture).querySelector(
        'ui5-table-header-row',
      ) as HTMLElement & { sticky: boolean };
      expect(headerRowEl.sticky).toBe(false);
    });

    it('maps scroll to the Scroll ui5-table-growing mode when hasMore is true', () => {
      const { fixture } = setup({
        columns: [{ property: 'name' }],
        resources: [{ id: '1' }],
        hasMore: true,
        loadMode: 'scroll',
      });
      const growingDe = fixture.debugElement.query(By.css('ui5-table-growing'));
      expect(growingDe?.properties?.['mode']).toBe('Scroll');
    });

    it('maps button to the Button ui5-table-growing mode when hasMore is true', () => {
      const { fixture } = setup({
        columns: [{ property: 'name' }],
        resources: [{ id: '1' }],
        hasMore: true,
        loadMode: 'button',
      });
      const growingDe = fixture.debugElement.query(By.css('ui5-table-growing'));
      expect(growingDe?.properties?.['mode']).toBe('Button');
    });

    it('does not render ui5-table-growing in pager mode even when hasMore is true', () => {
      const { fixture } = setup({
        columns: [{ property: 'name' }],
        resources: [{ id: '1' }],
        hasMore: true,
        loadMode: 'pager',
      });
      expect(el(fixture, 'generic-table-growing')).toBeNull();
    });
  });

  describe('pager mode', () => {
    const pagerSetup = (overrides: Partial<Parameters<typeof setup>[0]> = {}) =>
      setup({
        columns: [{ property: 'name' }],
        resources: [{ id: '1' }, { id: '2' }],
        loadMode: 'pager',
        paginationLimit: 5,
        totalItemsCount: 12,
        currentPage: 1,
        ...overrides,
      });

    it('renders the pager only in pager mode', () => {
      const { fixture } = pagerSetup();
      expect(el(fixture, 'generic-table-pager')).not.toBeNull();

      const { fixture: grow } = setup({
        columns: [{ property: 'name' }],
        loadMode: 'button',
      });
      expect(el(grow, 'generic-table-pager')).toBeNull();
    });

    it('computes totalPages as ceil(totalItemsCount / paginationLimit)', () => {
      const { component } = pagerSetup({
        totalItemsCount: 12,
        paginationLimit: 5,
      });
      expect(component.totalPages()).toBe(3);
    });

    it('shows the compact "X / Y" indicator', () => {
      const { fixture } = pagerSetup({
        currentPage: 2,
        totalItemsCount: 12,
        paginationLimit: 5,
      });
      expect(
        el(fixture, 'generic-table-pager-indicator')?.textContent?.trim(),
      ).toBe('2 / 3');
    });

    it('disables first and previous on the first page', () => {
      const { fixture } = pagerSetup({ currentPage: 1 });
      // canPrev is false on page 1 regardless of totalItemsCount
      const prev = el(fixture, 'generic-table-pager-prev') as HTMLElement & {
        disabled: boolean;
      };
      expect(prev.disabled).toBe(true);
      // first button is only rendered when knowsTotal=true (totalItemsCount set)
      const first = el(fixture, 'generic-table-pager-first') as HTMLElement & {
        disabled: boolean;
      };
      expect(first.disabled).toBe(true);
    });

    it('disables next and last on the last page', () => {
      const { fixture } = pagerSetup({
        currentPage: 3,
        totalItemsCount: 12,
        paginationLimit: 5,
      });
      const next = el(fixture, 'generic-table-pager-next') as HTMLElement & {
        disabled: boolean;
      };
      const last = el(fixture, 'generic-table-pager-last') as HTMLElement & {
        disabled: boolean;
      };
      expect(next.disabled).toBe(true);
      expect(last.disabled).toBe(true);
    });

    it('emits pageChange with the target page for each control', () => {
      const { component } = pagerSetup({
        currentPage: 2,
        totalItemsCount: 12,
        paginationLimit: 5,
      });
      const emitted: number[] = [];
      component.pageChange.subscribe((n) => emitted.push(n));

      component.firstPage();
      component.prevPage();
      component.nextPage();
      component.lastPage();

      expect(emitted).toEqual([1, 1, 3, 3]);
    });

    it('does not emit when already at the boundary', () => {
      const { component } = pagerSetup({
        currentPage: 1,
        totalItemsCount: 12,
        paginationLimit: 5,
      });
      const emitted: number[] = [];
      component.pageChange.subscribe((n) => emitted.push(n));

      component.firstPage();
      component.prevPage();

      expect(emitted).toEqual([]);
    });

    it('clamps out-of-range page requests to totalPages when total is known', () => {
      const { component } = pagerSetup({
        currentPage: 1,
        totalItemsCount: 12,
        paginationLimit: 5,
      });
      const emitted: number[] = [];
      component.pageChange.subscribe((n) => emitted.push(n));

      component.goToPage(99);

      expect(emitted).toEqual([3]);
    });

    it('shows a neutral "–" indicator and disables all arrows when there are no results', () => {
      const { fixture, component } = pagerSetup({
        resources: [],
        totalItemsCount: 0,
        currentPage: 1,
      });
      expect(
        el(fixture, 'generic-table-pager-indicator')?.textContent?.trim(),
      ).toBe('–');

      const ids = ['prev', 'next'];
      for (const id of ids) {
        const btn = el(fixture, `generic-table-pager-${id}`) as HTMLElement & {
          disabled: boolean;
        };
        expect(btn.disabled).toBe(true);
      }
      // first/last are still rendered (knowsTotal=true) but also disabled
      const first = el(fixture, 'generic-table-pager-first') as HTMLElement & {
        disabled: boolean;
      };
      const last = el(fixture, 'generic-table-pager-last') as HTMLElement & {
        disabled: boolean;
      };
      expect(first.disabled).toBe(true);
      expect(last.disabled).toBe(true);
      expect(component.canPrev()).toBe(false);
      expect(component.canNext()).toBe(false);
    });

    it('renders the total item count as "<n> Items" in pager mode', () => {
      const { fixture } = pagerSetup({ totalItemsCount: 145 });
      expect(
        el(fixture, 'generic-table-item-count')
          ?.textContent?.replace(/\s+/g, ' ')
          .trim(),
      ).toBe('145 Items');
    });

    it('shows "0 Items" when there are no results', () => {
      const { fixture } = pagerSetup({ resources: [], totalItemsCount: 0 });
      expect(
        el(fixture, 'generic-table-item-count')
          ?.textContent?.replace(/\s+/g, ' ')
          .trim(),
      ).toBe('0 Items');
    });

    describe('cursor-based mode (totalItemsCount undefined)', () => {
      const cursorSetup = (
        overrides: Partial<Parameters<typeof setup>[0]> = {},
      ) =>
        setup({
          columns: [{ property: 'name' }],
          resources: [{ id: '1' }, { id: '2' }],
          loadMode: 'pager',
          paginationLimit: 5,
          currentPage: 2,
          // totalItemsCount intentionally omitted
          ...overrides,
        });

      it('shows only the current page number when totalItemsCount is undefined', () => {
        const { fixture } = cursorSetup();
        expect(
          el(fixture, 'generic-table-pager-indicator')?.textContent?.trim(),
        ).toBe('2');
      });

      it('hides first and last buttons when totalItemsCount is undefined', () => {
        const { fixture } = cursorSetup();
        expect(el(fixture, 'generic-table-pager-first')).toBeNull();
        expect(el(fixture, 'generic-table-pager-last')).toBeNull();
      });

      it('hides the item count panel when totalItemsCount is undefined', () => {
        const { fixture } = cursorSetup();
        expect(el(fixture, 'generic-table-item-count')).toBeNull();
      });

      it('enables next when hasMore is true', () => {
        const { component } = cursorSetup({ hasMore: true });
        expect(component.canNext()).toBe(true);
      });

      it('disables next when hasMore is false', () => {
        const { component } = cursorSetup({ hasMore: false });
        expect(component.canNext()).toBe(false);
      });

      it('enables prev when currentPage > 1', () => {
        const { component } = cursorSetup({ currentPage: 3 });
        expect(component.canPrev()).toBe(true);
      });

      it('disables prev on page 1', () => {
        const { component } = cursorSetup({ currentPage: 1 });
        expect(component.canPrev()).toBe(false);
      });

      it('does not clamp nextPage when total is unknown', () => {
        const { component } = cursorSetup({ currentPage: 99 });
        const emitted: number[] = [];
        component.pageChange.subscribe((n) => emitted.push(n));
        component.nextPage();
        expect(emitted).toEqual([100]);
      });
    });
  });

  describe('loadMoreButtonText input', () => {
    it('defaults to Load More', () => {
      const { component } = setup({ columns: [{ property: 'name' }] });
      expect(component.loadMoreButtonText()).toBe('Load More');
    });

    it('passes custom text to ui5-table-growing when hasMore is true', () => {
      const { fixture } = setup({
        columns: [{ property: 'name' }],
        resources: [{ id: '1' }],
        hasMore: true,
        loadMoreButtonText: 'Fetch More',
      });
      const growingDe = fixture.debugElement.query(By.css('ui5-table-growing'));
      expect(growingDe?.properties?.['text']).toBe('Fetch More');
    });
  });

  describe('permissions input threading', () => {
    it('accepts a permissions map via the permissions input', () => {
      const permissions = { 'ns/pod-1': ['delete', 'get'] };
      const { component } = setup({
        columns: [{ property: 'name' }],
        resources: [{ id: 'ns/pod-1', name: 'pod-1' }],
        permissions,
      });
      expect(component.permissions()).toBe(permissions);
    });

    it('permissions input defaults to undefined', () => {
      const { component } = setup({
        columns: [{ property: 'name' }],
      });
      expect(component.permissions()).toBeUndefined();
    });

    it('passes permissions down to each mfp-resource-field child', () => {
      const permissions = { 'ns/pod-1': ['delete'] };
      const { fixture } = setup({
        columns: [
          {
            property: 'name',
            requirePermission: 'delete',
          },
        ],
        resources: [{ id: 'ns/pod-1', name: 'pod-1' }],
        permissions,
      });
      const resourceFields = fixture.debugElement.queryAll(
        By.directive(ResourceField),
      );
      expect(resourceFields.length).toBeGreaterThan(0);
      // Every ResourceField instance must receive the same permissions map
      for (const de of resourceFields) {
        const comp: ResourceField<GenericResource, TableFieldDefinition> =
          de.componentInstance;
        expect(comp.permissions()).toBe(permissions);
      }
    });

    it('field with requirePermission is hidden when verb is not in the map', () => {
      const permissions = { 'ns/pod-1': ['get'] };
      const column: TableFieldDefinition = {
        property: 'name',
        requirePermission: 'delete',
      };
      const { fixture } = setup({
        columns: [column],
        resources: [{ id: 'ns/pod-1', name: 'pod-1' }],
        permissions,
      });
      // The field span is inside ResourceField's shadow root; querying the
      // host element for the testid will find nothing when hidden.
      const resourceFieldDe = fixture.debugElement.query(
        By.directive(ResourceField),
      );
      const resourceFieldRoot: ShadowRoot | HTMLElement =
        resourceFieldDe.nativeElement.shadowRoot ??
        resourceFieldDe.nativeElement;
      expect(
        resourceFieldRoot.querySelector('[data-testid="resource-field-name"]'),
      ).toBeNull();
    });

    it('field with requirePermission is visible when verb is granted', () => {
      const permissions = { 'ns/pod-1': ['delete', 'get'] };
      const column: TableFieldDefinition = {
        property: 'name',
        requirePermission: 'delete',
      };
      const { fixture } = setup({
        columns: [column],
        resources: [{ id: 'ns/pod-1', name: 'pod-1' }],
        permissions,
      });
      const resourceFieldDe = fixture.debugElement.query(
        By.directive(ResourceField),
      );
      const resourceFieldRoot: ShadowRoot | HTMLElement =
        resourceFieldDe.nativeElement.shadowRoot ??
        resourceFieldDe.nativeElement;
      expect(
        resourceFieldRoot.querySelector('[data-testid="resource-field-name"]'),
      ).not.toBeNull();
    });
  });

  describe('web-component first render (before inputs are assigned)', () => {
    it('renders without emitting NG0950 when required inputs are not yet set', () => {
      const errorSpy = vi.spyOn(console, 'error');
      const fixture: Fixture = TestBed.createComponent(
        DeclarativeTable as unknown as typeof DeclarativeTable<GenericResource>,
      );

      expect(() => fixture.detectChanges()).not.toThrow();

      const ng0950 = errorSpy.mock.calls
        .flat()
        .some((arg) => String(arg).includes('NG0950'));
      expect(ng0950).toBe(false);
      expect(fixture.componentInstance.viewColumns()).toEqual([]);
    });

    it('recovers and renders once columns and resources are assigned', () => {
      const fixture: Fixture = TestBed.createComponent(
        DeclarativeTable as unknown as typeof DeclarativeTable<GenericResource>,
      );
      fixture.detectChanges();

      fixture.componentRef.setInput('columns', [
        { label: 'Name', property: 'metadata.name' },
      ]);
      fixture.componentRef.setInput('resources', [
        { metadata: { name: 'pod-1' } },
      ]);
      fixture.detectChanges();

      expect(fixture.componentInstance.viewColumns().length).toBe(1);
    });
  });
});
