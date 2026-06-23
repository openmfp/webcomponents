import { FormFieldChangeEvent, FormFieldDefinition } from '../form';
import { DeclarativeForm } from '../form/declarative-form/declarative-form.component';
import { GenericResource } from '../models';
import { DeclarativeTable } from '../table/declarative-table/declarative-table.component';
import {
  ResourceFieldButtonClickEvent,
  TableFieldDefinition,
} from '../table/models';
import { getResourceValueByJsonPath } from '../table/utils/resource-field-by-path';
import { TableCardConfig, TableCardFormState } from './models/configs';
import { TableCardSearch } from './search/table-card-search.component';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { Button } from '@fundamental-ngx/ui5-webcomponents/button';
import { Dialog } from '@fundamental-ngx/ui5-webcomponents/dialog';
import { Icon } from '@fundamental-ngx/ui5-webcomponents/icon';
import { Title } from '@fundamental-ngx/ui5-webcomponents/title';
import '@ui5/webcomponents-icons/dist/add.js';

@Component({
  selector: 'mfp-declarative-table-card',
  imports: [
    DeclarativeTable,
    DeclarativeForm,
    Dialog,
    Title,
    Button,
    Icon,
    TableCardSearch,
  ],
  templateUrl: './declarative-table-card.component.html',
  styleUrl: './declarative-table-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.ShadowDom,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DeclarativeTableCard<T extends GenericResource> {
  resources = input.required<T[]>();

  config = input.required<TableCardConfig>();
  createFormState = input<TableCardFormState>({});
  editFormState = input<TableCardFormState>({});

  readonly actionButtonClick = output<ResourceFieldButtonClickEvent<T>>();
  readonly tableRowClicked = output<T>();
  readonly loadMoreResources = output<void>();
  readonly paginationLimitChanged = output<number>();

  /**
   * Emitted after the user types into the search input, debounced by 300 ms.
   * Carries the current input value and the active scope (if any).
   */
  readonly searchChanged = output<{ value: string; scope?: string }>();
  /**
   * Emitted synchronously when the user submits the search (presses Enter or
   * clicks the search icon). Carries the submitted value and the active scope.
   */
  readonly searchSubmit = output<{ value: string; scope?: string }>();
  /**
   * Emitted synchronously when the user selects a different scope in the
   * scopes dropdown. Carries the current in-flight search text and the new scope.
   */
  readonly scopeChanged = output<{ value: string; scope?: string }>();
  readonly createFieldChange = output<FormFieldChangeEvent>();
  readonly editFieldChange = output<{
    resource: T;
    formChangeEvent: FormFieldChangeEvent;
  }>();
  readonly createSubmit = output<T>();
  readonly editSubmit = output<{
    resource: T;
    value: Record<string, unknown>;
  }>();
  readonly deleteSubmit = output<T>();

  protected createDialogOpen = signal(false);
  protected editDialogOpen = signal(false);
  protected deleteDialogOpen = signal(false);

  protected pendingResource = signal<T | null>(null);

  protected tableConfig = computed(() => this.config().tableConfig);
  protected header = computed(() => this.config().header);
  protected headerTooltip = computed(() => this.config().headerTooltip);
  protected searchConfig = computed(() => this.config().searchConfig);
  protected createFormConfig = computed(
    () => this.config().createResourceFormConfig,
  );
  protected editFormConfig = computed(
    () => this.config().editResourceFormConfig,
  );
  protected deleteConfirmationConfig = computed(
    () => this.config().deleteResourceConfirmationConfig,
  );
  protected createButtonConfig = computed(
    () => this.config().buttonSettings?.createButton,
  );
  protected searchButtonConfig = computed(
    () => this.config().buttonSettings?.searchButton,
  );
  protected effectiveColumns = computed(() => this.addActionsColumn());
  protected editInitialValue = computed(() => {
    const pendingResource = this.pendingResource();
    const editConfig = this.editFormConfig();
    if (!pendingResource || !editConfig) {
      return {};
    }

    return this.buildInitialValues(editConfig.fields, pendingResource);
  });

  onButtonClick(event: ResourceFieldButtonClickEvent<T>): void {
    const action = event.field.uiSettings?.buttonSettings?.action;
    if (action === 'edit' && event.resource) {
      this.pendingResource.set(event.resource);
      this.editDialogOpen.set(true);
      return;
    }
    if (action === 'delete' && event.resource) {
      this.pendingResource.set(event.resource);
      this.deleteDialogOpen.set(true);
      return;
    }

    this.actionButtonClick.emit(event);
  }

  closeCreateDialog(): void {
    this.createDialogOpen.set(false);
  }

  closeEditDialog(): void {
    this.editDialogOpen.set(false);
  }

  closeDeleteDialog(): void {
    this.deleteDialogOpen.set(false);
  }

  onCreateFieldChange(event: FormFieldChangeEvent): void {
    this.createFieldChange.emit(event);
  }

  onEditFieldChange(event: FormFieldChangeEvent): void {
    const resource = this.pendingResource();

    if (resource) {
      this.editFieldChange.emit({ resource, formChangeEvent: event });
    }
  }

  onCreateSubmit(value: T): void {
    this.createSubmit.emit(value);
  }

  onEditSubmit(value: Record<string, unknown>): void {
    const resource = this.pendingResource();

    if (resource) {
      this.editSubmit.emit({ resource, value });
    }
  }

  onDeleteSubmit(): void {
    const resource = this.pendingResource();
    if (resource) this.deleteSubmit.emit(resource);
  }

  protected hasErrors(state: TableCardFormState): boolean {
    const errors = state.fieldErrors;
    return !!errors && Object.values(errors).some((val) => !!val);
  }

  private addActionsColumn(): TableFieldDefinition[] {
    const cols = this.tableConfig().fields;
    const buttonSettings = this.config().buttonSettings;
    const editButton = this.editFormConfig();
    const deleteButton = this.deleteConfirmationConfig();
    const actions: TableFieldDefinition[] = [];

    if (editButton) {
      actions.push({
        property: 'mfp_edit_action',
        uiSettings: {
          displayAs: 'button',
          align: 'end',
          buttonSettings: {
            icon: 'edit',
            design: 'Transparent',
            action: 'edit',
            tooltip: 'Edit',
            ...buttonSettings?.editButton,
          },
        },
        group: { name: 'actions', label: '', multiline: false },
      });
    }

    if (deleteButton) {
      actions.push({
        property: 'mfp_delete_action',
        uiSettings: {
          align: 'end',
          displayAs: 'button',
          buttonSettings: {
            icon: 'decline',
            design: 'Transparent',
            action: 'delete',
            tooltip: 'Delete',
            ...buttonSettings?.deleteButton,
          },
        },
        group: { name: 'actions', label: '', multiline: false },
      });
    }

    return cols.concat(actions);
  }

  private buildInitialValues(
    fields: FormFieldDefinition[],
    resource?: T,
  ): Record<string, unknown> {
    if (!resource) return {};

    return fields.reduce(
      (acc, field) => {
        if (typeof field.name === 'string') {
          acc[field.name] =
            getResourceValueByJsonPath(resource, { property: field.name }) ??
            '';
        }
        return acc;
      },
      {} as Record<string, unknown>,
    );
  }
}
