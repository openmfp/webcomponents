import { GenericResource } from '../../models';
import { TableFieldDefinition, ValueCellButtonClickEvent } from '../models';
import { processGroupFields } from '../utils/proccess-fields';
import { getResourceValueByJsonPath } from '../utils/resource-field-by-path';
import { ValueCell } from '../../value-cell/value-cell.component';
import {
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';
import { IllustratedMessage } from '@fundamental-ngx/ui5-webcomponents-fiori';
import { Option } from '@fundamental-ngx/ui5-webcomponents/option';
import { Select } from '@fundamental-ngx/ui5-webcomponents/select';
import { Table } from '@fundamental-ngx/ui5-webcomponents/table';
import { TableCell } from '@fundamental-ngx/ui5-webcomponents/table-cell';
import { TableGrowing } from '@fundamental-ngx/ui5-webcomponents/table-growing';
import { TableHeaderCell } from '@fundamental-ngx/ui5-webcomponents/table-header-cell';
import { TableHeaderRow } from '@fundamental-ngx/ui5-webcomponents/table-header-row';
import { TableRow } from '@fundamental-ngx/ui5-webcomponents/table-row';
import '@ui5/webcomponents-fiori/dist/illustrations/NoData.js';

@Component({
  selector: 'mfp-declarative-table',
  imports: [
    IllustratedMessage,
    Table,
    TableCell,
    TableHeaderCell,
    TableHeaderRow,
    TableRow,
    ValueCell,
    Select,
    Option,
    TableGrowing,
  ],
  templateUrl: './declarative-table.component.html',
  styleUrl: './declarative-table.component.scss',
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class DeclarativeTable<T extends GenericResource> {
  columns = input.required<TableFieldDefinition[]>();
  resources = input.required<T[]>();
  trackByPath = input<string>('id');

  totalItemsCount = input<number>();
  paginationLimit = input<number>(5);
  hasMore = input<boolean>(false);
  growMode = input<'Scroll' | 'Button' | undefined>('Button');
  loadMoreButtonText = input<string | undefined>('Load More');
  height = input<number>();

  readonly buttonClick = output<ValueCellButtonClickEvent<T>>();
  readonly tableRowClicked = output<T>();
  readonly loadMoreResources = output<void>();
  readonly paginationLimitChanged = output<number>();

  columnTrackBy = (column: TableFieldDefinition, index: number) =>
    column.property ?? column.value ?? index;
  rowTrackBy = (_index: number, item: T): unknown =>
    getResourceValueByJsonPath(item, { property: this.trackByPath() }) ??
    _index;
  viewColumns = computed(() => processGroupFields(this.columns()));
}
