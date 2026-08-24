import { ResourceFormDialog } from '../dialogs/resource-form-dialog/resource-form-dialog.component';
import { FormFieldChangeEvent, FormFieldDefinition } from '../form/models';
import { DeclarativeTable } from '../table';
import {
  ButtonSettings,
  GenericResource,
  ResourceFieldButtonClickEvent,
  TableFieldDefinition,
} from '../table/models';
import { DeclarativeTableCard } from './declarative-table-card.component';
import {
  DeleteResourceConfirmationConfig,
  FieldFilterDefinition,
  ResourceFormConfig,
  TableCardConfig,
  TableCardFormState,
  TableConfig,
} from './models/configs';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { axe } from 'vitest-axe';

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

type TableCardCreateConfig = ResourceFormConfig;
type TableCardReadConfig = TableConfig;
type TableCardEditConfig = ResourceFormConfig & {
  editButtonSettings?: Partial<ButtonSettings>;
};
type TableCardDeleteConfig = DeleteResourceConfirmationConfig & {
  deleteButtonSettings?: Partial<ButtonSettings>;
};

type Comp = DeclarativeTableCard<GenericResource>;
type Fixture = ComponentFixture<Comp>;

/** Exposes the component's `protected filterTabs` computed for assertions. */
interface WithFilterTabs {
  filterTabs: () => FieldFilterDefinition[];
}

const COLUMNS: TableFieldDefinition[] = [
  { label: 'Name', property: 'metadata.name' },
  { label: 'Namespace', property: 'metadata.namespace' },
];

const READ_CONFIG: TableCardReadConfig = {
  fields: COLUMNS,
};

const RESOURCES: GenericResource[] = [
  { id: '1', metadata: { name: 'pod-alpha', namespace: 'default' } },
  { id: '2', metadata: { name: 'pod-beta', namespace: 'kube-system' } },
];

const FORM_FIELDS: FormFieldDefinition[] = [
  { name: 'metadata.name', label: 'Name', required: true },
  { name: 'metadata.namespace', label: 'Namespace' },
];

const CREATE_CONFIG: TableCardCreateConfig = {
  fields: FORM_FIELDS,
  title: 'Create Resource',
  confirmLabel: 'Create',
  cancelLabel: 'Cancel',
};

const EDIT_CONFIG: TableCardEditConfig = {
  fields: [
    { name: 'metadata.name', label: 'Name', required: true, disabled: true },
    { name: 'metadata.namespace', label: 'Namespace' },
  ],
  title: 'Edit Resource',
  confirmLabel: 'Save',
  cancelLabel: 'Cancel',
};

const DELETE_CONFIG: TableCardDeleteConfig = {
  title: 'Confirm Delete',
  message: 'This action cannot be undone.',
  confirmLabel: 'Delete',
  cancelLabel: 'Cancel',
};

function makeEvent(
  action: string,
  resource?: GenericResource,
): ResourceFieldButtonClickEvent<GenericResource> {
  return {
    event: new MouseEvent('click'),
    field: {
      label: '',
      uiSettings: {
        displayAs: 'button',
        buttonSettings: { action, icon: action },
      },
    },
    resource,
  };
}

function setup(
  opts: {
    headerTooltip?: string;
    readConfig?: TableCardReadConfig;
    resources?: GenericResource[];
    header?: string;
    createConfig?: TableCardCreateConfig;
    editConfig?: TableCardEditConfig;
    deleteConfig?: TableCardDeleteConfig;
    createFormState?: TableCardFormState;
    editFormState?: TableCardFormState;
    permissions?: Record<string, string[]>;
    loading?: boolean;
    loadingDelay?: number;
    error?: boolean;
  } = {},
): { fixture: Fixture; component: Comp } {
  const fixture: Fixture = TestBed.createComponent(
    DeclarativeTableCard as unknown as typeof DeclarativeTableCard<GenericResource>,
  );
  const component = fixture.componentInstance as Comp;

  const config: TableCardConfig = {
    header: opts.header || '',
    headerTooltip: opts.headerTooltip,
    tableConfig: opts.readConfig ?? READ_CONFIG,
    createResourceFormConfig: opts.createConfig,
    editResourceFormConfig: opts.editConfig
      ? () => opts.editConfig!
      : undefined,
    deleteResourceConfirmationConfig: opts.deleteConfig
      ? () => opts.deleteConfig!
      : undefined,
    buttonSettings: {},
  };

  fixture.componentRef.setInput('config', config);
  fixture.componentRef.setInput('resources', opts.resources ?? RESOURCES);
  fixture.componentRef.setInput('createFormState', opts.createFormState ?? {});
  fixture.componentRef.setInput('editFormState', opts.editFormState ?? {});
  if (opts.permissions !== undefined)
    fixture.componentRef.setInput('permissions', opts.permissions);
  if (opts.loading !== undefined)
    fixture.componentRef.setInput('loading', opts.loading);
  if (opts.loadingDelay !== undefined)
    fixture.componentRef.setInput('loadingDelay', opts.loadingDelay);
  if (opts.error !== undefined)
    fixture.componentRef.setInput('error', opts.error);

  fixture.detectChanges();
  return { fixture, component };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

/** Query inside a ResourceFormDialog child's shadow root by test-id prefix. */
function dialogRoot(
  fixture: ComponentFixture<DeclarativeTableCard<GenericResource>>,
  prefix: string,
): ShadowRoot | HTMLElement | null {
  const dialogs = fixture.debugElement.queryAll(
    By.directive(ResourceFormDialog),
  );
  const dialog = dialogs.find(
    (de) =>
      (de.componentInstance as ResourceFormDialog).dataTestidPrefix() ===
      prefix,
  );
  if (!dialog) return null;
  return dialog.nativeElement.shadowRoot ?? dialog.nativeElement;
}

describe('DeclarativeTableCard', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [
        DeclarativeTableCard as unknown as typeof DeclarativeTableCard<GenericResource>,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // -------------------------------------------------------------------------
  // 1. Component creation
  // -------------------------------------------------------------------------

  it('should create', () => {
    const { component } = setup();
    expect(component).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  // 2. DOM: mfp-declarative-table rendered
  // -------------------------------------------------------------------------

  describe('DOM: mfp-declarative-table', () => {
    it('renders mfp-declarative-table in the host element', () => {
      const { fixture } = setup();
      const root: ShadowRoot | HTMLElement =
        fixture.nativeElement.shadowRoot ?? fixture.nativeElement;
      expect(root.querySelector('mfp-declarative-table')).not.toBeNull();
    });
  });

  describe('loading and error state threading', () => {
    it('passes runtime state to mfp-declarative-table', () => {
      const { fixture } = setup({
        loading: true,
        loadingDelay: 250,
        error: false,
      });
      const table = fixture.debugElement.query(By.directive(DeclarativeTable))
        .componentInstance as DeclarativeTable<GenericResource>;

      expect(table.loading()).toBe(true);
      expect(table.loadingDelay()).toBe(250);
      expect(table.error()).toBe(false);
    });

    it('forwards retry from mfp-declarative-table', () => {
      const { fixture, component } = setup({ error: true });
      const table = fixture.debugElement.query(By.directive(DeclarativeTable))
        .componentInstance as DeclarativeTable<GenericResource>;
      const emitted: void[] = [];
      component.retry.subscribe(() => emitted.push(undefined));

      table.retry.emit();

      expect(emitted).toHaveLength(1);
    });
  });

  // -------------------------------------------------------------------------
  // 3. header input
  // -------------------------------------------------------------------------

  describe('header input', () => {
    it('renders the header title when header is provided', () => {
      const { fixture } = setup({ header: 'My Pods' });
      const root: ShadowRoot | HTMLElement =
        fixture.nativeElement.shadowRoot ?? fixture.nativeElement;
      const title = root.querySelector('.card__title');
      expect(title).not.toBeNull();
      expect(title?.textContent?.trim()).toBe('My Pods');
    });
  });

  // -------------------------------------------------------------------------
  // 4. headerTooltip input
  // -------------------------------------------------------------------------

  describe('headerTooltip input', () => {
    it('renders info icon when headerTooltip is provided', () => {
      const { fixture } = setup({
        header: 'My Pods',
        headerTooltip: 'Some tooltip',
      });
      fixture.detectChanges();
      const root: ShadowRoot | HTMLElement =
        fixture.nativeElement.shadowRoot ?? fixture.nativeElement;
      const icon = root.querySelector('ui5-icon[name="hint"]');
      expect(icon).not.toBeNull();
    });

    it('does not render info icon when headerTooltip is not provided', () => {
      const { fixture } = setup({ headerTooltip: undefined });
      const root: ShadowRoot | HTMLElement =
        fixture.nativeElement.shadowRoot ?? fixture.nativeElement;
      expect(root.querySelector('ui5-icon[name="hint"]')).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // 5. Search behaviour
  // -------------------------------------------------------------------------

  describe('search', () => {
    const setupSearch = (searchConfig: TableCardConfig['searchConfig']) => {
      const fixture = TestBed.createComponent(
        DeclarativeTableCard as unknown as typeof DeclarativeTableCard<GenericResource>,
      );
      const component = fixture.componentInstance as Comp;

      const searchEvents: string[] = [];
      component.searchChanged.subscribe((v) => searchEvents.push(v));

      fixture.componentRef.setInput('config', {
        header: '',
        tableConfig: READ_CONFIG,
        searchConfig,
      } satisfies TableCardConfig);
      fixture.componentRef.setInput('resources', RESOURCES);
      fixture.componentRef.setInput('createFormState', {});
      fixture.componentRef.setInput('editFormState', {});
      fixture.detectChanges();

      const root: ShadowRoot | HTMLElement =
        fixture.nativeElement.shadowRoot ?? fixture.nativeElement;

      return { fixture, component, searchEvents, root };
    };

    it('renders the search input when searchConfig is present', () => {
      const { root } = setupSearch({});
      expect(
        root.querySelector('[data-testid="generic-table-card-search-input"]'),
      ).not.toBeNull();
    });

    it('does not render the search input when searchConfig is absent', () => {
      const { fixture } = setup();
      const root: ShadowRoot | HTMLElement =
        fixture.nativeElement.shadowRoot ?? fixture.nativeElement;
      expect(
        root.querySelector('[data-testid="generic-table-card-search-input"]'),
      ).toBeNull();
    });

    it('enables the built-in clear icon on the input', () => {
      const { root } = setupSearch({});
      const input = root.querySelector(
        '[data-testid="generic-table-card-search-input"]',
      ) as (Element & { showClearIcon?: boolean }) | null;
      expect(input?.showClearIcon).toBe(true);
    });

    it('renders the search icon in the input icon slot', () => {
      const { root } = setupSearch({});
      const icon = root.querySelector(
        '[data-testid="generic-table-card-search-icon"]',
      );
      expect(icon).not.toBeNull();
      expect(icon?.getAttribute('slot')).toBe('icon');
      expect(icon?.getAttribute('name')).toBe('search');
    });

    it('debounces typing by 500ms before emitting searchChanged', () => {
      vi.useFakeTimers();
      try {
        const { component, searchEvents } = setupSearch({});
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (component as any).searchControl.setValue('abc');

        vi.advanceTimersByTime(499);
        expect(searchEvents).toEqual([]);

        vi.advanceTimersByTime(1);
        expect(searchEvents).toEqual(['abc']);
      } finally {
        vi.useRealTimers();
      }
    });

    it('does not re-emit when the same value arrives again (blur commit)', () => {
      // The UI5 `input` (typing) and `change` (blur/enter) events both flow
      // through the CVA into `valueChanges`. `distinctUntilChanged` drops the
      // duplicate the blur commit produces for an unchanged value.
      vi.useFakeTimers();
      try {
        const { component, searchEvents } = setupSearch({});
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const control = (component as any).searchControl;

        control.setValue('abc'); // typing (ui5 input)
        control.setValue('abc'); // blur commit (ui5 change) — same value

        vi.advanceTimersByTime(500);
        expect(searchEvents).toEqual(['abc']);
      } finally {
        vi.useRealTimers();
      }
    });

    it('submitSearch() emits the current value immediately', () => {
      const { component, searchEvents } = setupSearch({});
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).searchControl.setValue('now', { emitEvent: false });
      component.submitSearch();
      expect(searchEvents).toEqual(['now']);
    });

    it('submitSearch() emits an empty string when the control is empty', () => {
      const { component, searchEvents } = setupSearch({});
      component.submitSearch();
      expect(searchEvents).toEqual(['']);
    });

    it('uses searchConfig.placeholder as the input placeholder', () => {
      const { component } = setupSearch({ placeholder: 'Find pods' });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).searchPlaceholder()).toBe('Find pods');
    });

    it('defaults the placeholder to "Search" when unset', () => {
      const { component } = setupSearch({});
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).searchPlaceholder()).toBe('Search');
    });
  });

  // -------------------------------------------------------------------------
  // 5.b searchConfig one-shot seeds (initialSearch / initialFilter)
  // -------------------------------------------------------------------------

  /**
   * Small fixture builder — the shared `setup()` helper doesn't accept a
   * `searchConfig`, and every test here needs one. Also exposes the emitted
   * `searchChanged` values so we can assert the seed is silent.
   */
  const setupWithSearchConfig = (
    searchConfig: TableCardConfig['searchConfig'],
  ) => {
    const fixture = TestBed.createComponent(
      DeclarativeTableCard as unknown as typeof DeclarativeTableCard<GenericResource>,
    );
    const component = fixture.componentInstance as Comp;

    const searchEvents: string[] = [];
    component.searchChanged.subscribe((v) => searchEvents.push(v));

    const config: TableCardConfig = {
      header: '',
      tableConfig: READ_CONFIG,
      searchConfig,
    };
    fixture.componentRef.setInput('config', config);
    fixture.componentRef.setInput('resources', RESOURCES);
    fixture.componentRef.setInput('createFormState', {});
    fixture.componentRef.setInput('editFormState', {});
    fixture.detectChanges();

    return { fixture, component, searchEvents };
  };

  describe('searchConfig.initialSearch seed', () => {
    it('seeds the internal searchControl with initialSearch on first render', () => {
      const { component } = setupWithSearchConfig({ initialSearch: 'foo' });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).searchControl.value).toBe('foo');
    });

    it('keeps the always-visible search input rendered with the seeded value', () => {
      const { fixture, component } = setupWithSearchConfig({
        initialSearch: 'foo',
      });
      const root: ShadowRoot | HTMLElement =
        fixture.nativeElement.shadowRoot ?? fixture.nativeElement;
      expect(
        root.querySelector('[data-testid="generic-table-card-search-input"]'),
      ).not.toBeNull();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).searchControl.value).toBe('foo');
    });

    it('does not emit searchChanged for the seeded value', () => {
      // The seed uses `emitEvent: false` so the host doesn't see a phantom
      // user edit. debounceTime(500) also means any real emission wouldn't
      // arrive yet — this guards both.
      const { searchEvents } = setupWithSearchConfig({ initialSearch: 'foo' });
      expect(searchEvents).toEqual([]);
    });

    it('does nothing when initialSearch is absent', () => {
      const { component } = setupWithSearchConfig({});
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).searchControl.value).toBe('');
    });

    it('does nothing when initialSearch is an empty string', () => {
      // Guards the `if (!initial) return` branch — empty string is falsy so
      // treated the same as absent (no phantom set).
      const { component } = setupWithSearchConfig({ initialSearch: '' });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).searchControl.value).toBe('');
    });

    it('re-applies initialSearch to searchControl when the host pushes a new value', () => {
      // The seed subscription is source-driven (no `take(1)`), so any later
      // change to `searchConfig` with a truthy `initialSearch` re-writes
      // `searchControl` and forces the input open. This mirrors the way
      // `initialFilter` promotes on every recompute. **Trade-off:** if the
      // user has typed over the seeded value and the host later re-emits a
      // fresh `searchConfig` (even with the same `initialSearch`), the typed
      // value is overwritten. Hosts that build `config` in a `computed` and
      // don't want that should avoid pushing `initialSearch` after mount.
      const fixture = TestBed.createComponent(
        DeclarativeTableCard as unknown as typeof DeclarativeTableCard<GenericResource>,
      );
      const component = fixture.componentInstance as Comp;
      fixture.componentRef.setInput('config', {
        header: '',
        tableConfig: READ_CONFIG,
        searchConfig: { initialSearch: 'first' },
      } satisfies TableCardConfig);
      fixture.componentRef.setInput('resources', RESOURCES);
      fixture.componentRef.setInput('createFormState', {});
      fixture.componentRef.setInput('editFormState', {});
      fixture.detectChanges();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).searchControl.value).toBe('first');

      // Simulate the user typing over the seeded value; nothing in the
      // subscription's pipeline reacts to `searchControl.valueChanges`, so
      // this alone doesn't re-fire the seed.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).searchControl.setValue('user-typed', {
        emitEvent: false,
      });

      // Host pushes a new `initialSearch` — the seed fires again and wins.
      fixture.componentRef.setInput('config', {
        header: '',
        tableConfig: READ_CONFIG,
        searchConfig: { initialSearch: 'second' },
      } satisfies TableCardConfig);
      fixture.detectChanges();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).searchControl.value).toBe('second');
    });
  });

  describe('searchConfig.initialFilter seed', () => {
    const TABS: FieldFilterDefinition[] = [
      { label: 'Running', property: 'status.phase', value: 'Running' },
      {
        label: 'Pending',
        property: 'status.phase',
        value: 'Pending',
        default: true,
      },
      { label: 'Failed', property: 'status.phase', value: 'Failed' },
    ];

    it('promotes the matching tab to default: true', () => {
      const { component } = setupWithSearchConfig({
        filterTabs: TABS,
        initialFilter: {
          label: 'Failed',
          property: 'status.phase',
          value: 'Failed',
        },
      });

      const rendered = (component as unknown as WithFilterTabs).filterTabs();
      const defaults = rendered.filter((t) => t.default);
      expect(defaults).toHaveLength(1);
      expect(defaults[0].value).toBe('Failed');
    });

    it('clears default: true from the previously-default entry', () => {
      const { component } = setupWithSearchConfig({
        filterTabs: TABS,
        initialFilter: {
          label: 'Failed',
          property: 'status.phase',
          value: 'Failed',
        },
      });

      const rendered = (component as unknown as WithFilterTabs).filterTabs();
      // Pending had default:true in TABS — after promotion of Failed it must be cleared.
      const pending = rendered.find((t) => t.value === 'Pending');
      expect(pending?.default).toBe(false);
    });

    it('leaves the array untouched when initialFilter does not match any tab', () => {
      // The seed shouldn't latch until a match is found, so a later
      // recomputation could still succeed — but with no match right now, the
      // pre-existing default: true on Pending must remain.
      const { component } = setupWithSearchConfig({
        filterTabs: TABS,
        initialFilter: {
          label: 'Ghost',
          property: 'status.phase',
          value: 'Ghost',
        },
      });

      const rendered = (component as unknown as WithFilterTabs).filterTabs();
      const defaults = rendered.filter((t) => t.default);
      expect(defaults).toHaveLength(1);
      expect(defaults[0].value).toBe('Pending');
    });

    it('reacts to a later change of initialFilter and promotes the new matching tab', () => {
      const fixture = TestBed.createComponent(
        DeclarativeTableCard as unknown as typeof DeclarativeTableCard<GenericResource>,
      );
      const component = fixture.componentInstance as Comp;
      fixture.componentRef.setInput('config', {
        header: '',
        tableConfig: READ_CONFIG,
        searchConfig: {
          filterTabs: TABS,
          initialFilter: {
            label: 'Failed',
            property: 'status.phase',
            value: 'Failed',
          },
        },
      } satisfies TableCardConfig);
      fixture.componentRef.setInput('resources', RESOURCES);
      fixture.componentRef.setInput('createFormState', {});
      fixture.componentRef.setInput('editFormState', {});
      fixture.detectChanges();

      // Host swaps `initialFilter` — the promotion is source-driven (not
      // latched), so the new matching tab wins on the next recompute.
      fixture.componentRef.setInput('config', {
        header: '',
        tableConfig: READ_CONFIG,
        searchConfig: {
          filterTabs: TABS,
          initialFilter: {
            label: 'Running',
            property: 'status.phase',
            value: 'Running',
          },
        },
      } satisfies TableCardConfig);
      fixture.detectChanges();

      const rendered = (component as unknown as WithFilterTabs).filterTabs();
      const defaults = rendered.filter((t) => t.default);
      expect(defaults).toHaveLength(1);
      expect(defaults[0].value).toBe('Running');
    });

    it('passes filterTabs through untouched when initialFilter is absent', () => {
      const { component } = setupWithSearchConfig({ filterTabs: TABS });

      const rendered = (component as unknown as WithFilterTabs).filterTabs();
      // The array is passed through — reference equality isn't guaranteed
      // (the computed may or may not identity-preserve), but the shape is.
      expect(rendered).toEqual(TABS);
    });

    it('hasFilterTabs is false when searchConfig has no filterTabs', () => {
      const { component } = setupWithSearchConfig({ initialSearch: 'foo' });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).hasFilterTabs()).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // 6. Create button visibility
  // -------------------------------------------------------------------------

  describe('create button', () => {
    it('create button is absent when createConfig is not provided', () => {
      const { fixture } = setup();
      const root: ShadowRoot | HTMLElement =
        fixture.nativeElement.shadowRoot ?? fixture.nativeElement;
      expect(root.querySelector('.card__create-btn')).toBeNull();
    });

    it('create button is present when createConfig is provided', () => {
      const { fixture } = setup({ createConfig: CREATE_CONFIG });
      const root: ShadowRoot | HTMLElement =
        fixture.nativeElement.shadowRoot ?? fixture.nativeElement;
      expect(root.querySelector('.card__create-btn')).not.toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // 7. effectiveColumns() computed
  // -------------------------------------------------------------------------

  describe('effectiveColumns()', () => {
    it('returns readConfig.fields unchanged', () => {
      const { component } = setup();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cols = (component as any).effectiveColumns();
      expect(cols).toHaveLength(COLUMNS.length);
      expect(cols).toEqual(COLUMNS);
    });

    it('returns custom columns when provided via readConfig', () => {
      const customColumns: TableFieldDefinition[] = [
        { label: 'Phase', property: 'status.phase' },
      ];
      const { component } = setup({
        readConfig: { fields: customColumns },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cols = (component as any).effectiveColumns();
      expect(cols).toEqual(customColumns);
    });

    it('reflects editConfig being present (edit column must be in tableConfig.fields)', () => {
      // effectiveColumns simply returns tableConfig.fields — the host is
      // responsible for adding action columns to tableConfig.fields.
      // This test documents that behaviour: with no extra fields, count stays the same.
      const { component } = setup({ editConfig: EDIT_CONFIG });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cols = (component as any).effectiveColumns();
      expect(cols).toHaveLength(COLUMNS.length);
    });

    it('reflects deleteConfig being present (delete column must be in tableConfig.fields)', () => {
      const { component } = setup({ deleteConfig: DELETE_CONFIG });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cols = (component as any).effectiveColumns();
      expect(cols).toHaveLength(COLUMNS.length);
    });
  });

  // -------------------------------------------------------------------------
  // 8. editInitialValue() computed
  // -------------------------------------------------------------------------

  describe('editInitialValue()', () => {
    it('returns empty object when pendingResource is null', () => {
      const { component } = setup({ editConfig: EDIT_CONFIG });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).editInitialValue()).toEqual({});
    });

    it('returns empty object when editConfig is not set', () => {
      const { component } = setup();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).editInitialValue()).toEqual({});
    });

    it('builds initial values from pendingResource fields when editConfig is set', async () => {
      const { component } = setup({ editConfig: EDIT_CONFIG });
      const resource = RESOURCES[0];
      // Edit fields are resolved when the edit dialog opens; drive that path.
      component.onButtonClick(makeEvent('update', resource));
      await Promise.resolve();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const values = (component as any).editInitialValue();
      expect(values['metadata.name']).toBe('pod-alpha');
      expect(values['metadata.namespace']).toBe('default');
    });
  });

  // -------------------------------------------------------------------------
  // 9. onButtonClick()
  // -------------------------------------------------------------------------

  describe('onButtonClick()', () => {
    it('intercepts action="update": sets pendingResource and opens editDialogOpen', async () => {
      const { component } = setup({ editConfig: EDIT_CONFIG });
      const resource = RESOURCES[0];
      component.onButtonClick(makeEvent('update', resource));
      await Promise.resolve();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).pendingResource()).toBe(resource);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).editDialogOpen()).toBe(true);
    });

    it('intercepts action="update": does not emit actionButtonClick', () => {
      const { component } = setup({ editConfig: EDIT_CONFIG });
      const emitted: unknown[] = [];
      component.actionButtonClick.subscribe((e) => emitted.push(e));
      component.onButtonClick(makeEvent('update', RESOURCES[0]));
      expect(emitted).toHaveLength(0);
    });

    it('intercepts action="delete": sets pendingResource and opens deleteDialogOpen', () => {
      const { component } = setup({ deleteConfig: DELETE_CONFIG });
      const resource = RESOURCES[1];
      component.onButtonClick(makeEvent('delete', resource));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).pendingResource()).toBe(resource);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).deleteDialogOpen()).toBe(true);
    });

    it('intercepts action="delete": does not emit actionButtonClick', () => {
      const { component } = setup({ deleteConfig: DELETE_CONFIG });
      const emitted: unknown[] = [];
      component.actionButtonClick.subscribe((e) => emitted.push(e));
      component.onButtonClick(makeEvent('delete', RESOURCES[0]));
      expect(emitted).toHaveLength(0);
    });

    it('forwards other actions via actionButtonClick output', () => {
      const { component } = setup();
      const emitted: ResourceFieldButtonClickEvent<GenericResource>[] = [];
      component.actionButtonClick.subscribe((e) => emitted.push(e));

      const event = makeEvent('navigate', RESOURCES[0]);
      component.onButtonClick(event);

      expect(emitted).toHaveLength(1);
      expect(emitted[0]).toBe(event);
    });

    it('forwards action="update" without a resource via actionButtonClick', () => {
      const { component } = setup();
      const emitted: unknown[] = [];
      component.actionButtonClick.subscribe((e) => emitted.push(e));
      component.onButtonClick(makeEvent('update', undefined));
      expect(emitted).toHaveLength(1);
    });

    it('forwards action="delete" without a resource via actionButtonClick', () => {
      const { component } = setup();
      const emitted: unknown[] = [];
      component.actionButtonClick.subscribe((e) => emitted.push(e));
      component.onButtonClick(makeEvent('delete', undefined));
      expect(emitted).toHaveLength(1);
    });
  });

  // -------------------------------------------------------------------------
  // 9.b openCreateDialog() — lazy field resolution
  // -------------------------------------------------------------------------

  describe('openCreateDialog()', () => {
    it('resolves an array fields config and opens the dialog', async () => {
      const { component } = setup({ createConfig: CREATE_CONFIG });

      await component.openCreateDialog();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).resolvedCreateFields()).toEqual(FORM_FIELDS);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).createDialogOpen()).toBe(true);
    });

    it('invokes a thunk fields config lazily on open, then opens the dialog', async () => {
      let called = 0;
      const thunk = () => {
        called++;
        return Promise.resolve(FORM_FIELDS);
      };
      const { component } = setup({
        createConfig: { ...CREATE_CONFIG, fields: thunk },
      });

      // The thunk must NOT run until the dialog is opened.
      expect(called).toBe(0);

      await component.openCreateDialog();

      expect(called).toBe(1);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).resolvedCreateFields()).toEqual(FORM_FIELDS);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).createDialogOpen()).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 9.c openEditDialog() — concurrency / stale-resolver guard
  // -------------------------------------------------------------------------

  describe('openEditDialog() concurrency', () => {
    /** A promise plus its resolver, so the test controls when it settles. */
    function deferred<V>(): { promise: Promise<V>; resolve: (v: V) => void } {
      let resolve!: (v: V) => void;
      const promise = new Promise<V>((r) => {
        resolve = r;
      });
      return { promise, resolve };
    }

    it('ignores a stale field resolver that settles after a newer update action', async () => {
      const resourceA = RESOURCES[0];
      const resourceB = RESOURCES[1];

      const fieldsA: FormFieldDefinition[] = [{ name: 'a-only', label: 'A' }];
      const fieldsB: FormFieldDefinition[] = [{ name: 'b-only', label: 'B' }];

      const deferredA = deferred<FormFieldDefinition[]>();
      const deferredB = deferred<FormFieldDefinition[]>();

      const config: TableCardConfig = {
        header: '',
        tableConfig: READ_CONFIG,
        // Per-resource edit config, each with a thunk we resolve manually so we
        // can force the promises to settle out of order.
        editResourceFormConfig: (resource: GenericResource) => ({
          title: 'Edit',
          fields:
            resource === resourceA
              ? () => deferredA.promise
              : () => deferredB.promise,
        }),
      };

      const fixture = TestBed.createComponent(
        DeclarativeTableCard as unknown as typeof DeclarativeTableCard<GenericResource>,
      );
      const component = fixture.componentInstance as Comp;
      fixture.componentRef.setInput('config', config);
      fixture.componentRef.setInput('resources', RESOURCES);
      fixture.componentRef.setInput('createFormState', {});
      fixture.componentRef.setInput('editFormState', {});
      fixture.detectChanges();

      // First update on A (slow resolver), then a second update on B (fast).
      component.onButtonClick(makeEvent('update', resourceA));
      component.onButtonClick(makeEvent('update', resourceB));

      // B's resolver settles first — it is the current pending resource, so it
      // wins.
      deferredB.resolve(fieldsB);
      await Promise.resolve();
      await Promise.resolve();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).pendingResource()).toBe(resourceB);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).resolvedEditFields()).toEqual(fieldsB);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).editDialogOpen()).toBe(true);

      // A's resolver settles late — pendingResource is still B, so the stale
      // result must be dropped (fields stay B's).
      deferredA.resolve(fieldsA);
      await Promise.resolve();
      await Promise.resolve();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).resolvedEditFields()).toEqual(fieldsB);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).pendingResource()).toBe(resourceB);
    });

    it('resolves fields from the config bound to the clicked resource', async () => {
      const resourceA = RESOURCES[0];
      const resourceB = RESOURCES[1];
      const fieldsA: FormFieldDefinition[] = [{ name: 'a-only', label: 'A' }];
      const fieldsB: FormFieldDefinition[] = [{ name: 'b-only', label: 'B' }];

      const config: TableCardConfig = {
        header: '',
        tableConfig: READ_CONFIG,
        editResourceFormConfig: (resource: GenericResource) => ({
          title: 'Edit',
          fields: resource === resourceA ? fieldsA : fieldsB,
        }),
      };

      const fixture = TestBed.createComponent(
        DeclarativeTableCard as unknown as typeof DeclarativeTableCard<GenericResource>,
      );
      const component = fixture.componentInstance as Comp;
      fixture.componentRef.setInput('config', config);
      fixture.componentRef.setInput('resources', RESOURCES);
      fixture.componentRef.setInput('createFormState', {});
      fixture.componentRef.setInput('editFormState', {});
      fixture.detectChanges();

      component.onButtonClick(makeEvent('update', resourceB));
      await Promise.resolve();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).resolvedEditFields()).toEqual(fieldsB);
    });
  });

  // -------------------------------------------------------------------------
  // 10. form state and submit flow
  // -------------------------------------------------------------------------

  describe('form state and submit flow', () => {
    const fieldChange: FormFieldChangeEvent = {
      fieldProperty: 'metadata.name',
      value: 'new-pod',
    };

    it('emits createFieldChange on field change', () => {
      const { component } = setup({ createConfig: CREATE_CONFIG });
      const emitted: FormFieldChangeEvent[] = [];
      component.createFieldChange.subscribe((event) => emitted.push(event));

      component.onCreateFieldChange(fieldChange);

      expect(emitted).toEqual([fieldChange]);
    });

    it('emits editFieldChange with pending resource', () => {
      const { component } = setup({ editConfig: EDIT_CONFIG });
      const resource = RESOURCES[0];
      const emitted: {
        resource: GenericResource;
        formChangeEvent: FormFieldChangeEvent;
      }[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).pendingResource.set(resource);
      component.editFieldChange.subscribe((event) => emitted.push(event));

      component.onEditFieldChange(fieldChange);

      expect(emitted).toEqual([{ resource, formChangeEvent: fieldChange }]);
    });

    it('does not emit editFieldChange without pending resource', () => {
      const { component } = setup({ editConfig: EDIT_CONFIG });
      const emitted: unknown[] = [];
      component.editFieldChange.subscribe((event) => emitted.push(event));

      component.onEditFieldChange(fieldChange);

      expect(emitted).toHaveLength(0);
    });

    it('emits createSubmit and leaves create dialog open', () => {
      const { component } = setup({ createConfig: CREATE_CONFIG });
      const value = { metadata: { name: 'new-pod' } };
      const emitted: Record<string, unknown>[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).createDialogOpen.set(true);
      component.createSubmit.subscribe((event) => emitted.push(event));

      component.onCreateSubmit(value);

      expect(emitted).toEqual([value]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).createDialogOpen()).toBe(true);
    });

    it('emits editSubmit with resource and leaves edit dialog open', () => {
      const { component } = setup({ editConfig: EDIT_CONFIG });
      const resource = RESOURCES[0];
      const value = { metadata: { namespace: 'staging' } };
      const emitted: {
        resource: GenericResource;
        value: Record<string, unknown>;
      }[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).pendingResource.set(resource);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).editDialogOpen.set(true);
      component.editSubmit.subscribe((event) => emitted.push(event));

      component.onEditSubmit(value);

      expect(emitted).toEqual([{ resource, value }]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).editDialogOpen()).toBe(true);
    });

    it('does not emit editSubmit without pending resource', () => {
      const { component } = setup({ editConfig: EDIT_CONFIG });
      const emitted: unknown[] = [];
      component.editSubmit.subscribe((event) => emitted.push(event));

      component.onEditSubmit({ metadata: { namespace: 'staging' } });

      expect(emitted).toHaveLength(0);
    });

    it('emits deleteSubmit and leaves delete dialog open', () => {
      const { component } = setup({ deleteConfig: DELETE_CONFIG });
      const resource = RESOURCES[0];
      const emitted: GenericResource[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).pendingResource.set(resource);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).deleteDialogOpen.set(true);
      component.deleteSubmit.subscribe((event) => emitted.push(event));

      component.onDeleteSubmit();

      expect(emitted).toEqual([resource]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).deleteDialogOpen()).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 11. close methods
  // -------------------------------------------------------------------------

  describe('close methods', () => {
    it('closeCreateDialog() closes the create dialog', () => {
      const { component } = setup({ createConfig: CREATE_CONFIG });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).createDialogOpen.set(true);

      component.closeCreateDialog();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).createDialogOpen()).toBe(false);
    });

    it('closeEditDialog() closes the edit dialog', () => {
      const { component } = setup({ editConfig: EDIT_CONFIG });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).editDialogOpen.set(true);

      component.closeEditDialog();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).editDialogOpen()).toBe(false);
    });

    it('closeDeleteDialog() closes the delete dialog', () => {
      const { component } = setup({ deleteConfig: DELETE_CONFIG });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).deleteDialogOpen.set(true);

      component.closeDeleteDialog();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).deleteDialogOpen()).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // 12. runtime form state
  // -------------------------------------------------------------------------

  describe('runtime form state', () => {
    it('disables the create submit button when fieldErrors has errors', () => {
      const { fixture, component } = setup({
        createConfig: CREATE_CONFIG,
        createFormState: {
          fieldErrors: { 'metadata.name': 'required' },
        },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).createDialogOpen.set(true);
      fixture.detectChanges();

      const dRoot = dialogRoot(fixture, 'generic-table-card-create');
      const submitButton = dRoot?.querySelector(
        '[data-testid="generic-table-card-create-confirm"]',
      ) as (HTMLElement & { disabled: boolean }) | null;

      expect(submitButton?.disabled).toBe(true);
    });

    it('enables the create submit button when fieldErrors is empty', () => {
      const { fixture, component } = setup({
        createConfig: CREATE_CONFIG,
        createFormState: { fieldErrors: {} },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).createDialogOpen.set(true);
      fixture.detectChanges();

      const dRoot = dialogRoot(fixture, 'generic-table-card-create');
      const submitButton = dRoot?.querySelector(
        '[data-testid="generic-table-card-create-confirm"]',
      ) as (HTMLElement & { disabled: boolean }) | null;

      expect(submitButton?.disabled).toBe(false);
    });

    it('disables the edit submit button when fieldErrors has errors', () => {
      const { fixture, component } = setup({
        editConfig: EDIT_CONFIG,
        editFormState: {
          fieldErrors: { 'metadata.name': 'required' },
        },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).editDialogOpen.set(true);
      fixture.detectChanges();

      const dRoot = dialogRoot(fixture, 'generic-table-card-edit');
      const submitButton = dRoot?.querySelector(
        '[data-testid="generic-table-card-edit-confirm"]',
      ) as (HTMLElement & { disabled: boolean }) | null;

      expect(submitButton?.disabled).toBe(true);
    });

    it('enables the edit submit button when fieldErrors is empty', () => {
      const { fixture, component } = setup({
        editConfig: EDIT_CONFIG,
        editFormState: { fieldErrors: {} },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).editDialogOpen.set(true);
      fixture.detectChanges();

      const dRoot = dialogRoot(fixture, 'generic-table-card-edit');
      const submitButton = dRoot?.querySelector(
        '[data-testid="generic-table-card-edit-confirm"]',
      ) as (HTMLElement & { disabled: boolean }) | null;

      expect(submitButton?.disabled).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // 14. Pass-through outputs
  // -------------------------------------------------------------------------

  describe('pass-through outputs', () => {
    it('exposes tableRowClicked output', () => {
      const { component } = setup();
      expect(typeof component.tableRowClicked.emit).toBe('function');
      expect(typeof component.tableRowClicked.subscribe).toBe('function');
    });

    it('exposes loadMoreResources output', () => {
      const { component } = setup();
      expect(typeof component.loadMoreResources.emit).toBe('function');
    });

    it('exposes paginationLimitChanged output', () => {
      const { component } = setup();
      expect(typeof component.paginationLimitChanged.emit).toBe('function');
    });

    it('exposes searchChanged output', () => {
      const { component } = setup();
      expect(typeof component.searchChanged.emit).toBe('function');
    });
  });

  // -------------------------------------------------------------------------
  // 15. readConfig pagination pass-through
  // -------------------------------------------------------------------------

  describe('readConfig pagination', () => {
    it('effectiveColumns() uses fields from readConfig', () => {
      const customColumns: TableFieldDefinition[] = [
        { label: 'Phase', property: 'status.phase' },
      ];
      const { component } = setup({
        readConfig: {
          fields: customColumns,
          totalItemsCount: 42,
          paginationLimit: 10,
          hasMore: true,
        },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cols = (component as any).effectiveColumns();
      expect(cols[0]).toEqual(customColumns[0]);
    });
  });

  // -------------------------------------------------------------------------
  // 16. TableConfig: loadMode / height / loadMoreButtonText pass-through
  // -------------------------------------------------------------------------

  describe('tableConfig passthrough: loadMode, height, loadMoreButtonText', () => {
    it('exposes loadMode via tableConfig signal', () => {
      const { component } = setup({
        readConfig: { fields: COLUMNS, loadMode: 'scroll' },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).tableConfig().loadMode).toBe('scroll');
    });

    it('exposes currentPage via tableConfig signal', () => {
      const { component } = setup({
        readConfig: { fields: COLUMNS, loadMode: 'pager', currentPage: 3 },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).tableConfig().currentPage).toBe(3);
    });

    it('exposes height via tableConfig signal', () => {
      const { component } = setup({
        readConfig: { fields: COLUMNS, height: 500 },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).tableConfig().height).toBe(500);
    });

    it('exposes loadMoreButtonText via tableConfig signal', () => {
      const { component } = setup({
        readConfig: { fields: COLUMNS, loadMoreButtonText: 'Show More' },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).tableConfig().loadMoreButtonText).toBe(
        'Show More',
      );
    });

    it('re-emits pageChange from the inner table', () => {
      const { component } = setup();
      const emitted: number[] = [];
      component.pageChange.subscribe((n) => emitted.push(n));
      component.pageChange.emit(4);
      expect(emitted).toEqual([4]);
    });
  });

  // -------------------------------------------------------------------------
  // 16b. permissions input threading
  // -------------------------------------------------------------------------

  describe('permissions input threading', () => {
    it('accepts a permissions map and exposes it via the permissions() signal', () => {
      const permissions = { 'ns/pod-alpha': ['delete', 'get'] };
      const { component } = setup({ permissions });
      expect(component.permissions()).toBe(permissions);
    });

    it('permissions input defaults to undefined', () => {
      const { component } = setup();
      expect(component.permissions()).toBeUndefined();
    });

    it('passes the permissions map down to mfp-declarative-table', () => {
      const permissions = { 'ns/pod-alpha': ['delete'] };
      const { fixture } = setup({ permissions });
      // DeclarativeTable is a real (non-schema-stubbed) child because the
      // TestBed uses NO_ERRORS_SCHEMA only for unknowns — DeclarativeTable is
      // imported. Query via debugElement to reach its signal input.
      const tableDe = fixture.debugElement.query(
        By.directive(DeclarativeTable),
      );
      expect(tableDe).not.toBeNull();
      const tableComp: DeclarativeTable<GenericResource> =
        tableDe.componentInstance;
      expect(tableComp.permissions()).toBe(permissions);
    });

    it('passes undefined permissions to mfp-declarative-table when not set', () => {
      const { fixture } = setup();
      const tableDe = fixture.debugElement.query(
        By.directive(DeclarativeTable),
      );
      const tableComp: DeclarativeTable<GenericResource> =
        tableDe.componentInstance;
      expect(tableComp.permissions()).toBeUndefined();
    });

    it('updates mfp-declarative-table permissions when the input changes', () => {
      const permissions = { 'ns/pod-alpha': ['delete'] };
      const { fixture } = setup();
      const tableDe = fixture.debugElement.query(
        By.directive(DeclarativeTable),
      );
      const tableComp: DeclarativeTable<GenericResource> =
        tableDe.componentInstance;
      expect(tableComp.permissions()).toBeUndefined();

      fixture.componentRef.setInput('permissions', permissions);
      fixture.detectChanges();

      expect(tableComp.permissions()).toBe(permissions);
    });
  });

  // -------------------------------------------------------------------------
  // 17. data-testid attributes
  // -------------------------------------------------------------------------

  describe('data-testid attributes', () => {
    it('root card div has data-testid="generic-table-card"', () => {
      const { fixture } = setup();
      const shadow: ShadowRoot | HTMLElement =
        fixture.nativeElement.shadowRoot ?? fixture.nativeElement;
      const el = shadow.querySelector('[data-testid="generic-table-card"]');
      expect(el).not.toBeNull();
    });

    it('search input has data-testid="generic-table-card-search-input" when searchConfig is provided', () => {
      const config: TableCardConfig = {
        header: '',
        tableConfig: READ_CONFIG,
        searchConfig: {},
      };
      const fixture = TestBed.createComponent(
        DeclarativeTableCard as unknown as typeof DeclarativeTableCard<GenericResource>,
      );
      fixture.componentRef.setInput('config', config);
      fixture.componentRef.setInput('resources', RESOURCES);
      fixture.componentRef.setInput('createFormState', {});
      fixture.componentRef.setInput('editFormState', {});
      fixture.detectChanges();

      const shadow: ShadowRoot | HTMLElement =
        fixture.nativeElement.shadowRoot ?? fixture.nativeElement;
      const input = shadow.querySelector(
        '[data-testid="generic-table-card-search-input"]',
      );
      expect(input).not.toBeNull();
    });

    it('search input is absent when searchConfig is not set', () => {
      const { fixture } = setup();
      const shadow: ShadowRoot | HTMLElement =
        fixture.nativeElement.shadowRoot ?? fixture.nativeElement;
      expect(
        shadow.querySelector('[data-testid="generic-table-card-search-input"]'),
      ).toBeNull();
    });

    it('create button has data-testid="generic-table-card-create-btn" when createConfig is provided', () => {
      const { fixture } = setup({ createConfig: CREATE_CONFIG });
      const shadow: ShadowRoot | HTMLElement =
        fixture.nativeElement.shadowRoot ?? fixture.nativeElement;
      const btn = shadow.querySelector(
        '[data-testid="generic-table-card-create-btn"]',
      );
      expect(btn).not.toBeNull();
    });

    it('create button is absent when createConfig is not provided', () => {
      const { fixture } = setup();
      const shadow: ShadowRoot | HTMLElement =
        fixture.nativeElement.shadowRoot ?? fixture.nativeElement;
      expect(
        shadow.querySelector('[data-testid="generic-table-card-create-btn"]'),
      ).toBeNull();
    });

    it('create dialog has data-testid="generic-table-card-create-dialog" when open', () => {
      const { fixture, component } = setup({ createConfig: CREATE_CONFIG });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).createDialogOpen.set(true);
      fixture.detectChanges();

      const dRoot = dialogRoot(fixture, 'generic-table-card-create');
      expect(
        dRoot?.querySelector(
          '[data-testid="generic-table-card-create-dialog"]',
        ),
      ).not.toBeNull();
    });

    it('create confirm button has data-testid="generic-table-card-create-confirm"', () => {
      const { fixture, component } = setup({ createConfig: CREATE_CONFIG });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).createDialogOpen.set(true);
      fixture.detectChanges();

      const dRoot = dialogRoot(fixture, 'generic-table-card-create');
      expect(
        dRoot?.querySelector(
          '[data-testid="generic-table-card-create-confirm"]',
        ),
      ).not.toBeNull();
    });

    it('create cancel button has data-testid="generic-table-card-create-cancel"', () => {
      const { fixture, component } = setup({ createConfig: CREATE_CONFIG });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).createDialogOpen.set(true);
      fixture.detectChanges();

      const dRoot = dialogRoot(fixture, 'generic-table-card-create');
      expect(
        dRoot?.querySelector(
          '[data-testid="generic-table-card-create-cancel"]',
        ),
      ).not.toBeNull();
    });
  });

  describe('web-component first render (before inputs are assigned)', () => {
    it('renders without emitting NG0950 when config/resources are not yet set', () => {
      const errorSpy = vi.spyOn(console, 'error');
      const fixture: Fixture = TestBed.createComponent(
        DeclarativeTableCard as unknown as typeof DeclarativeTableCard<GenericResource>,
      );

      expect(() => {
        fixture.detectChanges();
      }).not.toThrow();

      const ng0950 = errorSpy.mock.calls
        .flat()
        .some((arg) => String(arg).includes('NG0950'));
      expect(ng0950).toBe(false);
      // No config → the inner table is not rendered.
      expect(
        (
          fixture.nativeElement.shadowRoot ?? fixture.nativeElement
        ).querySelector('mfp-declarative-table'),
      ).toBeNull();
    });

    it('recovers and renders the table once config and resources are assigned', () => {
      const fixture: Fixture = TestBed.createComponent(
        DeclarativeTableCard as unknown as typeof DeclarativeTableCard<GenericResource>,
      );
      fixture.detectChanges();

      fixture.componentRef.setInput('config', {
        header: 'Pods',
        tableConfig: READ_CONFIG,
      });
      fixture.componentRef.setInput('resources', RESOURCES);
      fixture.detectChanges();

      expect(
        (
          fixture.nativeElement.shadowRoot ?? fixture.nativeElement
        ).querySelector('mfp-declarative-table'),
      ).not.toBeNull();
    });
  });

  it('has no automatically-detectable accessibility violations', async () => {
    // axe is promise-based; restore real timers for this async assertion.
    vi.useRealTimers();
    const { fixture } = setup({ header: 'Pods' });

    expect(await axe(fixture.nativeElement)).toHaveNoViolations();
  });
});
