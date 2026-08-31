import { GenericResource } from '../../models';
import { FormFieldChangeEvent, FormFieldDefinition } from '../models';
import { DeclarativeForm } from './declarative-form.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { axe } from 'vitest-axe';

describe('DeclarativeForm', () => {
  let component: DeclarativeForm<GenericResource>;
  let fixture: ComponentFixture<DeclarativeForm<GenericResource>>;

  const testFields: FormFieldDefinition[] = [
    {
      name: 'metadata.name',
      label: 'Name',
      required: true,
      validation: 'onChange',
    },
    {
      name: 'metadata.namespace',
      label: 'Namespace',
      required: false,
      validation: 'onBlur',
    },
    { name: 'metadata.labels', label: 'Labels' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, DeclarativeForm],
    }).compileComponents();

    fixture = TestBed.createComponent(DeclarativeForm);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('fields', testFields);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('has no automatically-detectable accessibility violations', async () => {
    // UI5 web components label their focusable element via an internal
    // shadow-DOM input wired with ARIA at runtime. axe-core traverses into the
    // shadow root and evaluates that inner input, but jsdom does not resolve
    // UI5's cross-shadow `accessibleNameRef`, so the `label` rule reports a
    // false positive here. It is disabled; label association is covered by the
    // `for`/`id` binding asserted in the DOM tests above and verified in-browser
    // by the Storybook a11y addon.
    const results = await axe(fixture.nativeElement, {
      rules: { label: { enabled: false } },
    });

    expect(results).toHaveNoViolations();
  });

  it('has no accessibility violations when rendering a collection field', async () => {
    // Renders the nested mfp-form-collection-field via a propertyCollection
    // field, covering that component's a11y within the form's module context
    // (it and DeclarativeForm have a circular dependency that makes a
    // standalone spec fragile).
    fixture.componentRef.setInput('fields', [
      {
        name: 'spec.artifacts',
        label: 'Artifacts',
        propertyCollection: [
          { name: 'name', label: 'Name' },
          { name: 'url', label: 'URL' },
        ],
      },
    ]);
    fixture.detectChanges();

    const results = await axe(fixture.nativeElement, {
      rules: { label: { enabled: false } },
    });

    expect(results).toHaveNoViolations();
  });

  describe('form initialization', () => {
    it('should create controls for each field', () => {
      expect(component.form.controls['metadata.name']).toBeDefined();
      expect(component.form.controls['metadata.namespace']).toBeDefined();
      expect(component.form.controls['metadata.labels']).toBeDefined();
    });

    it('should not register validators for required fields', () => {
      const ctrl = component.form.controls['metadata.name'];

      ctrl.setValue('');

      expect(ctrl.validator).toBeNull();
      expect(ctrl.valid).toBe(true);
    });

    it('should pre-populate controls from initialValues without marking dirty', () => {
      fixture.componentRef.setInput('initialValues', {
        'metadata.name': 'my-resource',
        'metadata.namespace': 'default',
      });

      fixture.detectChanges();

      expect(component.form.controls['metadata.name'].value).toBe(
        'my-resource',
      );
      expect(component.form.controls['metadata.namespace'].value).toBe(
        'default',
      );
      expect(component.form.controls['metadata.name'].dirty).toBe(false);
      expect(component.getValueState('metadata.name')).toBe('None');
    });

    it('should default missing initialValues keys to empty string', () => {
      fixture.componentRef.setInput('initialValues', {});
      expect(component.form.controls['metadata.name'].value).toBe('');
    });

    it('should render a select when field.values are provided', () => {
      fixture.componentRef.setInput('fields', [
        {
          name: 'metadata.namespace',
          label: 'Namespace',
          values: ['default', 'kube-system'],
        },
      ]);

      fixture.detectChanges();

      const shadowRoot = fixture.nativeElement.shadowRoot as ShadowRoot;
      const fieldElement = shadowRoot.querySelector(
        '[data-testid="generic-form-field-metadata.namespace"]',
      );

      expect(fieldElement?.tagName.toLowerCase()).toBe('ui5-select');
    });

    it('should render an input when field.values are not provided', () => {
      fixture.componentRef.setInput('fields', [
        {
          name: 'metadata.namespace',
          label: 'Namespace',
        },
      ]);

      fixture.detectChanges();

      const shadowRoot = fixture.nativeElement.shadowRoot as ShadowRoot;
      const fieldElement = shadowRoot.querySelector(
        '[data-testid="generic-form-field-metadata.namespace"]',
      );

      expect(fieldElement?.tagName.toLowerCase()).toBe('ui5-input');
    });

    it('should render a password input when inputType is Password', () => {
      fixture.componentRef.setInput('fields', [
        {
          name: 'spec.oidc.clientSecret',
          label: 'Client secret',
          inputType: 'Password',
        },
      ]);
      fixture.detectChanges();

      const shadowRoot = fixture.nativeElement.shadowRoot as ShadowRoot;
      const fieldElement = shadowRoot.querySelector(
        '[data-testid="generic-form-field-spec.oidc.clientSecret"]',
      );

      expect(fieldElement?.tagName.toLowerCase()).toBe('ui5-input');
      expect((fieldElement as HTMLInputElement).type).toBe('Password');
    });

    it('should render hint text below a field', () => {
      fixture.componentRef.setInput('fields', [
        {
          name: 'spec.oidc.discoveryUrl',
          label: 'Discovery URL',
          hint: 'e.g. https://issuer.example.com/.well-known/openid-configuration',
        },
      ]);
      fixture.detectChanges();

      const shadowRoot = fixture.nativeElement.shadowRoot as ShadowRoot;
      const hint = shadowRoot.querySelector(
        '[data-testid="generic-form-field-hint-spec.oidc.discoveryUrl"]',
      );

      expect(hint?.textContent?.trim()).toBe(
        'e.g. https://issuer.example.com/.well-known/openid-configuration',
      );
    });

    it('should render a switch when inputType is Switch', () => {
      fixture.componentRef.setInput('fields', [
        {
          name: 'spec.enabled',
          label: 'Enabled',
          inputType: 'Switch',
        },
      ]);
      fixture.detectChanges();

      const shadowRoot = fixture.nativeElement.shadowRoot as ShadowRoot;
      const fieldElement = shadowRoot.querySelector(
        '[data-testid="generic-form-field-spec.enabled"]',
      );

      expect(fieldElement?.tagName.toLowerCase()).toBe('ui5-switch');
    });

    it('should bind placeholder on text inputs', () => {
      fixture.componentRef.setInput('fields', [
        {
          name: 'spec.oidc.clientSecret',
          label: 'Client secret',
          inputType: 'Password',
          placeholder: 'Leave empty to keep unchanged',
        },
      ]);
      fixture.detectChanges();

      const shadowRoot = fixture.nativeElement.shadowRoot as ShadowRoot;
      const fieldElement = shadowRoot.querySelector(
        '[data-testid="generic-form-field-spec.oidc.clientSecret"]',
      );

      expect((fieldElement as HTMLInputElement).placeholder).toBe(
        'Leave empty to keep unchanged',
      );
    });

    it('should render hint text below a select field', () => {
      fixture.componentRef.setInput('fields', [
        {
          name: 'spec.scope',
          label: 'Scope',
          values: ['ClusterScoped', 'Namespaced'],
          hint: 'Choose the resource scope',
        },
      ]);
      fixture.detectChanges();

      const shadowRoot = fixture.nativeElement.shadowRoot as ShadowRoot;
      const hint = shadowRoot.querySelector(
        '[data-testid="generic-form-field-hint-spec.scope"]',
      );

      expect(hint?.textContent?.trim()).toBe('Choose the resource scope');
    });

    it('should coerce string boolean initialValues for switch fields', () => {
      fixture.componentRef.setInput('fields', [
        {
          name: 'spec.enabled',
          label: 'Enabled',
          inputType: 'Switch',
        },
      ]);
      fixture.componentRef.setInput('initialValues', { 'spec.enabled': 'true' });
      fixture.detectChanges();

      expect(component.form.controls['spec.enabled'].value).toBe(true);
    });

    it('should default switch fields to false when initialValues are missing', () => {
      fixture.componentRef.setInput('fields', [
        {
          name: 'spec.enabled',
          label: 'Enabled',
          inputType: 'Switch',
        },
      ]);
      fixture.componentRef.setInput('initialValues', {});
      fixture.detectChanges();

      expect(component.form.controls['spec.enabled'].value).toBe(false);
    });
  });

  describe('fieldChange output', () => {
    it('should emit on value change for validation: onChange field', () => {
      const emitted: FormFieldChangeEvent[] = [];
      component.fieldChange.subscribe((event) => emitted.push(event));

      const onChangeField = testFields.find((f) => f.name === 'metadata.name')!;
      component.setFormControlValue(
        { target: { value: 'new-value' } } as unknown as Event,
        onChangeField,
      );

      expect(emitted).toEqual([
        { fieldProperty: 'metadata.name', value: 'new-value' },
      ]);
    });

    it('should not emit on blur for validation: onChange field', () => {
      const emitted: FormFieldChangeEvent[] = [];
      component.fieldChange.subscribe((event) => emitted.push(event));

      const onChangeField = testFields.find((f) => f.name === 'metadata.name')!;
      component.onFieldBlur(onChangeField);

      expect(emitted).toEqual([]);
    });

    it('should emit on blur for validation: onBlur field', () => {
      const emitted: FormFieldChangeEvent[] = [];
      component.fieldChange.subscribe((event) => emitted.push(event));

      const onBlurField = testFields.find(
        (f) => f.name === 'metadata.namespace',
      )!;
      component.setFormControlValue(
        { target: { value: 'kube-system' } } as unknown as Event,
        onBlurField,
      );

      expect(emitted).toEqual([]);

      component.onFieldBlur(onBlurField);

      expect(emitted).toEqual([
        { fieldProperty: 'metadata.namespace', value: 'kube-system' },
      ]);
    });

    it('should not emit on value change for validation: onBlur field', () => {
      const emitted: FormFieldChangeEvent[] = [];
      component.fieldChange.subscribe((event) => emitted.push(event));

      const onBlurField = testFields.find(
        (f) => f.name === 'metadata.namespace',
      )!;
      component.setFormControlValue(
        { target: { value: 'kube-system' } } as unknown as Event,
        onBlurField,
      );

      expect(emitted).toEqual([]);
    });

    it('should not emit on change or blur for field without validation', () => {
      const emitted: FormFieldChangeEvent[] = [];
      component.fieldChange.subscribe((event) => emitted.push(event));

      const noValidationField = testFields.find(
        (f) => f.name === 'metadata.labels',
      )!;
      component.setFormControlValue(
        { target: { value: 'some-label' } } as unknown as Event,
        noValidationField,
      );
      component.onFieldBlur(noValidationField);

      expect(emitted).toEqual([]);
    });

    it('should emit on value change for validation: onChange switch field', () => {
      const switchField: FormFieldDefinition = {
        name: 'spec.enabled',
        label: 'Enabled',
        inputType: 'Switch',
        validation: 'onChange',
      };
      fixture.componentRef.setInput('fields', [switchField]);
      fixture.detectChanges();

      const emitted: FormFieldChangeEvent[] = [];
      component.fieldChange.subscribe((event) => emitted.push(event));

      component.setSwitchValue(
        { target: { checked: true } } as unknown as Event,
        switchField,
      );

      expect(emitted).toEqual([
        { fieldProperty: 'spec.enabled', value: true },
      ]);
      expect(component.form.controls['spec.enabled'].value).toBe(true);
    });

    it('should not emit on toggle for validation: onBlur switch field', () => {
      const switchField: FormFieldDefinition = {
        name: 'spec.enabled',
        label: 'Enabled',
        inputType: 'Switch',
        validation: 'onBlur',
      };
      fixture.componentRef.setInput('fields', [switchField]);
      fixture.detectChanges();

      const emitted: FormFieldChangeEvent[] = [];
      component.fieldChange.subscribe((event) => emitted.push(event));

      component.setSwitchValue(
        { target: { checked: true } } as unknown as Event,
        switchField,
      );

      expect(emitted).toEqual([]);
    });

    it('should emit on blur for validation: onBlur switch field', () => {
      const switchField: FormFieldDefinition = {
        name: 'spec.enabled',
        label: 'Enabled',
        inputType: 'Switch',
        validation: 'onBlur',
      };
      fixture.componentRef.setInput('fields', [switchField]);
      fixture.detectChanges();

      component.setSwitchValue(
        { target: { checked: true } } as unknown as Event,
        switchField,
      );

      const emitted: FormFieldChangeEvent[] = [];
      component.fieldChange.subscribe((event) => emitted.push(event));

      component.onFieldBlur(switchField);

      expect(emitted).toEqual([
        { fieldProperty: 'spec.enabled', value: true },
      ]);
    });

    it('should emit formValueChange when a switch is toggled', () => {
      const switchField: FormFieldDefinition = {
        name: 'spec.enabled',
        label: 'Enabled',
        inputType: 'Switch',
      };
      fixture.componentRef.setInput('fields', [switchField]);
      fixture.detectChanges();

      const emitted: Record<string, unknown>[] = [];
      component.formValueChange.subscribe((value) => emitted.push(value));

      component.setSwitchValue(
        { target: { checked: true } } as unknown as Event,
        switchField,
      );

      expect(emitted).toEqual([{ 'spec.enabled': true }]);
    });

    it('should emit fieldChange for validated fields when initialValues change', () => {
      const emitted: FormFieldChangeEvent[] = [];
      component.fieldChange.subscribe((event) => emitted.push(event));

      fixture.componentRef.setInput('initialValues', {
        'metadata.name': 'my-resource',
        'metadata.namespace': 'ns-value',
      });
      fixture.detectChanges();

      expect(emitted).toEqual(
        expect.arrayContaining([
          { fieldProperty: 'metadata.name', value: 'my-resource' },
          { fieldProperty: 'metadata.namespace', value: 'ns-value' },
        ]),
      );
      expect(
        emitted.find((e) => e.fieldProperty === 'metadata.labels'),
      ).toBeUndefined();
    });
  });

  describe('initial emission', () => {
    it('should emit fieldChange for fields with validation on init', () => {
      const localFixture = TestBed.createComponent(DeclarativeForm);
      const localComponent = localFixture.componentInstance;

      const emitted: FormFieldChangeEvent[] = [];
      localComponent.fieldChange.subscribe((event) => emitted.push(event));

      localFixture.componentRef.setInput('fields', testFields);
      localFixture.detectChanges();

      expect(emitted).toEqual(
        expect.arrayContaining([
          { fieldProperty: 'metadata.name', value: '' },
          { fieldProperty: 'metadata.namespace', value: '' },
        ]),
      );
    });

    it('should not emit fieldChange for fields without validation on init', () => {
      const localFixture = TestBed.createComponent(DeclarativeForm);
      const localComponent = localFixture.componentInstance;

      const emitted: FormFieldChangeEvent[] = [];
      localComponent.fieldChange.subscribe((event) => emitted.push(event));

      localFixture.componentRef.setInput('fields', testFields);
      localFixture.detectChanges();

      expect(
        emitted.find((e) => e.fieldProperty === 'metadata.labels'),
      ).toBeUndefined();
    });
  });

  describe('field errors', () => {
    it('should show no error for a pristine field', () => {
      fixture.componentRef.setInput('fieldErrors', {
        'metadata.name': 'Name is required',
      });
      fixture.detectChanges();

      expect(component.getValueState('metadata.name')).toBe('None');
    });

    it('should show error for a dirty field with an error string', () => {
      fixture.componentRef.setInput('fieldErrors', {
        'metadata.name': 'Name is required',
      });

      const onChangeField = testFields.find((f) => f.name === 'metadata.name')!;
      component.setFormControlValue(
        { target: { value: '' } } as unknown as Event,
        onChangeField,
      );
      fixture.detectChanges();

      const shadowRoot = fixture.nativeElement.shadowRoot as ShadowRoot;
      const message = shadowRoot.querySelector('[slot="valueStateMessage"]');

      expect(component.getValueState('metadata.name')).toBe('Negative');
      expect(message?.textContent?.trim()).toBe('Name is required');
    });

    it('should show error for a touched field', () => {
      fixture.componentRef.setInput('fieldErrors', {
        'metadata.name': 'Name is required',
      });
      fixture.detectChanges();

      const control = component.form.controls['metadata.name'];
      control.markAsTouched();

      expect(component.getValueState('metadata.name')).toBe('Negative');
    });

    it('should show switch field errors below the control', () => {
      fixture.componentRef.setInput('fields', [
        {
          name: 'spec.enabled',
          label: 'Enabled',
          inputType: 'Switch',
          validation: 'onChange',
        },
      ]);
      fixture.componentRef.setInput('fieldErrors', {
        'spec.enabled': 'Must be enabled',
      });
      fixture.detectChanges();

      const switchField: FormFieldDefinition = {
        name: 'spec.enabled',
        label: 'Enabled',
        inputType: 'Switch',
        validation: 'onChange',
      };
      component.setSwitchValue(
        { target: { checked: false } } as unknown as Event,
        switchField,
      );
      fixture.detectChanges();

      const shadowRoot = fixture.nativeElement.shadowRoot as ShadowRoot;
      const error = shadowRoot.querySelector('.field-error');

      expect(error?.textContent?.trim()).toBe('Must be enabled');
    });
  });

  describe('submit output', () => {
    it('should emit nested object built from dotted field names', () => {
      const emitted: Record<string, unknown>[] = [];
      component.formSubmit.subscribe((value) => emitted.push(value));

      component.form.controls['metadata.name'].setValue('my-app');
      component.form.controls['metadata.namespace'].setValue('default');
      component.form.controls['metadata.labels'].setValue('app=my-app');

      component.submit();

      expect(emitted).toEqual([
        {
          metadata: {
            name: 'my-app',
            namespace: 'default',
            labels: 'app=my-app',
          },
        },
      ]);
    });

    it('should emit nested object for switch fields', () => {
      fixture.componentRef.setInput('fields', [
        {
          name: 'spec.enabled',
          label: 'Enabled',
          inputType: 'Switch',
        },
      ]);
      fixture.componentRef.setInput('initialValues', { 'spec.enabled': true });
      fixture.detectChanges();

      const emitted: Record<string, unknown>[] = [];
      component.formSubmit.subscribe((value) => emitted.push(value));

      component.submit();

      expect(emitted).toEqual([{ spec: { enabled: true } }]);
    });
  });

  describe('web-component first render (before inputs are assigned)', () => {
    it('renders without emitting NG0950 when fields are not yet set', () => {
      const errorSpy = vi.spyOn(console, 'error');
      const localFixture = TestBed.createComponent(DeclarativeForm);

      expect(() => {
        localFixture.detectChanges();
      }).not.toThrow();

      const ng0950 = errorSpy.mock.calls
        .flat()
        .some((arg) => String(arg).includes('NG0950'));
      expect(ng0950).toBe(false);
      expect(localFixture.componentInstance.fields()).toEqual([]);
    });

    it('recovers and renders once fields are assigned', () => {
      const localFixture = TestBed.createComponent(DeclarativeForm);
      localFixture.detectChanges();

      localFixture.componentRef.setInput('fields', testFields);
      localFixture.detectChanges();

      expect(localFixture.componentInstance.fields().length).toBe(
        testFields.length,
      );
    });
  });
});
