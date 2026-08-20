import { DeleteConfirmationDialog } from '../dialogs/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { ResourceFormDialog } from '../dialogs/resource-form-dialog/resource-form-dialog.component';
import { FormFieldChangeEvent, FormFieldDefinition } from '../form';
import { GenericResource, ResourceFieldButtonClickEvent } from '../models';
import { DeclarativeTable } from '../table';
import { getResourceValueByJsonPath } from '../table/utils/resource-field-by-path';
import { FilterTabs } from './filter-tabs/filter-tabs.component';
import {
  FieldFilterDefinition,
  TableCardConfig,
  TableCardFormState,
} from './models/configs';
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
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Button } from '@fundamental-ngx/ui5-webcomponents/button';
import { Icon } from '@fundamental-ngx/ui5-webcomponents/icon';
import { Input } from '@fundamental-ngx/ui5-webcomponents/input';
import '@ui5/webcomponents-icons/dist/add.js';
import '@ui5/webcomponents-icons/dist/search.js';
import { debounceTime, distinctUntilChanged, filter, map } from 'rxjs';

@Component({
  selector: 'mfp-declarative-table-card',
  imports: [
    DeclarativeTable,
    FilterTabs,
    ReactiveFormsModule,
    Button,
    Icon,
    Input,
    ResourceFormDialog,
    DeleteConfirmationDialog,
  ],
  templateUrl: './declarative-table-card.component.html',
  styleUrl: './declarative-table-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.ShadowDom,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DeclarativeTableCard<R extends GenericResource> {
  resources = input<R[]>([]);
  permissions = input<Record<string, string[]>>();

  config = input<TableCardConfig<R> | undefined>(undefined);
  createFormState = input<TableCardFormState>({});
  editFormState = input<TableCardFormState>({});

  readonly actionButtonClick = output<ResourceFieldButtonClickEvent<R>>();
  readonly tableRowClicked = output<R>();
  readonly loadMoreResources = output<void>();
  readonly paginationLimitChanged = output<number>();
  readonly pageChange = output<number>();

  readonly searchChanged = output<string>();
  readonly createFieldChange = output<FormFieldChangeEvent>();
  readonly editFieldChange = output<{
    resource: R;
    formChangeEvent: FormFieldChangeEvent;
  }>();
  readonly createSubmit = output<R>();
  readonly editSubmit = output<{
    resource: R;
    value: Record<string, unknown>;
  }>();
  readonly deleteSubmit = output<R>();
  readonly filterTabChanged = output<FieldFilterDefinition | undefined>();

  protected searchControl = new FormControl('');

  protected createDialogOpen = signal(false);
  protected editDialogOpen = signal(false);
  protected deleteDialogOpen = signal(false);

  protected pendingResource = signal<R | null>(null);
  protected resolvedCreateFields = signal<FormFieldDefinition[]>([]);
  protected resolvedEditFields = signal<FormFieldDefinition[]>([]);

  protected tableConfig = computed(() => this.config()?.tableConfig);
  protected header = computed(() => this.config()?.header);
  protected headerTooltip = computed(() => this.config()?.headerTooltip);
  protected createFormConfig = computed(
    () => this.config()?.createResourceFormConfig,
  );
  protected editFormConfig = computed(() => {
    const pendingResource = this.pendingResource();
    if (!pendingResource) {
      return;
    }

    return this.config()?.editResourceFormConfig?.(pendingResource);
  });
  protected deleteConfirmationConfig = computed(() => {
    const pendingResource = this.pendingResource();
    if (!pendingResource) {
      return;
    }

    return this.config()?.deleteResourceConfirmationConfig?.(pendingResource);
  });
  protected createButtonConfig = computed(
    () => this.config()?.buttonSettings?.createButton,
  );
  protected searchButtonConfig = computed(
    () => this.config()?.buttonSettings?.searchButton,
  );
  protected effectiveColumns = computed(() => this.tableConfig()?.fields ?? []);
  protected editInitialValue = computed(() => {
    const pendingResource = this.pendingResource();
    const editConfig = this.editFormConfig();
    if (!pendingResource || !editConfig) {
      return {};
    }

    return this.buildInitialValues(this.resolvedEditFields(), pendingResource);
  });

  protected searchConfig = computed(() => this.config()?.searchConfig);
  protected resourcesSearchable = computed(() => !!this.searchConfig());
  protected searchPlaceholder = computed(
    () => this.searchConfig()?.placeholder ?? 'Search',
  );

  protected filterTabs = computed(() => {
    const tabs = this.searchConfig()?.filterTabs;
    if (!tabs?.length) return [];

    const initial = this.searchConfig()?.initialFilter;
    if (!initial) {
      return tabs;
    }

    const matches = tabs.some(
      (t) => t.property === initial.property && t.value === initial.value,
    );
    if (!matches) return tabs;

    return tabs.map((tab) =>
      tab.property === initial.property && tab.value === initial.value
        ? { ...tab, default: true }
        : tab.default
          ? { ...tab, default: false }
          : tab,
    );
  });

  protected hasFilterTabs = computed(() => this.filterTabs().length > 0);

  constructor() {
    this.searchControl.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((value) => {
        this.searchChanged.emit(value ?? '');
      });

    toObservable(this.searchConfig)
      .pipe(
        map((config) => config?.initialSearch),
        filter((initial): initial is string => !!initial),
        takeUntilDestroyed(),
      )
      .subscribe((initial) => {
        this.searchControl.setValue(initial, { emitEvent: false });
      });
  }

  protected onFilterTabChanged(tab: FieldFilterDefinition | undefined): void {
    this.filterTabChanged.emit(tab);
  }

  submitSearch(): void {
    this.searchChanged.emit(this.searchControl.value ?? '');
  }

  onButtonClick(event: ResourceFieldButtonClickEvent<R>): void {
    if (event.resource?.isAvailable === false) {
      return;
    }

    const action = event.field.uiSettings?.buttonSettings?.action;
    if (action === 'update' && event.resource) {
      this.pendingResource.set(event.resource);
      void this.openEditDialog(event.resource);
      return;
    }
    if (action === 'delete' && event.resource) {
      this.pendingResource.set(event.resource);
      this.deleteDialogOpen.set(true);
      return;
    }

    this.actionButtonClick.emit(event);
  }

  async openCreateDialog(): Promise<void> {
    this.resolvedCreateFields.set(
      await this.resolveFormFields(this.createFormConfig()?.fields),
    );
    this.createDialogOpen.set(true);
  }

  private async openEditDialog(resource: R): Promise<void> {
    const config = this.config()?.editResourceFormConfig?.(resource);
    const fields = await this.resolveFormFields(config?.fields);
    // A newer update action may have replaced the pending resource while we
    // awaited the field resolver; ignore this stale result so the dialog never
    // shows one resource's fields with another's initial values.
    if (this.pendingResource() !== resource) {
      return;
    }

    this.resolvedEditFields.set(fields);
    this.editDialogOpen.set(true);
  }

  private async resolveFormFields(
    fields:
      | FormFieldDefinition[]
      | (() => Promise<FormFieldDefinition[]>)
      | undefined,
  ): Promise<FormFieldDefinition[]> {
    if (!fields) return [];
    return typeof fields === 'function' ? await fields() : fields;
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

  onCreateSubmit(value: Record<string, unknown>): void {
    this.createSubmit.emit(value as R);
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

  private buildInitialValues(
    fields: FormFieldDefinition[],
    resource?: R,
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
