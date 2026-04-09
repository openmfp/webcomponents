import { FormFieldDefinition } from '../form';
import { DeclarativeForm } from '../form/declarative-form/declarative-form.component';
import { DeclarativeTable } from '../table/declarative-table/declarative-table.component';
import {
  GenericResource,
  TableFieldDefinition,
  ValueCellButtonClickEvent,
} from '../table/models';
import { getResourceValueByJsonPath } from '../table/utils/resource-field-by-path';
import {
  TableCardCreateConfig,
  TableCardDeleteConfig,
  TableCardEditConfig,
  TableCardReadConfig,
} from './models/configs';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  Injector,
  ViewEncapsulation,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Button } from '@fundamental-ngx/ui5-webcomponents/button';
import { Dialog } from '@fundamental-ngx/ui5-webcomponents/dialog';
import { Icon } from '@fundamental-ngx/ui5-webcomponents/icon';
import { Input } from '@fundamental-ngx/ui5-webcomponents/input';
import { Title } from '@fundamental-ngx/ui5-webcomponents/title';
import { debounceTime } from 'rxjs';

@Component({
  selector: 'mfp-declarative-table-card',
  imports: [
    DeclarativeTable,
    DeclarativeForm,
    ReactiveFormsModule,
    Dialog,
    Title,
    Button,
    Icon,
    Input,
  ],
  templateUrl: './declarative-table-card.component.html',
  styleUrl: './declarative-table-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.ShadowDom,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DeclarativeTableCardComponent<T extends GenericResource> {
  header = input.required<string>();
  resources = input.required<T[]>();
  headerTooltip = input<string>();

  readConfig = input.required<TableCardReadConfig>();
  createConfig = input<TableCardCreateConfig>();
  editConfig = input<TableCardEditConfig>();
  deleteConfig = input<TableCardDeleteConfig>();

  readonly actionButtonClick = output<ValueCellButtonClickEvent<T>>();
  readonly tableRowClicked = output<T>();
  readonly loadMoreResources = output<void>();
  readonly paginationLimitChanged = output<number>();

  readonly searchChanged = output<string>();
  readonly createConfirmed = output<Record<string, unknown>>();
  readonly editConfirmed = output<{
    resource: T;
    formValue: Record<string, unknown>;
  }>();
  readonly deleteConfirmed = output<T>();

  protected searchExpanded = signal(false);
  protected searchCollapsing = signal(false);
  protected searchControl = new FormControl('');
  protected searchInputRef = viewChild<Input>('searchInput');

  protected createDialogOpen = signal(false);
  protected editDialogOpen = signal(false);
  protected deleteDialogOpen = signal(false);

  protected pendingResource = signal<T | null>(null);
  protected pendingFormValue = signal<Record<string, unknown> | null>(null);

  protected effectiveColumns = computed(() => this.addActionsColumn());
  protected editInitialValue = computed(() => {
    const pendingResource = this.pendingResource();
    const editConfig = this.editConfig();
    if (!pendingResource || !editConfig) {
      return {};
    }

    return this.buildInitialValues(editConfig.fields, pendingResource);
  });

  private readonly injector = inject(Injector);

  constructor() {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed())
      .subscribe((value) => {
        this.searchChanged.emit(value ?? '');
      });
  }

  toggleSearch(): void {
    if (this.searchExpanded() && !this.searchCollapsing()) {
      this.collapseSearch();
    } else if (!this.searchExpanded()) {
      this.searchExpanded.set(true);
      afterNextRender(
        () => {
          this.searchInputRef()?.elementRef.nativeElement.focus();
        },
        { injector: this.injector },
      );
    }
  }

  onSearchBlur(): void {
    if (!this.searchControl.value) {
      this.collapseSearch();
    }
  }

  onSearchAnimationEnd(): void {
    if (this.searchCollapsing()) {
      this.searchCollapsing.set(false);
      this.searchExpanded.set(false);
      this.searchControl.setValue('', { emitEvent: false });
    }
  }

  private collapseSearch(): void {
    this.searchCollapsing.set(true);
  }

  onButtonClick(event: ValueCellButtonClickEvent<T>): void {
    const action = event.field.uiSettings?.buttonSettings?.action;
    if (action === 'edit' && event.resource) {
      this.pendingResource.set(event.resource);
      this.pendingFormValue.set(null);
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

  private addActionsColumn(): TableFieldDefinition[] {
    const cols = this.readConfig().fields;
    const editButton = this.editConfig();
    const deleteButton = this.deleteConfig();
    const actions: TableFieldDefinition[] = [];

    if (editButton) {
      actions.push({
        uiSettings: {
          displayAs: 'button',
          buttonSettings: {
            icon: 'edit',
            design: 'Transparent',
            action: 'edit',
            ...editButton.editButtonSettings,
          },
        },
        group: { name: 'actions', label: '', multiline: false },
      });
    }

    if (deleteButton) {
      actions.push({
        uiSettings: {
          displayAs: 'button',
          buttonSettings: {
            icon: 'decline',
            design: 'Transparent',
            action: 'delete',
            ...deleteButton.deleteButtonSettings,
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
