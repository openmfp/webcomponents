import {
  FieldDefinition,
  GenericResource,
  ResourceFieldButtonClickEvent,
} from '../models';
import { ResourceField } from './resource-field.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';

type Fixture = ComponentFixture<ResourceField<GenericResource, FieldDefinition>>;
type Comp = ResourceField<GenericResource, FieldDefinition>;

function setup(
  field: FieldDefinition,
  resource?: Partial<GenericResource>,
  permissions?: Record<string, string[]>,
): { fixture: Fixture; component: Comp } {
  const fixture: Fixture = TestBed.createComponent(
    ResourceField as unknown as typeof ResourceField<GenericResource, FieldDefinition>,
  );
  const component = fixture.componentInstance;
  fixture.componentRef.setInput('fieldDefinition', field);
  if (resource !== undefined)
    fixture.componentRef.setInput('resource', resource as GenericResource);
  if (permissions !== undefined)
    fixture.componentRef.setInput('permissions', permissions);
  fixture.detectChanges();
  return { fixture, component };
}

function el(fixture: Fixture, testId: string): Element | null {
  return (
    fixture.nativeElement.shadowRoot ?? fixture.nativeElement
  ).querySelector(`[data-testid="${testId}"]`);
}

function q(fixture: Fixture, selector: string): Element | null {
  return (
    fixture.nativeElement.shadowRoot ?? fixture.nativeElement
  ).querySelector(selector);
}

describe('ResourceField', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceField],
    }).compileComponents();
  });

  describe('testId', () => {
    it('is derived from fieldDefinition.property', () => {
      const { component } = setup({ property: 'name' });
      expect(component.testId()).toBe('resource-field-name');
    });
  });

  describe('default display', () => {
    it('renders plain string value from resource property', () => {
      const { fixture } = setup({ property: 'status' }, { status: 'Active' });
      const span = q(fixture, '[data-testid="resource-field-status"]');
      expect(span?.textContent?.trim()).toBe('Active');
    });

    it('falls back to field.value when no resource is provided', () => {
      const { fixture } = setup({ property: 'status', value: 'fallback' });
      const span = q(fixture, '[data-testid="resource-field-status"]');
      expect(span?.textContent?.trim()).toBe('fallback');
    });

    it('renders empty when value is absent', () => {
      const { fixture } = setup({ property: 'missing' }, {});
      const span = q(fixture, '[data-testid="resource-field-missing"]');
      expect(span?.textContent?.trim()).toBe('');
    });
  });

  describe('computed signals', () => {
    it('value() resolves from resource property', () => {
      const { component } = setup({ property: 'age' }, { age: 42 });
      expect(component.value()).toBe(42);
    });

    it('boolValue() is true for string "true"', () => {
      const { component } = setup({ property: 'active' }, { active: 'true' });
      expect(component.boolValue()).toBe(true);
    });

    it('boolValue() is false for string "false"', () => {
      const { component } = setup({ property: 'active' }, { active: 'false' });
      expect(component.boolValue()).toBe(false);
    });

    it('boolValue() is undefined for non-boolean string', () => {
      const { component } = setup({ property: 'status' }, { status: 'Active' });
      expect(component.boolValue()).toBeUndefined();
    });

    it('isBoolLike() is true when boolValue is defined', () => {
      const { component } = setup({ property: 'active' }, { active: 'true' });
      expect(component.isBoolLike()).toBe(true);
    });

    it('isBoolLike() is false for non-boolean value', () => {
      const { component } = setup(
        { property: 'status' },
        { status: 'running' },
      );
      expect(component.isBoolLike()).toBe(false);
    });

    it('stringValue() returns string value', () => {
      const { component } = setup({ property: 'label' }, { label: 'hello' });
      expect(component.stringValue()).toBe('hello');
    });

    it('stringValue() returns undefined for non-string value', () => {
      const { component } = setup({ property: 'count' }, { count: 99 });
      expect(component.stringValue()).toBeUndefined();
    });

    it('stringValue() returns undefined for blank string', () => {
      const { component } = setup({ property: 'label' }, { label: '   ' });
      expect(component.stringValue()).toBeUndefined();
    });

    it('isUrlValue() is true for valid http URL', () => {
      const { component } = setup(
        { property: 'link' },
        { link: 'https://example.com' },
      );
      expect(component.isUrlValue()).toBe(true);
    });

    it('isUrlValue() is false for plain string', () => {
      const { component } = setup({ property: 'link' }, { link: 'not-a-url' });
      expect(component.isUrlValue()).toBe(false);
    });
  });

  describe('displayAs: secret', () => {
    it('renders secret-value component', () => {
      const { fixture } = setup(
        { property: 'token', uiSettings: { displayAs: 'secret' } },
        { token: 'abc123' },
      );
      expect(el(fixture, 'resource-field-token-secret')).not.toBeNull();
    });

    it('renders toggle icon', () => {
      const { fixture } = setup(
        { property: 'token', uiSettings: { displayAs: 'secret' } },
        { token: 'abc123' },
      );
      expect(el(fixture, 'resource-field-token-secret-toggle')).not.toBeNull();
    });

    it('toggleVisibility flips isVisible', () => {
      const { component } = setup(
        { property: 'token', uiSettings: { displayAs: 'secret' } },
        { token: 'abc123' },
      );
      expect(component.isVisible()).toBe(false);
      component.toggleVisibility(new MouseEvent('click'));
      expect(component.isVisible()).toBe(true);
      component.toggleVisibility(new MouseEvent('click'));
      expect(component.isVisible()).toBe(false);
    });
  });

  describe('displayAs: boolIcon', () => {
    it('renders boolean-value when value is boolean-like', () => {
      const { fixture } = setup(
        { property: 'enabled', uiSettings: { displayAs: 'boolIcon' } },
        { enabled: 'true' },
      );
      expect(el(fixture, 'resource-field-enabled-boolean')).not.toBeNull();
    });

    it('does not render boolean-value when value is not boolean-like', () => {
      const { fixture } = setup(
        { property: 'status', uiSettings: { displayAs: 'boolIcon' } },
        { status: 'running' },
      );
      expect(el(fixture, 'resource-field-status-boolean')).toBeNull();
    });
  });

  describe('displayAs: link', () => {
    it('renders link-value for valid URL', () => {
      const { fixture } = setup(
        { property: 'url', uiSettings: { displayAs: 'link' } },
        { url: 'https://example.com' },
      );
      expect(el(fixture, 'resource-field-url-link')).not.toBeNull();
    });

    it('does not render link-value for non-URL string', () => {
      const { fixture } = setup(
        { property: 'url', uiSettings: { displayAs: 'link' } },
        { url: 'not-a-url' },
      );
      expect(el(fixture, 'resource-field-url-link')).toBeNull();
    });
  });

  describe('displayAs: tooltip', () => {
    it('renders tooltip icon', () => {
      const { fixture } = setup(
        { property: 'info', uiSettings: { displayAs: 'tooltip' } },
        { info: 'some tooltip text' },
      );
      expect(el(fixture, 'resource-field-info-tooltip')).not.toBeNull();
    });
  });

  describe('displayAs: alert', () => {
    it('renders alert icon when value is falsy', () => {
      const { fixture } = setup(
        { property: 'flag', uiSettings: { displayAs: 'alert' } },
        { flag: '' },
      );
      expect(el(fixture, 'resource-field-flag-icon')).not.toBeNull();
    });

    it('does not render alert icon when value is truthy', () => {
      const { fixture } = setup(
        { property: 'flag', uiSettings: { displayAs: 'alert' } },
        { flag: 'ok' },
      );
      expect(el(fixture, 'resource-field-flag-icon')).toBeNull();
    });
  });

  describe('displayAs: img', () => {
    it('renders img element when value is set', () => {
      const { fixture } = setup(
        { property: 'avatar', uiSettings: { displayAs: 'img' } },
        { avatar: 'https://example.com/img.png' },
      );
      const img = q(fixture, 'img.image-cell');
      expect(img).not.toBeNull();
      expect(img?.getAttribute('src')).toBe('https://example.com/img.png');
    });

    it('does not render img when value is absent', () => {
      const { fixture } = setup(
        { property: 'avatar', uiSettings: { displayAs: 'img' } },
        {},
      );
      expect(q(fixture, 'img.image-cell')).toBeNull();
    });
  });

  describe('withCopyButton', () => {
    it('renders copy icon when withCopyButton is true', () => {
      const { fixture } = setup(
        { property: 'token', uiSettings: { withCopyButton: true } },
        { token: 'secret' },
      );
      expect(el(fixture, 'resource-field-token-copy')).not.toBeNull();
    });

    it('does not render copy icon when withCopyButton is false', () => {
      const { fixture } = setup(
        { property: 'token', uiSettings: { withCopyButton: false } },
        { token: 'secret' },
      );
      expect(el(fixture, 'resource-field-token-copy')).toBeNull();
    });
  });

  describe('cssStyles', () => {
    it('merges cssCustomization and cssRules', () => {
      const { component } = setup(
        {
          property: 'status',
          uiSettings: {
            cssCustomization: { color: 'red' },
            cssRules: [
              {
                if: { condition: 'equals', value: 'Active' },
                styles: { fontWeight: 'bold' },
              },
            ],
          },
        },
        { status: 'Active' },
      );
      expect(component.cssStyles()).toEqual({
        color: 'red',
        fontWeight: 'bold',
      });
    });
  });

  describe('buttonClick output', () => {
    it('emits buttonClick with field and resource on buttonClicked', () => {
      const field: FieldDefinition = {
        property: 'action',
        uiSettings: {
          displayAs: 'button',
          buttonSettings: { text: 'Go', action: 'navigate' },
        },
      };
      const resource = { action: 'go' };
      const { fixture, component } = setup(field, resource);

      const emitted: ResourceFieldButtonClickEvent<GenericResource>[] = [];
      component.buttonClick.subscribe((e) => emitted.push(e));

      const btn = q(fixture, 'ui5-button');
      btn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      fixture.detectChanges();

      expect(emitted).toHaveLength(1);
      expect(emitted[0].field).toEqual(field);
      expect(emitted[0].resource).toEqual(resource);
    });

    it('disables the button and exposes the resource status when unavailable', () => {
      const { fixture, component } = setup(
        {
          property: 'action',
          uiSettings: {
            displayAs: 'button',
            buttonSettings: {
              action: 'delete',
              icon: 'delete',
              tooltip: 'Delete',
            },
          },
        },
        {
          isAvailable: false,
          accessibleName: 'Resource is pending deletion',
        },
      );

      const button = q(fixture, 'ui5-button') as
        | (Element & {
            accessibleName: string;
            disabled: boolean;
          })
        | null;

      expect(component.buttonDisabled()).toBe(true);
      expect(button?.disabled).toBe(true);
      expect(button?.accessibleName).toBe('Resource is pending deletion');
    });

    it('does not emit buttonClick when the resource is unavailable', () => {
      const field: FieldDefinition = {
        property: 'action',
        uiSettings: {
          displayAs: 'button',
          buttonSettings: { action: 'delete' },
        },
      };
      const { fixture, component } = setup(field, { isAvailable: false });
      const emitted: ResourceFieldButtonClickEvent<GenericResource>[] = [];
      component.buttonClick.subscribe((event) => emitted.push(event));

      q(fixture, 'ui5-button')?.dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      );

      expect(emitted).toHaveLength(0);
    });
  });

  describe('displayAs: tag', () => {
    it('renders mfp-tag-list-value component', () => {
      const { fixture } = setup(
        { property: 'labels', uiSettings: { displayAs: 'tag' } },
        { labels: 'api,backend' },
      );
      expect(el(fixture, 'resource-field-labels-tags')).not.toBeNull();
    });

    it('does not render plain text when displayAs is tag', () => {
      const { fixture } = setup(
        { property: 'labels', uiSettings: { displayAs: 'tag' } },
        { labels: 'api,backend' },
      );
      const span = q(fixture, '[data-testid="resource-field-labels"]');
      expect(span?.textContent?.trim()).not.toBe('api,backend');
    });
  });

  describe('normalizeTagsArray', () => {
    it('splits comma-separated string into trimmed array', () => {
      const { component } = setup(
        { property: 'labels', uiSettings: { displayAs: 'tag' } },
        { labels: 'api, backend , v2' },
      );
      expect(component.tags()).toEqual(['api', 'backend', 'v2']);
    });

    it('uses custom valueSeparator from tagSettings', () => {
      const { component } = setup(
        {
          property: 'envs',
          uiSettings: { displayAs: 'tag', tagSettings: { valueSeparator: '|' } },
        },
        { envs: 'prod|staging|dev' },
      );
      expect(component.tags()).toEqual(['prod', 'staging', 'dev']);
    });

    it('filters out empty segments', () => {
      const { component } = setup(
        { property: 'labels', uiSettings: { displayAs: 'tag' } },
        { labels: 'api,,backend,' },
      );
      expect(component.tags()).toEqual(['api', 'backend']);
    });

    it('converts array values to string array', () => {
      const { component } = setup(
        { property: 'items', uiSettings: { displayAs: 'tag' } },
        { items: ['prod', 'staging'] },
      );
      expect(component.tags()).toEqual(['prod', 'staging']);
    });

    it('returns empty array for non-string non-array value', () => {
      const { component } = setup(
        { property: 'count', uiSettings: { displayAs: 'tag' } },
        { count: 42 },
      );
      expect(component.tags()).toEqual([]);
    });

    it('returns empty array when value is absent', () => {
      const { component } = setup(
        { property: 'missing', uiSettings: { displayAs: 'tag' } },
        {},
      );
      expect(component.tags()).toEqual([]);
    });
  });

  describe('displayValue / valueRules', () => {
    it('equals the raw value when valueRules is not set', () => {
      const { fixture } = setup({ property: 'score' }, { score: '42' });
      const span = q(fixture, '[data-testid="resource-field-score"]');
      expect(span?.textContent?.trim()).toBe('42');
    });

    it('equals the matching rule then when a rule matches', () => {
      const { fixture } = setup(
        {
          property: 'score',
          uiSettings: {
            valueRules: [
              { if: { condition: 'lessThan', value: '20' }, then: 'Low' },
              { if: { condition: 'lessThan', value: '60' }, then: 'Medium' },
              { if: { condition: 'greaterThanOrEqual', value: '60' }, then: 'High' },
            ],
          },
        },
        { score: '10' },
      );
      const span = q(fixture, '[data-testid="resource-field-score"]');
      expect(span?.textContent?.trim()).toBe('Low');
    });

    it('equals the raw value when rules are present but none match', () => {
      const { fixture } = setup(
        {
          property: 'score',
          uiSettings: {
            valueRules: [
              { if: { condition: 'equals', value: 'Running' }, then: 'Active' },
            ],
          },
        },
        { score: 'Pending' },
      );
      const span = q(fixture, '[data-testid="resource-field-score"]');
      expect(span?.textContent?.trim()).toBe('Pending');
    });
  });

  describe('collection display', () => {
    it('delegates to mfp-resource-collection-field when the field has propertyCollection', () => {
      const { fixture } = setup(
        {
          label: 'Conditions',
          property: 'status.conditions',
          propertyCollection: [
            { label: 'Type', property: 'status.conditions.type' },
          ],
        },
        {
          status: { conditions: [{ type: 'Ready' }] },
        } as unknown as GenericResource,
      );

      const scope = fixture.nativeElement.shadowRoot ?? fixture.nativeElement;
      expect(scope.querySelector('mfp-resource-collection-field')).toBeTruthy();
    });

    it('renders a scalar value (no collection) for a plain field', () => {
      const { fixture } = setup({ property: 'status' }, { status: 'Active' });
      const scope = fixture.nativeElement.shadowRoot ?? fixture.nativeElement;
      expect(scope.querySelector('mfp-resource-collection-field')).toBeNull();
    });
  });

  describe('canRenderField / requirePermission', () => {
    const FIELD_PROPERTY = 'action';
    const RESOURCE_ID = 'ns/pod-1';
    const VERB = 'delete';

    it('renders the field when requirePermission is absent', () => {
      // No requirePermission → always visible regardless of permissions map
      const { fixture } = setup(
        { property: FIELD_PROPERTY },
        { id: RESOURCE_ID, action: 'go' },
      );
      const span = q(fixture, `[data-testid="resource-field-${FIELD_PROPERTY}"]`);
      expect(span).not.toBeNull();
    });

    it('renders the field when requirePermission is absent and permissions map is undefined', () => {
      const { fixture } = setup(
        { property: FIELD_PROPERTY },
        { id: RESOURCE_ID, action: 'go' },
        undefined,
      );
      const span = q(fixture, `[data-testid="resource-field-${FIELD_PROPERTY}"]`);
      expect(span).not.toBeNull();
    });

    it('renders the field when verb is present in the row\'s granted actions', () => {
      const permissions = { [RESOURCE_ID]: [VERB, 'get'] };
      const { fixture } = setup(
        { property: FIELD_PROPERTY, requirePermission: VERB },
        { id: RESOURCE_ID, action: 'go' },
        permissions,
      );
      const span = q(fixture, `[data-testid="resource-field-${FIELD_PROPERTY}"]`);
      expect(span).not.toBeNull();
    });

    it('hides the field when verb is absent from the row\'s granted actions', () => {
      const permissions = { [RESOURCE_ID]: ['get', 'list'] };
      const { fixture } = setup(
        { property: FIELD_PROPERTY, requirePermission: VERB },
        { id: RESOURCE_ID, action: 'go' },
        permissions,
      );
      const span = q(fixture, `[data-testid="resource-field-${FIELD_PROPERTY}"]`);
      expect(span).toBeNull();
    });

    it('hides the field when the resource id is not in the permissions map (fail-closed)', () => {
      // Row exists in the map under a different id — no match → hidden
      const permissions = { 'other-id': [VERB] };
      const { fixture } = setup(
        { property: FIELD_PROPERTY, requirePermission: VERB },
        { id: RESOURCE_ID, action: 'go' },
        permissions,
      );
      const span = q(fixture, `[data-testid="resource-field-${FIELD_PROPERTY}"]`);
      expect(span).toBeNull();
    });

    it('hides the field when permissions input is undefined (fail-closed)', () => {
      // requirePermission set but no permissions map at all
      const { fixture } = setup(
        { property: FIELD_PROPERTY, requirePermission: VERB },
        { id: RESOURCE_ID, action: 'go' },
        undefined,
      );
      const span = q(fixture, `[data-testid="resource-field-${FIELD_PROPERTY}"]`);
      expect(span).toBeNull();
    });

    it('hides the field when resource has no id (fail-closed)', () => {
      // resource.id is undefined → id ?? '' → empty string key
      // If the map does NOT have '' as a key, actions is undefined → hidden
      const permissions = { [RESOURCE_ID]: [VERB] };
      const { fixture } = setup(
        { property: FIELD_PROPERTY, requirePermission: VERB },
        { action: 'go' }, // no id — id resolves to ''
        permissions,
      );
      const span = q(fixture, `[data-testid="resource-field-${FIELD_PROPERTY}"]`);
      expect(span).toBeNull();
    });

    it('hides the field when resource has no id even if the map has an empty-string key (fail-closed)', () => {
      // Regression: a `{ '': [...] }` entry must NOT grant access to an
      // id-less resource. Guarding on a non-empty id closes this bypass.
      const permissions = { '': [VERB] };
      const { fixture } = setup(
        { property: FIELD_PROPERTY, requirePermission: VERB },
        { action: 'go' }, // no id
        permissions,
      );
      const span = q(fixture, `[data-testid="resource-field-${FIELD_PROPERTY}"]`);
      expect(span).toBeNull();
    });

    it('hides the field when resource id is an empty string even if the map has an empty-string key (fail-closed)', () => {
      const permissions = { '': [VERB] };
      const { fixture } = setup(
        { property: FIELD_PROPERTY, requirePermission: VERB },
        { id: '', action: 'go' },
        permissions,
      );
      const span = q(fixture, `[data-testid="resource-field-${FIELD_PROPERTY}"]`);
      expect(span).toBeNull();
    });

    it('hides the field when resource input is undefined (fail-closed)', () => {
      const permissions = { [RESOURCE_ID]: [VERB] };
      // resource not provided → resource() returns undefined
      const { fixture } = setup(
        { property: FIELD_PROPERTY, requirePermission: VERB },
        undefined,
        permissions,
      );
      const span = q(fixture, `[data-testid="resource-field-${FIELD_PROPERTY}"]`);
      expect(span).toBeNull();
    });

    it('hides the field when permissions map entry is an empty array', () => {
      // Row is present but granted no actions → hidden
      const permissions = { [RESOURCE_ID]: [] as string[] };
      const { fixture } = setup(
        { property: FIELD_PROPERTY, requirePermission: VERB },
        { id: RESOURCE_ID, action: 'go' },
        permissions,
      );
      const span = q(fixture, `[data-testid="resource-field-${FIELD_PROPERTY}"]`);
      expect(span).toBeNull();
    });

    it('reacts to a permissions input change and hides the field', () => {
      // Start with permission granted, then revoke it
      const permissions = { [RESOURCE_ID]: [VERB] };
      const { fixture } = setup(
        { property: FIELD_PROPERTY, requirePermission: VERB },
        { id: RESOURCE_ID, action: 'go' },
        permissions,
      );
      expect(
        q(fixture, `[data-testid="resource-field-${FIELD_PROPERTY}"]`),
      ).not.toBeNull();

      // Remove the verb
      fixture.componentRef.setInput('permissions', { [RESOURCE_ID]: ['get'] });
      fixture.detectChanges();

      expect(
        q(fixture, `[data-testid="resource-field-${FIELD_PROPERTY}"]`),
      ).toBeNull();
    });

    it('reacts to a permissions input change and shows the field', () => {
      // Start hidden (no map), then grant the verb
      const { fixture } = setup(
        { property: FIELD_PROPERTY, requirePermission: VERB },
        { id: RESOURCE_ID, action: 'go' },
        undefined,
      );
      expect(
        q(fixture, `[data-testid="resource-field-${FIELD_PROPERTY}"]`),
      ).toBeNull();

      fixture.componentRef.setInput(
        'permissions',
        { [RESOURCE_ID]: [VERB] },
      );
      fixture.detectChanges();

      expect(
        q(fixture, `[data-testid="resource-field-${FIELD_PROPERTY}"]`),
      ).not.toBeNull();
    });
  });
});
