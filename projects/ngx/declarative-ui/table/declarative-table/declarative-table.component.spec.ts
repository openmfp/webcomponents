import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DeclarativeTable } from './declarative-table.component';
import { GenericResource, TableFieldDefinition, ValueCellButtonClickEvent } from '../models';
import { ValueCell } from '../value-cell/value-cell.component';

type Fixture = ComponentFixture<DeclarativeTable<GenericResource>>;
type Comp = DeclarativeTable<GenericResource>;

function setup(opts: {
  columns: TableFieldDefinition[];
  resources?: GenericResource[];
  trackByPath?: string;
  totalItemsCount?: number;
  paginationLimit?: number;
  hasMore?: boolean;
  growMode?: 'Scroll' | 'Button' | undefined;
  loadMoreButtonText?: string;
  height?: number;
}): { fixture: Fixture; component: Comp } {
  const fixture: Fixture = TestBed.createComponent(
    DeclarativeTable as unknown as typeof DeclarativeTable<GenericResource>,
  );
  const component = fixture.componentInstance;
  fixture.componentRef.setInput('columns', opts.columns);
  fixture.componentRef.setInput('resources', opts.resources ?? []);
  if (opts.trackByPath !== undefined) fixture.componentRef.setInput('trackByPath', opts.trackByPath);
  if (opts.totalItemsCount !== undefined) fixture.componentRef.setInput('totalItemsCount', opts.totalItemsCount);
  if (opts.paginationLimit !== undefined) fixture.componentRef.setInput('paginationLimit', opts.paginationLimit);
  if (opts.hasMore !== undefined) fixture.componentRef.setInput('hasMore', opts.hasMore);
  if (opts.growMode !== undefined) fixture.componentRef.setInput('growMode', opts.growMode);
  if (opts.loadMoreButtonText !== undefined) fixture.componentRef.setInput('loadMoreButtonText', opts.loadMoreButtonText);
  if (opts.height !== undefined) fixture.componentRef.setInput('height', opts.height);
  fixture.detectChanges();
  return { fixture, component };
}

function root(fixture: Fixture): ShadowRoot | HTMLElement {
  return fixture.nativeElement.shadowRoot ?? fixture.nativeElement;
}

function el(fixture: Fixture, testId: string): Element | null {
  return root(fixture).querySelector(`[test-id="${testId}"]`);
}

describe('DeclarativeTable', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [DeclarativeTable as unknown as typeof DeclarativeTable<GenericResource>],
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
          { property: 'city', label: 'City', group: { name: 'location', label: 'Location' } },
          { property: 'country', label: 'Country', group: { name: 'location', label: 'Location' } },
        ],
      });
      const header = el(fixture, 'generic-table-header-location');
      expect(header).not.toBeNull();
      expect(header?.textContent?.trim()).toBe('Location');
    });

    it('renders group header with group name when no label', () => {
      const { fixture } = setup({
        columns: [
          { property: 'city', group: { name: 'location' } },
        ],
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
      const { fixture } = setup({ columns: [{ property: 'name' }], resources: [] });
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
        resources: [{ id: '1', name: 'Alice' }, { id: '2', name: 'Bob' }],
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
      expect(el(fixture, 'generic-table-cell-0-location-country')).not.toBeNull();
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
  });

  describe('buttonClick output', () => {
    it('bubbles buttonClick from value-cell', () => {
      const field: TableFieldDefinition = {
        property: 'action',
        uiSettings: { displayAs: 'button', buttonSettings: { text: 'Go', action: 'navigate' } },
      };
      const resource = { id: '1', action: 'go' };
      const { fixture, component } = setup({
        columns: [field],
        resources: [resource],
      });

      const emitted: ValueCellButtonClickEvent<GenericResource>[] = [];
      component.buttonClick.subscribe((e) => emitted.push(e));

      // The button lives inside value-cell's shadow root, unreachable via DOM
      // querySelector in jsdom. Get the ValueCell instance directly
      // and invoke its buttonClicked method to test the event chain.
      const valueCellDe = fixture.debugElement.query(By.directive(ValueCell));
      const valueCellComp: ValueCell<GenericResource, TableFieldDefinition> = valueCellDe.componentInstance;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- accessing protected method for testing
      (valueCellComp as any).buttonClicked(new MouseEvent('click'));
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
        resources: [{ id: '1', name: 'Alice' }, { id: '2', name: 'Bob' }],
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

      const select = root(fixture).querySelector('ui5-select') as HTMLElement & { value: string };
      if (select) {
        Object.defineProperty(select, 'value', { value: '50', configurable: true });
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
      const result = component.rowTrackBy(0, { id: '1', metadata: { name: 'pod-1' } });
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
      const { component } = setup({ columns: [{ property: 'name' }], height: 400 });
      expect(component.height()).toBe(400);
    });
  });

  describe('growMode input', () => {
    it('defaults to Button', () => {
      const { component } = setup({ columns: [{ property: 'name' }] });
      expect(component.growMode()).toBe('Button');
    });

    it('marks header row sticky when growMode is Scroll and height is set', () => {
      const { fixture } = setup({
        columns: [{ property: 'name' }],
        growMode: 'Scroll',
        height: 300,
      });
      const headerRowEl = root(fixture).querySelector('ui5-table-header-row') as HTMLElement & { sticky: boolean };
      expect(headerRowEl.sticky).toBe(true);
    });

    it('header row is not sticky when growMode is Button', () => {
      const { fixture } = setup({
        columns: [{ property: 'name' }],
        height: 300,
      });
      const headerRowEl = root(fixture).querySelector('ui5-table-header-row') as HTMLElement & { sticky: boolean };
      expect(headerRowEl.sticky).toBe(false);
    });

    it('header row is not sticky when height is not set even if growMode is Scroll', () => {
      const { fixture } = setup({
        columns: [{ property: 'name' }],
        growMode: 'Scroll',
      });
      const headerRowEl = root(fixture).querySelector('ui5-table-header-row') as HTMLElement & { sticky: boolean };
      expect(headerRowEl.sticky).toBe(false);
    });

    it('passes growMode to ui5-table-growing when hasMore is true', () => {
      const { fixture } = setup({
        columns: [{ property: 'name' }],
        resources: [{ id: '1' }],
        hasMore: true,
        growMode: 'Scroll',
      });
      const growingDe = fixture.debugElement.query(By.css('ui5-table-growing'));
      expect(growingDe?.properties?.['mode']).toBe('Scroll');
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
});
