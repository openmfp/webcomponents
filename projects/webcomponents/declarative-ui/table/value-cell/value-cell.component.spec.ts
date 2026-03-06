import { BooleanValue } from './boolean-value/boolean-value.component';
import { LinkValue } from './link-value/link-value.component';
import { SecretValue } from './secret-value/secret-value.component';
import { ValueCellComponent } from './value-cell.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  FieldDefinition,
  GenericResource,
  Resource,
} from '@platform-mesh/portal-ui-lib/models/models';

describe('ValueCellComponent', () => {
  let component: ValueCellComponent<GenericResource>;
  let fixture: ComponentFixture<ValueCellComponent<GenericResource>>;

  const makeComponent = (
    value: unknown,
    fieldDefinition: Partial<FieldDefinition> = {},
  ) => {
    fixture = TestBed.createComponent(ValueCellComponent);
    component = fixture.componentInstance;

    const resource: Resource = {
      metadata: { name: 'test-resource' },
      spec: { value },
    } as any;

    const field: FieldDefinition = {
      property: 'spec.value',
      ...fieldDefinition,
    };

    fixture.componentRef.setInput('resource', resource);
    fixture.componentRef.setInput('fieldDefinition', field);

    fixture.detectChanges();

    return { component, fixture };
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ValueCellComponent],
    }).overrideComponent(ValueCellComponent, {
      set: {
        imports: [BooleanValue, LinkValue, SecretValue],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
      },
    });
  });

  it('should create', () => {
    const { component } = makeComponent('test');
    expect(component).toBeTruthy();
  });

  it('should render boolean-value component for boolean-like values', () => {
    const { fixture } = makeComponent('true', {
      uiSettings: { displayAs: 'boolIcon' },
    });
    const compiled = fixture.nativeElement;

    expect(compiled.querySelector('pm-boolean-value')).toBeTruthy();
    expect(component.isBoolLike()).toBe(true);
    expect(component.boolValue()).toBe(true);
  });

  it('should render boolean-value component for false boolean-like values', () => {
    const { fixture } = makeComponent('false', {
      uiSettings: { displayAs: 'boolIcon' },
    });
    const compiled = fixture.nativeElement;

    expect(compiled.querySelector('pm-boolean-value')).toBeTruthy();
    expect(component.isBoolLike()).toBe(true);
    expect(component.boolValue()).toBe(false);
  });

  it('should render boolean-value component for actual boolean values', () => {
    const { fixture } = makeComponent(true, {
      uiSettings: { displayAs: 'boolIcon' },
    });
    const compiled = fixture.nativeElement;

    expect(compiled.querySelector('pm-boolean-value')).toBeTruthy();
    expect(component.isBoolLike()).toBe(true);
    expect(component.boolValue()).toBe(true);
  });

  it('should render link-value component for valid URLs', () => {
    const { fixture } = makeComponent('https://example.com', {
      uiSettings: { displayAs: 'link' },
    });
    const compiled = fixture.nativeElement;

    expect(compiled.querySelector('pm-link-value')).toBeTruthy();
    expect(component.isUrlValue()).toBe(true);
    expect(component.stringValue()).toBe('https://example.com');
  });

  it('should render link-value component for valid URLs with different protocols', () => {
    const { fixture } = makeComponent('http://test.com', {
      uiSettings: { displayAs: 'link' },
    });
    const compiled = fixture.nativeElement;

    expect(compiled.querySelector('pm-link-value')).toBeTruthy();
    expect(component.isUrlValue()).toBe(true);
  });

  it('should render plain text for non-boolean, non-URL values', () => {
    const { fixture } = makeComponent('cluster-a');
    const compiled = fixture.nativeElement;

    expect(compiled.querySelector('pm-boolean-value')).toBeFalsy();
    expect(compiled.querySelector('pm-link-value')).toBeFalsy();
    expect(compiled.textContent.trim()).toBe('cluster-a');
    expect(component.isBoolLike()).toBe(false);
    expect(component.isUrlValue()).toBe(false);
  });

  it('should render plain text for empty strings', () => {
    const { fixture } = makeComponent('');
    const compiled = fixture.nativeElement;

    expect(compiled.querySelector('pm-boolean-value')).toBeFalsy();
    expect(compiled.querySelector('pm-link-value')).toBeFalsy();
    expect(component.isBoolLike()).toBe(false);
    expect(component.isUrlValue()).toBe(false);
  });

  it('should render plain text for whitespace-only strings', () => {
    const { fixture } = makeComponent('   ');
    const compiled = fixture.nativeElement;

    expect(compiled.querySelector('pm-boolean-value')).toBeFalsy();
    expect(compiled.querySelector('pm-link-value')).toBeFalsy();
    expect(component.isBoolLike()).toBe(false);
    expect(component.isUrlValue()).toBe(false);
  });

  it('should render plain text for invalid URLs', () => {
    const { fixture } = makeComponent('not-a-url', {
      uiSettings: { displayAs: 'link' },
    });
    const compiled = fixture.nativeElement;

    expect(compiled.querySelector('pm-boolean-value')).toBeFalsy();
    expect(compiled.querySelector('pm-link-value')).toBeFalsy();
    expect(compiled.textContent.trim()).toBe('not-a-url');
    expect(component.isUrlValue()).toBe(false);
  });

  it('should handle null and undefined values', () => {
    const { fixture } = makeComponent(null);
    const compiled = fixture.nativeElement;

    expect(compiled.querySelector('pm-boolean-value')).toBeFalsy();
    expect(compiled.querySelector('pm-link-value')).toBeFalsy();
    expect(component.isBoolLike()).toBe(false);
    expect(component.isUrlValue()).toBe(false);
  });

  it('should handle numeric values', () => {
    const { fixture } = makeComponent(123);
    const compiled = fixture.nativeElement;

    expect(compiled.querySelector('pm-boolean-value')).toBeFalsy();
    expect(compiled.querySelector('pm-link-value')).toBeFalsy();
    expect(compiled.textContent.trim()).toBe('123');
  });

  describe('labelDisplay functionality', () => {
    it('should apply label-value class when labelDisplay is true', () => {
      const { fixture } = makeComponent('test-value', {
        uiSettings: { labelDisplay: true },
      });
      const compiled = fixture.nativeElement;
      const span = compiled.querySelector('span');

      expect(span.classList.contains('label-value')).toBe(true);
    });

    it('should not apply label-value class when labelDisplay is false', () => {
      const { fixture } = makeComponent('test-value', {
        uiSettings: { labelDisplay: false },
      });
      const compiled = fixture.nativeElement;
      const span = compiled.querySelector('span');

      expect(span.classList.contains('label-value')).toBe(false);
    });

    it('should not apply label-value class when labelDisplay is undefined', () => {
      const { fixture } = makeComponent('test-value', {
        uiSettings: { labelDisplay: undefined },
      });
      const compiled = fixture.nativeElement;
      const span = compiled.querySelector('span');

      expect(span.classList.contains('label-value')).toBe(false);
      expect(component.labelDisplay()).toBeUndefined();
    });
  });

  describe('displayAs secret functionality', () => {
    it('should render secret-value component when displayAs is secret', () => {
      const { fixture } = makeComponent('secret-password', {
        uiSettings: { displayAs: 'secret' },
      });
      const compiled = fixture.nativeElement;

      expect(compiled.querySelector('pm-secret-value')).toBeTruthy();
      expect(component.displayAs()).toBe('secret');
    });

    it('should not render secret-value component when displayAs is not secret', () => {
      const { fixture } = makeComponent('plain-text', {
        uiSettings: { displayAs: 'link' },
      });
      const compiled = fixture.nativeElement;

      expect(compiled.querySelector('pm-secret-value')).toBeFalsy();
      expect(component.displayAs()).toBe('link');
    });

    it('should not render secret-value component when displayAs is undefined', () => {
      const { fixture } = makeComponent('plain-text');
      const compiled = fixture.nativeElement;

      expect(compiled.querySelector('pm-secret-value')).toBeFalsy();
      expect(component.displayAs()).toBeUndefined();
    });

    it('should render toggle icon when displayAs is secret', () => {
      const { fixture } = makeComponent('secret-password', {
        uiSettings: { displayAs: 'secret' },
      });
      const compiled = fixture.nativeElement;

      const toggleIcon = compiled.querySelector('ui5-icon.toggle-icon');
      expect(toggleIcon).toBeTruthy();
    });

    it('should not render toggle icon when displayAs is not secret', () => {
      const { fixture } = makeComponent('plain-text', {
        uiSettings: { displayAs: 'link' },
      });
      const compiled = fixture.nativeElement;

      const toggleIcon = compiled.querySelector('ui5-icon.toggle-icon');
      expect(toggleIcon).toBeFalsy();
    });

    it('should initialize isVisible as false', () => {
      const { component } = makeComponent('secret-password', {
        uiSettings: { displayAs: 'secret' },
      });

      expect(component.isVisible()).toBe(false);
    });

    it('should toggle visibility when icon is clicked', () => {
      const { component, fixture } = makeComponent('secret-password', {
        uiSettings: { displayAs: 'secret' },
      });
      const compiled = fixture.nativeElement;

      expect(component.isVisible()).toBe(false);

      const icon = compiled.querySelector('ui5-icon.toggle-icon');
      icon?.click();
      fixture.detectChanges();

      expect(component.isVisible()).toBe(true);
    });

    it('should toggle back to hidden when icon is clicked again', () => {
      const { component, fixture } = makeComponent('secret-password', {
        uiSettings: { displayAs: 'secret' },
      });
      const compiled = fixture.nativeElement;

      const icon = compiled.querySelector('ui5-icon.toggle-icon');

      icon?.click();
      fixture.detectChanges();
      expect(component.isVisible()).toBe(true);

      icon?.click();
      fixture.detectChanges();
      expect(component.isVisible()).toBe(false);
    });

    it('should stop event propagation when toggle icon is clicked', () => {
      const { component, fixture } = makeComponent('secret-password', {
        uiSettings: { displayAs: 'secret' },
      });

      const event = new Event('click');
      const stopPropagationSpy = vi.spyOn(event, 'stopPropagation');

      component.toggleVisibility(event);
      fixture.detectChanges();

      expect(stopPropagationSpy).toHaveBeenCalled();
    });

    it('should pass isVisible state to secret-value component', () => {
      const { component, fixture } = makeComponent('secret-password', {
        uiSettings: { displayAs: 'secret' },
      });
      const compiled = fixture.nativeElement;

      component.isVisible.set(true);
      fixture.detectChanges();

      const secretValueComponent = compiled.querySelector('pm-secret-value');
      expect(secretValueComponent).toBeTruthy();
    });
  });

  describe('withCopyButton functionality', () => {
    it('should render copy button when withCopyButton is true', () => {
      const { fixture } = makeComponent('test-value', {
        uiSettings: { withCopyButton: true },
      });
      const compiled = fixture.nativeElement;

      expect(compiled.querySelector('ui5-icon[name="copy"]')).toBeTruthy();
      expect(component.withCopyButton()).toBe(true);
    });

    it('should not render copy button when withCopyButton is false', () => {
      const { fixture } = makeComponent('test-value', {
        uiSettings: { withCopyButton: false },
      });
      const compiled = fixture.nativeElement;

      expect(compiled.querySelector('ui5-icon[name="copy"]')).toBeFalsy();
      expect(component.withCopyButton()).toBe(false);
    });

    it('should not render copy button when withCopyButton is undefined', () => {
      const { fixture } = makeComponent('test-value');
      const compiled = fixture.nativeElement;

      expect(compiled.querySelector('ui5-icon[name="copy"]')).toBeFalsy();
      expect(component.withCopyButton()).toBeUndefined();
    });

    it('should copy value to clipboard when copy button is clicked', async () => {
      const writeTextSpy = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { clipboard: { writeText: writeTextSpy } });

      const { fixture } = makeComponent('test-value', {
        uiSettings: { withCopyButton: true },
      });

      const compiled = fixture.nativeElement;
      const copyButton = compiled.querySelector('ui5-icon[name="copy"]');

      const event = new Event('click');
      copyButton.dispatchEvent(event);
      fixture.detectChanges();

      expect(writeTextSpy).toHaveBeenCalledWith('test-value');
    });

    it('should stop event propagation when copy button is clicked', () => {
      const { fixture } = makeComponent('test-value', {
        uiSettings: { withCopyButton: true },
      });
      const compiled = fixture.nativeElement;

      const event = new Event('click');
      const stopPropagationSpy = vi.spyOn(event, 'stopPropagation');

      component.copyValue(event);
      fixture.detectChanges();

      expect(stopPropagationSpy).toHaveBeenCalled();
    });
  });

  describe('displayAs plainText functionality', () => {
    it('should render plain text when displayAs is undefined', () => {
      const { fixture } = makeComponent('test-value', {
        uiSettings: { displayAs: undefined },
      });
      const compiled = fixture.nativeElement;

      expect(compiled.querySelector('pm-boolean-value')).toBeFalsy();
      expect(compiled.querySelector('pm-link-value')).toBeFalsy();
      expect(compiled.querySelector('pm-secret-value')).toBeFalsy();
      expect(compiled.textContent.trim()).toContain('test-value');
    });

    it('should not render plain text when displayAs is not plainText', () => {
      const { fixture } = makeComponent('https://example.com', {
        uiSettings: { displayAs: 'link' },
      });
      const compiled = fixture.nativeElement;

      expect(compiled.querySelector('pm-link-value')).toBeTruthy();
    });
  });

  describe('boolean normalization edge cases', () => {
    it('should handle boolean true value', () => {
      const { fixture } = makeComponent(true, {
        uiSettings: { displayAs: 'boolIcon' },
      });
      const compiled = fixture.nativeElement;

      expect(compiled.querySelector('pm-boolean-value')).toBeTruthy();
      expect(component.isBoolLike()).toBe(true);
      expect(component.boolValue()).toBe(true);
    });

    it('should handle boolean false value', () => {
      const { fixture } = makeComponent(false, {
        uiSettings: { displayAs: 'boolIcon' },
      });
      const compiled = fixture.nativeElement;

      expect(compiled.querySelector('pm-boolean-value')).toBeTruthy();
      expect(component.isBoolLike()).toBe(true);
      expect(component.boolValue()).toBe(false);
    });

    it('should handle string "True" (capitalized)', () => {
      const { fixture } = makeComponent('True', {
        uiSettings: { displayAs: 'boolIcon' },
      });
      const compiled = fixture.nativeElement;

      expect(compiled.querySelector('pm-boolean-value')).toBeTruthy();
      expect(component.isBoolLike()).toBe(true);
      expect(component.boolValue()).toBe(true);
    });

    it('should handle string "FALSE" (uppercase)', () => {
      const { fixture } = makeComponent('FALSE', {
        uiSettings: { displayAs: 'boolIcon' },
      });
      const compiled = fixture.nativeElement;

      expect(compiled.querySelector('pm-boolean-value')).toBeTruthy();
      expect(component.isBoolLike()).toBe(true);
      expect(component.boolValue()).toBe(false);
    });

    it('should handle string "TRUE" (uppercase)', () => {
      const { fixture } = makeComponent('TRUE', {
        uiSettings: { displayAs: 'boolIcon' },
      });
      const compiled = fixture.nativeElement;

      expect(compiled.querySelector('pm-boolean-value')).toBeTruthy();
      expect(component.isBoolLike()).toBe(true);
      expect(component.boolValue()).toBe(true);
    });

    it('should not treat "yes" as boolean', () => {
      const { fixture } = makeComponent('yes', {
        uiSettings: { displayAs: 'boolIcon' },
      });
      const compiled = fixture.nativeElement;

      expect(compiled.querySelector('pm-boolean-value')).toBeFalsy();
      expect(component.isBoolLike()).toBe(false);
      expect(component.boolValue()).toBeUndefined();
    });

    it('should not treat "no" as boolean', () => {
      const { fixture } = makeComponent('no');
      const compiled = fixture.nativeElement;

      expect(compiled.querySelector('pm-boolean-value')).toBeFalsy();
      expect(component.isBoolLike()).toBe(false);
      expect(component.boolValue()).toBeUndefined();
    });

    it('should not treat "1" as boolean', () => {
      const { fixture } = makeComponent('1');
      const compiled = fixture.nativeElement;

      expect(compiled.querySelector('pm-boolean-value')).toBeFalsy();
      expect(component.isBoolLike()).toBe(false);
      expect(component.boolValue()).toBeUndefined();
    });

    it('should not treat "0" as boolean', () => {
      const { fixture } = makeComponent('0');
      const compiled = fixture.nativeElement;

      expect(compiled.querySelector('pm-boolean-value')).toBeFalsy();
      expect(component.isBoolLike()).toBe(false);
      expect(component.boolValue()).toBeUndefined();
    });

    it('should handle object with toString method returning "true"', () => {
      const obj = { toString: () => 'true' };
      const { fixture } = makeComponent(obj, {
        uiSettings: { displayAs: 'boolIcon' },
      });
      const compiled = fixture.nativeElement;

      expect(compiled.querySelector('pm-boolean-value')).toBeTruthy();
      expect(component.isBoolLike()).toBe(true);
      expect(component.boolValue()).toBe(true);
    });

    it('should handle object with toString method returning "false"', () => {
      const obj = { toString: () => 'false' };
      const { fixture } = makeComponent(obj, {
        uiSettings: { displayAs: 'boolIcon' },
      });
      const compiled = fixture.nativeElement;

      expect(compiled.querySelector('pm-boolean-value')).toBeTruthy();
      expect(component.isBoolLike()).toBe(true);
      expect(component.boolValue()).toBe(false);
    });
  });

  describe('URL validation edge cases', () => {
    it('should handle valid HTTPS URL', () => {
      const { fixture } = makeComponent('https://example.com', {
        uiSettings: { displayAs: 'link' },
      });
      const compiled = fixture.nativeElement;

      expect(compiled.querySelector('pm-link-value')).toBeTruthy();
      expect(component.isUrlValue()).toBe(true);
      expect(component.stringValue()).toBe('https://example.com');
    });

    it('should handle valid HTTP URL', () => {
      const { fixture } = makeComponent('http://example.com', {
        uiSettings: { displayAs: 'link' },
      });
      const compiled = fixture.nativeElement;

      expect(compiled.querySelector('pm-link-value')).toBeTruthy();
      expect(component.isUrlValue()).toBe(true);
      expect(component.stringValue()).toBe('http://example.com');
    });

    it('should handle valid FTP URL', () => {
      const { fixture } = makeComponent('ftp://example.com', {
        uiSettings: { displayAs: 'link' },
      });
      const compiled = fixture.nativeElement;

      expect(compiled.querySelector('pm-link-value')).toBeTruthy();
      expect(component.isUrlValue()).toBe(true);
      expect(component.stringValue()).toBe('ftp://example.com');
    });

    it('should handle valid URL with port', () => {
      const { fixture } = makeComponent('https://example.com:8080', {
        uiSettings: { displayAs: 'link' },
      });
      const compiled = fixture.nativeElement;

      expect(compiled.querySelector('pm-link-value')).toBeTruthy();
      expect(component.isUrlValue()).toBe(true);
      expect(component.stringValue()).toBe('https://example.com:8080');
    });

    it('should handle valid URL with path', () => {
      const { fixture } = makeComponent(
        'https://example.com/path/to/resource',
        {
          uiSettings: { displayAs: 'link' },
        },
      );
      const compiled = fixture.nativeElement;

      expect(compiled.querySelector('pm-link-value')).toBeTruthy();
      expect(component.isUrlValue()).toBe(true);
      expect(component.stringValue()).toBe(
        'https://example.com/path/to/resource',
      );
    });

    it('should handle valid URL with query parameters', () => {
      const { fixture } = makeComponent(
        'https://example.com?param=value&other=test',
        {
          uiSettings: { displayAs: 'link' },
        },
      );
      const compiled = fixture.nativeElement;

      expect(compiled.querySelector('pm-link-value')).toBeTruthy();
      expect(component.isUrlValue()).toBe(true);
      expect(component.stringValue()).toBe(
        'https://example.com?param=value&other=test',
      );
    });

    it('should handle valid URL with fragment', () => {
      const { fixture } = makeComponent('https://example.com#section', {
        uiSettings: { displayAs: 'link' },
      });
      const compiled = fixture.nativeElement;

      expect(compiled.querySelector('pm-link-value')).toBeTruthy();
      expect(component.isUrlValue()).toBe(true);
      expect(component.stringValue()).toBe('https://example.com#section');
    });

    it('should not treat "example.com" as valid URL', () => {
      const { fixture } = makeComponent('example.com');
      const compiled = fixture.nativeElement;

      expect(compiled.querySelector('pm-link-value')).toBeFalsy();
      expect(component.isUrlValue()).toBe(false);
    });

    it('should not treat "www.example.com" as valid URL', () => {
      const { fixture } = makeComponent('www.example.com');
      const compiled = fixture.nativeElement;

      expect(compiled.querySelector('pm-link-value')).toBeFalsy();
      expect(component.isUrlValue()).toBe(false);
    });

    it('should treat "mailto:test@example.com" as valid URL for link component', () => {
      const { fixture } = makeComponent('mailto:test@example.com', {
        uiSettings: { displayAs: 'link' },
      });
      const compiled = fixture.nativeElement;

      expect(compiled.querySelector('pm-link-value')).toBeTruthy();
      expect(component.isUrlValue()).toBe(true);
    });

    it('should treat "tel:+1234567890" as valid URL for link component', () => {
      const { fixture } = makeComponent('tel:+1234567890', {
        uiSettings: { displayAs: 'link' },
      });
      const compiled = fixture.nativeElement;

      expect(compiled.querySelector('pm-link-value')).toBeTruthy();
      expect(component.isUrlValue()).toBe(true);
    });

    it('should handle malformed URL', () => {
      const { fixture } = makeComponent('https://');
      const compiled = fixture.nativeElement;

      expect(compiled.querySelector('pm-link-value')).toBeFalsy();
      expect(component.isUrlValue()).toBe(false);
    });

    it('should handle URL with invalid characters', () => {
      const { fixture } = makeComponent('https://example.com with spaces');
      const compiled = fixture.nativeElement;

      expect(compiled.querySelector('pm-link-value')).toBeFalsy();
      expect(component.isUrlValue()).toBe(false);
    });
  });

  describe('string normalization edge cases', () => {
    it('should handle string with only spaces', () => {
      const { fixture } = makeComponent('   ');
      const compiled = fixture.nativeElement;

      expect(compiled.querySelector('pm-boolean-value')).toBeFalsy();
      expect(compiled.querySelector('pm-link-value')).toBeFalsy();
      expect(component.stringValue()).toBeUndefined();
    });

    it('should handle string with tabs and newlines', () => {
      const { fixture } = makeComponent('\t\n\r');
      const compiled = fixture.nativeElement;

      expect(compiled.querySelector('pm-boolean-value')).toBeFalsy();
      expect(compiled.querySelector('pm-link-value')).toBeFalsy();
      expect(component.stringValue()).toBeUndefined();
    });

    it('should handle string with leading and trailing spaces', () => {
      const { fixture } = makeComponent('  test  ');
      const compiled = fixture.nativeElement;

      expect(compiled.querySelector('pm-boolean-value')).toBeFalsy();
      expect(compiled.querySelector('pm-link-value')).toBeFalsy();
      expect(component.stringValue()).toBe('  test  ');
    });

    it('should handle non-string values', () => {
      const { fixture } = makeComponent(123);
      const compiled = fixture.nativeElement;

      expect(compiled.querySelector('pm-boolean-value')).toBeFalsy();
      expect(compiled.querySelector('pm-link-value')).toBeFalsy();
      expect(component.stringValue()).toBeUndefined();
    });

    it('should handle object values', () => {
      const obj = { key: 'value' };
      const { fixture } = makeComponent(obj);
      const compiled = fixture.nativeElement;

      expect(compiled.querySelector('pm-boolean-value')).toBeFalsy();
      expect(compiled.querySelector('pm-link-value')).toBeFalsy();
      expect(component.stringValue()).toBeUndefined();
    });

    it('should handle array values', () => {
      const arr = ['item1', 'item2'];
      const { fixture } = makeComponent(arr);
      const compiled = fixture.nativeElement;

      expect(compiled.querySelector('pm-boolean-value')).toBeFalsy();
      expect(compiled.querySelector('pm-link-value')).toBeFalsy();
      expect(component.stringValue()).toBeUndefined();
    });
  });

  describe('complex scenarios', () => {
    it('should prioritize boolean over URL when both are valid', () => {
      const { fixture } = makeComponent('true', {
        uiSettings: { displayAs: 'boolIcon' },
      });
      const compiled = fixture.nativeElement;

      expect(compiled.querySelector('pm-boolean-value')).toBeTruthy();
      expect(compiled.querySelector('pm-link-value')).toBeFalsy();
    });

    it('should render plain text when no special rendering is needed', () => {
      const { fixture } = makeComponent('some-text', {
        uiSettings: { labelDisplay: false },
      });
      const compiled = fixture.nativeElement;
      const span = compiled.querySelector('span');

      expect(compiled.querySelector('pm-boolean-value')).toBeFalsy();
      expect(compiled.querySelector('pm-link-value')).toBeFalsy();
      expect(span.classList.contains('label-value')).toBe(false);
      expect(compiled.textContent.trim()).toBe('some-text');
    });
  });

  describe('testId functionality', () => {
    it('should generate testId from field property', () => {
      const { component } = makeComponent('test-value');

      expect(component.testId()).toBe('value-cell-spec.value');
    });

    it('should generate testId with custom property', () => {
      fixture = TestBed.createComponent(ValueCellComponent);
      component = fixture.componentInstance;

      const resource: Resource = {
        metadata: { name: 'test-resource' },
        spec: { password: 'secret-password' },
      } as any;

      const field: FieldDefinition = {
        property: 'spec.password',
        uiSettings: { displayAs: 'secret' },
      };

      fixture.componentRef.setInput('resource', resource);
      fixture.componentRef.setInput('fieldDefinition', field);

      fixture.detectChanges();

      expect(component.testId()).toBe('value-cell-spec.password');
    });

    it('should pass testId to boolean component', () => {
      const { component } = makeComponent('true', {
        uiSettings: { displayAs: 'boolIcon' },
      });

      expect(component.testId()).toBe('value-cell-spec.value');
    });

    it('should pass testId to link component', () => {
      const { component } = makeComponent('https://example.com', {
        uiSettings: { displayAs: 'link' },
      });

      expect(component.testId()).toBe('value-cell-spec.value');
    });

    it('should pass testId to secret component', () => {
      const { component } = makeComponent('secret-password', {
        uiSettings: { displayAs: 'secret' },
      });

      expect(component.testId()).toBe('value-cell-spec.value');
    });
  });

  describe('normalization helpers', () => {
    it('normalizeBoolean should handle true, false and undefined', () => {
      const { component } = makeComponent('true');
      const instance = component as any;

      expect(instance.normalizeBoolean('true')).toBe(true);
      expect(instance.normalizeBoolean('false')).toBe(false);
      expect(instance.normalizeBoolean('nope')).toBeUndefined();
    });

    it('normalizeString should handle empty, whitespace, and non-string values', () => {
      const { component } = makeComponent('value');
      const instance = component as any;

      expect(instance.normalizeString('')).toBeUndefined();
      expect(instance.normalizeString('   ')).toBeUndefined();
      expect(instance.normalizeString(123)).toBeUndefined();
      expect(instance.normalizeString('abc')).toBe('abc');
    });

    it('checkValidUrl should validate URL input', () => {
      const { component } = makeComponent('value');
      const instance = component as any;

      expect(instance.checkValidUrl(undefined)).toBe(false);
      expect(instance.checkValidUrl('not-a-url')).toBe(false);
      expect(instance.checkValidUrl('https://example.com')).toBe(true);
    });
  });

  describe('CSS customization', () => {
    it('should compute cssCustomization from uiSettings', () => {
      const { component } = makeComponent('test-value', {
        uiSettings: {
          cssCustomization: {
            backgroundColor: 'red',
            color: 'white',
          },
        },
      });

      expect(component.cssCustomization()).toEqual({
        backgroundColor: 'red',
        color: 'white',
      });
    });

    it('should compute cssRules from value and uiSettings', () => {
      const { component } = makeComponent('test-value', {
        uiSettings: {
          cssRules: [
            {
              if: { condition: 'equals', value: 'test-value' },
              styles: { color: 'green' },
            },
          ],
        },
      });

      const cssRules = component.cssRules();
      expect(cssRules).toBeDefined();
    });

    it('should merge cssCustomization and cssRules in cssStyles', () => {
      const { component } = makeComponent('test-value', {
        uiSettings: {
          cssCustomization: {
            backgroundColor: 'red',
          },
          cssRules: [
            {
              if: { condition: 'equals', value: 'test-value' },
              styles: { color: 'green' },
            },
          ],
        },
      });

      const cssStyles = component.cssStyles();
      expect(cssStyles).toBeDefined();
      expect(cssStyles.backgroundColor).toBe('red');
    });

    it('should return empty object when cssCustomization is undefined', () => {
      const { component } = makeComponent('test-value');

      expect(component.cssCustomization()).toBeUndefined();
    });
  });

  describe('tooltipIcon functionality', () => {
    it('should compute tooltipIcon from uiSettings', () => {
      const { component } = makeComponent('test-value', {
        uiSettings: {
          tooltipIcon: 'information',
        },
      });

      expect(component.tooltipIcon()).toBe('information');
    });

    it('should return undefined when tooltipIcon is not set', () => {
      const { component } = makeComponent('test-value');

      expect(component.tooltipIcon()).toBeUndefined();
    });

    it('should render tooltip icon when displayAs is tooltip', () => {
      const { fixture } = makeComponent('tooltip text', {
        uiSettings: {
          displayAs: 'tooltip',
          tooltipIcon: 'information',
        },
      });
      const compiled = fixture.nativeElement;

      const tooltipIcon = compiled.querySelector(
        'ui5-icon[name="information"]',
      );
      expect(tooltipIcon).toBeTruthy();
    });

    it('should use default hint icon when tooltipIcon is not specified', () => {
      const { fixture } = makeComponent('tooltip text', {
        uiSettings: {
          displayAs: 'tooltip',
        },
      });
      const compiled = fixture.nativeElement;

      const tooltipIcon = compiled.querySelector('ui5-icon[name="hint"]');
      expect(tooltipIcon).toBeTruthy();
    });
  });

  describe('value without resource', () => {
    it('should use fieldDefinition value when resource is not provided', () => {
      fixture = TestBed.createComponent(ValueCellComponent);
      component = fixture.componentInstance;

      const field: FieldDefinition = {
        property: 'spec.value',
        value: 'static-value',
      };

      fixture.componentRef.setInput('fieldDefinition', field);

      fixture.detectChanges();

      expect(component.value()).toBe('static-value');
    });

    it('should prioritize resource value over fieldDefinition value', () => {
      fixture = TestBed.createComponent(ValueCellComponent);
      component = fixture.componentInstance;

      const resource: Resource = {
        metadata: { name: 'test-resource' },
        spec: { value: 'resource-value' },
      } as any;

      const field: FieldDefinition = {
        property: 'spec.value',
        value: 'static-value',
      };

      fixture.componentRef.setInput('resource', resource);
      fixture.componentRef.setInput('fieldDefinition', field);

      fixture.detectChanges();

      expect(component.value()).toBe('resource-value');
    });

    it('should use fieldDefinition value as fallback when resource value is null', () => {
      fixture = TestBed.createComponent(ValueCellComponent);
      component = fixture.componentInstance;

      const resource: Resource = {
        metadata: { name: 'test-resource' },
        spec: { value: null },
      } as any;

      const field: FieldDefinition = {
        property: 'spec.value',
        value: 'fallback-value',
      };

      fixture.componentRef.setInput('resource', resource);
      fixture.componentRef.setInput('fieldDefinition', field);

      fixture.detectChanges();

      expect(component.value()).toBe('fallback-value');
    });

    it('should use fieldDefinition value as fallback when resource value is undefined', () => {
      fixture = TestBed.createComponent(ValueCellComponent);
      component = fixture.componentInstance;

      const resource: Resource = {
        metadata: { name: 'test-resource' },
        spec: {},
      } as any;

      const field: FieldDefinition = {
        property: 'spec.nonExistent',
        value: 'fallback-value',
      };

      fixture.componentRef.setInput('resource', resource);
      fixture.componentRef.setInput('fieldDefinition', field);

      fixture.detectChanges();

      expect(component.value()).toBe('fallback-value');
    });

    it('should use fieldDefinition value as fallback when property path does not exist in resource', () => {
      fixture = TestBed.createComponent(ValueCellComponent);
      component = fixture.componentInstance;

      const resource: Resource = {
        metadata: { name: 'test-resource' },
        spec: { otherField: 'other-value' },
      } as any;

      const field: FieldDefinition = {
        property: 'spec.missingField',
        value: 'fallback-value',
      };

      fixture.componentRef.setInput('resource', resource);
      fixture.componentRef.setInput('fieldDefinition', field);

      fixture.detectChanges();

      expect(component.value()).toBe('fallback-value');
    });

    it('should handle fieldDefinition value with uiSettings', () => {
      fixture = TestBed.createComponent(ValueCellComponent);
      component = fixture.componentInstance;

      const field: FieldDefinition = {
        property: 'spec.value',
        value: 'true',
        uiSettings: { displayAs: 'boolIcon' },
      };

      fixture.componentRef.setInput('fieldDefinition', field);

      fixture.detectChanges();

      expect(component.value()).toBe('true');
      expect(component.isBoolLike()).toBe(true);
      expect(component.boolValue()).toBe(true);
    });

    it('should handle fieldDefinition value with copy button', () => {
      const writeTextSpy = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { clipboard: { writeText: writeTextSpy } });

      fixture = TestBed.createComponent(ValueCellComponent);
      component = fixture.componentInstance;

      const field: FieldDefinition = {
        property: 'spec.value',
        value: 'copy-me',
        uiSettings: { withCopyButton: true },
      };

      fixture.componentRef.setInput('fieldDefinition', field);

      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const copyButton = compiled.querySelector('ui5-icon[name="copy"]');

      const event = new Event('click');
      copyButton.dispatchEvent(event);
      fixture.detectChanges();

      expect(writeTextSpy).toHaveBeenCalledWith('copy-me');
    });

    it('should handle fieldDefinition value with jsonPathExpression', () => {
      fixture = TestBed.createComponent(ValueCellComponent);
      component = fixture.componentInstance;

      const resource: Resource = {
        metadata: { name: 'test-resource' },
        spec: { nested: { value: 'nested-value' } },
      } as any;

      const field: FieldDefinition = {
        property: 'spec.value',
        jsonPathExpression: '$.spec.nested.value',
        value: 'fallback-value',
      };

      fixture.componentRef.setInput('resource', resource);
      fixture.componentRef.setInput('fieldDefinition', field);

      fixture.detectChanges();

      expect(component.value()).toBe('nested-value');
    });
  });
});
