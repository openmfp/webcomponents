import { FormFieldChangeEvent, FormFieldDefinition } from '../form/models';
import {
  ButtonSettings,
  GenericResource,
  TableFieldDefinition,
  ValueCellButtonClickEvent,
} from '../table/models';
import { DeclarativeTableCard } from './declarative-table-card.component';
import {
  DeleteResourceConfirmationConfig,
  ResourceFormConfig,
  TableCardConfig,
  TableCardFormState,
  TableConfig,
} from './models/configs';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
): ValueCellButtonClickEvent<GenericResource> {
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
    editResourceFormConfig: opts.editConfig,
    deleteResourceConfirmationConfig: opts.deleteConfig,
    buttonSettings: {
      editButton: opts.editConfig?.editButtonSettings,
      deleteButton: opts.deleteConfig?.deleteButtonSettings,
    },
  };

  fixture.componentRef.setInput('config', config);
  fixture.componentRef.setInput('resources', opts.resources ?? RESOURCES);
  fixture.componentRef.setInput('createFormState', opts.createFormState ?? {});
  fixture.componentRef.setInput('editFormState', opts.editFormState ?? {});

  fixture.detectChanges();
  return { fixture, component };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DeclarativeTableCard', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DeclarativeTableCard as unknown as typeof DeclarativeTableCard<GenericResource>,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
    }).compileComponents();
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
      expect(icon?.getAttribute('accessible-name')).toBe('Some tooltip');
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
    it('searchExpanded starts as false', () => {
      const { component } = setup();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).searchExpanded()).toBe(false);
    });

    it('toggleSearch() sets searchExpanded to true on first call', () => {
      const { component } = setup();
      component.toggleSearch();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).searchExpanded()).toBe(true);
    });

    it('toggleSearch() starts collapsing on second call when already expanded', () => {
      const { component } = setup();
      component.toggleSearch(); // expand
      component.toggleSearch(); // collapse
      // searchCollapsing should be set; searchExpanded still true until animation ends
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).searchCollapsing()).toBe(true);
    });

    it('onSearchBlur() collapses search when value is empty', () => {
      const { component } = setup();
      component.toggleSearch();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).searchControl.setValue('');
      component.onSearchBlur();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).searchCollapsing()).toBe(true);
    });

    it('onSearchBlur() does not collapse when value is non-empty', () => {
      const { component } = setup();
      component.toggleSearch();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).searchControl.setValue('abc');
      component.onSearchBlur();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).searchCollapsing()).toBe(false);
    });

    it('onSearchAnimationEnd() resets search state after collapse animation', () => {
      const { component } = setup();
      component.toggleSearch(); // expand
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).searchControl.setValue('query');
      component.toggleSearch(); // start collapsing
      component.onSearchAnimationEnd();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).searchCollapsing()).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).searchExpanded()).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).searchControl.value).toBe('');
    });

    it('onSearchAnimationEnd() does nothing when not collapsing', () => {
      const { component } = setup();
      component.toggleSearch();
      // Not in collapsing state — should be a no-op
      component.onSearchAnimationEnd();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).searchExpanded()).toBe(true);
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
    it('returns only readConfig.fields when no edit or delete config is set', () => {
      const { component } = setup();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cols = (component as any).effectiveColumns();
      expect(cols).toHaveLength(COLUMNS.length);
      expect(cols).toEqual(COLUMNS);
    });

    it('adds an edit action column when editConfig is provided', () => {
      const { component } = setup({ editConfig: EDIT_CONFIG });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cols = (component as any).effectiveColumns();
      expect(cols).toHaveLength(COLUMNS.length + 1);
      const editCol = cols.find(
        (c: TableFieldDefinition) =>
          c.uiSettings?.buttonSettings?.action === 'edit',
      );
      expect(editCol).toBeDefined();
      expect(editCol.uiSettings.buttonSettings.icon).toBe('edit');
    });

    it('adds a delete action column when deleteConfig is provided', () => {
      const { component } = setup({ deleteConfig: DELETE_CONFIG });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cols = (component as any).effectiveColumns();
      expect(cols).toHaveLength(COLUMNS.length + 1);
      const deleteCol = cols.find(
        (c: TableFieldDefinition) =>
          c.uiSettings?.buttonSettings?.action === 'delete',
      );
      expect(deleteCol).toBeDefined();
    });

    it('adds both edit and delete columns when both configs are provided', () => {
      const { component } = setup({
        editConfig: EDIT_CONFIG,
        deleteConfig: DELETE_CONFIG,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cols = (component as any).effectiveColumns();
      expect(cols).toHaveLength(COLUMNS.length + 2);
      const editCol = cols.find(
        (c: TableFieldDefinition) =>
          c.uiSettings?.buttonSettings?.action === 'edit',
      );
      const deleteCol = cols.find(
        (c: TableFieldDefinition) =>
          c.uiSettings?.buttonSettings?.action === 'delete',
      );
      expect(editCol).toBeDefined();
      expect(deleteCol).toBeDefined();
    });

    it('delete column uses "decline" icon by default', () => {
      const { component } = setup({ deleteConfig: DELETE_CONFIG });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cols = (component as any).effectiveColumns();
      const deleteCol = cols.find(
        (c: TableFieldDefinition) =>
          c.uiSettings?.buttonSettings?.action === 'delete',
      );
      expect(deleteCol.uiSettings.buttonSettings.icon).toBe('decline');
    });

    it('respects custom icon from editConfig.editButtonSettings', () => {
      const customEditConfig: TableCardEditConfig = {
        ...EDIT_CONFIG,
        editButtonSettings: { icon: 'pen-tool' },
      };
      const { component } = setup({ editConfig: customEditConfig });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cols = (component as any).effectiveColumns();
      const editCol = cols.find(
        (c: TableFieldDefinition) =>
          c.uiSettings?.buttonSettings?.action === 'edit',
      );
      expect(editCol.uiSettings.buttonSettings.icon).toBe('pen-tool');
    });

    it('respects custom icon from deleteConfig.deleteButtonSettings', () => {
      const customDeleteConfig: TableCardDeleteConfig = {
        ...DELETE_CONFIG,
        deleteButtonSettings: { icon: 'trash' },
      };
      const { component } = setup({ deleteConfig: customDeleteConfig });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cols = (component as any).effectiveColumns();
      const deleteCol = cols.find(
        (c: TableFieldDefinition) =>
          c.uiSettings?.buttonSettings?.action === 'delete',
      );
      expect(deleteCol.uiSettings.buttonSettings.icon).toBe('trash');
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

    it('builds initial values from pendingResource fields when editConfig is set', () => {
      const { component } = setup({ editConfig: EDIT_CONFIG });
      const resource = RESOURCES[0];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).pendingResource.set(resource);

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
    it('intercepts action="edit": sets pendingResource and opens editDialogOpen', () => {
      const { component } = setup({ editConfig: EDIT_CONFIG });
      const resource = RESOURCES[0];
      component.onButtonClick(makeEvent('edit', resource));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).pendingResource()).toBe(resource);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).editDialogOpen()).toBe(true);
    });

    it('intercepts action="edit": does not emit actionButtonClick', () => {
      const { component } = setup({ editConfig: EDIT_CONFIG });
      const emitted: unknown[] = [];
      component.actionButtonClick.subscribe((e) => emitted.push(e));
      component.onButtonClick(makeEvent('edit', RESOURCES[0]));
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
      const emitted: ValueCellButtonClickEvent<GenericResource>[] = [];
      component.actionButtonClick.subscribe((e) => emitted.push(e));

      const event = makeEvent('navigate', RESOURCES[0]);
      component.onButtonClick(event);

      expect(emitted).toHaveLength(1);
      expect(emitted[0]).toBe(event);
    });

    it('forwards action="edit" without a resource via actionButtonClick', () => {
      const { component } = setup();
      const emitted: unknown[] = [];
      component.actionButtonClick.subscribe((e) => emitted.push(e));
      component.onButtonClick(makeEvent('edit', undefined));
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

      const root: ShadowRoot | HTMLElement =
        fixture.nativeElement.shadowRoot ?? fixture.nativeElement;
      const submitButton = root.querySelector(
        '.dialog__footer ui5-button[design="Emphasized"]',
      ) as HTMLElement & { disabled: boolean };

      expect(submitButton.disabled).toBe(true);
    });

    it('enables the create submit button when fieldErrors is empty', () => {
      const { fixture, component } = setup({
        createConfig: CREATE_CONFIG,
        createFormState: { fieldErrors: {} },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).createDialogOpen.set(true);
      fixture.detectChanges();

      const root: ShadowRoot | HTMLElement =
        fixture.nativeElement.shadowRoot ?? fixture.nativeElement;
      const submitButton = root.querySelector(
        '.dialog__footer ui5-button[design="Emphasized"]',
      ) as HTMLElement & { disabled: boolean };

      expect(submitButton.disabled).toBe(false);
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

      const root: ShadowRoot | HTMLElement =
        fixture.nativeElement.shadowRoot ?? fixture.nativeElement;
      const submitButton = root.querySelector(
        '.dialog__footer ui5-button[design="Emphasized"]',
      ) as HTMLElement & { disabled: boolean };

      expect(submitButton.disabled).toBe(true);
    });

    it('enables the edit submit button when fieldErrors is empty', () => {
      const { fixture, component } = setup({
        editConfig: EDIT_CONFIG,
        editFormState: { fieldErrors: {} },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).editDialogOpen.set(true);
      fixture.detectChanges();

      const root: ShadowRoot | HTMLElement =
        fixture.nativeElement.shadowRoot ?? fixture.nativeElement;
      const submitButton = root.querySelector(
        '.dialog__footer ui5-button[design="Emphasized"]',
      ) as HTMLElement & { disabled: boolean };

      expect(submitButton.disabled).toBe(false);
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
});
