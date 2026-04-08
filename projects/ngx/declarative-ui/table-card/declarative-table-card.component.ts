import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ViewEncapsulation,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { DeclarativeTable } from '../table/declarative-table/declarative-table.component';
import { DeclarativeForm } from '../form/declarative-form/declarative-form.component';
import {
  ButtonSettings,
  GenericResource,
  TableFieldDefinition,
  ValueCellButtonClickEvent,
} from '../table/models';
import { FormFieldDefinition } from '../form/models';
import { Button } from '@fundamental-ngx/ui5-webcomponents/button';
import { Dialog } from '@fundamental-ngx/ui5-webcomponents/dialog';
import { Icon } from '@fundamental-ngx/ui5-webcomponents/icon';
import { Input } from '@fundamental-ngx/ui5-webcomponents/input';
import { Title } from '@fundamental-ngx/ui5-webcomponents/title';

export interface TableCardCreateEditConfig {
  fields: FormFieldDefinition[];
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  createOnlyFields?: string[];
  editButtonSettings?: Partial<ButtonSettings>;
  deleteButtonSettings?: Partial<ButtonSettings>;
}

export interface TableCardDeleteConfig {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

@Component({
  selector: 'mfp-declarative-table-card',
  imports: [DeclarativeTable, DeclarativeForm, Dialog, Title, Button, Icon, Input],
  templateUrl: './declarative-table-card.component.html',
  styleUrl: './declarative-table-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.ShadowDom,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DeclarativeTableCardComponent<T extends GenericResource> {
  // Table pass-through inputs
  columns = input.required<TableFieldDefinition[]>();
  resources = input.required<T[]>();
  totalItemsCount = input<number>();
  paginationLimit = input<number>(5);
  hasMore = input<boolean>(false);

  // Card-specific inputs
  header = input<string>();
  createConfig = input<TableCardCreateEditConfig>();
  editDeleteConfig = input<TableCardCreateEditConfig>();
  deleteConfig = input<TableCardDeleteConfig>();

  // Table pass-through outputs (only non-intercepted buttonClick forwarded)
  readonly buttonClick = output<ValueCellButtonClickEvent<T>>();
  readonly tableRowClicked = output<T>();
  readonly loadMoreResources = output<void>();
  readonly paginationLimitChanged = output<number>();

  // Card-specific outputs
  readonly searchChanged = output<string>();
  readonly createConfirmed = output<Record<string, unknown>>();
  readonly editConfirmed = output<{ resource: T; formValue: Record<string, unknown> }>();
  readonly deleteConfirmed = output<T>();

  // Internal signals
  protected searchExpanded = signal(false);
  protected searchValue = signal('');
  protected createDialogOpen = signal(false);
  protected editDialogOpen = signal(false);
  protected deleteDialogOpen = signal(false);
  protected pendingResource = signal<T | null>(null);
  protected pendingFormValue = signal<Record<string, unknown> | null>(null);
  protected formValid = signal(false);

  // Computed: inject Actions column when edit/delete configs provided
  protected effectiveColumns = computed<TableFieldDefinition[]>(() => {
    const cols = this.columns();
    const hasEdit = !!this.editDeleteConfig();
    const hasDelete = !!this.deleteConfig();
    if (!hasEdit && !hasDelete) return cols;

    const editCol: TableFieldDefinition | undefined = hasEdit
      ? {
          label: '',
          uiSettings: {
            displayAs: 'button',
            buttonSettings: {
              icon: this.editDeleteConfig()!.editButtonSettings?.icon ?? 'edit',
              design: (this.editDeleteConfig()!.editButtonSettings?.design as ButtonSettings['design']) ?? 'Transparent',
              action: 'edit',
            },
          },
          group: { name: 'actions', label: 'Actions' },
        }
      : undefined;

    const deleteCol: TableFieldDefinition | undefined = hasDelete
      ? {
          label: '',
          uiSettings: {
            displayAs: 'button',
            buttonSettings: {
              icon: this.editDeleteConfig()?.deleteButtonSettings?.icon ?? 'delete',
              design: (this.editDeleteConfig()?.deleteButtonSettings?.design as ButtonSettings['design']) ?? 'Negative',
              action: 'delete',
            },
          },
          group: { name: 'actions' },
        }
      : undefined;

    return [...cols, ...[editCol, deleteCol].filter(Boolean) as TableFieldDefinition[]];
  });

  // Computed: edit fields with createOnlyFields disabled
  protected editFields = computed<FormFieldDefinition[]>(() => {
    const cfg = this.editDeleteConfig();
    if (!cfg) return [];
    return cfg.fields.map(f => ({
      ...f,
      disabled: cfg.createOnlyFields?.includes(f.name) ? true : (f.disabled ?? false),
    }));
  });

  toggleSearch(): void {
    this.searchExpanded.update(v => !v);
  }

  onSearchInput(value: string): void {
    this.searchValue.set(value);
    this.searchChanged.emit(value);
    if (!value) this.searchExpanded.set(false);
  }

  onButtonClick(event: ValueCellButtonClickEvent<T>): void {
    const action = event.field.uiSettings?.buttonSettings?.action;
    if (action === 'edit' && event.resource) {
      this.pendingResource.set(event.resource);
      this.pendingFormValue.set(null);
      this.formValid.set(false);
      this.editDialogOpen.set(true);
      return;
    }
    if (action === 'delete' && event.resource) {
      this.pendingResource.set(event.resource);
      this.deleteDialogOpen.set(true);
      return;
    }
    this.buttonClick.emit(event);
  }

  onCreateConfirm(): void {
    const value = this.pendingFormValue();
    if (value) this.createConfirmed.emit(value);
    this.createDialogOpen.set(false);
  }

  onEditConfirm(): void {
    const resource = this.pendingResource();
    const formValue = this.pendingFormValue();
    if (resource && formValue) this.editConfirmed.emit({ resource, formValue });
    this.editDialogOpen.set(false);
  }

  onDeleteConfirm(): void {
    const resource = this.pendingResource();
    if (resource) this.deleteConfirmed.emit(resource);
    this.deleteDialogOpen.set(false);
  }
}
