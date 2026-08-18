import { GenericResource, ResourceFieldButtonClickEvent } from '../../models';
import { ResourceField } from '../../resource-field';
import { TableFieldDefinition } from '../models';
import { processGroupFields } from '../utils/proccess-fields';
import { getResourceValueByJsonPath } from '../utils/resource-field-by-path';
import {
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';
import { IllustratedMessage } from '@fundamental-ngx/ui5-webcomponents-fiori';
import { Button } from '@fundamental-ngx/ui5-webcomponents/button';
import { Option } from '@fundamental-ngx/ui5-webcomponents/option';
import { Select } from '@fundamental-ngx/ui5-webcomponents/select';
import { Table } from '@fundamental-ngx/ui5-webcomponents/table';
import { TableCell } from '@fundamental-ngx/ui5-webcomponents/table-cell';
import { TableGrowing } from '@fundamental-ngx/ui5-webcomponents/table-growing';
import { TableHeaderCell } from '@fundamental-ngx/ui5-webcomponents/table-header-cell';
import { TableHeaderRow } from '@fundamental-ngx/ui5-webcomponents/table-header-row';
import { TableRow } from '@fundamental-ngx/ui5-webcomponents/table-row';
import '@ui5/webcomponents-fiori/dist/illustrations/NoData.js';
import '@ui5/webcomponents-icons/dist/close-command-field.js';
import '@ui5/webcomponents-icons/dist/navigation-left-arrow.js';
import '@ui5/webcomponents-icons/dist/navigation-right-arrow.js';
import '@ui5/webcomponents-icons/dist/open-command-field.js';

@Component({
  selector: 'mfp-declarative-table',
  imports: [
    IllustratedMessage,
    Table,
    TableCell,
    TableHeaderCell,
    TableHeaderRow,
    TableRow,
    ResourceField,
    Select,
    Option,
    TableGrowing,
    Button,
  ],
  templateUrl: './declarative-table.component.html',
  styleUrl: './declarative-table.component.scss',
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class DeclarativeTable<T extends GenericResource> {
  columns = input.required<TableFieldDefinition[]>();
  resources = input.required<T[]>();
  trackByPath = input<string>('id');
  permissions = input<Record<string, string[]>>();

  totalItemsCount = input<number>();
  paginationLimit = input<number>(5);
  hasMore = input<boolean>(false);
  loadMode = input<'scroll' | 'button' | 'pager'>('button');
  loadMoreButtonText = input<string>('Load More');
  height = input<number>();
  currentPage = input<number>(1);

  readonly buttonClick = output<ResourceFieldButtonClickEvent<T>>();
  readonly tableRowClicked = output<T>();
  readonly loadMoreResources = output<void>();
  readonly paginationLimitChanged = output<number>();
  readonly pageChange = output<number>();

  columnTrackBy = (column: TableFieldDefinition, index: number) =>
    column.property ?? column.value ?? index;
  rowTrackBy = (_index: number, item: T): unknown =>
    getResourceValueByJsonPath(item, { property: this.trackByPath() }) ??
    _index;
  viewColumns = computed(() => processGroupFields(this.columns()));

  onRowClick(item: T): void {
    // Unavailable rows stay visually dimmed but remain clickable: a resource
    // that is not ready is exactly the one a user needs to open and inspect.
    this.tableRowClicked.emit(item);
  }

  isPagerMode = computed(() => this.loadMode() === 'pager');
  knowsTotal = computed(() => this.totalItemsCount() !== undefined);
  hasResults = computed(() => (this.totalItemsCount() ?? 0) > 0);
  totalPages = computed(() =>
    Math.max(
      1,
      Math.ceil((this.totalItemsCount() ?? 0) / this.paginationLimit()),
    ),
  );
  canPrev = computed(() => this.currentPage() > 1);
  canNext = computed(() =>
    this.knowsTotal()
      ? this.hasResults() && this.currentPage() < this.totalPages()
      : this.hasMore(),
  );

  goToPage(page: number): void {
    const maxPage = this.knowsTotal() ? this.totalPages() : Infinity;
    const target = Math.min(Math.max(1, page), maxPage);
    if (target !== this.currentPage()) {
      this.pageChange.emit(target);
    }
  }

  firstPage = () => {
    this.goToPage(1);
  };
  prevPage = () => {
    this.goToPage(this.currentPage() - 1);
  };
  nextPage = () => {
    this.goToPage(this.currentPage() + 1);
  };
  lastPage = () => {
    this.goToPage(this.totalPages());
  };
}
