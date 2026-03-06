import { ProcessedFieldDefinition } from '../../../utils/proccess-fields';
import { ValueCellComponent } from '../value-cell/value-cell.component';
import { GenericTable } from './generic-table.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  FieldDefinition,
  GenericResource,
} from '@platform-mesh/portal-ui-lib/models';
import '@ui5/webcomponents-fiori/dist/illustrations/NoData.js';

interface TestResource extends GenericResource {
  id: string;
  name: string;
  status: string;
}

describe('GenericTable', () => {
  let component: GenericTable<TestResource>;
  let fixture: ComponentFixture<GenericTable<TestResource>>;

  const mockColumns: FieldDefinition[] = [
    { property: 'name', label: 'Name' },
    { property: 'status', label: 'Status' },
  ];

  const mockResources: TestResource[] = [
    { id: '1', name: 'Resource 1', status: 'active', isAvailable: true },
    { id: '2', name: 'Resource 2', status: 'inactive', isAvailable: false },
    { id: '3', name: 'Resource 3', status: 'active', isAvailable: true },
  ];

  const trackByFn = (item: TestResource) => item.id;

  const getShadowRoot = () => fixture.nativeElement.shadowRoot as ShadowRoot;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [GenericTable],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).overrideComponent(GenericTable, {
      set: {
        imports: [ValueCellComponent],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
      },
    });

    fixture = TestBed.createComponent(GenericTable<TestResource>);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('columns', mockColumns);
    fixture.componentRef.setInput('resources', mockResources);
    fixture.componentRef.setInput('trackBy', trackByFn);
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('should display table with correct number of rows', () => {
    fixture.componentRef.setInput('columns', mockColumns);
    fixture.componentRef.setInput('resources', mockResources);
    fixture.componentRef.setInput('trackBy', trackByFn);
    fixture.detectChanges();

    const shadowRoot = fixture.nativeElement.shadowRoot;
    const rows = shadowRoot.querySelectorAll('ui5-table-row');
    expect(rows.length).toBe(3);
  });

  it('should display correct number of header cells', () => {
    fixture.componentRef.setInput('columns', mockColumns);
    fixture.componentRef.setInput('resources', mockResources);
    fixture.componentRef.setInput('trackBy', trackByFn);
    fixture.detectChanges();

    const shadowRoot = fixture.nativeElement.shadowRoot;
    const headerCells = shadowRoot.querySelectorAll('ui5-table-header-cell');
    expect(headerCells.length).toBe(2);
  });

  it('should display empty state when no resources', () => {
    fixture.componentRef.setInput('columns', mockColumns);
    fixture.componentRef.setInput('resources', []);
    fixture.componentRef.setInput('trackBy', trackByFn);
    fixture.detectChanges();

    const shadowRoot = getShadowRoot();
    const illustratedMessage = shadowRoot.querySelector(
      'ui5-illustrated-message',
    );
    expect(illustratedMessage).toBeTruthy();
  });

  it('should emit tableRowClicked when row is clicked', () => {
    fixture.componentRef.setInput('columns', mockColumns);
    fixture.componentRef.setInput('resources', mockResources);
    fixture.componentRef.setInput('trackBy', trackByFn);
    fixture.detectChanges();

    const tableRowClickedSpy = vi.fn();
    component.tableRowClicked.subscribe(tableRowClickedSpy);

    const shadowRoot = getShadowRoot();
    const firstRow = shadowRoot.querySelector('ui5-table-row') as HTMLElement;
    firstRow?.click();

    expect(tableRowClickedSpy).toHaveBeenCalledWith(mockResources[0]);
  });

  it('should apply disabled class when isAvailable is false', () => {
    fixture.componentRef.setInput('columns', mockColumns);
    fixture.componentRef.setInput('resources', mockResources);
    fixture.componentRef.setInput('trackBy', trackByFn);
    fixture.detectChanges();

    const shadowRoot = getShadowRoot();
    const rows = shadowRoot.querySelectorAll('ui5-table-row');
    expect(rows[1].classList.contains('disabled')).toBe(true);
  });

  it('should set interactive to false when isAvailable is false', () => {
    fixture.componentRef.setInput('columns', mockColumns);
    fixture.componentRef.setInput('resources', mockResources);
    fixture.componentRef.setInput('trackBy', trackByFn);
    fixture.detectChanges();

    const shadowRoot = getShadowRoot();
    const rows = shadowRoot.querySelectorAll('ui5-table-row');
    expect((rows[1] as any).interactive).toBe(false);
  });

  it('should default isAvailable to true when undefined', () => {
    const resourcesWithoutIsAvailable: TestResource[] = [
      { id: '1', name: 'Resource 1', status: 'active' },
    ];

    fixture.componentRef.setInput('columns', mockColumns);
    fixture.componentRef.setInput('resources', resourcesWithoutIsAvailable);
    fixture.componentRef.setInput('trackBy', trackByFn);
    fixture.detectChanges();

    const shadowRoot = getShadowRoot();
    const row = shadowRoot.querySelector('ui5-table-row');
    expect((row as any)?.interactive).toBe(true);
    expect(row?.classList.contains('disabled')).toBe(false);
  });

  it('should display pagination footer', () => {
    fixture.componentRef.setInput('columns', mockColumns);
    fixture.componentRef.setInput('resources', mockResources);
    fixture.componentRef.setInput('trackBy', trackByFn);
    fixture.detectChanges();

    const shadowRoot = getShadowRoot();
    const paginationFooter = shadowRoot.querySelector('.pagination-footer');
    expect(paginationFooter).toBeTruthy();
  });

  it('should display correct pagination limit', () => {
    fixture.componentRef.setInput('columns', mockColumns);
    fixture.componentRef.setInput('resources', mockResources);
    fixture.componentRef.setInput('trackBy', trackByFn);
    fixture.componentRef.setInput('paginationLimit', 10);
    fixture.detectChanges();

    const shadowRoot = getShadowRoot();
    const select = shadowRoot.querySelector('ui5-select');
    expect(select?.getAttribute('value')).toBe('10');
  });

  it('should emit paginationLimitChanged when limit changes', () => {
    fixture.componentRef.setInput('columns', mockColumns);
    fixture.componentRef.setInput('resources', mockResources);
    fixture.componentRef.setInput('trackBy', trackByFn);
    fixture.detectChanges();

    const paginationLimitChangedSpy = vi.fn();
    component.paginationLimitChanged.subscribe(paginationLimitChangedSpy);

    const shadowRoot = getShadowRoot();
    const select = shadowRoot.querySelector('ui5-select');
    const changeEvent = new CustomEvent('change', {
      detail: { target: { value: '50' } },
    });
    Object.defineProperty(changeEvent, 'target', { value: { value: '50' } });
    select?.dispatchEvent(changeEvent);

    expect(paginationLimitChangedSpy).toHaveBeenCalledWith(50);
  });

  it('should display load more button when hasMore is true', () => {
    fixture.componentRef.setInput('columns', mockColumns);
    fixture.componentRef.setInput('resources', mockResources);
    fixture.componentRef.setInput('trackBy', trackByFn);
    fixture.componentRef.setInput('hasMore', true);
    fixture.detectChanges();

    const shadowRoot = getShadowRoot();
    const loadMoreButton = shadowRoot.querySelector('ui5-table-growing');
    expect(loadMoreButton).toBeTruthy();
  });

  it('should not display load more button when hasMore is false', () => {
    fixture.componentRef.setInput('columns', mockColumns);
    fixture.componentRef.setInput('resources', mockResources);
    fixture.componentRef.setInput('trackBy', trackByFn);
    fixture.componentRef.setInput('hasMore', false);
    fixture.detectChanges();

    const shadowRoot = getShadowRoot();
    const loadMoreButton = shadowRoot.querySelector('ui5-table-growing');
    expect(loadMoreButton).toBeFalsy();
  });

  it('should emit loadMoreResources when load more button is clicked', () => {
    fixture.componentRef.setInput('columns', mockColumns);
    fixture.componentRef.setInput('resources', mockResources);
    fixture.componentRef.setInput('trackBy', trackByFn);
    fixture.componentRef.setInput('hasMore', true);
    fixture.detectChanges();

    const loadMoreResourcesSpy = vi.fn();
    component.loadMoreResources.subscribe(loadMoreResourcesSpy);

    const shadowRoot = getShadowRoot();
    const loadMoreButton = shadowRoot.querySelector('ui5-table-growing');
    loadMoreButton?.dispatchEvent(new CustomEvent('ui5LoadMore'));

    expect(loadMoreResourcesSpy).toHaveBeenCalled();
  });

  it('should display total items count', () => {
    fixture.componentRef.setInput('columns', mockColumns);
    fixture.componentRef.setInput('resources', mockResources);
    fixture.componentRef.setInput('trackBy', trackByFn);
    fixture.componentRef.setInput('totalItemsCount', 10);
    fixture.detectChanges();

    const shadowRoot = getShadowRoot();
    const itemsLoadedText = shadowRoot.textContent;
    expect(itemsLoadedText).toContain('3 / 10');
  });

  it('should emit buttonClick from value cell', () => {
    const columnsWithButton: FieldDefinition[] = [
      {
        property: 'name',
        label: 'Name',
        uiSettings: { displayAs: 'button' },
      },
    ];

    fixture.componentRef.setInput('columns', columnsWithButton);
    fixture.componentRef.setInput('resources', mockResources);
    fixture.componentRef.setInput('trackBy', trackByFn);
    fixture.detectChanges();

    const buttonClickSpy = vi.fn();
    component.buttonClick.subscribe(buttonClickSpy);

    const shadowRoot = getShadowRoot();
    const valueCell = shadowRoot.querySelector('mfp-value-cell');
    valueCell?.dispatchEvent(
      new CustomEvent('buttonClick', {
        detail: { field: columnsWithButton[0], resource: mockResources[0] },
      }),
    );

    expect(buttonClickSpy).toHaveBeenCalled();
  });

  it('should handle grouped fields', () => {
    const groupedColumns: ProcessedFieldDefinition[] = [
      {
        property: 'group1',
        label: 'Group 1',
        group: {
          name: 'group1',
          label: 'Grouped Fields',
          fields: [
            { property: 'name', label: 'Name' },
            { property: 'status', label: 'Status' },
          ],
        },
      },
    ];

    fixture.componentRef.setInput('columns', groupedColumns);
    fixture.componentRef.setInput('resources', mockResources);
    fixture.componentRef.setInput('trackBy', trackByFn);
    fixture.detectChanges();

    const shadowRoot = getShadowRoot();
    const groupValues = shadowRoot.querySelectorAll('.group-value');
    expect(groupValues.length).toBeGreaterThan(0);
  });

  it('should apply multiline class to grouped cells when multiline is true', () => {
    const groupedColumns: ProcessedFieldDefinition[] = [
      {
        property: 'group1',
        label: 'Group 1',
        group: {
          name: 'group1',
          label: 'Grouped Fields',
          multiline: true,
          fields: [
            { property: 'name', label: 'Name' },
            { property: 'status', label: 'Status' },
          ],
        },
      },
    ];

    fixture.componentRef.setInput('columns', groupedColumns);
    fixture.componentRef.setInput('resources', mockResources);
    fixture.componentRef.setInput('trackBy', trackByFn);
    fixture.detectChanges();

    const shadowRoot = getShadowRoot();
    const cell = shadowRoot.querySelector('ui5-table-cell.multiline');
    expect(cell).toBeTruthy();
  });

  it('should use correct test-id attributes', () => {
    fixture.componentRef.setInput('columns', mockColumns);
    fixture.componentRef.setInput('resources', mockResources);
    fixture.componentRef.setInput('trackBy', trackByFn);
    fixture.detectChanges();

    const shadowRoot = getShadowRoot();
    const table = shadowRoot.querySelector('[test-id="generic-table"]');
    const headerCell = shadowRoot.querySelector(
      '[test-id="generic-table-header-name"]',
    );
    const row = shadowRoot.querySelector('[test-id="generic-table-row-0"]');
    const cell = shadowRoot.querySelector(
      '[test-id="generic-table-cell-0-name"]',
    );

    expect(table).toBeTruthy();
    expect(headerCell).toBeTruthy();
    expect(row).toBeTruthy();
    expect(cell).toBeTruthy();
  });

  it('should process group fields via computed viewColumns', () => {
    fixture.componentRef.setInput('columns', mockColumns);
    fixture.componentRef.setInput('resources', mockResources);
    fixture.componentRef.setInput('trackBy', trackByFn);
    fixture.detectChanges();

    expect(component.viewColumns()).toBeDefined();
    expect(component.viewColumns().length).toBe(2);
  });
});
