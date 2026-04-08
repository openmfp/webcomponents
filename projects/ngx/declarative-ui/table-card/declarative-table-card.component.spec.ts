import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeclarativeTableCardComponent } from './declarative-table-card.component';
import { TableFieldDefinition, ValueCellButtonClickEvent, GenericResource } from '../table/models';
import { FormFieldDefinition } from '../form/models';
import { TableCardCreateEditConfig, TableCardDeleteConfig } from './declarative-table-card.component';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Comp = DeclarativeTableCardComponent<GenericResource>;
type Fixture = ComponentFixture<Comp>;

const COLUMNS: TableFieldDefinition[] = [
  { label: 'Name', property: 'metadata.name' },
  { label: 'Namespace', property: 'metadata.namespace' },
];

const RESOURCES: GenericResource[] = [
  { id: '1', metadata: { name: 'pod-alpha', namespace: 'default' } },
  { id: '2', metadata: { name: 'pod-beta', namespace: 'kube-system' } },
];

const FORM_FIELDS: FormFieldDefinition[] = [
  { name: 'name', label: 'Name', required: true },
  { name: 'namespace', label: 'Namespace' },
];

const CREATE_CONFIG: TableCardCreateEditConfig = {
  fields: FORM_FIELDS,
  title: 'Create Resource',
  confirmLabel: 'Create',
  cancelLabel: 'Cancel',
};

const EDIT_DELETE_CONFIG: TableCardCreateEditConfig = {
  fields: FORM_FIELDS,
  title: 'Edit Resource',
  confirmLabel: 'Save',
  cancelLabel: 'Cancel',
  createOnlyFields: ['name'],
};

const DELETE_CONFIG: TableCardDeleteConfig = {
  title: 'Confirm Delete',
  confirmLabel: 'Delete',
  cancelLabel: 'Cancel',
};

function makeEvent(action: string, resource?: GenericResource): ValueCellButtonClickEvent<GenericResource> {
  return {
    event: new MouseEvent('click'),
    field: {
      label: '',
      uiSettings: { displayAs: 'button', buttonSettings: { action, icon: action } },
    },
    resource,
  };
}

function setup(opts: {
  columns?: TableFieldDefinition[];
  resources?: GenericResource[];
  header?: string;
  createConfig?: TableCardCreateEditConfig;
  editDeleteConfig?: TableCardCreateEditConfig;
  deleteConfig?: TableCardDeleteConfig;
} = {}): { fixture: Fixture; component: Comp } {
  const fixture: Fixture = TestBed.createComponent(
    DeclarativeTableCardComponent as unknown as typeof DeclarativeTableCardComponent<GenericResource>,
  );
  const component = fixture.componentInstance as Comp;

  fixture.componentRef.setInput('columns', opts.columns ?? COLUMNS);
  fixture.componentRef.setInput('resources', opts.resources ?? RESOURCES);
  if (opts.header !== undefined) fixture.componentRef.setInput('header', opts.header);
  if (opts.createConfig !== undefined) fixture.componentRef.setInput('createConfig', opts.createConfig);
  if (opts.editDeleteConfig !== undefined) fixture.componentRef.setInput('editDeleteConfig', opts.editDeleteConfig);
  if (opts.deleteConfig !== undefined) fixture.componentRef.setInput('deleteConfig', opts.deleteConfig);

  fixture.detectChanges();
  return { fixture, component };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DeclarativeTableCardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeclarativeTableCardComponent as unknown as typeof DeclarativeTableCardComponent<GenericResource>],
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
      const root: ShadowRoot | HTMLElement = fixture.nativeElement.shadowRoot ?? fixture.nativeElement;
      expect(root.querySelector('mfp-declarative-table')).not.toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // 3. header input
  // -------------------------------------------------------------------------

  describe('header input', () => {
    it('renders the header title when header is provided', () => {
      const { fixture } = setup({ header: 'My Pods' });
      const root: ShadowRoot | HTMLElement = fixture.nativeElement.shadowRoot ?? fixture.nativeElement;
      const title = root.querySelector('.card__title');
      expect(title).not.toBeNull();
      expect(title?.textContent?.trim()).toBe('My Pods');
    });

    it('does not render the header title element when header is not set', () => {
      const { fixture } = setup();
      const root: ShadowRoot | HTMLElement = fixture.nativeElement.shadowRoot ?? fixture.nativeElement;
      expect(root.querySelector('.card__title')).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // 4. Search behaviour
  // -------------------------------------------------------------------------

  describe('search', () => {
    it('searchExpanded starts as false', () => {
      const { component } = setup();
      // Access protected signal for unit testing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).searchExpanded()).toBe(false);
    });

    it('toggleSearch() flips searchExpanded to true', () => {
      const { component } = setup();
      component.toggleSearch();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).searchExpanded()).toBe(true);
    });

    it('toggleSearch() flips searchExpanded back to false on second call', () => {
      const { component } = setup();
      component.toggleSearch();
      component.toggleSearch();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).searchExpanded()).toBe(false);
    });

    it('onSearchInput() emits searchChanged with the provided value', () => {
      const { component } = setup();
      const emitted: string[] = [];
      component.searchChanged.subscribe(v => emitted.push(v));

      component.onSearchInput('my-query');
      expect(emitted).toEqual(['my-query']);
    });

    it('onSearchInput() updates the internal searchValue signal', () => {
      const { component } = setup();
      component.onSearchInput('hello');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).searchValue()).toBe('hello');
    });

    it('onSearchInput() collapses search when value is cleared', () => {
      const { component } = setup();
      component.toggleSearch(); // expand first
      component.onSearchInput(''); // clear
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).searchExpanded()).toBe(false);
    });

    it('onSearchInput() does not collapse search when value is non-empty', () => {
      const { component } = setup();
      component.toggleSearch();
      component.onSearchInput('abc');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).searchExpanded()).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 5. Create button visibility
  // -------------------------------------------------------------------------

  describe('create button', () => {
    it('create button is absent when createConfig is not provided', () => {
      const { fixture } = setup();
      const root: ShadowRoot | HTMLElement = fixture.nativeElement.shadowRoot ?? fixture.nativeElement;
      // The button contains the text "Create" and an add icon
      const buttons = Array.from(root.querySelectorAll('ui5-button'));
      const createButton = buttons.find(b => b.getAttribute('icon') === 'add');
      expect(createButton).toBeUndefined();
    });

    it('create button is present when createConfig is provided', () => {
      const { fixture } = setup({ createConfig: CREATE_CONFIG });
      const root: ShadowRoot | HTMLElement = fixture.nativeElement.shadowRoot ?? fixture.nativeElement;
      const buttons = Array.from(root.querySelectorAll('ui5-button'));
      const createButton = buttons.find(b => b.getAttribute('icon') === 'add');
      expect(createButton).not.toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // 6. effectiveColumns() computed
  // -------------------------------------------------------------------------

  describe('effectiveColumns()', () => {
    it('returns the original columns when neither editDeleteConfig nor deleteConfig is set', () => {
      const { component } = setup();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cols = (component as any).effectiveColumns();
      expect(cols).toHaveLength(COLUMNS.length);
      expect(cols).toEqual(COLUMNS);
    });

    it('adds an edit action column when editDeleteConfig is provided', () => {
      const { component } = setup({ editDeleteConfig: EDIT_DELETE_CONFIG });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cols = (component as any).effectiveColumns();
      expect(cols).toHaveLength(COLUMNS.length + 1);
      const editCol = cols.find(
        (c: TableFieldDefinition) => c.uiSettings?.buttonSettings?.action === 'edit',
      );
      expect(editCol).toBeDefined();
      expect(editCol.uiSettings.buttonSettings.icon).toBe('edit');
    });

    it('adds a delete action column when deleteConfig is provided alongside editDeleteConfig', () => {
      const { component } = setup({ editDeleteConfig: EDIT_DELETE_CONFIG, deleteConfig: DELETE_CONFIG });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cols = (component as any).effectiveColumns();
      // original + edit col + delete col
      expect(cols).toHaveLength(COLUMNS.length + 2);
      const deleteCol = cols.find(
        (c: TableFieldDefinition) => c.uiSettings?.buttonSettings?.action === 'delete',
      );
      expect(deleteCol).toBeDefined();
      expect(deleteCol.uiSettings.buttonSettings.icon).toBe('delete');
    });

    it('adds only a delete column (no edit column) when only deleteConfig is provided', () => {
      const { component } = setup({ deleteConfig: DELETE_CONFIG });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cols = (component as any).effectiveColumns();
      expect(cols).toHaveLength(COLUMNS.length + 1);
      const deleteCol = cols.find(
        (c: TableFieldDefinition) => c.uiSettings?.buttonSettings?.action === 'delete',
      );
      expect(deleteCol).toBeDefined();
      const editCol = cols.find(
        (c: TableFieldDefinition) => c.uiSettings?.buttonSettings?.action === 'edit',
      );
      expect(editCol).toBeUndefined();
    });

    it('respects custom icon from editButtonSettings', () => {
      const customConfig: TableCardCreateEditConfig = {
        ...EDIT_DELETE_CONFIG,
        editButtonSettings: { icon: 'pen-tool' },
      };
      const { component } = setup({ editDeleteConfig: customConfig });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cols = (component as any).effectiveColumns();
      const editCol = cols.find(
        (c: TableFieldDefinition) => c.uiSettings?.buttonSettings?.action === 'edit',
      );
      expect(editCol.uiSettings.buttonSettings.icon).toBe('pen-tool');
    });

    it('respects custom icon from deleteButtonSettings', () => {
      const customConfig: TableCardCreateEditConfig = {
        ...EDIT_DELETE_CONFIG,
        deleteButtonSettings: { icon: 'trash' },
      };
      const { component } = setup({ editDeleteConfig: customConfig, deleteConfig: DELETE_CONFIG });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cols = (component as any).effectiveColumns();
      const deleteCol = cols.find(
        (c: TableFieldDefinition) => c.uiSettings?.buttonSettings?.action === 'delete',
      );
      expect(deleteCol.uiSettings.buttonSettings.icon).toBe('trash');
    });
  });

  // -------------------------------------------------------------------------
  // 7. editFields() computed
  // -------------------------------------------------------------------------

  describe('editFields()', () => {
    it('returns empty array when editDeleteConfig is not set', () => {
      const { component } = setup();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).editFields()).toEqual([]);
    });

    it('disables fields listed in createOnlyFields', () => {
      const { component } = setup({ editDeleteConfig: EDIT_DELETE_CONFIG });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fields: FormFieldDefinition[] = (component as any).editFields();
      const nameField = fields.find(f => f.name === 'name');
      expect(nameField?.disabled).toBe(true);
    });

    it('does not disable fields not listed in createOnlyFields', () => {
      const { component } = setup({ editDeleteConfig: EDIT_DELETE_CONFIG });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fields: FormFieldDefinition[] = (component as any).editFields();
      const namespaceField = fields.find(f => f.name === 'namespace');
      expect(namespaceField?.disabled).toBe(false);
    });

    it('preserves existing disabled=true on non-createOnly fields', () => {
      const configWithDisabled: TableCardCreateEditConfig = {
        fields: [
          { name: 'name', label: 'Name' },
          { name: 'namespace', label: 'Namespace', disabled: true },
        ],
        createOnlyFields: ['name'],
      };
      const { component } = setup({ editDeleteConfig: configWithDisabled });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fields: FormFieldDefinition[] = (component as any).editFields();
      const namespaceField = fields.find(f => f.name === 'namespace');
      expect(namespaceField?.disabled).toBe(true);
    });

    it('returns all fields with correct count', () => {
      const { component } = setup({ editDeleteConfig: EDIT_DELETE_CONFIG });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).editFields()).toHaveLength(FORM_FIELDS.length);
    });
  });

  // -------------------------------------------------------------------------
  // 8. onButtonClick()
  // -------------------------------------------------------------------------

  describe('onButtonClick()', () => {
    it('intercepts action="edit": sets pendingResource and opens editDialogOpen', () => {
      const { component } = setup({ editDeleteConfig: EDIT_DELETE_CONFIG });
      const resource = RESOURCES[0];
      component.onButtonClick(makeEvent('edit', resource));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).pendingResource()).toBe(resource);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).editDialogOpen()).toBe(true);
    });

    it('intercepts action="edit": resets pendingFormValue and formValid', () => {
      const { component } = setup({ editDeleteConfig: EDIT_DELETE_CONFIG });
      // Pre-set values to verify they are cleared
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).pendingFormValue.set({ name: 'stale' });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).formValid.set(true);

      component.onButtonClick(makeEvent('edit', RESOURCES[0]));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).pendingFormValue()).toBeNull();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).formValid()).toBe(false);
    });

    it('intercepts action="edit": does not emit buttonClick', () => {
      const { component } = setup({ editDeleteConfig: EDIT_DELETE_CONFIG });
      const emitted: unknown[] = [];
      component.buttonClick.subscribe(e => emitted.push(e));
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

    it('intercepts action="delete": does not emit buttonClick', () => {
      const { component } = setup({ deleteConfig: DELETE_CONFIG });
      const emitted: unknown[] = [];
      component.buttonClick.subscribe(e => emitted.push(e));
      component.onButtonClick(makeEvent('delete', RESOURCES[0]));
      expect(emitted).toHaveLength(0);
    });

    it('forwards other actions via buttonClick output', () => {
      const { component } = setup();
      const emitted: ValueCellButtonClickEvent<GenericResource>[] = [];
      component.buttonClick.subscribe(e => emitted.push(e));

      const event = makeEvent('navigate', RESOURCES[0]);
      component.onButtonClick(event);

      expect(emitted).toHaveLength(1);
      expect(emitted[0]).toBe(event);
    });

    it('forwards action="edit" without a resource via buttonClick (no pending interception)', () => {
      // When resource is undefined the edit guard is not entered
      const { component } = setup();
      const emitted: unknown[] = [];
      component.buttonClick.subscribe(e => emitted.push(e));
      component.onButtonClick(makeEvent('edit', undefined));
      expect(emitted).toHaveLength(1);
    });

    it('forwards action="delete" without a resource via buttonClick', () => {
      const { component } = setup();
      const emitted: unknown[] = [];
      component.buttonClick.subscribe(e => emitted.push(e));
      component.onButtonClick(makeEvent('delete', undefined));
      expect(emitted).toHaveLength(1);
    });
  });

  // -------------------------------------------------------------------------
  // 9. onCreateConfirm()
  // -------------------------------------------------------------------------

  describe('onCreateConfirm()', () => {
    it('emits createConfirmed with pendingFormValue when it is set', () => {
      const { component } = setup({ createConfig: CREATE_CONFIG });
      const formValue = { name: 'new-pod', namespace: 'default' };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).pendingFormValue.set(formValue);

      const emitted: Record<string, unknown>[] = [];
      component.createConfirmed.subscribe(v => emitted.push(v));

      component.onCreateConfirm();

      expect(emitted).toHaveLength(1);
      expect(emitted[0]).toEqual(formValue);
    });

    it('does not emit createConfirmed when pendingFormValue is null', () => {
      const { component } = setup({ createConfig: CREATE_CONFIG });
      const emitted: unknown[] = [];
      component.createConfirmed.subscribe(v => emitted.push(v));

      component.onCreateConfirm();

      expect(emitted).toHaveLength(0);
    });

    it('closes the create dialog after confirming', () => {
      const { component } = setup({ createConfig: CREATE_CONFIG });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).createDialogOpen.set(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).pendingFormValue.set({ name: 'x' });

      component.onCreateConfirm();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).createDialogOpen()).toBe(false);
    });

    it('closes the create dialog even when pendingFormValue is null (cancel path)', () => {
      const { component } = setup({ createConfig: CREATE_CONFIG });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).createDialogOpen.set(true);

      component.onCreateConfirm();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).createDialogOpen()).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // 10. onEditConfirm()
  // -------------------------------------------------------------------------

  describe('onEditConfirm()', () => {
    it('emits editConfirmed with resource and formValue when both are set', () => {
      const { component } = setup({ editDeleteConfig: EDIT_DELETE_CONFIG });
      const resource = RESOURCES[0];
      const formValue = { name: 'pod-alpha', namespace: 'staging' };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).pendingResource.set(resource);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).pendingFormValue.set(formValue);

      const emitted: { resource: GenericResource; formValue: Record<string, unknown> }[] = [];
      component.editConfirmed.subscribe(v => emitted.push(v));

      component.onEditConfirm();

      expect(emitted).toHaveLength(1);
      expect(emitted[0].resource).toBe(resource);
      expect(emitted[0].formValue).toEqual(formValue);
    });

    it('does not emit editConfirmed when pendingResource is null', () => {
      const { component } = setup({ editDeleteConfig: EDIT_DELETE_CONFIG });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).pendingFormValue.set({ name: 'x' });

      const emitted: unknown[] = [];
      component.editConfirmed.subscribe(v => emitted.push(v));

      component.onEditConfirm();

      expect(emitted).toHaveLength(0);
    });

    it('does not emit editConfirmed when pendingFormValue is null', () => {
      const { component } = setup({ editDeleteConfig: EDIT_DELETE_CONFIG });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).pendingResource.set(RESOURCES[0]);

      const emitted: unknown[] = [];
      component.editConfirmed.subscribe(v => emitted.push(v));

      component.onEditConfirm();

      expect(emitted).toHaveLength(0);
    });

    it('closes the edit dialog after confirming', () => {
      const { component } = setup({ editDeleteConfig: EDIT_DELETE_CONFIG });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).editDialogOpen.set(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).pendingResource.set(RESOURCES[0]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).pendingFormValue.set({ name: 'x' });

      component.onEditConfirm();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).editDialogOpen()).toBe(false);
    });

    it('closes the edit dialog even when confirm condition is not met', () => {
      const { component } = setup({ editDeleteConfig: EDIT_DELETE_CONFIG });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).editDialogOpen.set(true);
      // Both null — no emit, but dialog should still close
      component.onEditConfirm();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).editDialogOpen()).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // 11. onDeleteConfirm()
  // -------------------------------------------------------------------------

  describe('onDeleteConfirm()', () => {
    it('emits deleteConfirmed with the pending resource when set', () => {
      const { component } = setup({ deleteConfig: DELETE_CONFIG });
      const resource = RESOURCES[0];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).pendingResource.set(resource);

      const emitted: GenericResource[] = [];
      component.deleteConfirmed.subscribe(v => emitted.push(v));

      component.onDeleteConfirm();

      expect(emitted).toHaveLength(1);
      expect(emitted[0]).toBe(resource);
    });

    it('does not emit deleteConfirmed when pendingResource is null', () => {
      const { component } = setup({ deleteConfig: DELETE_CONFIG });
      const emitted: unknown[] = [];
      component.deleteConfirmed.subscribe(v => emitted.push(v));

      component.onDeleteConfirm();

      expect(emitted).toHaveLength(0);
    });

    it('closes the delete dialog after confirming', () => {
      const { component } = setup({ deleteConfig: DELETE_CONFIG });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).deleteDialogOpen.set(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).pendingResource.set(RESOURCES[0]);

      component.onDeleteConfirm();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).deleteDialogOpen()).toBe(false);
    });

    it('closes the delete dialog even when pendingResource is null', () => {
      const { component } = setup({ deleteConfig: DELETE_CONFIG });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).deleteDialogOpen.set(true);
      component.onDeleteConfirm();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).deleteDialogOpen()).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // 12. Cancel / closing dialogs — no confirm event emitted
  // -------------------------------------------------------------------------

  describe('dialog cancel / close', () => {
    it('setting createDialogOpen to false does not emit createConfirmed', () => {
      const { component } = setup({ createConfig: CREATE_CONFIG });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).pendingFormValue.set({ name: 'x' });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).createDialogOpen.set(true);

      const emitted: unknown[] = [];
      component.createConfirmed.subscribe(v => emitted.push(v));

      // Simulate cancel: close dialog without calling onCreateConfirm
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).createDialogOpen.set(false);

      expect(emitted).toHaveLength(0);
    });

    it('setting editDialogOpen to false does not emit editConfirmed', () => {
      const { component } = setup({ editDeleteConfig: EDIT_DELETE_CONFIG });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).pendingResource.set(RESOURCES[0]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).pendingFormValue.set({ name: 'x' });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).editDialogOpen.set(true);

      const emitted: unknown[] = [];
      component.editConfirmed.subscribe(v => emitted.push(v));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).editDialogOpen.set(false);

      expect(emitted).toHaveLength(0);
    });

    it('setting deleteDialogOpen to false does not emit deleteConfirmed', () => {
      const { component } = setup({ deleteConfig: DELETE_CONFIG });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).pendingResource.set(RESOURCES[0]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).deleteDialogOpen.set(true);

      const emitted: unknown[] = [];
      component.deleteConfirmed.subscribe(v => emitted.push(v));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).deleteDialogOpen.set(false);

      expect(emitted).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // 13. Pass-through outputs wired to the table
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
  });
});
