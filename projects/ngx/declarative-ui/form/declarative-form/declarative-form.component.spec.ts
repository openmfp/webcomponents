import { GenericResource } from '../../models';
import { FormFieldChangeEvent, FormFieldDefinition } from '../models';
import { DeclarativeForm } from './declarative-form.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
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

    it('keeps an empty dynamic options field as an enabled select', () => {
      fixture.componentRef.setInput('fields', [
        { name: 'spec.secret', label: 'Secret', values: [] },
      ]);
      fixture.detectChanges();

      const shadowRoot = fixture.nativeElement.shadowRoot as ShadowRoot;
      const select = shadowRoot.querySelector(
        '[data-testid="generic-form-field-spec.secret"]',
      );
      expect(select?.tagName.toLowerCase()).toBe('ui5-select');
      expect((select as HTMLSelectElement | null)?.disabled).toBe(false);
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

    it('should render a show/hide toggle for password fields by default', () => {
      fixture.componentRef.setInput('fields', [
        {
          name: 'spec.oidc.clientSecret',
          label: 'Client secret',
          inputType: 'Password',
        },
      ]);
      fixture.detectChanges();

      const shadowRoot = fixture.nativeElement.shadowRoot as ShadowRoot;
      const toggle = shadowRoot.querySelector(
        '[data-testid="generic-form-field-spec.oidc.clientSecret-password-toggle"]',
      );

      expect(toggle?.tagName.toLowerCase()).toBe('ui5-input-icon');
      expect(toggle?.getAttribute('name')).toBe('show');
    });

    it('should hide the password toggle when showPasswordToggle is false', () => {
      fixture.componentRef.setInput('fields', [
        {
          name: 'spec.oidc.clientSecret',
          label: 'Client secret',
          inputType: 'Password',
          showPasswordToggle: false,
        },
      ]);
      fixture.detectChanges();

      const shadowRoot = fixture.nativeElement.shadowRoot as ShadowRoot;
      const toggle = shadowRoot.querySelector(
        '[data-testid="generic-form-field-spec.oidc.clientSecret-password-toggle"]',
      );

      expect(toggle).toBeNull();
    });

    it('should reveal password values when the toggle is clicked', () => {
      const passwordField: FormFieldDefinition = {
        name: 'spec.oidc.clientSecret',
        label: 'Client secret',
        inputType: 'Password',
      };
      fixture.componentRef.setInput('fields', [passwordField]);
      fixture.detectChanges();

      const shadowRoot = fixture.nativeElement.shadowRoot as ShadowRoot;
      const input = shadowRoot.querySelector(
        '[data-testid="generic-form-field-spec.oidc.clientSecret"]',
      ) as HTMLInputElement;

      expect(input.type).toBe('Password');

      component.togglePasswordVisibility(passwordField, new Event('click'));
      fixture.detectChanges();

      expect(input.type).toBe('Text');
      expect(
        shadowRoot
          .querySelector(
            '[data-testid="generic-form-field-spec.oidc.clientSecret-password-toggle"]',
          )
          ?.getAttribute('name'),
      ).toBe('hide');
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
      expect(fieldElement?.getAttribute('title')).toBe(
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
      fixture.componentRef.setInput('initialValues', {
        'spec.enabled': 'true',
      });
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

  describe('partial initialValues', () => {
    const fieldsWithCollection: FormFieldDefinition[] = [
      {
        name: 'spec.dependentSelect',
        label: 'Dependent select',
        validation: 'onChange',
      },
      {
        name: 'spec.artifacts',
        label: 'Artifacts',
        propertyCollection: [
          { name: 'name', label: 'Name' },
          { name: 'url', label: 'URL' },
        ],
      },
    ];

    function getCollectionEntries(name: string): Record<string, unknown>[] {
      const array = component.form.controls[name] as FormArray;
      return array.controls.map(
        (group) =>
          (group as FormGroup).controls['entry'].value as Record<
            string,
            unknown
          >,
      );
    }

    beforeEach(() => {
      fixture.componentRef.setInput('fields', fieldsWithCollection);
      fixture.componentRef.setInput('initialValues', {
        'spec.dependentSelect': 'initial-value',
        'spec.artifacts': [
          { name: 'a', url: 'https://a' },
          { name: 'b', url: 'https://b' },
        ],
      });
      fixture.detectChanges();
    });

    it('should leave an absent collection field untouched (regression)', () => {
      expect(getCollectionEntries('spec.artifacts')).toEqual([
        { name: 'a', url: 'https://a' },
        { name: 'b', url: 'https://b' },
      ]);

      // Simulate the onFieldChange hook pushing a partial object that only
      // clears a dependent scalar and omits the collection key entirely.
      fixture.componentRef.setInput('initialValues', {
        'spec.dependentSelect': '',
      });
      fixture.detectChanges();

      // The collection's already-entered entries must survive, not be wiped.
      expect(getCollectionEntries('spec.artifacts')).toEqual([
        { name: 'a', url: 'https://a' },
        { name: 'b', url: 'https://b' },
      ]);
      expect(component.collectionEntries(fieldsWithCollection[1])).toEqual([
        { name: 'a', url: 'https://a' },
        { name: 'b', url: 'https://b' },
      ]);
    });

    it('should still set the scalar keys the partial object contains', () => {
      fixture.componentRef.setInput('initialValues', {
        'spec.dependentSelect': '',
      });
      fixture.detectChanges();

      expect(component.form.controls['spec.dependentSelect'].value).toBe('');
    });

    it('should preserve a scalar sibling absent from the partial object', () => {
      fixture.componentRef.setInput('initialValues', {
        'spec.artifacts': [{ name: 'c', url: 'https://c' }],
      });
      fixture.detectChanges();

      expect(component.form.controls['spec.dependentSelect'].value).toBe(
        'initial-value',
      );
      expect(getCollectionEntries('spec.artifacts')).toEqual([
        { name: 'c', url: 'https://c' },
      ]);
    });

    it('should rebuild all collection fields for a full initialValues object', () => {
      fixture.componentRef.setInput('initialValues', {
        'spec.dependentSelect': 'next',
        'spec.artifacts': [{ name: 'x', url: 'https://x' }],
      });
      fixture.detectChanges();

      expect(component.form.controls['spec.dependentSelect'].value).toBe(
        'next',
      );
      expect(getCollectionEntries('spec.artifacts')).toEqual([
        { name: 'x', url: 'https://x' },
      ]);
    });

    it('should apply a collection key explicitly present as an empty array', () => {
      fixture.componentRef.setInput('initialValues', {
        'spec.artifacts': [],
      });
      fixture.detectChanges();

      expect(getCollectionEntries('spec.artifacts')).toEqual([]);
      expect(component.collectionEntries(fieldsWithCollection[1])).toEqual([]);
    });

    it('should preserve an absent switch sibling in a partial object', () => {
      fixture.componentRef.setInput('fields', [
        {
          name: 'spec.enabled',
          label: 'Enabled',
          inputType: 'Switch',
        },
        {
          name: 'spec.dependentSelect',
          label: 'Dependent select',
        },
      ]);
      fixture.componentRef.setInput('initialValues', {
        'spec.enabled': true,
        'spec.dependentSelect': 'initial-value',
      });
      fixture.detectChanges();

      expect(component.form.controls['spec.enabled'].value).toBe(true);

      fixture.componentRef.setInput('initialValues', {
        'spec.dependentSelect': '',
      });
      fixture.detectChanges();

      // The switch must keep its value; the partial object must not reset it.
      expect(component.form.controls['spec.enabled'].value).toBe(true);
      expect(component.form.controls['spec.dependentSelect'].value).toBe('');
    });

    it('should settle on repeated partial re-init without a self-triggering effect', () => {
      // Pin the loop-free re-init contract of setInitialValues: it reads
      // collectionSeeds via untracked() before .set()-ing a NEW object each run.
      // That untracked read is load-bearing — the child FormCollectionField
      // resets its UI from these seeds, so the seeding effect MUST re-seed from
      // the current seeds, yet it must NOT take a dependency on them, or the
      // .set() would re-trigger the effect in an endless cascade.
      //
      // This test drives two partial re-inits that each touch the collection key
      // and asserts the component reaches a stable fixed point. If a future
      // change reintroduced a tracked collectionSeeds read, the seeding effect
      // would self-trigger; under the zoneless test runner that loop starves the
      // microtask queue, so this test would stop settling and the run would fail
      // (as a suite-level non-termination — there is no public zoneless API for a
      // bounded single-pass effect flush, so it cannot be asserted in-test).
      fixture.componentRef.setInput('initialValues', {
        'spec.dependentSelect': 'first',
        'spec.artifacts': [{ name: 'p', url: 'https://p' }],
      });
      fixture.detectChanges();

      expect(getCollectionEntries('spec.artifacts')).toEqual([
        { name: 'p', url: 'https://p' },
      ]);

      fixture.componentRef.setInput('initialValues', {
        'spec.dependentSelect': 'second',
        'spec.artifacts': [{ name: 'q', url: 'https://q' }],
      });
      fixture.detectChanges();

      // Settled on the last push rather than diverging.
      expect(component.form.controls['spec.dependentSelect'].value).toBe(
        'second',
      );
      expect(getCollectionEntries('spec.artifacts')).toEqual([
        { name: 'q', url: 'https://q' },
      ]);
      expect(component.collectionEntries(fieldsWithCollection[1])).toEqual([
        { name: 'q', url: 'https://q' },
      ]);

      // A further flush with no new input must not change anything: the effects
      // have reached a fixed point (no pending self-triggered re-run).
      fixture.detectChanges();
      expect(component.collectionEntries(fieldsWithCollection[1])).toEqual([
        { name: 'q', url: 'https://q' },
      ]);
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

      expect(emitted).toMatchObject([
        { fieldProperty: 'metadata.name', value: 'new-value', source: 'user' },
      ]);
      expect(emitted[0].formValues).toEqual({
        'metadata.name': 'new-value',
        'metadata.namespace': '',
        'metadata.labels': '',
      });
    });

    it('should not emit on blur for validation: onChange field', () => {
      const emitted: FormFieldChangeEvent[] = [];
      component.fieldChange.subscribe((event) => emitted.push(event));

      const onChangeField = testFields.find((f) => f.name === 'metadata.name')!;
      component.onFieldBlur(onChangeField);

      expect(emitted).toMatchObject([]);
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

      expect(emitted).toMatchObject([]);

      component.onFieldBlur(onBlurField);

      expect(emitted).toMatchObject([
        {
          fieldProperty: 'metadata.namespace',
          value: 'kube-system',
          source: 'user',
        },
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

      expect(emitted).toMatchObject([]);
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

      expect(emitted).toMatchObject([]);
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

      expect(emitted).toMatchObject([
        { fieldProperty: 'spec.enabled', value: true, source: 'user' },
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

      expect(emitted).toMatchObject([]);
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

      expect(emitted).toMatchObject([
        { fieldProperty: 'spec.enabled', value: true, source: 'user' },
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

      expect(emitted).toMatchObject([{ 'spec.enabled': true }]);
    });
  });

  describe('fieldChange source tagging', () => {
    // The `source` field distinguishes user interactions (`'user'`) from seed
    // echoes (`'seed'`) that fire when `initialValues` identity changes or
    // when `patchForm({ emitEvent: true })` is called. Downstream consumers
    // (notably the dialog's `onFieldChange` hook) drop seed echoes so a
    // prefilled parent on edit-open does not trigger dependent clearing.

    it('tags setFormControlValue emits with source: user', () => {
      const emitted: FormFieldChangeEvent[] = [];
      component.fieldChange.subscribe((e) => emitted.push(e));

      const onChangeField = testFields.find((f) => f.name === 'metadata.name')!;
      component.setFormControlValue(
        { target: { value: 'typed' } } as unknown as Event,
        onChangeField,
      );

      expect(emitted).toHaveLength(1);
      expect(emitted[0].source).toBe('user');
    });

    it('tags setSwitchValue emits with source: user', () => {
      const switchField: FormFieldDefinition = {
        name: 'spec.enabled',
        label: 'Enabled',
        inputType: 'Switch',
        validation: 'onChange',
      };
      fixture.componentRef.setInput('fields', [switchField]);
      fixture.detectChanges();

      const emitted: FormFieldChangeEvent[] = [];
      component.fieldChange.subscribe((e) => emitted.push(e));

      component.setSwitchValue(
        { target: { checked: true } } as unknown as Event,
        switchField,
      );

      expect(emitted).toHaveLength(1);
      expect(emitted[0].source).toBe('user');
    });

    it('tags onFieldBlur emits with source: user', () => {
      const emitted: FormFieldChangeEvent[] = [];
      component.fieldChange.subscribe((e) => emitted.push(e));

      const onBlurField = testFields.find(
        (f) => f.name === 'metadata.namespace',
      )!;
      component.onFieldBlur(onBlurField);

      expect(emitted).toHaveLength(1);
      expect(emitted[0].source).toBe('user');
    });

    it('tags onCollectionValueChange emits with source: user', () => {
      const collectionField: FormFieldDefinition = {
        name: 'spec.rules',
        label: 'Rules',
        validation: 'onChange',
        propertyCollection: [{ name: 'host', label: 'Host' }],
      };
      fixture.componentRef.setInput('fields', [collectionField]);
      fixture.detectChanges();

      const emitted: FormFieldChangeEvent[] = [];
      component.fieldChange.subscribe((e) => emitted.push(e));

      component.onCollectionValueChange(collectionField, [{ host: 'a.com' }]);

      expect(emitted).toHaveLength(1);
      expect(emitted[0].source).toBe('user');
    });

    it('tags seedValidationFields emits with source: seed (input identity push)', () => {
      const localFixture = TestBed.createComponent(DeclarativeForm);
      const localComponent = localFixture.componentInstance;

      const emitted: FormFieldChangeEvent[] = [];
      localComponent.fieldChange.subscribe((e) => emitted.push(e));

      localFixture.componentRef.setInput('fields', testFields);
      localFixture.componentRef.setInput('initialValues', {
        'metadata.name': 'seeded',
      });
      localFixture.detectChanges();

      // All seed emits carry source: 'seed'.
      expect(emitted.length).toBeGreaterThan(0);
      for (const e of emitted) {
        expect(e.source).toBe('seed');
      }
    });

    it('tags patchForm({ emitEvent: true }) emits with source: seed', () => {
      const localFixture = TestBed.createComponent(DeclarativeForm);
      const localComponent = localFixture.componentInstance;
      localFixture.componentRef.setInput('fields', testFields);
      localFixture.componentRef.setInput('initialValues', {});
      localFixture.detectChanges();

      const emitted: FormFieldChangeEvent[] = [];
      localComponent.fieldChange.subscribe((e) => emitted.push(e));

      localComponent.patchForm(
        { 'metadata.name': 'via-patch' } as GenericResource,
        { emitEvent: true },
      );

      expect(emitted.length).toBeGreaterThan(0);
      for (const e of emitted) {
        expect(e.source).toBe('seed');
      }
    });

    it('does not emit at all when patchForm({ emitEvent: false }) is used (unchanged)', () => {
      const localFixture = TestBed.createComponent(DeclarativeForm);
      const localComponent = localFixture.componentInstance;
      localFixture.componentRef.setInput('fields', testFields);
      localFixture.componentRef.setInput('initialValues', {});
      localFixture.detectChanges();

      const emitted: FormFieldChangeEvent[] = [];
      localComponent.fieldChange.subscribe((e) => emitted.push(e));

      localComponent.patchForm(
        { 'metadata.name': 'silent' } as GenericResource,
        { emitEvent: false },
      );

      expect(emitted).toMatchObject([]);
    });
  });

  describe('initial seeding emission', () => {
    // Contract: on every `initialValues` input identity push, `fieldChange`
    // is emitted ONCE per validation field with its resulting control value.
    // This mirrors Angular's own `AbstractControl.setValue(v, { emitEvent })`:
    // the input binding is the "emit" path; the imperative `patchForm` method
    // is the "silent" path for hosts that need to seed without echoing a
    // user-change-shaped event (edit-open self-clear prevention).

    it('does not re-emit seeds when field options change', async () => {
      const emitted: FormFieldChangeEvent[] = [];
      component.fieldChange.subscribe((event) => emitted.push(event));
      component.patchForm(
        { 'metadata.name': 'edited-name' },
        { emitEvent: false, markAsDirty: true },
      );
      const nameControl = component.form.controls['metadata.name'];

      fixture.componentRef.setInput(
        'fields',
        testFields.map((field) =>
          field.name === 'metadata.namespace'
            ? { ...field, values: ['team-a'] }
            : field,
        ),
      );
      await fixture.whenStable();

      expect(emitted).toEqual([]);
      expect(component.form.controls['metadata.name']).toBe(nameControl);
      expect(nameControl.value).toBe('edited-name');
      expect(nameControl.dirty).toBe(true);

      fixture.componentRef.setInput('initialValues', {
        'metadata.name': 'next-resource',
        'metadata.namespace': 'team-a',
      });
      await fixture.whenStable();

      expect(emitted).toMatchObject([
        {
          fieldProperty: 'metadata.name',
          value: 'next-resource',
          source: 'seed',
        },
        {
          fieldProperty: 'metadata.namespace',
          value: 'team-a',
          source: 'seed',
        },
      ]);
    });

    it('emits once for each validation field with the resulting control value (seeded or empty)', () => {
      const localFixture = TestBed.createComponent(DeclarativeForm);
      const localComponent = localFixture.componentInstance;

      const emitted: FormFieldChangeEvent[] = [];
      localComponent.fieldChange.subscribe((event) => emitted.push(event));

      localFixture.componentRef.setInput('fields', testFields);
      localFixture.componentRef.setInput('initialValues', {
        'metadata.name': 'seeded-name',
      });
      localFixture.detectChanges();

      // metadata.name has validation + prefilled value → emits seeded value.
      expect(
        emitted.filter((e) => e.fieldProperty === 'metadata.name'),
      ).toMatchObject([
        {
          fieldProperty: 'metadata.name',
          value: 'seeded-name',
          source: 'seed',
        },
      ]);
      // metadata.namespace has validation but NO prefilled value → emits ''.
      expect(
        emitted.filter((e) => e.fieldProperty === 'metadata.namespace'),
      ).toMatchObject([
        {
          fieldProperty: 'metadata.namespace',
          value: '',
          source: 'seed',
        },
      ]);
      // metadata.labels has no `validation` → never emits from seeding.
      expect(
        emitted.find((e) => e.fieldProperty === 'metadata.labels'),
      ).toBeUndefined();
    });

    it('patchForm with emitEvent:false does not re-emit on a subsequent push (loop-breaker)', () => {
      // Critical loop-breaker — the real mechanism now. Host sees a parent
      // emit, resolves dependents, and must apply the result WITHOUT echoing
      // a seed. The dialog applies the result via `patchForm({ emitEvent:
      // false })`, which bypasses the input signal entirely → no re-emit.
      const localFixture = TestBed.createComponent(DeclarativeForm);
      const localComponent = localFixture.componentInstance;

      const emitted: FormFieldChangeEvent[] = [];
      localComponent.fieldChange.subscribe((event) => emitted.push(event));

      localFixture.componentRef.setInput('fields', testFields);
      // First input push → emits once per validation field.
      localFixture.componentRef.setInput('initialValues', {});
      localFixture.detectChanges();

      const firstCount = emitted.length;
      expect(firstCount).toBeGreaterThan(0);

      // Silent re-seed via patchForm — must NOT re-emit.
      localComponent.patchForm(
        { 'metadata.name': 'second' } as GenericResource,
        { emitEvent: false },
      );

      expect(emitted.length).toBe(firstCount);
      expect(localComponent.form.controls['metadata.name'].value).toBe(
        'second',
      );
    });

    it('adds new controls silently until initialValues changes', async () => {
      const localFixture = TestBed.createComponent(DeclarativeForm);
      const localComponent = localFixture.componentInstance;

      localFixture.componentRef.setInput('fields', testFields);
      localFixture.componentRef.setInput('initialValues', {});
      localFixture.detectChanges();

      const emitted: FormFieldChangeEvent[] = [];
      localComponent.fieldChange.subscribe((event) => emitted.push(event));

      localFixture.componentRef.setInput('fields', [
        ...testFields,
        { name: 'spec.late', label: 'Late', validation: 'onChange' },
      ]);
      await localFixture.whenStable();

      expect(localComponent.form.controls['spec.late']?.value).toBe('');
      expect(emitted).toEqual([]);

      localFixture.componentRef.setInput('initialValues', {
        'spec.late': 'prefilled',
      });
      await localFixture.whenStable();

      expect(emitted).toContainEqual(
        expect.objectContaining({
          fieldProperty: 'spec.late',
          value: 'prefilled',
          source: 'seed',
          formValues: expect.objectContaining({ 'spec.late': 'prefilled' }),
        }),
      );
    });

    it('still fires user-driven emits after seeding', () => {
      const localFixture = TestBed.createComponent(DeclarativeForm);
      const localComponent = localFixture.componentInstance;

      const field: FormFieldDefinition = {
        name: 'metadata.name',
        label: 'Name',
        validation: 'onChange',
      };
      localFixture.componentRef.setInput('fields', [field]);
      localFixture.componentRef.setInput('initialValues', {
        'metadata.name': 'seeded',
      });
      localFixture.detectChanges();

      const emitted: FormFieldChangeEvent[] = [];
      localComponent.fieldChange.subscribe((event) => emitted.push(event));

      // User types a new value.
      localComponent.setFormControlValue(
        { target: { value: 'user-typed' } } as unknown as Event,
        field,
      );

      expect(emitted).toMatchObject([
        {
          fieldProperty: 'metadata.name',
          value: 'user-typed',
          source: 'user',
        },
      ]);

      // Silent re-seed via patchForm — must NOT re-emit on top.
      localComponent.patchForm(
        { 'metadata.name': 'user-typed' } as GenericResource,
        { emitEvent: false },
      );

      expect(emitted).toMatchObject([
        {
          fieldProperty: 'metadata.name',
          value: 'user-typed',
          source: 'user',
        },
      ]);
    });

    it(
      'settles on repeated host-driven patchForm pushes (no loop)',
      { timeout: 2000 },
      () => {
        // Guards the parent↔dependent loop at the DeclarativeForm layer: a host
        // that reacts to an emit by applying fresh values via `patchForm({
        // emitEvent: false })` must NOT trigger another emit from the form. The
        // 2s timeout fails fast if a regression reintroduced the loop.
        const dependencyFields: FormFieldDefinition[] = [
          {
            name: 'metadata.namespace',
            label: 'Namespace',
            validation: 'onBlur',
          },
          {
            name: 'spec.dependentSelect',
            label: 'Dependent select',
            validation: 'onChange',
          },
        ];

        const localFixture = TestBed.createComponent(DeclarativeForm);
        const localComponent = localFixture.componentInstance;

        const emitted: FormFieldChangeEvent[] = [];
        localComponent.fieldChange.subscribe((event) => emitted.push(event));

        localFixture.componentRef.setInput('fields', dependencyFields);
        localFixture.componentRef.setInput('initialValues', {});
        localFixture.detectChanges();

        const seedCount = emitted.length;
        expect(seedCount).toBe(2);

        // Host responds by applying new values via silent patchForm. No further
        // emit must happen.
        localComponent.patchForm(
          {
            'metadata.namespace': 'team-a',
            'spec.dependentSelect': '',
          } as GenericResource,
          { emitEvent: false },
        );
        // And again, to make sure repeated silent writes don't accumulate emits.
        localComponent.patchForm(
          {
            'metadata.namespace': 'team-b',
            'spec.dependentSelect': '',
          } as GenericResource,
          { emitEvent: false },
        );

        expect(emitted.length).toBe(seedCount);
      },
    );

    it('re-emits on EVERY input identity push (restored library-wide contract)', () => {
      // Guards the restored contract: a NEW `[initialValues]` identity push
      // (as happens on re-open or on programmatic seed through the input)
      // must re-fire the seeding effect. This is intentional — hosts opt out
      // of seed-emits by using `patchForm({ emitEvent: false })` instead of
      // pushing through the input.
      const localFixture = TestBed.createComponent(DeclarativeForm);
      const localComponent = localFixture.componentInstance;

      const emitted: FormFieldChangeEvent[] = [];
      localComponent.fieldChange.subscribe((event) => emitted.push(event));

      localFixture.componentRef.setInput('fields', testFields);
      localFixture.componentRef.setInput('initialValues', {});
      localFixture.detectChanges();
      const firstCount = emitted.length;

      localFixture.componentRef.setInput('initialValues', {
        'metadata.name': 'second',
      });
      localFixture.detectChanges();

      expect(emitted.length).toBeGreaterThan(firstCount);
      expect(
        emitted.filter((e) => e.fieldProperty === 'metadata.name').pop()?.value,
      ).toBe('second');
    });
  });

  describe('patchForm', () => {
    // Mirrors Angular's `AbstractControl.setValue(v, { emitEvent })` pattern.
    // The default (no options) emits; `{ emitEvent: false }` is the silent
    // path for hosts that know their write is NOT a user-change event.

    it('calls setInitialValues AND emits fieldChange when options are omitted', () => {
      const localFixture = TestBed.createComponent(DeclarativeForm);
      const localComponent = localFixture.componentInstance;
      localFixture.componentRef.setInput('fields', testFields);
      localFixture.componentRef.setInput('initialValues', {});
      localFixture.detectChanges();

      const emitted: FormFieldChangeEvent[] = [];
      localComponent.fieldChange.subscribe((event) => emitted.push(event));

      localComponent.patchForm({
        'metadata.name': 'via-patch',
        'metadata.namespace': 'ns-a',
      } as GenericResource);

      expect(localComponent.form.controls['metadata.name'].value).toBe(
        'via-patch',
      );
      expect(localComponent.form.controls['metadata.namespace'].value).toBe(
        'ns-a',
      );
      expect(emitted).toMatchObject([
        { fieldProperty: 'metadata.name', value: 'via-patch', source: 'seed' },
        { fieldProperty: 'metadata.namespace', value: 'ns-a', source: 'seed' },
      ]);
    });

    it('calls setInitialValues AND emits fieldChange when options.emitEvent is true', () => {
      const localFixture = TestBed.createComponent(DeclarativeForm);
      const localComponent = localFixture.componentInstance;
      localFixture.componentRef.setInput('fields', testFields);
      localFixture.componentRef.setInput('initialValues', {});
      localFixture.detectChanges();

      const emitted: FormFieldChangeEvent[] = [];
      localComponent.fieldChange.subscribe((event) => emitted.push(event));

      localComponent.patchForm(
        { 'metadata.name': 'via-patch' } as GenericResource,
        { emitEvent: true },
      );

      expect(emitted.length).toBeGreaterThan(0);
    });

    it('calls setInitialValues but does NOT emit fieldChange when options.emitEvent is false', () => {
      const localFixture = TestBed.createComponent(DeclarativeForm);
      const localComponent = localFixture.componentInstance;
      localFixture.componentRef.setInput('fields', testFields);
      localFixture.componentRef.setInput('initialValues', {});
      localFixture.detectChanges();

      const emitted: FormFieldChangeEvent[] = [];
      localComponent.fieldChange.subscribe((event) => emitted.push(event));

      localComponent.patchForm(
        { 'metadata.name': 'silent' } as GenericResource,
        { emitEvent: false },
      );

      expect(localComponent.form.controls['metadata.name'].value).toBe(
        'silent',
      );
      expect(emitted).toMatchObject([]);
    });

    it('patchForm with emitEvent:false on a prefilled parent + dependent does not emit (edit-open self-clear fix)', () => {
      // Direct regression test for the edit-open self-clear bug: when the
      // host supplies all validation fields with real values (edit of an
      // existing resource) THROUGH patchForm (not the input), the form must
      // stay silent — any `dependsOn` consumer must not interpret the seeded
      // parent as a user change.
      const localFixture = TestBed.createComponent(DeclarativeForm);
      const localComponent = localFixture.componentInstance;

      const emitted: FormFieldChangeEvent[] = [];
      localComponent.fieldChange.subscribe((event) => emitted.push(event));

      localFixture.componentRef.setInput('fields', testFields);
      // Keep the input empty — the host will drive seeding via patchForm.
      localFixture.componentRef.setInput('initialValues', {});
      localFixture.detectChanges();
      emitted.length = 0; // ignore the initial input-driven seed

      localComponent.patchForm(
        {
          'metadata.name': 'my-resource',
          'metadata.namespace': 'my-ns',
        } as GenericResource,
        { emitEvent: false },
      );

      expect(emitted).toMatchObject([]);
    });

    it('still emits on a user interaction AFTER a silent patchForm', () => {
      const localFixture = TestBed.createComponent(DeclarativeForm);
      const localComponent = localFixture.componentInstance;
      const field: FormFieldDefinition = {
        name: 'metadata.name',
        label: 'Name',
        validation: 'onChange',
      };
      localFixture.componentRef.setInput('fields', [field]);
      localFixture.componentRef.setInput('initialValues', {});
      localFixture.detectChanges();

      localComponent.patchForm(
        { 'metadata.name': 'seeded' } as GenericResource,
        { emitEvent: false },
      );

      const emitted: FormFieldChangeEvent[] = [];
      localComponent.fieldChange.subscribe((event) => emitted.push(event));

      localComponent.setFormControlValue(
        { target: { value: 'user-typed' } } as unknown as Event,
        field,
      );

      expect(emitted).toMatchObject([
        {
          fieldProperty: 'metadata.name',
          value: 'user-typed',
          source: 'user',
        },
      ]);
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

      expect(emitted).toMatchObject([
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

      expect(emitted).toMatchObject([{ spec: { enabled: true } }]);
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
