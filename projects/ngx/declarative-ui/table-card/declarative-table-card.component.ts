import { FormFieldChangeEvent, FormFieldDefinition } from '../form';
import { DeclarativeForm } from '../form/declarative-form/declarative-form.component';
import { GenericResource } from '../models';
import { DeclarativeTable } from '../table/declarative-table/declarative-table.component';
import {
  ResourceFieldButtonClickEvent,
  TableFieldDefinition,
} from '../table/models';
import { getResourceValueByJsonPath } from '../table/utils/resource-field-by-path';
import {
  FieldFilterDefinition,
  TableCardConfig,
  TableCardFormState,
} from './models/configs';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  OnDestroy,
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
import '@ui5/webcomponents-icons/dist/navigation-left-arrow.js';
import '@ui5/webcomponents-icons/dist/navigation-right-arrow.js';
import '@ui5/webcomponents-icons/dist/search.js';
import { debounceTime } from 'rxjs';

type SearchState = 'collapsed' | 'expanded' | 'collapsing';

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
export class DeclarativeTableCard<
  T extends GenericResource,
> implements OnDestroy {
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

  // ------------------------------------------------------------------------
  // Filter-tab strip (rendered above the table when `config.filterTabs` is set)
  // ------------------------------------------------------------------------

  /** Configured filters from the host. */
  protected filterTabs = computed(() => this.config().filterTabs ?? []);
  /** Whether the tab strip should render at all. */
  protected hasFilterTabs = computed(() => this.filterTabs().length > 0);
  /**
   * The currently-active filter, or `undefined` for the auto-prepended "All"
   * tab. Reset whenever the host swaps in a different `filterTabs` array.
   */
  protected activeFilterTab = signal<FieldFilterDefinition | undefined>(
    undefined,
  );
  /** True when the auto-prepended "All" tab is the active selection. */
  protected isAllTabActive = computed(
    () => this.activeFilterTab() === undefined,
  );
  protected filterStripRef =
    viewChild<ElementRef<HTMLDivElement>>('filterStrip');
  /** Whether the horizontal-scroll viewport can scroll further in each direction. */
  protected canScrollLeft = signal(false);
  protected canScrollRight = signal(false);

  private readonly injector = inject(Injector);
  /** Resize observer driving the chevron-visibility recomputation. */
  private resizeObserver?: ResizeObserver;

  constructor() {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed())
      .subscribe((value) => {
        this.searchChanged.emit(value ?? '');
      });

    // Whenever the host updates the filter list, seed the active selection
    // from `default: true` (falling back to "All"). Comparing by reference
    // catches genuine config swaps and ignores in-place CD pulses.
    effect(() => {
      const tabs = this.filterTabs();
      const def = tabs.find((t) => t.default);
      this.activeFilterTab.set(def);
      // Recompute scroll state once the new tabs paint.
      afterNextRender(() => this.recomputeScrollState(), {
        injector: this.injector,
      });
    });

    // Observe the strip size and recompute chevron visibility on resize.
    afterNextRender(
      () => {
        const el = this.filterStripRef()?.nativeElement;
        if (!el) return;
        this.resizeObserver = new ResizeObserver(() =>
          this.recomputeScrollState(),
        );
        this.resizeObserver.observe(el);
        this.recomputeScrollState();
      },
      { injector: this.injector },
    );
  }

  /**
   * Reflects the carousel's current `scrollLeft` into signals that drive the
   * chevron buttons' enabled state. Called on init, on user scroll, and after
   * any size change.
   */
  protected recomputeScrollState(): void {
    const el = this.filterStripRef()?.nativeElement;
    if (!el) {
      this.canScrollLeft.set(false);
      this.canScrollRight.set(false);
      return;
    }
    const { scrollLeft, scrollWidth, clientWidth } = el;
    // 1px tolerance — browsers occasionally report fractional pixel widths.
    this.canScrollLeft.set(scrollLeft > 1);
    this.canScrollRight.set(scrollLeft + clientWidth < scrollWidth - 1);
  }

  protected onFilterStripScroll(): void {
    this.recomputeScrollState();
  }

  /**
   * Scrolls the strip by ~70% of its visible width so one filter overlaps
   * the previous viewport — matches the carousel idiom in SAP and Material.
   */
  protected scrollFilterStrip(direction: 'left' | 'right'): void {
    const el = this.filterStripRef()?.nativeElement;
    if (!el) return;
    const delta = el.clientWidth * 0.7 * (direction === 'right' ? 1 : -1);
    el.scrollBy({ left: delta, behavior: 'smooth' });
  }

  selectFilterTab(tab: FieldFilterDefinition | undefined): void {
    this.activeFilterTab.set(tab);
    this.filterTabChanged.emit(tab);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
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
