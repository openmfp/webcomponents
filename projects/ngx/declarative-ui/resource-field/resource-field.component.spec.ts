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
): { fixture: Fixture; component: Comp } {
  const fixture: Fixture = TestBed.createComponent(
    ResourceField as unknown as typeof ResourceField<GenericResource, FieldDefinition>,
  );
  const component = fixture.componentInstance;
  fixture.componentRef.setInput('fieldDefinition', field);
  if (resource !== undefined)
    fixture.componentRef.setInput('resource', resource as GenericResource);
  fixture.detectChanges();
  return { fixture, component };
}

function el(fixture: Fixture, testId: string): Element | null {
  return (
    fixture.nativeElement.shadowRoot ?? fixture.nativeElement
  ).querySelector(`[test-id="${testId}"]`);
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
      const span = q(fixture, '[test-id="resource-field-status"]');
      expect(span?.textContent?.trim()).toBe('Active');
    });

    it('falls back to field.value when no resource is provided', () => {
      const { fixture } = setup({ property: 'status', value: 'fallback' });
      const span = q(fixture, '[test-id="resource-field-status"]');
      expect(span?.textContent?.trim()).toBe('fallback');
    });

    it('renders empty when value is absent', () => {
      const { fixture } = setup({ property: 'missing' }, {});
      const span = q(fixture, '[test-id="resource-field-missing"]');
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
      const span = q(fixture, '[test-id="resource-field-labels"]');
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
});
