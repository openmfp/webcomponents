import {
  GenericResource,
  TableFieldDefinition,
  ValueCellButtonClickEvent,
} from '../models';
import { processGroupFields } from '../utils/proccess-fields';
import { ValueCellComponent } from '../value-cell/value-cell.component';
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

@Component({
  selector: 'mfp-declarative-table',
  templateUrl: './declarative-table.component.html',
  styleUrls: ['./declarative-table.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom,
  imports: [
    IllustratedMessage,
    Table,
    TableCell,
    TableHeaderCell,
    TableHeaderRow,
    TableRow,
    ValueCellComponent,
    Select,
    Option,
    TableGrowing,
  ],
})
export class DeclarativeTable<T extends GenericResource> {
  columns = input.required<TableFieldDefinition[]>();
  resources = input.required<T[]>();
  trackBy = input.required<(item: T) => string | number>();

  totalItemsCount = input<number>();
  paginationLimit = input<number>(5);
  hasMore = input<boolean>(false);

  buttonClick = output<ValueCellButtonClickEvent<T>>();
  tableRowClicked = output<any>();
  loadMoreResources = output<void>();
  paginationLimitChanged = output<number>();

  columnTrackBy = (column: TableFieldDefinition, index: number) =>
    column.property ?? column.value ?? index;
  viewColumns = computed(() => processGroupFields(this.columns()));
}
