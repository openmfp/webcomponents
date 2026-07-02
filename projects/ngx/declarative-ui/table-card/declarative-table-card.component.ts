import { FormFieldChangeEvent, FormFieldDefinition } from '../form';
import { DeclarativeForm } from '../form/declarative-form/declarative-form.component';
import { GenericResource } from '../models';
import { DeclarativeTable } from '../table/declarative-table/declarative-table.component';
import {
  ResourceFieldButtonClickEvent,
  TableFieldDefinition,
} from '../table/models';
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
  Injector,
  ViewEncapsulation,
  afterNextRender,
  computed,
  effect,
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
import '@ui5/webcomponents-icons/dist/add.js';
import '@ui5/webcomponents-icons/dist/search.js';
import { debounceTime } from 'rxjs';

type SearchState = 'collapsed' | 'expanded' | 'collapsing';

@Component({
  selector: 'mfp-declarative-table-card',
  imports: [
    DeclarativeTable,
    DeclarativeForm,
    FilterTabs,
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
export class DeclarativeTableCard<T extends GenericResource> {
  resources = input.required<T[]>();

  config = input.required<TableCardConfig>();
  createFormState = input<TableCardFormState>({});
  editFormState = input<TableCardFormState>({});

  readonly actionButtonClick = output<ResourceFieldButtonClickEvent<T>>();
  readonly tableRowClicked = output<T>();
  readonly loadMoreResources = output<void>();
  readonly paginationLimitChanged = output<number>();

  readonly searchChanged = output<string>();
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
  readonly filterTabChanged = output<FieldFilterDefinition | undefined>();

  protected searchState = signal<SearchState>('collapsed');
  protected searchExpanded = computed(() => this.searchState() !== 'collapsed');
  protected searchCollapsing = computed(
    () => this.searchState() === 'collapsing',
  );
  protected searchControl = new FormControl('');
  protected searchInputRef = viewChild<Input>('searchInput');

  protected createDialogOpen = signal(false);
  protected editDialogOpen = signal(false);
  protected deleteDialogOpen = signal(false);

  protected pendingResource = signal<T | null>(null);

  protected tableConfig = computed(() => this.config().tableConfig);
  protected header = computed(() => this.config().header);
  protected headerTooltip = computed(() => this.config().headerTooltip);
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

  protected searchConfig = computed(() => this.config().searchConfig);
  protected resourcesSearchable = computed(() => !!this.searchConfig());
  /**
   * Filter-tab definitions for the strip rendered above the table.
   *
   * If `searchConfig.initialFilter` is set and matches an entry by
   * `property`+`value`, that entry is promoted to `default: true` (and any
   * pre-existing `default` on other entries is cleared) exactly once — the
   * first time filter tabs are handed to the child. This is how we drive the
   * initial selection without adding an API to `<mfp-filter-tabs>`, which
   * already re-evaluates its active tab from `default:` whenever `tabs()`
   * changes. Subsequent recomputations pass through untouched so user-driven
   * tab clicks (which flow through `filterTabChanged`) aren't overridden.
   */
  protected filterTabs = computed(() => {
    const tabs = this.searchConfig()?.filterTabs;
    if (!tabs?.length) return [];

    // Once the seed has latched, keep returning the promoted array (not the
    // raw input) so the child `<mfp-filter-tabs>` doesn't re-select from the
    // original `default: true` on every recomputation.
    if (this.hasSeededFilter) {
      return this.seededFilterTabs ?? tabs;
    }

    const initial = this.searchConfig()?.initialFilter;
    if (!initial) {
      this.hasSeededFilter = true;
      return tabs;
    }

    // Only touch the array if the initial filter actually matches an entry.
    // Otherwise pass through untouched — the pre-existing `default: true`
    // (if any) still drives the initial selection, and a later recomputation
    // might find a match (e.g. host is still resolving `filterTabs`).
    const matches = tabs.some(
      (t) => t.property === initial.property && t.value === initial.value,
    );
    if (!matches) return tabs;

    this.hasSeededFilter = true;
    this.seededFilterTabs = tabs.map((tab) =>
      tab.property === initial.property && tab.value === initial.value
        ? { ...tab, default: true }
        : tab.default
          ? { ...tab, default: false }
          : tab,
    );
    return this.seededFilterTabs;
  });

  protected hasFilterTabs = computed(() => this.filterTabs().length > 0);

  /** Latched once the `initialFilter` seed has been applied (or determined to be absent). */
  private hasSeededFilter = false;
  /** Cached promoted array so recomputations don't fall back to the raw input. */
  private seededFilterTabs: FieldFilterDefinition[] | undefined;
  /** Latched once the `initialSearch` seed has been applied. */
  private hasSeededSearch = false;

  private readonly injector = inject(Injector);

  constructor() {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed())
      .subscribe((value) => {
        this.searchChanged.emit(value ?? '');
      });

    // One-shot seed of the search input from `searchConfig.initialSearch`.
    // Runs the first time the config carries a non-empty `initialSearch`;
    // afterwards the flag latches and the effect no-ops. `emitEvent: false`
    // suppresses `searchChanged` so the host doesn't see a phantom user edit.
    // We also auto-expand the input so the seeded value is visible instead of
    // hidden behind the collapsed toggle button.
    effect(() => {
      if (this.hasSeededSearch) return;
      const initial = this.searchConfig()?.initialSearch;
      if (!initial) return;
      this.searchControl.setValue(initial, { emitEvent: false });
      this.searchState.set('expanded');
      this.hasSeededSearch = true;
    });
  }

  protected onFilterTabChanged(tab: FieldFilterDefinition | undefined): void {
    this.filterTabChanged.emit(tab);
  }

  toggleSearch(): void {
    if (this.searchState() === 'expanded') {
      this.collapseSearch();
    } else if (this.searchState() === 'collapsed') {
      this.searchState.set('expanded');
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
      this.searchState.set('collapsed');
      this.searchControl.setValue('', { emitEvent: false });
    }
  }

  private collapseSearch(): void {
    this.searchState.set('collapsing');
  }

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
